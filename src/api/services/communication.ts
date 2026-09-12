import { api, type PageResponse } from '../client';
import { API_ENDPOINTS } from '../endpoints';
import type { Role } from './auth';

// ─── Communication service ───────────────────────────────────────────────────
// Conversations + messages. The web portal layers a STOMP/SockJS socket on top
// of these REST calls for live delivery; the app polls the open thread instead
// (see the chat screen) — sockjs-client can't run inside Expo Go, and polling
// keeps the same REST contract.

export type ConversationType = 'DIRECT' | 'GROUP';

export interface ConversationMember {
  userId: number;
  fullName: string;
  email: string;
  role: string;
}

export interface Conversation {
  id: number;
  name: string;
  type: ConversationType;
  createdAt: string;
  updatedAt: string;
  members: ConversationMember[];
}

/** Returns the raw array — no envelope and no pagination. */
export const getConversations = async (): Promise<Conversation[]> => {
  const response = await api.get<Conversation[]>(API_ENDPOINTS.CONVERSATION.LIST);
  return response.data;
};

export const createDirectConversation = async (userId: number): Promise<Conversation> => {
  const response = await api.post<Conversation>(API_ENDPOINTS.CONVERSATION.CREATE_DIRECT, { userId });
  return response.data;
};

export interface ChatMessage {
  id: number;
  clientMessageId: string;
  conversationId: number;
  senderId: number;
  senderName: string;
  type: 'TEXT';
  content: string;
  status: string;
  createdAt: string;
}

export const getMessages = async (conversationId: number): Promise<ChatMessage[]> => {
  const response = await api.get<ChatMessage[]>(API_ENDPOINTS.CONVERSATION.MESSAGES(conversationId));
  return response.data;
};

export const sendMessage = async (conversationId: number, content: string): Promise<ChatMessage> => {
  const response = await api.post<ChatMessage>(API_ENDPOINTS.CONVERSATION.SEND_MESSAGE, {
    conversationId,
    content,
  });
  return response.data;
};

export const markConversationRead = async (conversationId: number): Promise<void> => {
  await api.put(API_ENDPOINTS.CONVERSATION.READ(conversationId));
};

// ─── Directory ────────────────────────────────────────────────────────────────
// Searching staff doubles as "start a new chat", exactly as on the web portal.

export interface StaffMember {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
}

export const searchStaff = async (search: string): Promise<StaffMember[]> => {
  const response = await api.get<PageResponse<StaffMember>>(API_ENDPOINTS.ADMIN.ALL_STAFF, {
    params: { search, page: 0, size: 50 },
  });
  return response.data.content ?? [];
};
