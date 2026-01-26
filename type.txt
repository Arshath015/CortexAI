
export type RequestStatus = 'open' | 'merged' | 'confirmed' | 'dispatched' | 'completed';
export type RequestCategory = 'ORDER' | 'COMPLAINT';

export interface RequestAnalysis {
  severity: number;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  sentiment: string;
  risk_score: number;
  complexity_score: number;
  protocol_steps: string[];
}

export interface GuestRequest {
  id: string;
  chat_id: string;
  timestamp: string;
  category: RequestCategory;
  structured_data: string; // e.g., "3 plates idly and 1 water bottle"
  status: RequestStatus;
  analysis: RequestAnalysis;
  dispatch_id?: string;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender: 'guest' | 'agent';
  text: string;
  timestamp: string;
  associated_request_id?: string;
}

export interface DatabaseState {
  requests: GuestRequest[];
  messages: ChatMessage[];
}
