from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
