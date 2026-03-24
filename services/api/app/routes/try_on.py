from fastapi import APIRouter

from app.schemas import TryOnRequest, TryOnResponse, TryOnResult
from app.services.virtual_try_on import create_try_on_job, get_try_on_job

router = APIRouter(prefix="/v1/try-on", tags=["try-on"])


@router.post("/request", response_model=TryOnResponse)
def request_try_on(payload: TryOnRequest) -> TryOnResponse:
    return create_try_on_job(payload)


@router.get("/{job_id}", response_model=TryOnResult)
def fetch_try_on_result(job_id: str) -> TryOnResult:
    return get_try_on_job(job_id)
