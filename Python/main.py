from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from contextlib import asynccontextmanager
import asyncio
import uvicorn
import urllib3
from dotenv import load_dotenv

# Vo hieu hoa cac canh bao SSL self-signed khong an toan tu urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Nap cac bien moi truong tu .env truoc khi nap cac services
load_dotenv()

from services.skills_sync_service import fetch_skills_from_db_on_startup, seconds_until_next_sync
from controllers.analysis_controller import router as analysis_router
from controllers.chat_controller import router as chat_router
from controllers.skills_controller import router as skills_router
from controllers.search_controller import router as search_router
from utils.logger import logger

async def sync_skills_with_retry() -> bool:
    """Đồng bộ mà không chặn health endpoint của AI service."""
    for attempt in range(1, 7):
        if attempt > 1:
            await asyncio.sleep(10)

        success = await asyncio.to_thread(fetch_skills_from_db_on_startup)
        if success:
            return True

        logger.warning("Skill synchronization attempt %s/6 failed; retrying.", attempt)

    logger.error("Skill synchronization could not reach the backend after 6 attempts.")
    return False


async def run_taxonomy_sync_scheduler():
    await sync_skills_with_retry()
    while True:
        delay_seconds = seconds_until_next_sync()
        logger.info(
            "Taxonomy scheduler will check SQL data again at 02:00 Vietnam time (in %.0f seconds).",
            delay_seconds,
        )
        await asyncio.sleep(delay_seconds)
        await sync_skills_with_retry()

@asynccontextmanager
async def lifespan(app: FastAPI):
    sync_task = asyncio.create_task(run_taxonomy_sync_scheduler())
    try:
        yield
    finally:
        sync_task.cancel()

app = FastAPI(
    title="AI Recruitment System API",
    version="1.0",
    lifespan=lifespan
)

# 1. Cấu hình Giới hạn Kích thước Payload HTTP Request (Tối đa 10MB)
MAX_PAYLOAD_SIZE = 10 * 1024 * 1024  # 10 MB

@app.middleware("http")
async def limit_request_body_size(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length:
        try:
            if int(content_length) > MAX_PAYLOAD_SIZE:
                return JSONResponse(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    content={
                        "status": "error",
                        "message": "Dữ liệu hoặc tập tin gửi lên vượt quá kích thước cho phép (Tối đa 10MB)."
                    }
                )
        except ValueError:
            pass
    return await call_next(request)

# 2. Xử lý lỗi sai định dạng Payload / Lỗi Validation Pydantic
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    safe_details = [
        {
            "type": str(error.get("type", "validation_error")),
            "location": [str(item) for item in error.get("loc", ())],
            "message": str(error.get("msg", "Dữ liệu không hợp lệ.")),
        }
        for error in exc.errors()
    ]
    logger.warning(
        "Payload sai định dạng tại endpoint %s; số lỗi validation: %s.",
        request.url.path,
        len(safe_details),
    )
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "status": "error",
            "message": "Dữ liệu gửi lên sai định dạng hoặc chứa trường thông tin không hợp lệ.",
            "details": safe_details,
        }
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
app.include_router(search_router)

@app.get("/")
async def root():
    return {"message": "AI Recruitment Service is running perfectly!", "status": "ok"}

@app.get("/health", include_in_schema=False)
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True, reload_excludes=["*.json"])
