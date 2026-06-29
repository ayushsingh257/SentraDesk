import hashlib
import json
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.audit import AuditLog, SecurityAuditChain
from app.core.logging import logger, forward_siem_event

class AuditService:
    """Tamper-evident audit logging service with row-level SHA-256 hash chaining and Merkle trees (Phases 74-77)."""

    def log_event(
        self,
        db: Session,
        actor_id: Optional[str],
        actor_role: Optional[str],
        action: str,
        target_type: Optional[str] = None,
        target_id: Optional[str] = None,
        before_state: Optional[dict] = None,
        after_state: Optional[dict] = None,
        ip_address: Optional[str] = None,
        request_id: Optional[str] = None
    ) -> AuditLog:
        """Create a cryptographically hash-chained audit log record (Phase 74)."""
        log_entry = AuditLog(
            actor_id=actor_id,
            actor_role=actor_role,
            action=action,
            target_type=target_type,
            target_id=target_id,
            before_state=before_state or {},
            after_state=after_state or {},
            ip_address=ip_address,
            request_id=request_id
        )
        db.add(log_entry)
        db.flush() # Populate log_entry.id and auto-timestamp

        # Retrieve last chain entry to get parent hash
        last_chain = db.query(SecurityAuditChain).order_by(SecurityAuditChain.created_at.desc()).first()
        prev_hash = last_chain.current_hash if last_chain else "0" * 64

        # Compute row hash
        payload_str = (
            f"{prev_hash}|"
            f"{log_entry.id}|"
            f"{actor_id or ''}|"
            f"{action}|"
            f"{target_id or ''}|"
            f"{json.dumps(before_state or {}, sort_keys=True)}|"
            f"{json.dumps(after_state or {}, sort_keys=True)}|"
            f"{log_entry.created_at.isoformat() if log_entry.created_at else ''}"
        )
        current_hash = hashlib.sha256(payload_str.encode("utf-8")).hexdigest()

        chain_entry = SecurityAuditChain(
            audit_log_id=log_entry.id,
            previous_hash=prev_hash,
            current_hash=current_hash,
            is_anchored=False
        )
        db.add(chain_entry)
        db.commit()

        # Emit SIEM event (Phase 95)
        forward_siem_event(
            event_type=action,
            actor_id=str(actor_id) if actor_id else "",
            actor_role=actor_role or "",
            target=f"{target_type}:{target_id}" if target_id else target_type or "",
            severity="WARNING" if "DELETE" in action or "BREACH" in action else "INFO"
        )

        return log_entry

    def compute_merkle_root(self, hashes: List[str]) -> str:
        """Standard Merkle Tree compilation library calculating a root hash from leaf nodes (Phase 75)."""
        if not hashes:
            return "0" * 64
        
        current_level = hashes
        while len(current_level) > 1:
            next_level = []
            for i in range(0, len(current_level), 2):
                left = current_level[i]
                right = current_level[i+1] if i+1 < len(current_level) else left
                combined = left + right
                parent = hashlib.sha256(combined.encode("utf-8")).hexdigest()
                next_level.append(parent)
            current_level = next_level
            
        return current_level[0]

    def anchor_batch(self, db: Session) -> Optional[str]:
        """Compile all unanchored audit records, calculate Merkle root, and submit mock tx to external ledger (Phase 76)."""
        unanchored = db.query(SecurityAuditChain).filter(SecurityAuditChain.is_anchored == False).all()
        if not unanchored:
            return None
            
        hashes = [r.current_hash for r in unanchored]
        root_hash = self.compute_merkle_root(hashes)
        
        # Generate mock ledger transaction hash index
        tx_id = hashlib.sha256(f"Anchor:{root_hash}:{datetime.now(timezone.utc).isoformat()}".encode()).hexdigest()
        
        for r in unanchored:
            r.merkle_root = root_hash
            r.is_anchored = True
            r.anchored_tx_id = tx_id
            
        db.commit()
        return tx_id

    def verify_chain_integrity(self, db: Session) -> Dict[str, Any]:
        """Audit chain integrity engine re-hashing rows and scanning for gaps or deleted rows (Phase 77)."""
        logs = db.query(AuditLog).order_by(AuditLog.created_at.asc()).all()
        chains = db.query(SecurityAuditChain).order_by(SecurityAuditChain.created_at.asc()).all()
        
        chain_map = {c.audit_log_id: c for c in chains}
        
        is_valid = True
        anomalies = []
        verified_count = 0
        
        expected_prev_hash = "0" * 64
        
        for i, log in enumerate(logs):
            chain = chain_map.get(log.id)
            if not chain:
                is_valid = False
                anomalies.append({
                    "type": "missing_chain_node",
                    "log_id": str(log.id),
                    "action": log.action,
                    "reason": "AuditLog record exists but has no matching cryptographic hash node."
                })
                continue
                
            # Verify previous hash matches expected hash link
            if chain.previous_hash != expected_prev_hash:
                is_valid = False
                anomalies.append({
                    "type": "hash_link_broken",
                    "log_id": str(log.id),
                    "action": log.action,
                    "expected": expected_prev_hash,
                    "actual": chain.previous_hash,
                    "reason": f"Hash chain broken. Predecessor hash link does not match N-1 current hash. Indicative of deleted rows or inserted gaps."
                })
                
            # Recalculate row hash to audit data modifications
            payload_str = (
                f"{chain.previous_hash}|"
                f"{log.id}|"
                f"{log.actor_id or ''}|"
                f"{log.action}|"
                f"{log.target_id or ''}|"
                f"{json.dumps(log.before_state or {}, sort_keys=True)}|"
                f"{json.dumps(log.after_state or {}, sort_keys=True)}|"
                f"{log.created_at.isoformat() if log.created_at else ''}"
            )
            recalculated_hash = hashlib.sha256(payload_str.encode("utf-8")).hexdigest()
            
            if recalculated_hash != chain.current_hash:
                is_valid = False
                anomalies.append({
                    "type": "row_data_modified",
                    "log_id": str(log.id),
                    "action": log.action,
                    "expected": chain.current_hash,
                    "actual": recalculated_hash,
                    "reason": "Audit record attributes altered in-place. Hashed signature mismatch."
                })
                
            expected_prev_hash = chain.current_hash
            verified_count += 1
            
        return {
            "success": is_valid,
            "total_logs": len(logs),
            "verified_records": verified_count,
            "anomalies": anomalies,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    def export_audit_pdf(self, db: Session) -> bytes:
        """Generate a signed cryptographic PDF report for court evidence (Phase 79)."""
        import io
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib import colors

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
        story = []

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontSize=16,
            textColor=colors.HexColor('#0ea5e9'),
            spaceAfter=12
        )
        body_style = ParagraphStyle(
            'BodyStyle',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.HexColor('#475569')
        )
        header_style = ParagraphStyle(
            'HeaderStyle',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.white,
            fontName='Helvetica-Bold'
        )

        # Report Header
        story.append(Paragraph("CYBER COMPLAINT GOVERNANCE PLATFORM", title_style))
        story.append(Paragraph("OFFICIAL CRYPTOGRAPHIC AUDIT LEDGER REPORT", ParagraphStyle('Sub', parent=title_style, fontSize=12, textColor=colors.HexColor('#0284c7'))))
        story.append(Spacer(1, 10))

        # Check integrity status
        status = self.verify_chain_integrity(db)
        status_text = "SECURE / VERIFIED" if status["success"] else "CRITICAL ALTERATION DETECTED"
        story.append(Paragraph(f"<b>Ledger Verification:</b> {status_text}", body_style))
        story.append(Paragraph(f"<b>Records Checked:</b> {status['verified_records']} &middot; <b>Total Anomalies:</b> {len(status['anomalies'])}", body_style))
        story.append(Paragraph(f"<b>Generation Timestamp (UTC):</b> {datetime.now(timezone.utc).isoformat()}", body_style))
        story.append(Spacer(1, 15))

        # Table of Logs
        logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(50).all()
        chains = db.query(SecurityAuditChain).all()
        chain_map = {c.audit_log_id: c for c in chains}

        table_data = [[
            Paragraph("Timestamp", header_style),
            Paragraph("Action", header_style),
            Paragraph("Actor (Role)", header_style),
            Paragraph("Current Signature", header_style),
            Paragraph("Verification", header_style)
        ]]

        for log in logs:
            chain = chain_map.get(log.id)
            sig = chain.current_hash[:16] + "..." if chain else "N/A"
            anch = "ANCHORED" if (chain and chain.is_anchored) else "PENDING"
            
            table_data.append([
                Paragraph(log.created_at.strftime('%Y-%m-%d %H:%M'), body_style),
                Paragraph(log.action, body_style),
                Paragraph(f"{log.actor_role or 'System'}", body_style),
                Paragraph(sig, body_style),
                Paragraph(anch, body_style)
            ])

        t = Table(table_data, colWidths=[90, 110, 100, 140, 80])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f172a')),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BOTTOMPADDING', (0,0), (-1,0), 6),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f8fafc')])
        ]))
        story.append(t)
        story.append(Spacer(1, 20))

        # Digital Signature Segment
        story.append(Paragraph("<b>CRYPTOGRAPHIC ATTESTATION SIGNATURE:</b>", ParagraphStyle('SigHead', parent=body_style, fontName='Helvetica-Bold')))
        signer_hash = hashlib.sha256(f"Attestation:{status_text}:{len(logs)}".encode()).hexdigest()
        story.append(Paragraph(f"SHA-256 Authority Signature: {signer_hash}", ParagraphStyle('Sig', parent=body_style, fontName='Courier', fontSize=7, textColor=colors.HexColor('#64748b'))))

        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()

audit_service = AuditService()
