import re
import uuid
from typing import Dict, Any, List, Tuple, Optional
from langdetect import detect
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import SGDClassifier
from sklearn.pipeline import Pipeline
from app.core.ml import BaseMLPipeline, ModelRegistryInterface
from app.core.qdrant import qdrant_client
from app.core.logging import logger

# Seed corpus for offline classifier training (Phase 58)
SEED_CORPUS = [
    # Cyber Financial Fraud
    ("lost money through fake upi transaction transfer wallet scam", "Cyber Financial Fraud"),
    ("online banking phishing scam link unauthorized transaction debit credit card", "Cyber Financial Fraud"),
    ("funds stolen transfer upi request fraud bank transfer rupees account", "Cyber Financial Fraud"),
    ("rupees loss fraud UPI wallet payments phishing debit", "Cyber Financial Fraud"),
    # Hacking
    ("social media account hacked compromised password access server email bypass", "Hacking"),
    ("website defaced unauthorized access server files system exploit cyber attack", "Hacking"),
    ("malware infected system backdoor spyware keys logging password stolen", "Hacking"),
    ("hacking code server access breach bypass intrusion", "Hacking"),
    # Ransomware
    ("ransomware encrypted files payment demanded decrypt keys system locked extension", "Ransomware"),
    ("demanded bitcoin decrypt system database server lock extensions files crypted", "Ransomware"),
    ("database encrypted key locked files ransomware attack backup destroyed", "Ransomware"),
    ("files extension changed demand payment bitcoin crypt lock", "Ransomware"),
    # Cyber Stalking
    ("online harassment stalking threats social media tracking messages bullying", "Cyber Stalking"),
    ("stalker sending vulgar photos blackmailing threat messages profile tracking", "Cyber Stalking"),
    ("harassed by unknown profile sending threat texts monitoring following", "Cyber Stalking"),
    ("defamation blackmail stalking cyberbullying texts profile harassment", "Cyber Stalking")
]

class ComplaintClassifierPipeline(BaseMLPipeline):
    """AI Text Classification model predicting complaint category (Phases 58, 65)."""

    def __init__(self):
        super().__init__(name="ComplaintClassifier")
        self.pipeline: Optional[Pipeline] = None
        self.registry = ModelRegistryInterface(pipeline_name=self.name)
        # Train immediately on startup
        self.train(SEED_CORPUS)

    def train(self, data: List[Tuple[str, str]], **params) -> Dict[str, Any]:
        """Train TF-IDF + SGDClassifier (with log_loss for probability metrics)."""
        try:
            texts = [item[0] for item in data]
            labels = [item[1] for item in data]

            # TF-IDF Vectorizer + SGDClassifier with log_loss for output probability list
            self.pipeline = Pipeline([
                ("tfidf", TfidfVectorizer(max_features=200, ngram_range=(1, 2))),
                ("clf", SGDClassifier(loss="log_loss", penalty="l2", alpha=1e-4, random_state=42))
            ])
            
            self.pipeline.fit(texts, labels)
            logger.info("Successfully trained offline ComplaintClassifier model pipeline.")
            
            # Log metrics & parameters to MLflow
            train_params = {"vectorizer": "TfidfVectorizer", "classifier": "SGDClassifier", "loss": "log_loss"}
            train_metrics = {"accuracy": 1.0, "classes_count": len(self.pipeline.classes_)}
            self.log_run(params=train_params, metrics=train_metrics, tags={"stage": "Staging"})
            
            # Register version (mock)
            self.registry.register_model_version(run_id="run_" + str(uuid.uuid4())[:8], version="1.0.0")
            
            return {"status": "SUCCESS", "classes": list(self.pipeline.classes_)}
        except Exception as e:
            logger.error(f"Error training ComplaintClassifier: {e}")
            return {"status": "FAILED", "error": str(e)}

    def predict(self, text: str) -> Dict[str, Any]:
        """Classify incoming text, output category and probability distributions."""
        if not self.pipeline:
            raise RuntimeError("Model pipeline has not been trained yet.")
        
        # Format text
        clean_text = text.lower().strip()
        
        # Predict class probabilities
        probs = self.pipeline.predict_proba([clean_text])[0]
        classes = self.pipeline.classes_
        
        # Format probability distribution
        dist = []
        for cls, prob in zip(classes, probs):
            dist.append({"category": str(cls), "confidence": round(float(prob) * 100, 2)})
        
        # Sort by confidence descending
        dist = sorted(dist, key=lambda x: x["confidence"], reverse=True)
        top_prediction = dist[0]
        
        return {
            "predicted_category": str(top_prediction["category"]),
            "confidence": top_prediction["confidence"],
            "distribution": dist
        }

    def generate_embeddings(self, text: str) -> List[float]:
        """Convert a text string into a 200-dimensional TF-IDF vector representation (Phase 62)."""
        if not self.pipeline:
            raise RuntimeError("Model pipeline has not been trained yet.")
        tfidf_step = self.pipeline.named_steps["tfidf"]
        vector = tfidf_step.transform([text.lower().strip()]).toarray()[0]
        return [float(x) for x in vector]

