from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
import numpy as np
from services.gemini_service import embed_content_with_retry
from utils.logger import logger

router = APIRouter()

class JobTextDto(BaseModel):
    id: str
    text: str

class SemanticSearchRequest(BaseModel):
    query: str
    jobs: List[JobTextDto]

class SemanticSearchResultItem(BaseModel):
    id: str
    score: float

class SemanticSearchResponse(BaseModel):
    results: List[SemanticSearchResultItem]

def cosine_similarity(v1, v2):
    dot_product = np.dot(v1, v2)
    norm_v1 = np.linalg.norm(v1)
    norm_v2 = np.linalg.norm(v2)
    if norm_v1 == 0 or norm_v2 == 0:
        return 0.0
    return float(dot_product / (norm_v1 * norm_v2))

@router.post("/semantic-search", response_model=SemanticSearchResponse)
async def semantic_search(request: SemanticSearchRequest):
    try:
        if not request.query.strip() or not request.jobs:
            return SemanticSearchResponse(results=[])
            
        # Group query and job texts together for batch embedding call to optimize API requests
        all_texts = [request.query] + [job.text for job in request.jobs]
        
        logger.info(f"Yeu cau tim kiem ngu nghia cho tu khoa: '{request.query}'. Tong so cong viec can so sanh: {len(request.jobs)}")
        
        # Get embeddings
        embeddings = embed_content_with_retry(all_texts)
        
        if not embeddings or len(embeddings) != len(all_texts):
            raise Exception("Loi lay vector bieu dien tu Gemini API: So luong vector khong khop.")
            
        query_vector = np.array(embeddings[0])
        job_vectors = [np.array(emb) for emb in embeddings[1:]]
        
        results = []
        for idx, job in enumerate(request.jobs):
            score = cosine_similarity(query_vector, job_vectors[idx])
            results.append(SemanticSearchResultItem(id=job.id, score=score))
            
        # Sort results by similarity score descending
        results.sort(key=lambda x: x.score, reverse=True)
        
        return SemanticSearchResponse(results=results)
    except Exception as e:
        logger.error(f"Loi trong qua trinh tim kiem ngu nghia: {e}")
        # Tra ve danh sach trong kem loi de backend handles
        return SemanticSearchResponse(results=[])
