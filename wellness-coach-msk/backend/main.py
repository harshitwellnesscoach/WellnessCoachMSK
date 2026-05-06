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
        "http://localhost:5173",
        "https://wellness-coach-msk.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routers (uncomment as you build each phase) ---
# from routers import auth, intake, dashboard, pain, program, session, odi, checkin, progression, rescreen
# app.include_router(auth.router)
# app.include_router(intake.router)
# app.include_router(dashboard.router)
# app.include_router(pain.router)
# app.include_router(program.router)
# app.include_router(session.router)
# app.include_router(odi.router)
# app.include_router(checkin.router)
# app.include_router(progression.router)
# app.include_router(rescreen.router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
