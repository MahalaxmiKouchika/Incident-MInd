from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import os
import uuid
import asyncio
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="IncidentMind API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    conversation_id: str | None = None
    memory_enabled: bool = True

class ChatResponse(BaseModel):
    answer: str
    memory_used: bool = False
    memories: list = []
    sources: list = []
    tools_used: list = []
    conversation_id: str

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    n8n_url = os.getenv("N8N_CHAT_URL")
    
    conversation_id = request.conversation_id or str(uuid.uuid4())
    
    payload = {
        "message": request.message,
        "conversation_id": conversation_id,
        "memory_enabled": request.memory_enabled
    }
    
    if n8n_url:
        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                response = await client.post(n8n_url, json=payload)
                response.raise_for_status()
                data = response.json()
                return ChatResponse(
                    answer=data.get("answer", ""),
                    memory_used=data.get("memory_used", False),
                    memories=data.get("memories", []),
                    sources=data.get("sources", []),
                    tools_used=data.get("tools_used", []),
                    conversation_id=data.get("conversation_id", conversation_id)
                )
            except Exception as e:
                print(f"Error contacting n8n: {e}")
                raise HTTPException(status_code=503, detail=f"AI Agent is temporarily unavailable. Error: {str(e)}")
    
    # Mock fallback for demo testing if n8n is not connected
    await asyncio.sleep(1.5) # Simulate processing
    return mock_agent_response(payload)

def mock_agent_response(payload):
    msg = payload.get("message", "").lower()
    mem_enabled = payload.get("memory_enabled", True)
    conv_id = payload.get("conversation_id")
    
    if "jwt" in msg:
        return ChatResponse(
            answer="JWT (JSON Web Token) is an open standard that defines a compact and self-contained way for securely transmitting information between parties as a JSON object.",
            memory_used=False,
            conversation_id=conv_id
        )
    elif "react" in msg:
        return ChatResponse(
            answer="React is a declarative, efficient, and flexible JavaScript library for building user interfaces.",
            memory_used=False,
            conversation_id=conv_id
        )
    elif "fastapi" in msg:
        return ChatResponse(
            answer="FastAPI is a modern, fast (high-performance), web framework for building APIs with Python 3.8+ based on standard Python type hints.",
            memory_used=False,
            conversation_id=conv_id
        )
    elif "payment-api" in msg and mem_enabled and ("before" in msg or "last time" in msg or "history" in msg):
        return ChatResponse(
            answer="Based on historical memory, INC-013 had a similar database connection timeout pattern. The previous resolution involved scaling the connection pool and increasing the timeout threshold.",
            memory_used=True,
            memories=[{"id": "INC-013", "summary": "payment-api database connection timeout"}],
            sources=["Hindsight"],
            tools_used=["hindsight_search"],
            conversation_id=conv_id
        )
    elif "payment-api" in msg:
        return ChatResponse(
            answer="Current logs show a database connection timeout in the payment-api service. Would you like me to check if we've seen this problem before?",
            memory_used=False,
            conversation_id=conv_id
        )
    else:
        return ChatResponse(
            answer=f"I am IncidentMind. You asked: {payload.get('message')}",
            memory_used=False,
            conversation_id=conv_id
        )
