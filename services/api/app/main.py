from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routes.provider import router as provider_router
from app.routes.try_on import router as try_on_router

app = FastAPI(title="AI Fashion Try-On API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(try_on_router)
app.include_router(provider_router)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

_WEB_ROOT = Path(__file__).resolve().parent.parent.parent.parent / "apps" / "web"
if _WEB_ROOT.is_dir():
    app.mount("/ui", StaticFiles(directory=str(_WEB_ROOT), html=True), name="ui")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
