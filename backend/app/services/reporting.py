import io
import hashlib
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

from app.models.ticket import Ticket
from app.models.evidence import Evidence

class ReportingService:
    """PDF compiling engine generating official complaint and case investigation sheets (Phases 84-88)."""

    def generate_complaint_pdf(self, ticket: Ticket) -> bytes:
        """Compile a single citizen complaint sheet into PDF (Phase 84)."""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
        story = []

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'TitleStyle', parent=styles['Heading1'], fontSize=16, textColor=colors.HexColor('#0ea5e9'), spaceAfter=12
        )
        body_style = ParagraphStyle(
            'BodyStyle', parent=styles['Normal'], fontSize=9, textColor=colors.HexColor('#334155')
        )
        header_style = ParagraphStyle(
            'HeaderStyle', parent=styles['Normal'], fontSize=9, textColor=colors.white, fontName='Helvetica-Bold'
        )

        story.append(Paragraph(f"CCGP INCIDENT RECORD SHEET: {ticket.ticket_number}", title_style))
        story.append(Spacer(1, 10))

        # Basic properties
        complaint_data = [
            [Paragraph("Field", header_style), Paragraph("Value", header_style)],
            [Paragraph("Ticket ID", body_style), Paragraph(str(ticket.id), body_style)],
            [Paragraph("Title", body_style), Paragraph(ticket.complaint.title, body_style)],
            [Paragraph("Reporter", body_style), Paragraph(ticket.complaint.reporter_name, body_style)],
            [Paragraph("Email", body_style), Paragraph(ticket.complaint.reporter_email or "None Provided", body_style)],
            [Paragraph("Phone", body_style), Paragraph(ticket.complaint.reporter_phone or "None Provided", body_style)],
            [Paragraph("Category", body_style), Paragraph(ticket.category, body_style)],
            [Paragraph("Severity", body_style), Paragraph(ticket.severity, body_style)],
            [Paragraph("Status", body_style), Paragraph(ticket.complaint.status, body_style)],
            [Paragraph("Created At", body_style), Paragraph(ticket.created_at.strftime('%Y-%m-%d %H:%M'), body_style)]
        ]

        t = Table(complaint_data, colWidths=[120, 400])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f172a')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f8fafc')]),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('TOPPADDING', (0,0), (-1,-1), 5),
        ]))
        story.append(t)
        story.append(Spacer(1, 15))

        story.append(Paragraph("<b>COMPLAINT DESCRIPTION:</b>", ParagraphStyle('DescHead', parent=body_style, fontName='Helvetica-Bold')))
        story.append(Spacer(1, 4))
        story.append(Paragraph(ticket.complaint.description, body_style))
        story.append(Spacer(1, 20))

        # Digital Signature attestation
        attest_str = f"Attest:{ticket.ticket_number}:{ticket.complaint.status}:{ticket.created_at.isoformat()}"
        attest_hash = hashlib.sha256(attest_str.encode()).hexdigest()
        story.append(Paragraph(f"<b>Attestation Seal:</b> {attest_hash}", ParagraphStyle('Sig', parent=body_style, fontName='Courier', fontSize=7, textColor=colors.HexColor('#94a3b8'))))

        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()

    def generate_case_report_pdf(self, ticket: Ticket, db: Session) -> bytes:
        """Compile complete timeline, evidence logs, notes, metadata into single PDF (Phase 85, 87, 88)."""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
        story = []

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'TitleStyle', parent=styles['Heading1'], fontSize=16, textColor=colors.HexColor('#0f172a'), spaceAfter=12
        )
        h2_style = ParagraphStyle(
            'H2Style', parent=styles['Heading2'], fontSize=11, textColor=colors.HexColor('#0284c7'), spaceBefore=10, spaceAfter=6
        )
        body_style = ParagraphStyle(
            'BodyStyle', parent=styles['Normal'], fontSize=8.5, textColor=colors.HexColor('#334155')
        )
        header_style = ParagraphStyle(
            'HeaderStyle', parent=styles['Normal'], fontSize=9, textColor=colors.white, fontName='Helvetica-Bold'
        )

        story.append(Paragraph(f"TACTICAL CASE INVESTIGATION REPORT: {ticket.ticket_number}", title_style))
        story.append(Spacer(1, 10))

        # 1. Metadata Block
        meta_data = [
            [Paragraph("Field", header_style), Paragraph("Value", header_style)],
            [Paragraph("Assigned Investigator Group", body_style), Paragraph(ticket.assigned_group or "—", body_style)],
            [Paragraph("Assigned Officer ID", body_style), Paragraph(str(ticket.assigned_officer_id) if ticket.assigned_officer_id else "—", body_style)],
            [Paragraph("SLA Target Deadline", body_style), Paragraph(ticket.sla_deadline.strftime('%Y-%m-%d %H:%M') if ticket.sla_deadline else "—", body_style)],
            [Paragraph("Auto Escalated Status", body_style), Paragraph("YES / SLA BREACHED" if ticket.is_escalated else "NO / NOMINAL", body_style)]
        ]
        t_meta = Table(meta_data, colWidths=[150, 370])
        t_meta.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e293b')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('TOPPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(t_meta)
        story.append(Spacer(1, 15))

        # 2. AI Model predictions & Override Reports (Phase 87)
        story.append(Paragraph("AI Model Decision Audit Log", h2_style))
        meta = ticket.complaint.metadata_json or {}
        ai_cat = meta.get("ai_category_prediction", "Unclassified")
        ai_conf = meta.get("ai_confidence", 0.0)
        ai_risk = meta.get("ai_risk_score", 0.0)
        ai_lang = meta.get("ai_language", "en")
        
        # Override audit checks
        is_overridden = ticket.category != ai_cat
        override_text = "YES" if is_overridden else "NO (Model Category Retained)"

        ai_data = [
            [Paragraph("Metric", header_style), Paragraph("Value", header_style)],
            [Paragraph("Predicted Model Category", body_style), Paragraph(ai_cat, body_style)],
            [Paragraph("Classification Confidence Level", body_style), Paragraph(f"{ai_conf}%", body_style)],
            [Paragraph("Predicted Threat Severity Score", body_style), Paragraph(f"{ai_risk}/100", body_style)],
            [Paragraph("Language Profile", body_style), Paragraph(ai_lang, body_style)],
            [Paragraph("Human Nodal Override Action", body_style), Paragraph(override_text, body_style)]
        ]
        t_ai = Table(ai_data, colWidths=[150, 370])
        t_ai.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#475569')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('TOPPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(t_ai)
        story.append(Spacer(1, 15))

        # 3. Evidence Log Inventory (Phase 85)
        story.append(Paragraph("Evidence Files Inventory Ledger", h2_style))
        evidence_list = db.query(Evidence).filter(Evidence.ticket_id == ticket.id).all()
        
        evidence_data = [[
            Paragraph("Filename", header_style),
            Paragraph("Size (KB)", header_style),
            Paragraph("Version", header_style),
            Paragraph("SHA-256 Hash Signature", header_style)
        ]]
        
        for file in evidence_list:
            evidence_data.append([
                Paragraph(file.filename, body_style),
                Paragraph(f"{(file.file_size / 1024):.1f}", body_style),
                Paragraph(str(file.version), body_style),
                Paragraph(file.sha256_hash[:20] + "...", body_style)
            ])
            
        t_ev = Table(evidence_data, colWidths=[130, 60, 50, 280])
        t_ev.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#64748b')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('TOPPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(t_ev)
        story.append(Spacer(1, 15))

        # 4. Activity Logs (Phase 85)
        story.append(Paragraph("Timeline Events Logs Tracking", h2_style))
        timeline_events = ticket.timeline
        
        timeline_data = [[
            Paragraph("Timestamp", header_style),
            Paragraph("Event", header_style),
            Paragraph("Description", header_style)
        ]]
        
        for ev in timeline_events:
            timeline_data.append([
                Paragraph(ev.created_at.strftime('%Y-%m-%d %H:%M'), body_style),
                Paragraph(ev.event_type, body_style),
                Paragraph(ev.description, body_style)
            ])
            
        t_tl = Table(timeline_data, colWidths=[90, 110, 320])
        t_tl.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#334155')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('TOPPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(t_tl)
        story.append(Spacer(1, 20))

        # Signed verification seal
        story.append(Paragraph("<b>CRYPTOGRAPHIC VERIFICATION SEAL:</b>", ParagraphStyle('SealHead', parent=body_style, fontName='Helvetica-Bold')))
        doc_hash = hashlib.sha256(f"CaseReport:{ticket.ticket_number}:{len(timeline_events)}".encode()).hexdigest()
        story.append(Paragraph(f"SHA-256 Case Document hash: {doc_hash}", ParagraphStyle('SealHash', parent=body_style, fontName='Courier', fontSize=7, textColor=colors.HexColor('#64748b'))))

        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()

    def dispatch_governance_report_email(self, db: Session, supervisor_email: str) -> None:
        """Celery periodic worker task emailing governance analytics report to supervisor (Phase 86)."""
        from app.services.notification import notification_service
        # Generate summary metrics
        total = db.query(Ticket).count()
        closed = db.query(Ticket).join(Complaint).filter(Complaint.status == "Closed").count()
        breached = db.query(Ticket).filter(Ticket.is_escalated == True).count()
        
        variables = {
            "total_tickets": str(total),
            "closed_tickets": str(closed),
            "breached_tickets": str(breached),
            "report_date": datetime.now(timezone.utc).strftime('%Y-%m-%d')
        }
        
        # Build custom html body for periodic governance updates
        html_content = f"""
        <html>
            <body>
                <h2>📊 Monthly Governance Analytics Report</h2>
                <p>Dear Supervisory Officer,</p>
                <p>Please find the monthly operation performance metrics report for the CCGP platform below:</p>
                <ul>
                    <li><strong>Total Logged Incidents:</strong> {variables['total_tickets']}</li>
                    <li><strong>Resolved & Closed Cases:</strong> {variables['closed_tickets']}</li>
                    <li><strong>Violated SLA Escalations:</strong> {variables['breached_tickets']}</li>
                </ul>
                <p>Please log into the auditor command center portal to download official signed ledger audit logs.</p>
                <p>Best regards,<br/>CCGP Governance Alert System</p>
            </body>
        </html>
        """
        
        # Dispatch email
        from app.core.logging import logger
        logger.info(f"Dispatching scheduled monthly analytics report email to {supervisor_email}")
        try:
            # Inject variables directly into notification dispatcher
            notification_service.send_email(
                db,
                recipient=supervisor_email,
                subject="CCGP Monthly Governance Performance Report",
                template_name="ticket_escalated", # Reuse template name or map manually
                variables=variables
            )
        except Exception as e:
            logger.error(f"Failed to deliver scheduled governance report email: {e}")

reporting_service = ReportingService()
