# Deployment Guide

## Environment Configuration

### Frontend (React/Vite)

The frontend needs to know the backend API URL. This is configured via the `VITE_API_URL` environment variable.

#### Local Development
```bash
# .env file in project root
VITE_API_URL=http://localhost:5001
```

#### Production Deployment
For production, you'll need to set the `VITE_API_URL` to your deployed backend URL:

```bash
# Example for Vercel, Netlify, etc.
VITE_API_URL=https://your-backend-domain.com
```

### Backend (Flask)

The backend needs the Google Gemini API key and frontend URL configuration.

#### Local Development
```bash
# backend/.env file
GEMINI_API_KEY=your_gemini_api_key_here
FRONTEND_URL=http://localhost:8080
```

#### Production Deployment
```bash
# Environment variables for production
GEMINI_API_KEY=your_gemini_api_key_here
FRONTEND_URL=https://your-frontend-domain.com
```

## Deployment Steps

### 1. Frontend Deployment (Vercel/Netlify/Railway)

1. **Set Environment Variables:**
   - `VITE_API_URL`: Your backend URL (e.g., `https://your-backend.railway.app`)

2. **Build Command:**
   ```bash
   npm run build
   ```

3. **Output Directory:**
   ```
   dist
   ```

### 2. Backend Deployment (Railway/Render/Heroku)

1. **Set Environment Variables:**
   - `GEMINI_API_KEY`: Your Google Gemini API key
   - `FRONTEND_URL`: Your frontend URL (e.g., `https://your-frontend.vercel.app`)

2. **Requirements:**
   - Python 3.8+
   - Install dependencies: `pip install -r requirements.txt`

3. **Start Command:**
   ```bash
   python app.py
   ```

## Testing Your Deployment

### 1. Test API Key
Use the built-in test functionality:

```bash
# Command line test
cd backend
python test_gemini_api.py
```

### 2. Test Frontend-Backend Connection
Visit your frontend and try the chat functionality. If you see errors like:
- `Failed to load resource: the server responded with a status of 404`
- `/undefined/api/generate-graph`

This means the `VITE_API_URL` environment variable is not set correctly.

### 3. Common Issues

#### Issue: "undefined/api/generate-graph"
**Solution:** Set the `VITE_API_URL` environment variable in your frontend deployment.

#### Issue: CORS errors
**Solution:** Ensure the `FRONTEND_URL` environment variable is set correctly in your backend deployment.

#### Issue: "Gemini API not configured"
**Solution:** Set the `GEMINI_API_KEY` environment variable in your backend deployment.

## Environment Variables Summary

### Frontend (.env)
```
VITE_API_URL=http://localhost:5001
```

### Backend (.env)
```
GEMINI_API_KEY=your_gemini_api_key_here
FRONTEND_URL=http://localhost:8080
```

## Quick Test Commands

```bash
# Test backend locally
cd backend
python app.py

# Test API key
python test_gemini_api.py

# Test frontend locally
npm run dev
``` 