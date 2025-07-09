from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import random

app = FastAPI()

# Configure CORS to allow requests from the frontend application
# Assuming the frontend (Gatsby) will run on http://localhost:8000 by default.
# If running on a different port, adjust this origin.
origins = [
    "http://localhost:8000", # Default Gatsby development server port
    "http://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

@app.get("/random_color")
async def get_random_color():
    """
    Returns a random hexadecimal color code.
    """
    # Generate a random 6-digit hexadecimal number
    # e.g., 0xRRGGBB, then format it as a string "#RRGGBB"
    random_hex_color = f"#{random.randint(0, 0xFFFFFF):06x}"
    return {"color": random_hex_color}

# To run this application, use uvicorn:
# uvicorn main:app --host 0.0.0.0 --port 8001 --reload
# (We're choosing port 8001 to avoid conflict with Gatsby's default port 8000)
