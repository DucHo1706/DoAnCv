from pydantic import BaseModel
from typing import List, Optional, Dict

class SkillUpdateRequest(BaseModel):
    skills: List[str]

class ChatMessageModel(BaseModel):
    role: str
    text: str

class GenerateEmailRequest(BaseModel):
    email_type: str
    candidate_name: str
    job_title: str
    company_name: Optional[str] = "AI Recruitment"
    fit_score: int = 0
    classification: Optional[str] = ""
    summary: Optional[str] = ""
    matched_skills: Optional[List[str]] = []
    missing_skills: Optional[List[str]] = []
    reject_reason: Optional[str] = None
    email_context: Optional[str] = ""

class EvaluateAnswerRequest(BaseModel):
    question: str
    answer: str
    job_title: str

class LazyAnalysisRequest(BaseModel):
    cv_text: str
    jd_text: str
    cv_skills: Optional[List[str]] = []
    jd_skills: Optional[List[str]] = []
    job_title: Optional[str] = ""
    company_name: Optional[str] = ""

class AprioriTrainRequest(BaseModel):
    transactions: List[List[str]]
    min_support: Optional[float] = 0.05
    min_confidence: Optional[float] = 0.3
    domain: Optional[str] = None
    taxonomy_skills: Optional[List[str]] = None
    taxonomy_aliases: Optional[Dict[str, str]] = None
    dataset_id: Optional[str] = None
    min_support_count: Optional[int] = 2
    reset_models: bool = False

class SkillRecommendRequest(BaseModel):
    current_skills: List[str]
    top_n: Optional[int] = 5

class HUIMTransaction(BaseModel):
    items: List[str]
    quantities: Dict[str, int]

class HUIMTrainRequest(BaseModel):
    transactions: List[HUIMTransaction]
    external_utilities: Dict[str, float]
    min_utility: float
    domain: Optional[str] = None
    taxonomy_skills: Optional[List[str]] = None
    taxonomy_aliases: Optional[Dict[str, str]] = None
    dataset_id: Optional[str] = None
    min_support_count: Optional[int] = 2
    reset_models: bool = False
