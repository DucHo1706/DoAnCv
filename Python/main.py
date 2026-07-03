from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import urllib3
from dotenv import load_dotenv

# Vo hieu hoa cac canh bao SSL self-signed khong an toan tu urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Nap cac bien moi truong tu .env truoc khi nap cac services
load_dotenv()

from services.skills_sync_service import fetch_skills_from_db_on_startup
from controllers.analysis_controller import router as analysis_router
from controllers.chat_controller import router as chat_router
from controllers.skills_controller import router as skills_router
from utils.logger import logger

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Thuc hien dong bo ky nang tu SQL Server khi khoi dong ung dung
    fetch_skills_from_db_on_startup()
    yield

app = FastAPI(
    title="AI Recruitment System API",
    version="1.0",
    lifespan=lifespan
)

# Cau hinh CORS cho phep Frontend goi truc tiep
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dang ky cac router phan lop
app.include_router(analysis_router)
app.include_router(chat_router)
app.include_router(skills_router)

@app.get("/")
async def root():
    return {"message": "AI Recruitment Service is running perfectly!", "status": "ok"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)