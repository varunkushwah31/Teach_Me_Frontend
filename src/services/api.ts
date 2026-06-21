const API_BASE = '';

export function getAuthHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
  };
}

// --- DTO Interfaces ---

export interface PaginatedResponse<T> {
  content: T[];
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface DocumentHistoryDTO {
  id: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  description?: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  updatedAt: string;
  errorMessage?: string;
}

export interface ChatHistoryDTO {
  id: number;
  sessionId: string;
  question: string;
  answer: string;
  context?: string;
  createdAt: string;
  updatedAt: string;
  documentId?: number;
  documentName?: string;
}

// --- Auth Endpoints ---

export async function login(email: string, password: string): Promise<{ token: string }> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error((await res.text()) || 'Login failed');
  return res.json();
}

export async function register(email: string, password: string): Promise<{ token: string }> {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error((await res.text()) || 'Registration failed');
  return res.json();
}

// --- Document Endpoints ---

export async function uploadDocument(token: string, file: File, category: string, chatId: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);
  formData.append('chatId', chatId);

  const res = await fetch(`${API_BASE}/api/documents/upload`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: formData,
  });
  if (!res.ok) throw new Error((await res.text()) || 'Upload failed');
  return res.text();
}

export async function getDocumentHistory(token: string, page = 0, size = 20): Promise<PaginatedResponse<DocumentHistoryDTO>> {
  const res = await fetch(`${API_BASE}/api/history/documents?page=${page}&size=${size}`, {
    headers: getAuthHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to fetch document history');
  return res.json();
}

// --- Chat Endpoints ---

export function getChatStreamUrl(): string {
  return '/api/chat/ask/stream';
}

export async function getRecentChats(token: string, page = 0, size = 50): Promise<PaginatedResponse<ChatHistoryDTO>> {
  const res = await fetch(`${API_BASE}/api/history/chats?page=${page}&size=${size}`, {
    headers: getAuthHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to fetch chat history');
  return res.json();
}

export async function getChatSessionHistory(token: string, sessionId: string, page = 0, size = 50): Promise<PaginatedResponse<ChatHistoryDTO>> {
  const res = await fetch(`${API_BASE}/api/history/chats/session/${sessionId}?page=${page}&size=${size}&direction=ASC`, {
    headers: getAuthHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to fetch session history');
  return res.json();
}