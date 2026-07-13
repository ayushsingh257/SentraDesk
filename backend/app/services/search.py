import uuid
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.repositories.ticket import ticket_repository
from app.services.ai_pipeline import ai_pipeline_service
from app.core.logging import logger

class UnifiedSearchService:
    """Hybrid SQL keyword + Qdrant vector semantic search service (Phase 68)."""

    def hybrid_search(self, db: Session, query_text: str, limit: int = 15) -> List[Dict[str, Any]]:
        """Perform unified search across relational PostgreSQL and vector Qdrant databases."""
        if not query_text or not query_text.strip():
            return []
            
        query_clean = query_text.strip()
        combined_results = {}
        
        # 1. Check if query is a UUID (matches ticket_id or complaint_id)
        is_uuid = False
        try:
            val_uuid = uuid.UUID(query_clean)
            is_uuid = True
        except ValueError:
            pass
            
        if is_uuid:
            from app.models.ticket import Ticket, Complaint
            ticket = db.query(Ticket).filter((Ticket.id == val_uuid) | (Ticket.complaint_id == val_uuid)).first()
            if ticket:
                combined_results[str(ticket.id)] = {
                    "ticket": ticket,
                    "score": 100.0,
                    "match_type": "exact_id"
                }

        # 2. Run Qdrant Vector Semantic Search
        vector_results = []
        try:
            vector_results = ai_pipeline_service.find_similar_complaints(query_clean, limit=limit)
        except Exception as q_err:
            logger.error(f"Vector search failed in hybrid query: {q_err}")
        vector_map = {item["ticket_id"]: item["similarity_score"] for item in vector_results}

        # 3. Match ExtractedEntityIndex indicators (fuzzy/like matches)
        from app.models.threat_intel import ExtractedEntityIndex
        entity_matches = db.query(ExtractedEntityIndex).filter(ExtractedEntityIndex.entity_value.like(f"%{query_clean}%")).all()
        for match in entity_matches:
            ticket_id_str = str(match.ticket_id)
            if ticket_id_str not in combined_results:
                ticket = ticket_repository.get(db, match.ticket_id)
                if ticket:
                    combined_results[ticket_id_str] = {
                        "ticket": ticket,
                        "score": 98.0,
                        "match_type": f"entity_index ({match.entity_type})"
                    }

        # 4. PostgreSQL text search across metadata and demographic columns
        from app.models.ticket import Ticket as TicketModel, Complaint as ComplaintModel
        
        search_pattern = f"%{query_clean}%"
        sql_results = (
            db.query(TicketModel)
            .join(TicketModel.complaint)
            .filter(
                (ComplaintModel.title.like(search_pattern)) |
                (ComplaintModel.description.like(search_pattern)) |
                (TicketModel.ticket_number.like(search_pattern)) |
                (ComplaintModel.reporter_name.like(search_pattern)) |
                (ComplaintModel.reporter_email.like(search_pattern)) |
                (ComplaintModel.reporter_phone.like(search_pattern)) |
                (TicketModel.category.like(search_pattern)) |
                (ComplaintModel.status.like(search_pattern))
            )
            .limit(limit)
            .all()
        )
        
        for ticket in sql_results:
            ticket_id_str = str(ticket.id)
            if ticket_id_str in combined_results:
                if combined_results[ticket_id_str]["match_type"] not in ["exact_id"]:
                    combined_results[ticket_id_str]["match_type"] = "hybrid"
                continue
            
            score = vector_map.get(ticket_id_str, 50.0)
            combined_results[ticket_id_str] = {
                "ticket": ticket,
                "score": score,
                "match_type": "hybrid" if ticket_id_str in vector_map else "keyword"
            }

        # 5. Process Qdrant semantic matches that didn't hit PostgreSQL SQL query filters
        for v_item in vector_results:
            v_id_str = v_item["ticket_id"]
            if v_id_str not in combined_results:
                try:
                    ticket = ticket_repository.get(db, uuid.UUID(v_id_str))
                    if ticket:
                        combined_results[v_id_str] = {
                            "ticket": ticket,
                            "score": v_item["similarity_score"],
                            "match_type": "semantic"
                        }
                except Exception as err:
                    logger.error(f"Error fetching ticket {v_id_str} in hybrid search fallback: {err}")

        # 6. Sort results descending by score
        sorted_items = sorted(combined_results.values(), key=lambda x: x["score"], reverse=True)

        output = []
        for item in sorted_items[:limit]:
            t = item["ticket"]
            output.append({
                "ticket_id": str(t.id),
                "ticket_number": t.ticket_number,
                "title": t.complaint.title,
                "description": t.complaint.description,
                "category": t.category,
                "severity": t.severity,
                "status": t.complaint.status,
                "assigned_group": t.assigned_group,
                "created_at": t.created_at.isoformat(),
                "score": item["score"],
                "match_type": item["match_type"]
            })
            
        return output

unified_search_service = UnifiedSearchService()
