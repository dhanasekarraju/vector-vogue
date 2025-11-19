#!/usr/bin/env bash
# start backend (assumes virtualenv active) and frontend dev server in separate terminals
echo "Start backend: uvicorn app.api:app --reload --port 8000"
echo "Start frontend: cd frontend && npm install && npm run dev"