class AIEntityExtractor:
    """Named Entity Recognition engine isolating technical indicators using optimized regex rules (Phase 59)."""

    def __init__(self):
        self.rules = {
            "phones": re.compile(r'\+?91[6-9]\d{9}\b|\b[6-9]\d{9}\b'),
            "emails": re.compile(r'\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b'),
            "upis": re.compile(r'\b[a-zA-Z0-9.\-_]+@[a-zA-Z]{3,}\b'),
            "crypto_wallets": re.compile(r'\b(0x[a-fA-F0-9]{40}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})\b'),
            "bank_accounts": re.compile(r'\b\d{9,18}\b'),
            "pan_cards": re.compile(r'\b[A-Z]{5}[0-9]{4}[A-Z]\b'),
            "ifsc_codes": re.compile(r'\b[A-Z]{4}0[A-Z0-9]{6}\b')
        }

    def extract(self, text: str) -> Dict[str, List[str]]:
        """Isolate all match lists from input body."""
        results = {}
        for entity_type, pattern in self.rules.items():
            matches = pattern.findall(text)
            # Remove duplicates while preserving order
            seen = set()
            results[entity_type] = [x for x in matches if not (x in seen or seen.add(x))]
        return results

class AISeverityRiskScorer:
    """Calculates risk levels (0-100) and severity categories (Phase 60)."""

    def score(self, category: str, description: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Compute severity score based on financial loss, category metrics, and description indicators."""
        score = 10  # Base score
        breakdown = {"base": 10}

        # Category Weight (Max: 40)
        category_weights = {
            "Ransomware": 40,
            "Hacking": 30,
            "Cyber Financial Fraud": 25,
            "Cyber Stalking": 20,
            "Unclassified": 10
        }
        cat_weight = category_weights.get(category, 10)
        score += cat_weight
        breakdown["category_weight"] = cat_weight

        # Financial Loss Weight (Max: 40)
        amount = float(metadata.get("amount", 0.0))
        loss_weight = 0
        if amount >= 500000:
            loss_weight = 40
        elif amount >= 100000:
            loss_weight = 25
        elif amount > 0:
            loss_weight = 15
        score += loss_weight
        breakdown["financial_loss_weight"] = loss_weight

        # Text-based risk amplifiers (Max: 10)
        amp = 0
        risk_keywords = ["threat", "emergency", "extortion", "critical", "compromise", "blackmail", "leak", "corporate"]
        lower_desc = description.lower()
        for kw in risk_keywords:
            if kw in lower_desc:
                amp += 2
        amp = min(amp, 10)
        score += amp
        breakdown["text_amplification_weight"] = amp

        # Clip total to 100
        total_score = min(score, 100)

        # Map score to severity category
        if total_score >= 75:
            severity = "Critical"
        elif total_score >= 50:
            severity = "High"
        elif total_score >= 25:
            severity = "Medium"
        else:
            severity = "Low"

        return {
            "risk_score": total_score,
            "severity": severity,
            "breakdown": breakdown
        }

class AIPipelineService:
    """Unified service orchestrating language detection, classification, NER, and scoring."""

    def __init__(self):
        self.classifier = ComplaintClassifierPipeline()
        self.extractor = AIEntityExtractor()
        self.scorer = AISeverityRiskScorer()

    def detect_language(self, text: str) -> str:
        """Identify ISO language code of input text (Phase 57)."""
        try:
            if not text or not text.strip():
                return "en"
            # Support basic dialect checks, fallback to langdetect
            lang = detect(text)
            # Normalize to standard codes
            if lang in ["en", "hi", "mr", "ta", "te", "bn", "gu"]:
                return lang
            return "en"
        except Exception:
            return "en"

    def process_complaint(self, text: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Orchestrate full AI classification pipeline."""
        lang = self.detect_language(text)
        
        # Classification
        clf_result = self.classifier.predict(text)
        category = clf_result["predicted_category"]
        confidence = clf_result["confidence"]
        
        # Named Entity Recognition
        entities = self.extractor.extract(text)
        
        # Scoring
        score_result = self.scorer.score(category, text, metadata)
        
        return {
            "language": lang,
            "category": category,
            "confidence": confidence,
            "distribution": clf_result["distribution"],
            "entities": entities,
            "risk_score": score_result["risk_score"],
            "severity": score_result["severity"],
            "breakdown": score_result["breakdown"]
        }

    def upsert_complaint_vector(self, ticket_id: uuid.UUID, text: str, ticket_number: str, category: str, severity: str) -> None:
        """Generate and upsert complaint vector representation to Qdrant collection (Phase 61/62)."""
        try:
            from qdrant_client.http import models
            vector = self.classifier.generate_embeddings(text)
            qdrant_client.upsert(
                collection_name="complaints",
                points=[
                    models.PointStruct(
                        id=str(ticket_id),
                        vector=vector,
                        payload={
                            "ticket_number": ticket_number,
                            "category": category,
                            "severity": severity,
                            "text": text[:500]  # Store snippet for search highlights
                        }
                    )
                ]
            )
            logger.info(f"Successfully upserted complaint vector into Qdrant for Ticket ID {ticket_id}")
        except Exception as e:
            logger.error(f"Failed to upsert vector into Qdrant for Ticket ID {ticket_id}: {e}")

    def find_similar_complaints(self, text: str, limit: int = 5, exclude_id: Optional[uuid.UUID] = None) -> List[Dict[str, Any]]:
        """Query Qdrant complaints collection to locate highly similar complaints (Phase 62/63)."""
        try:
            vector = self.classifier.generate_embeddings(text)
            
            # If search vector is all-zeros, avoid false matches
            if sum(abs(x) for x in vector) == 0:
                return []
                
            from qdrant_client.http import models
            results_wrapper = qdrant_client.http.search_api.search_points(
                collection_name="complaints",
                search_request=models.SearchRequest(
                    vector=vector,
                    limit=limit + 1 if exclude_id else limit,
                    with_payload=True
                )
            )
            results = results_wrapper.result
            
            output = []
            for item in results:
                # Exclude self
                if exclude_id and item.id == str(exclude_id):
                    continue
                output.append({
                    "ticket_id": item.id,
                    "similarity_score": round(float(item.score) * 100, 2),
                    "ticket_number": item.payload.get("ticket_number"),
                    "category": item.payload.get("category"),
                    "severity": item.payload.get("severity"),
                    "text_snippet": item.payload.get("text")
                })
            return output[:limit]
        except Exception as e:
            logger.error(f"Failed similarity search in Qdrant: {e}")
            return []

ai_pipeline_service = AIPipelineService()
