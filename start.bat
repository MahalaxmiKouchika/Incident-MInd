@echo off
echo Starting IncidentMind Backend...
cd backend
start cmd /k "pip install -r requirements.txt && uvicorn main:app --reload --port 8000"

echo Starting IncidentMind Frontend...
cd ../frontend
start cmd /k "npm install && npm run dev"

echo Both services are starting up.
