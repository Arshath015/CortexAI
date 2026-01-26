from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional, TypedDict
import json
from fastapi.middleware.cors import CORSMiddleware

# LangChain & LangGraph imports
from langchain_community.llms import Ollama
from langchain_core.messages import SystemMessage, HumanMessage
from langgraph.graph import StateGraph, END

app = FastAPI()

# Configuration
OLLAMA_URL = "http://localhost:11434"
MODEL_NAME = "phi3"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Schemas ---

class ChatMessage(BaseModel):
    sender: str
    text: str

class GuestRequest(BaseModel):
    id: str
    category: str
    structured_data: str
    status: str

class ProcessInput(BaseModel):
    currentMessage: str
    history: List[ChatMessage]
    activeRequests: List[GuestRequest]

# --- LangGraph State Definition ---

class AgentState(TypedDict):
    """Minimally contains the prompt and the resulting structured JSON."""
    system_instruction: str
    user_prompt: str
    result: dict

# --- LangGraph Node Logic ---

def call_model(state: AgentState):
    """Node to execute the LLM via LangChain."""
    llm = Ollama(base_url=OLLAMA_URL, model=MODEL_NAME, format="json")
    
    messages = [
        SystemMessage(content=state["system_instruction"]),
        HumanMessage(content=state["user_prompt"])
    ]
    
    response = llm.invoke(messages)
    
    try:
        # Parse the string output into a dictionary for the state
        state["result"] = json.loads(response)
    except Exception as e:
        state["result"] = {"error": f"Failed to parse JSON: {str(e)}", "raw": response}
    
    return state

# --- Graph Construction ---

workflow = StateGraph(AgentState)
workflow.add_node("llm_node", call_model)
workflow.set_entry_point("llm_node")
workflow.add_edge("llm_node", END)
graph = workflow.compile()

# --- FastAPI Route ---

@app.post("/process")
def process_guest_input(payload: ProcessInput):
    history_context = "\n".join(
        [f"{m.sender}: {m.text}" for m in payload.history]
    )

    request_context = "\n".join(
        [
            f"ID: {r.id}, Category: {r.category}, Content: {r.structured_data}, Status: {r.status}"
            for r in payload.activeRequests
        ]
    )

    system_instruction = """
You are a Guest Service AI.

You MUST return ONLY valid JSON with this exact structure:

{
  "intent": "NEW_REQUEST | MODIFICATION | STATUS_INQUIRY",
  "category": "ORDER | COMPLAINT",
  "reconstructedRequest": "string",
  "targetRequestId": "string or null",
  "analysis": {
    "severity": number,
    "urgency": "LOW | MEDIUM | HIGH",
    "sentiment": "string",
    "risk_score": number,
    "complexity_score": number,
    "protocol_steps": ["string"]
  },
  "agentResponse": "string"
}

CRITICAL RULES:

1. reconstructedRequest MUST be a CONSOLIDATED ORDER SUMMARY.
   It must be short, factual, and machine-readable.
   It must NEVER be a conversational sentence.

   Correct examples:
   - "Order: 2x Plate Idly, 1x Water Bottle. Context: Breakfast."
   - "Order: 1x Coffee. Context: Room Service."
   - "Complaint: AC not working in room."

   WRONG examples (never do this):
   - "Hey, I have placed an order for idly and water"
   - "Your breakfast will be served shortly"
   - "Sure, I will arrange that for you"

2. agentResponse MUST be a natural human reply for the guest.
   reconstructedRequest and agentResponse MUST NOT be the same.

3. Always reconstruct using FULL chat history.
   If user says "one more idly", update quantity.

4. If topic changes, create NEW_REQUEST.

5. If modifying an order, set intent = MODIFICATION and targetRequestId.

6. DO NOT output anything outside JSON.
"""

    user_prompt = f"""
Existing Requests:
{request_context or "None"}

Chat History:
{history_context or "None"}

New Guest Input:
{payload.currentMessage}

Return ONLY JSON.
"""

    # Prepare initial state for LangGraph
    initial_state = {
        "system_instruction": system_instruction,
        "user_prompt": user_prompt,
        "result": {}
    }

    try:
        # Execute the graph
        final_state = graph.invoke(initial_state)
        return final_state["result"]

    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)