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
            
        # 1. Execute vector search query
        vector_results = ai_pipeline_service.find_similar_complaints(query_text, limit=limit)
        vector_map = {item["ticket_id"]: item["similarity_score"] for item in vector_results}
        
        # 2. Execute SQL keyword search query
        sql_results = ticket_repository.get_tickets_filtered(db, search_query=query_text, limit=limit)
        
        # 2.5 Query relational entity indicator index matching query exactly
        from app.models.threat_intel import ExtractedEntityIndex
        entity_matches = db.query(ExtractedEntityIndex).filter(ExtractedEntityIndex.entity_value == query_text).all()
        
        # 3. Combine results
        combined_results = {}
        
        # Process entity index matches first (exact matches)
        for match in entity_matches:
            ticket_id_str = str(match.ticket_id)
            ticket = ticket_repository.get(db, match.ticket_id)
            if ticket:
                combined_results[ticket_id_str] = {
                    "ticket": ticket,
                    "score": 98.0,
                    "match_type": "entity_index"
                }
        
        # Process SQL results
        for ticket in sql_results:
            ticket_id_str = str(ticket.id)
            if ticket_id_str in combined_results:
                continue
            score = vector_map.get(ticket_id_str, 50.0) # Nominal score for keyword matches
            combined_results[ticket_id_str] = {
                "ticket": ticket,
                "score": score,
                "match_type": "hybrid" if ticket_id_str in vector_map else "keyword"
            }
            
        # Process vector results not found in SQL matches
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
                    logger.error(f"Error fetching ticket {v_id_str} in hybrid search: {err}")
                    
        # Sort by similarity score descending
        sorted_items = sorted(combined_results.values(), key=lambda x: x["score"], reverse=True)
        
        # Format response payload
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
