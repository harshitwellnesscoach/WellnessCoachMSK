import logging

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("main")

app = FastAPI(title="Wellness Coach MSK API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://wellness-coach-msk.vercel.app",
    ],
    allow_origin_regex=r"http://localhost:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers import auth, intake

app.include_router(auth.router)
app.include_router(intake.router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
