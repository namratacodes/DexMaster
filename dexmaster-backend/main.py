from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routes import players, sessions, questions, analytics

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="DexMaster API",
    description="Backend for DexMaster Pokémon Quiz Platform",
    version="1.0.0"
)

# Allow React frontend to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(players.router)
app.include_router(sessions.router)
app.include_router(questions.router)
app.include_router(analytics.router)

@app.get("/")
def root():
    return {"message": "DexMaster API is running"}

@app.get("/health")
def health():
    return {"status": "healthy"}
