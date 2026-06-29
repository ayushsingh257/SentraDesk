import re
import uuid
import imaplib
import email
from email.utils import parseaddr
from datetime import datetime
from typing import Optional, Tuple
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.logging import logger
from app.models.notification import EmailConversation
from app.models.ticket import Ticket, Comment, ActivityTimeline
from app.services.ticket import TicketService
from app.services.notification import notification_service

class EmailListenerService:
    """Service governing incoming email listener, parsing, threading, and auto-ticketing (Phases 33-37)."""

    def __init__(self):
        self.ticket_service = TicketService()

    def connect_imap(self) -> Optional[imaplib.IMAP4_SSL]:
        """Establish IMAP secure connection."""
        try:
            if settings.ENVIRONMENT == "development":
                # Mock connection for local test run
                return None
            
            imap = imaplib.IMAP4_SSL(settings.IMAP_HOST, settings.IMAP_PORT)
            imap.login(settings.IMAP_USER, settings.IMAP_PASSWORD)
            return imap
        except Exception as e:
            logger.error(f"Failed to connect to IMAP server: {str(e)}")
            return None

    def poll_mailbox(self, db: Session):
        """Poll Inbox mailbox for new unseen emails, parsing and processing each (Phase 33, 34)."""
        imap = self.connect_imap()
        if not imap:
            logger.info("IMAP polling skipped (mock mode or connection unavailable).")
            return
            
        try:
            imap.select("INBOX")
            status, messages = imap.search(None, "UNSEEN")
            if status != "OK":
                return
                
            for num in messages[0].split():
                status, data = imap.fetch(num, "(RFC822)")
                if status != "OK":
                    continue
                    
                raw_email = data[0][1]
                msg = email.message_from_bytes(raw_email)
                
                # Parse and process email
                self.process_incoming_email(db, msg)
                
                # Mark as seen/deleted
                imap.store(num, "+FLAGS", "\\Seen")
        except Exception as e:
            logger.error(f"Error during mailbox polling cycle: {str(e)}")
        finally:
            try:
                imap.close()
                imap.logout()
            except Exception:
                pass

    def extract_body(self, msg: email.message.Message) -> str:
        """Parse email body plain-text decoding HTML if needed."""
        body = ""
        if msg.is_multipart():
            for part in msg.walk():
                content_type = part.get_content_type()
                content_disp = str(part.get("Content-Disposition"))
                if content_type == "text/plain" and "attachment" not in content_disp:
                    try:
                        body = part.get_payload(decode=True).decode("utf-8", errors="ignore")
                        break
                    except Exception:
                        pass
                elif content_type == "text/html" and "attachment" not in content_disp:
                    try:
                        body = part.get_payload(decode=True).decode("utf-8", errors="ignore")
                    except Exception:
                        pass
        else:
            try:
                body = msg.get_payload(decode=True).decode("utf-8", errors="ignore")
            except Exception:
                pass
        return body.strip()

    def detect_thread_ticket(self, db: Session, subject: str, references: Optional[str]) -> Optional[Ticket]:
        """Detect if incoming email belongs to an existing ticket conversation thread (Phase 36)."""
        # 1. Look for ticket ID pattern in Subject (e.g. [CCGP-2026-1002])
        match = re.search(r"\[(CCGP-\d{4}-\d+)\]", subject)
        if match:
            ticket_number = match.group(1)
            ticket = db.query(Ticket).filter(Ticket.ticket_number == ticket_number).first()
            if ticket:
                return ticket

        # 2. Look for existing Message-ID references in references string
        if references:
            for ref_id in references.split():
                ref_id = ref_id.strip()
                conv = db.query(EmailConversation).filter(EmailConversation.message_id == ref_id).first()
                if conv:
                    return conv.ticket

        return None

    def process_incoming_email(self, db: Session, msg: email.message.Message) -> Tuple[Ticket, bool]:
        """Process incoming parsed email message, saving threading log, comments, or auto-creating tickets (Phase 37)."""
        message_id = msg.get("Message-ID", f"<mock_{uuid.uuid4()}@ccgp.local>")
        subject = msg.get("Subject", "No Subject")
        from_hdr = msg.get("From", "Unknown <anonymous@example.com>")
        in_reply_to = msg.get("In-Reply-To", None)
        references = msg.get("References", None)
        
        # Extract sender detail
        sender_name, sender_email = parseaddr(from_hdr)
        if not sender_name:
            sender_name = sender_email.split("@")[0] if sender_email else "Citizen Complainant"

        body = self.extract_body(msg)
        
        # Check if conversation is a thread message
        ticket = self.detect_thread_ticket(db, subject, references)
        is_new_thread = False

        if ticket:
            logger.info(f"Incoming email matched to existing ticket {ticket.ticket_number}. Appending comment.")
            # Create thread comment from officer/citizen
            comment = Comment(
                ticket_id=ticket.id,
                author_id=ticket.assigned_officer_id or ticket.complaint.ticket.assigned_officer_id or uuid.UUID("00000000-0000-0000-0000-000000000000"), # System or default
                content=f"--- [Email Reply from {sender_name}] ---\n\n{body}"
            )
            # Add to timeline
            timeline = ActivityTimeline(
                ticket_id=ticket.id,
                event_type="EmailReply",
                description=f"Received email reply from {sender_name}",
                actor_id=ticket.assigned_officer_id
            )
            db.add(comment)
            db.add(timeline)
        else:
            logger.info("Incoming email does not match any existing thread. Provisioning new ticket.")
            is_new_thread = True
            
            # Extract category from subject if present
            category = "Unclassified"
            if "financial" in subject.lower() or "fraud" in subject.lower() or "money" in subject.lower():
                category = "Cyber Financial Fraud"
            elif "hacking" in subject.lower() or "hacked" in subject.lower():
                category = "Hacking"
            elif "harassment" in subject.lower() or "stalking" in subject.lower():
                category = "Cyber Stalking"

            # Parse financial amount from text
            amount = 0.0
            amount_match = re.search(r"(\d+)\s*(?:rupees|inr|usd|rs)", (subject + " " + (body or "")).lower())
            if amount_match:
                try:
                    amount = float(amount_match.group(1))
                except ValueError:
                    pass

            # Create complaint and ticket
            ticket = self.ticket_service.create_complaint_and_ticket(
                db,
                title=subject,
                description=body or "Email complaint body was blank.",
                source="email",
                reporter_name=sender_name,
                reporter_email=sender_email,
                metadata_json={"category": category, "amount": amount}
            )

            # Auto Dispatch acknowledgement email (Phase 37)
            try:
                notification_service.send_email(
                    db,
                    recipient=sender_email,
                    template_name="ticket_created",
                    subject=f"CCGP Complaint Registered successfully [{ticket.ticket_number}]",
                    variables={
                        "reporter_name": sender_name,
                        "ticket_number": ticket.ticket_number,
                        "category": ticket.category,
                        "severity": ticket.severity
                    },
                    ticket_id=ticket.id
                )
            except Exception as e:
                logger.error(f"Auto-acknowledgement email failed: {str(e)}")

        # Log conversation threading
        conv = EmailConversation(
            ticket_id=ticket.id,
            message_id=message_id,
            in_reply_to=in_reply_to,
            references=references,
            sender=sender_email,
            subject=subject,
            body=body
        )
        db.add(conv)
        db.commit()
        db.refresh(ticket)
        
        return ticket, is_new_thread

    def receive_mock_email(self, db: Session, sender: str, subject: str, body: str) -> Tuple[Ticket, bool]:
        """Utility function to simulate receiving an email for local verification testing."""
        msg = email.message.Message()
        msg["From"] = sender
        msg["Subject"] = subject
        msg["Message-ID"] = f"<mock_{uuid.uuid4()}@ccgp.local>"
        msg.set_payload(body)
        
        return self.process_incoming_email(db, msg)

email_listener_service = EmailListenerService()
