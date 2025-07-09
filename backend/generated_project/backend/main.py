from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Configure CORS to allow requests from the frontend application
# Assuming the frontend (React) will run on http://localhost:3000
origins = [
    "http://localhost:3000",  # Default Create React App port
    "http://127.0.0.1:3000",
    # Add any other frontend URLs if needed, e.g., for deployment
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

@app.get("/hello")
async def read_hello():
    """Simple GET endpoint that returns a greeting message."""
    return {"message": "Hello from FastAPI backend!"}

# Optional: A root endpoint to verify the API is running
@app.get("/")
async def read_root():
    return {"message": "FastAPI backend is running!"}
