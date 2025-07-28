from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Configure CORS to allow requests from the frontend application
# For development, you can allow all origins using "*"
# In a production environment, you should specify the exact origins of your frontend(s).
# For example, if your Gatsby frontend runs on http://localhost:8000:
# origins = [
#     "http://localhost:8000",
#     "http://localhost:3000", # Common for React/Vite dev servers
# ]
origins = [
    "*" # Allows all origins during development
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

@app.get("/colors")
async def get_colors():
    """
    Returns a predefined list of color names.
    """
    colors = [
        "red",
        "green",
        "blue",
        "purple",
        "orange",
        "pink",
        "cyan",
        "magenta",
        "brown",
        "teal"
    ]
    return {"colors": colors}
