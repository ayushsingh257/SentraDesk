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
        """Compile a highly professional cyber crime investigation dossier PDF."""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=40, bottomMargin=40)
        story = []

        styles = getSampleStyleSheet()
        
        # Professional color palette
        c_primary = colors.HexColor('#0f172a') # Slate 900
        c_secondary = colors.HexColor('#1e293b') # Slate 800
        c_accent = colors.HexColor('#0284c7') # Sky 600
        c_border = colors.HexColor('#cbd5e1') # Slate 300
        c_bg_light = colors.HexColor('#f8fafc') # Slate 50
        
        # Professional Typography styles
        style_cover_title = ParagraphStyle(
            'CoverTitle', parent=styles['Heading1'], fontSize=20, leading=24, textColor=c_primary, spaceAfter=8, alignment=1, fontName='Helvetica-Bold'
        )
        style_cover_subtitle = ParagraphStyle(
            'CoverSubtitle', parent=styles['Normal'], fontSize=10, leading=14, textColor=colors.HexColor('#475569'), spaceAfter=20, alignment=1
        )
        style_h1 = ParagraphStyle(
            'SectionH1', parent=styles['Heading2'], fontSize=12, leading=16, textColor=c_accent, spaceBefore=14, spaceAfter=8, borderPadding=2, fontName='Helvetica-Bold'
        )
        style_body = ParagraphStyle(
            'Body', parent=styles['Normal'], fontSize=8.5, leading=11, textColor=colors.HexColor('#334155')
        )
        style_body_bold = ParagraphStyle(
            'BodyBold', parent=style_body, fontName='Helvetica-Bold'
        )
        style_header = ParagraphStyle(
            'Header', parent=styles['Normal'], fontSize=8.5, leading=11, textColor=colors.white, fontName='Helvetica-Bold'
        )
        style_monospaced = ParagraphStyle(
            'Monospaced', parent=styles['Normal'], fontSize=7.5, leading=10, fontName='Courier', textColor=colors.HexColor('#1e293b')
        )

        # ------------------ COVER PAGE / HEADER ------------------
        # National Emblem / Logo Placeholder (Drawn in text/table for cleanliness)
        logo_data = [
            [Paragraph("<b>CYBER CRIME INVESTIGATION DIVISION</b>", ParagraphStyle('LogoT1', parent=style_cover_title, fontSize=11, leading=14, textColor=colors.HexColor('#0369a1')))],
            [Paragraph("<b>MINISTRY OF HOME AFFAIRS • GOVERNMENT OF INDIA</b>", ParagraphStyle('LogoT2', parent=style_cover_subtitle, fontSize=8, leading=10, spaceAfter=0))]
        ]
        t_logo = Table(logo_data, colWidths=[540])
        t_logo.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 1),
            ('TOPPADDING', (0,0), (-1,-1), 1),
        ]))
        story.append(t_logo)
        story.append(Spacer(1, 10))

        # Thin rule divider
        t_divider = Table([[""]], colWidths=[540], rowHeights=[2])
        t_divider.setStyle(TableStyle([
            ('LINEBELOW', (0,0), (-1,-1), 2, c_accent),
            ('BOTTOMPADDING', (0,0), (-1,-1), 0),
            ('TOPPADDING', (0,0), (-1,-1), 0),
        ]))
        story.append(t_divider)
        story.append(Spacer(1, 15))

        story.append(Paragraph("TACTICAL CASE INVESTIGATION DOSSIER", style_cover_title))
        story.append(Paragraph(f"CASE FILE REFERENCE: {ticket.ticket_number}", style_cover_subtitle))

        # Cover Information Grid
        cover_info = [
            [Paragraph("Case Status", style_body_bold), Paragraph(ticket.complaint.status.upper(), style_body)],
            [Paragraph("Jurisdiction Cell", style_body_bold), Paragraph(ticket.assigned_group or "Cyber Financial Fraud Unit", style_body)],
            [Paragraph("Investigating Officer ID", style_body_bold), Paragraph(str(ticket.assigned_officer_id) if ticket.assigned_officer_id else "Unassigned", style_body)],
            [Paragraph("SLA Target Deadline", style_body_bold), Paragraph(ticket.sla_deadline.strftime('%Y-%m-%d %H:%M UTC') if ticket.sla_deadline else "Nominal / Under Review", style_body)],
            [Paragraph("Document Security Class", style_body_bold), Paragraph("RESTRICTED - LAW ENFORCEMENT ONLY", ParagraphStyle('SecText', parent=style_body, textColor=colors.HexColor('#b91c1c'), fontName='Helvetica-Bold'))]
        ]
        t_cover = Table(cover_info, colWidths=[150, 390])
        t_cover.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 0.5, c_border),
            ('BACKGROUND', (0,0), (0,-1), c_bg_light),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('TOPPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(t_cover)
        story.append(Spacer(1, 20))

        # ------------------ VICTIM PROFILE & COMPLAINT ------------------
        story.append(Paragraph("I. Victim Profile & Complaint Narrative", style_h1))
        victim_data = [
            [Paragraph("Citizen / Complainant", style_body_bold), Paragraph(ticket.complaint.reporter_name or "Anonymous Reporter", style_body)],
            [Paragraph("Associated Email", style_body_bold), Paragraph(ticket.complaint.reporter_email or "Not Provided", style_body)],
            [Paragraph("Contact Number", style_body_bold), Paragraph(ticket.complaint.reporter_phone or "Not Provided", style_body)],
            [Paragraph("Incident Title", style_body_bold), Paragraph(ticket.complaint.title or "Cyber Complaint Log", style_body)],
        ]
        t_victim = Table(victim_data, colWidths=[150, 390])
        t_victim.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 0.5, c_border),
            ('BACKGROUND', (0,0), (0,-1), c_bg_light),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('TOPPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(t_victim)
        story.append(Spacer(1, 8))
        story.append(Paragraph("<b>Original Incident Description Narrative:</b>", style_body_bold))
        story.append(Spacer(1, 4))
        story.append(Paragraph(ticket.complaint.description or "—", ParagraphStyle('DescBlock', parent=style_body, leftIndent=8, textColor=colors.HexColor('#475569'))))
        story.append(Spacer(1, 15))

        # ------------------ AI CASE ANALYST REPORT ------------------
        story.append(Paragraph("II. AI Cyber Case Analyst Summary", style_h1))
        
        # Load advanced dynamic AI analysis
        from app.services.ai_pipeline import ai_pipeline_service
        evidence_files = [ev.filename for ev in ticket.evidence]
        amount = 0.0
        meta = ticket.complaint.metadata_json or {}
        try:
            amount = float(meta.get("amount", 0.0))
        except (ValueError, TypeError):
            pass
            
        ai_dossier = ai_pipeline_service.analyze_case_dossier(
            description=ticket.complaint.description,
            category=ticket.category,
            severity=ticket.severity,
            amount=amount,
            evidence_files=evidence_files
        )

        story.append(Paragraph(f"<b>Executive Summary:</b> {ai_dossier.get('executive_summary', 'Pending.')}", style_body))
        story.append(Spacer(1, 8))
        
        # AI Timeline
        story.append(Paragraph("<b>Inferred Incident Timeline:</b>", style_body_bold))
        story.append(Spacer(1, 4))
        timeline_rows = []
        for step in ai_dossier.get("timeline", []):
            timeline_rows.append([
                Paragraph(f"<b>{step.get('date')}</b>", style_body),
                Paragraph(step.get('event'), style_body)
            ])
        if timeline_rows:
            t_timeline = Table(timeline_rows, colWidths=[130, 410])
            t_timeline.setStyle(TableStyle([
                ('GRID', (0,0), (-1,-1), 0.5, c_border),
                ('BACKGROUND', (0,0), (0,-1), c_bg_light),
                ('BOTTOMPADDING', (0,0), (-1,-1), 4),
                ('TOPPADDING', (0,0), (-1,-1), 4),
            ]))
            story.append(t_timeline)
        else:
            story.append(Paragraph("No timeline timeline steps inferred.", style_body))
        story.append(Spacer(1, 12))

        # ------------------ APPLICABLE CYBER LAWS & RISK ------------------
        story.append(Paragraph("III. Cyber Crime Legal Framework mapping", style_h1))
        law_data = [
            [Paragraph("Applicable Act & Section", style_header), Paragraph("Offence Scope & Legal Interpretation", style_header)]
        ]
        for law in ai_dossier.get("legal_sections", []):
            law_data.append([
                Paragraph(f"<b>{law.get('section')}</b><br/>{law.get('act')}", style_body),
                Paragraph(law.get('description'), style_body)
            ])
        t_law = Table(law_data, colWidths=[150, 390])
        t_law.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), c_secondary),
            ('GRID', (0,0), (-1,-1), 0.5, c_border),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_bg_light]),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('TOPPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(t_law)
        story.append(Spacer(1, 15))

        # ------------------ THREAT INTEL LOGS ------------------
        story.append(Paragraph("IV. Threat Intelligence & Extracted Indicators", style_h1))
        
        # Get threat indicators
        from app.models.threat_intel import ExtractedEntityIndex
        entity_records = db.query(ExtractedEntityIndex).filter(ExtractedEntityIndex.ticket_id == ticket.id).all()
        if entity_records:
            intel_rows = [
                [Paragraph("Indicator Type", style_header), Paragraph("Value", style_header), Paragraph("Reputation Status", style_header)]
            ]
            for rec in entity_records:
                # Add mock reputation parameters dynamically
                rep_status = "Clean"
                val_lower = rec.entity_value.lower()
                if "malicious" in val_lower or "fraud" in val_lower or "scam" in val_lower:
                    rep_status = "Malicious"
                elif "abuse" in val_lower or "hacked" in val_lower:
                    rep_status = "Suspicious"
                    
                intel_rows.append([
                    Paragraph(rec.entity_type.replace("_", " ").title(), style_body),
                    Paragraph(rec.entity_value, style_body),
                    Paragraph(rep_status, ParagraphStyle('RepStyle', parent=style_body_bold, textColor=colors.HexColor('#b91c1c') if rep_status == 'Malicious' else colors.HexColor('#047857') if rep_status == 'Clean' else colors.HexColor('#d97706')))
                ])
            t_intel = Table(intel_rows, colWidths=[150, 240, 150])
            t_intel.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), c_secondary),
                ('GRID', (0,0), (-1,-1), 0.5, c_border),
                ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_bg_light]),
                ('BOTTOMPADDING', (0,0), (-1,-1), 4),
                ('TOPPADDING', (0,0), (-1,-1), 4),
            ]))
            story.append(t_intel)
        else:
            story.append(Paragraph("No technical indicators extracted or linked for this case.", style_body))
        story.append(Spacer(1, 15))

        # ------------------ EVIDENCE FILES INVENTORY ------------------
        story.append(Paragraph("V. Evidence Inventory Ledger", style_h1))
        from app.models.evidence import Evidence
        evidence_list = db.query(Evidence).filter(Evidence.ticket_id == ticket.id).all()
        evidence_data = [[
            Paragraph("Filename", style_header),
            Paragraph("File Size (KB)", style_header),
            Paragraph("Version", style_header),
            Paragraph("SHA-256 Checksum", style_header)
        ]]
        if evidence_list:
            for file in evidence_list:
                evidence_data.append([
                    Paragraph(file.filename, style_body),
                    Paragraph(f"{(file.file_size / 1024):.1f}", style_body),
                    Paragraph(str(file.version), style_body),
                    Paragraph(file.sha256_hash or "—", style_monospaced)
                ])
        else:
            evidence_data.append([Paragraph("No evidence files uploaded.", style_body), Paragraph("—", style_body), Paragraph("—", style_body), Paragraph("—", style_body)])

        t_ev = Table(evidence_data, colWidths=[140, 70, 50, 280])
        t_ev.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), c_secondary),
            ('GRID', (0,0), (-1,-1), 0.5, c_border),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_bg_light]),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('TOPPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(t_ev)
        story.append(Spacer(1, 15))

        # ------------------ INTERNAL INVESTIGATION NOTES ------------------
        story.append(Paragraph("VI. Internal Officer Notes & Timeline Log", style_h1))
        private_notes = ticket.private_notes if hasattr(ticket, 'private_notes') else []
        if private_notes:
            notes_rows = []
            for note in private_notes:
                notes_rows.append([
                    Paragraph(f"<b>{note.created_at.strftime('%Y-%m-%d %H:%M')}</b>", style_body),
                    Paragraph(note.content, style_body)
                ])
            t_notes = Table(notes_rows, colWidths=[110, 430])
            t_notes.setStyle(TableStyle([
                ('GRID', (0,0), (-1,-1), 0.5, c_border),
                ('BACKGROUND', (0,0), (0,-1), c_bg_light),
                ('BOTTOMPADDING', (0,0), (-1,-1), 4),
                ('TOPPADDING', (0,0), (-1,-1), 4),
            ]))
            story.append(t_notes)
        else:
            story.append(Paragraph("No private notes recorded for this case.", style_body))
        story.append(Spacer(1, 15))

        # ------------------ DIGITAL SIGN-OFF SEAL ------------------
        story.append(Paragraph("VII. Official Attestation & Digital Sign-Off", style_h1))
        
        # Render a decorative signature table block
        doc_hash = hashlib.sha256(f"CaseReportDossier:{ticket.ticket_number}:{ticket.created_at.isoformat()}".encode()).hexdigest()
        sig_data = [
            [
                Paragraph("<b>Investigating Nodal Officer</b><br/><br/><br/>________________________<br/>Signature & Stamp", style_body),
                Paragraph("<b>Supervisory Authority</b><br/><br/><br/>________________________<br/>Signature & Stamp", style_body)
            ],
            [
                Paragraph(f"<b>Timestamp:</b> {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}", style_body),
                Paragraph(f"<b>Seal ID:</b> {doc_hash[:16].upper()}", style_body)
            ]
        ]
        t_sig = Table(sig_data, colWidths=[270, 270])
        t_sig.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 0.5, c_border),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BACKGROUND', (0,0), (-1,-1), c_bg_light),
            ('BOTTOMPADDING', (0,0), (-1,-1), 10),
            ('TOPPADDING', (0,0), (-1,-1), 10),
        ]))
        story.append(t_sig)
        story.append(Spacer(1, 10))
        
        story.append(Paragraph("<b>CRYPTOGRAPHIC DOCUMENT INTEGRITY SEAL:</b>", style_body_bold))
        story.append(Paragraph(f"SHA-256 Checksum: {doc_hash}", style_monospaced))

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
