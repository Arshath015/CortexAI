import { ChatMessage, GuestRequest } from "../types";

const BACKEND_URL = "http://127.0.0.1:8000/process";

export const processGuestInput = async (
  currentMessage: string,
  history: ChatMessage[],
  activeRequests: GuestRequest[]
) => {
  try {
    const response = await fetch(BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        currentMessage,
        history,
        activeRequests
      })
    });

    if (!response.ok) {
      throw new Error("Backend error: " + response.statusText);
    }

    const data = await response.json();

    return data;

  } catch (err) {
    console.error("BACKEND API ERROR:", err);
    return null;
  }
};
