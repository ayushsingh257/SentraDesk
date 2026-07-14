import os
import json
import requests
from typing import Dict, Any, Optional
from app.core.logging import logger

class LLMService:
    """Service to connect to OpenAI, Gemini, Anthropic, or Ollama for cyber investigation analysis."""

    def __init__(self):
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        self.gemini_model = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
        
        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.openai_model = os.getenv("OPENAI_MODEL", "gpt-4o")
        
        self.anthropic_key = os.getenv("ANTHROPIC_API_KEY")
        self.anthropic_model = os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet")
        
        self.ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434")
        self.ollama_model = os.getenv("OLLAMA_MODEL", "llama3")

    def is_configured(self) -> bool:
        """Check if any LLM service is configured."""
        return bool(self.gemini_key or self.openai_key or self.anthropic_key or os.getenv("OLLAMA_ACTIVE") == "true")

    def analyze_complaint(self, description: str, category: str, severity: str, amount: float, evidence_files: list) -> Optional[Dict[str, Any]]:
        """Send case information to configured LLM for full cyber investigation analysis."""
        if not self.is_configured():
            logger.info("No LLM service configured. Using local rule-based analysis.")
            return None

        prompt = f"""
You are an expert Cyber Crime Case Analyst (AI Investigator) working for a Cyber Cell Police Department.
Analyze the following cybercrime complaint and generate a structured JSON investigation analysis.

CASE DETAILS:
- Initial Category: {category}
- Initial Severity: {severity}
- Financial Loss Amount: ₹{amount}
- Evidence Files Uploaded: {', '.join(evidence_files) if evidence_files else 'None'}

COMPLAINT DESCRIPTION NARRATIVE:
\"\"\"{description}\"\"\"

Provide the analysis strictly in JSON format matching the following keys:
{{
  "summary": "Short 1-sentence classification summary, e.g. 'Complaint classified as Investment Scam (Telegram + UPI Fraud)'",
  "executive_summary": "A coherent executive summary paragraph detailing the cyber heist or attack vector, who contacted whom, promises made, and the overall narrative.",
  "classification_reasoning": "Reasoning explaining why this complaint belongs to the predicted category or categories.",
  "probabilities": [
    {{"category": "Main Category", "confidence": 95}},
    {{"category": "Secondary Method", "confidence": 85}}
  ],
  "overall_risk": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "timeline": [
    {{"date": "Date/Time or step name", "event": "Description of event"}}
  ],
  "extracted_indicators": [
    {{"type": "Telegram Handle" | "UPI ID" | "Phone Number" | "Domain" | "URL" | "IP Address" | "Bank Account" | "Amount" | "Crypto Wallet", "value": "Extracted string"}}
  ],
  "recommendations": [
    {{"action": "Investigative action, e.g. Scan domain, Freeze UPI, Contact Bank", "priority": "High" | "Medium" | "Low", "status": "Action Required" | "Recommended" | "Pending"}}
  ],
  "evidence_gaps": [
    "Specific items missing, e.g. Bank statement showing debit, Attacker Telegram chat logs, Domain registrar WHOIS screenshots"
  ],
  "suggested_questions": [
    "Suggested question for the citizen to clarify transaction details, handle names, or logs"
  ],
  "investigation_score": 85,
  "legal_sections": [
    {{"act": "Information Technology Act 2000" | "Indian Penal Code (IPC) / Bharatiya Nyaya Sanhita (BNS)", "section": "Section number, e.g. Section 66D, Section 420", "description": "Short explanation of the violation"}}
  ],
  "investigation_narrative": "A complete, formal, natural-language investigation narrative summary (suitable for inclusion in a official PDF case dossier)."
}}

Return ONLY valid JSON. Do not include markdown formatting or backticks like ```json.
"""

        try:
            if self.gemini_key:
                return self._call_gemini(prompt)
            elif self.openai_key:
                return self._call_openai(prompt)
            elif self.anthropic_key:
                return self._call_anthropic(prompt)
            elif os.getenv("OLLAMA_ACTIVE") == "true":
                return self._call_ollama(prompt)
        except Exception as e:
            logger.error(f"LLM API call failed with exception: {e}. Falling back to rule-based analysis.")
        return None

    def _call_gemini(self, prompt: str) -> Optional[Dict[str, Any]]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.gemini_model}:generateContent?key={self.gemini_key}"
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "responseMimeType": "application/json"
            }
        }
        res = requests.post(url, headers=headers, json=payload, timeout=12)
        if res.status_code == 200:
            data = res.json()
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            return json.loads(text)
        logger.error(f"Gemini API returned status code {res.status_code}: {res.text}")
        return None

    def _call_openai(self, prompt: str) -> Optional[Dict[str, Any]]:
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.openai_key}"
        }
        payload = {
            "model": self.openai_model,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": "You are a cyber investigation assistant returning structured JSON."},
                {"role": "user", "content": prompt}
            ]
        }
        res = requests.post(url, headers=headers, json=payload, timeout=12)
        if res.status_code == 200:
            data = res.json()
            text = data["choices"][0]["message"]["content"]
            return json.loads(text)
        logger.error(f"OpenAI API returned status code {res.status_code}: {res.text}")
        return None

    def _call_anthropic(self, prompt: str) -> Optional[Dict[str, Any]]:
        url = "https://api.anthropic.com/v1/messages"
        headers = {
            "x-api-key": self.anthropic_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }
        payload = {
            "model": self.anthropic_model,
            "max_tokens": 4000,
            "messages": [
                {"role": "user", "content": prompt}
            ]
        }
        res = requests.post(url, headers=headers, json=payload, timeout=15)
        if res.status_code == 200:
            data = res.json()
            text = data["content"][0]["text"]
            # Clean up potential markdown formatting block wrapper
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0]
            elif "```" in text:
                text = text.split("```")[1].split("```")[0]
            return json.loads(text.strip())
        logger.error(f"Anthropic API returned status code {res.status_code}: {res.text}")
        return None

    def _call_ollama(self, prompt: str) -> Optional[Dict[str, Any]]:
        url = f"{self.ollama_url}/api/chat"
        payload = {
            "model": self.ollama_model,
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "format": "json",
            "stream": False
        }
        res = requests.post(url, json=payload, timeout=20)
        if res.status_code == 200:
            data = res.json()
            text = data["message"]["content"]
            return json.loads(text)
        logger.error(f"Ollama returned status code {res.status_code}: {res.text}")
        return None

llm_service = LLMService()
