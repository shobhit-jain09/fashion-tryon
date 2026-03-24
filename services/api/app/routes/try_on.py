import uuid
from pathlib import Path

from fastapi import APIRouter, File, Request, UploadFile

from app.schemas import TryOnRequest, TryOnResponse, TryOnResult
from app.services.virtual_try_on import create_try_on_job, get_try_on_job

router = APIRouter(prefix="/v1/try-on", tags=["try-on"])
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/upload")
async def upload_person_image(request: Request, image: UploadFile = File(...)) -> dict[str, str]:
    extension = Path(image.filename or "photo.jpg").suffix or ".jpg"
    filename = f"{uuid.uuid4()}{extension}"
    target = UPLOAD_DIR / filename
    content = await image.read()
    target.write_bytes(content)
    image_url = f"{str(request.base_url).rstrip('/')}/uploads/{filename}"
    return {"image_url": image_url}


@router.post("/request", response_model=TryOnResponse)
def request_try_on(payload: TryOnRequest) -> TryOnResponse:
    return create_try_on_job(payload)


@router.get("/{job_id}", response_model=TryOnResult)
def fetch_try_on_result(job_id: str) -> TryOnResult:
    return get_try_on_job(job_id)
