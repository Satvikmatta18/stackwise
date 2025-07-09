# Full-Stack Application Setup (FastAPI Backend & React Frontend)

This project demonstrates a simple full-stack application with a FastAPI backend and a React frontend. The frontend makes a GET request to the backend's `/hello` endpoint and displays the received message.

## Table of Contents

*   [Prerequisites](#prerequisites)
*   [Project Structure](#project-structure)
*   [Backend Setup (FastAPI)](#backend-setup-fastapi)
*   [Frontend Setup (React)](#frontend-setup-react)
*   [Running Both Applications](#running-both-applications)
*   [Verification Steps](#verification-steps)
*   [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have the following installed on your system:

*   **Python 3.8+**: [Download Python](https://www.python.org/downloads/)
*   **Node.js LTS**: [Download Node.js](https://nodejs.org/en/download/) (Includes npm)

## Project Structure

```
.
├── backend/
│   ├── main.py
│   └── requirements.txt
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── App.js
    │   └── index.js
    └── package.json
```

## Backend Setup (FastAPI)

Follow these steps to set up and run the FastAPI backend:

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Create a Python virtual environment (recommended):**
    ```bash
    python3 -m venv venv
    ```

3.  **Activate the virtual environment:**
    *   On macOS/Linux:
        ```bash
        source venv/bin/activate
        ```
    *   On Windows (PowerShell):
        ```bash
        .\venv\Scripts\Activate.ps1
        ```
    *   On Windows (Command Prompt):
        ```bash
        .\venv\Scripts\activate.bat
        ```

4.  **Install backend dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

5.  **Run the FastAPI application:**
    ```bash
    uvicorn main:app --reload --port 8000
    ```
    The backend will be accessible at `http://127.0.0.1:8000`. You can test the `/hello` endpoint directly by visiting `http://127.0.0.1:8000/hello` in your browser. It should return a JSON response like `{"message": "Hello from FastAPI!"}`.

## Frontend Setup (React)

Follow these steps to set up and run the React frontend:

1.  **Navigate to the frontend directory:**
    Open a *new* terminal window/tab and navigate to the frontend directory (leave the backend terminal running).
    ```bash
    cd frontend
    ```

2.  **Install frontend dependencies:**
    ```bash
    npm install
    ```

3.  **Run the React application:**
    ```bash
    npm start
    ```
    The frontend application will typically open in your browser at `http://localhost:3000` (or another available port).

## Running Both Applications

To see the full application in action, ensure you have:

1.  **Backend running:** In one terminal, `cd backend` and run `uvicorn main:app --reload --port 8000`.
2.  **Frontend running:** In a *separate* terminal, `cd frontend` and run `npm start`.

## Verification Steps

1.  **Access the Frontend:** Open your web browser and navigate to `http://localhost:3000`.
2.  **Check for Message:** You should see a message displayed on the page, similar to "Message from backend: Hello from FastAPI!".
3.  **Inspect Browser Console:**
    *   Open your browser's developer tools (usually F12 or right-click -> Inspect).
    *   Go to the "Console" tab. There should be no errors related to network requests or CORS.
    *   Go to the "Network" tab. You should see a successful GET request to `http://127.0.0.1:8000/hello`.

## Troubleshooting

*   **CORS Error:** If you see a CORS error in your browser console, ensure that the `CORS middleware` is correctly configured in `backend/main.py` to allow requests from `http://localhost:3000`. The provided FastAPI setup should handle this.
*   **Backend Not Running:** Double-check that the FastAPI backend is running on `http://127.0.0.1:8000`.
*   **Frontend Not Running:** Ensure `npm install` and `npm start` ran without errors in the `frontend` directory.
*   **Port Conflicts:** If `http://localhost:3000` or `http://127.0.0.1:8000` are already in use, `npm start` or `uvicorn` might suggest another port. Adjust your expectations accordingly.
