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

// Add to Document Endpoints section
export async function searchDocumentHistory(token: string, query: string, page = 0, size = 20): Promise<PaginatedResponse<DocumentHistoryDTO>> {
  const res = await fetch(`${API_BASE}/api/history/documents/search?q=${encodeURIComponent(query)}&page=${page}&size=${size}`, {
    headers: getAuthHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to search documents');
  return res.json();
}

// Add to Chat Endpoints section
export async function searchChatHistory(token: string, query: string, page = 0, size = 50): Promise<PaginatedResponse<ChatHistoryDTO>> {
  const res = await fetch(`${API_BASE}/api/history/chat/search?q=${encodeURIComponent(query)}&page=${page}&size=${size}`, {
    headers: getAuthHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to search chats');
  return res.json();
}

export interface DocumentSummaryDTO {
  id: number;
  documentId: number;
  documentName: string;
  executiveSummary: string;
  summaryLength: number;
  wordCount: number;
  status: string;
  createdAt: string;
}

export interface QuizQuestionDTO {
  id: number;
  questionText: string;
  questionOrder: number;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface QuizDTO {
  id: number;
  title: string;
  description: string;
  totalQuestions: number;
  passScore: number;
  questions: QuizQuestionDTO[];
  documentId: number;
  documentName: string;
}

export interface FlashcardDTO {
  id: number;
  front: string;
  back: string;
  sourceContent?: string;
  repetitionCount: number;
  easeFactor: number;
  intervalDays: number;
  nextReviewDate: string;
  deckName: string;
  documentId?: number;
  documentName?: string;
}

// --- Summary Endpoints ---
export async function generateSummary(token: string, documentId: number): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/api/summary/generate/${documentId}`, {
    method: 'POST',
    headers: getAuthHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to generate summary');
  return res.json();
}

export async function getSummary(token: string, documentId: number): Promise<DocumentSummaryDTO> {
  const res = await fetch(`${API_BASE}/api/summary/${documentId}`, { headers: getAuthHeaders(token) });
  if (!res.ok) throw new Error('Summary not found');
  return res.json();
}

// --- Quiz Endpoints ---
export async function generateQuiz(token: string, documentId: number): Promise<QuizDTO> {
  const res = await fetch(`${API_BASE}/api/quiz/generate/${documentId}`, {
    method: 'POST',
    headers: getAuthHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to generate quiz');
  return res.json();
}

export async function getDocumentQuizzes(token: string, documentId: number): Promise<QuizDTO[]> {
  const res = await fetch(`${API_BASE}/api/quiz/document/${documentId}`, { headers: getAuthHeaders(token) });
  if (!res.ok) throw new Error('Failed to fetch quizzes');
  return res.json();
}

export async function submitQuiz(token: string, quizId: number, answers: number[]): Promise<any> {
  const res = await fetch(`${API_BASE}/api/quiz/submit/${quizId}`, {
    method: 'POST',
    headers: { ...getAuthHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers }),
  });
  if (!res.ok) throw new Error('Failed to submit quiz');
  return res.json();
}

// --- Flashcard Endpoints ---
export async function createFlashcard(token: string, data: { front: string; back: string; sourceContent?: string; deckName?: string; documentId?: number }): Promise<FlashcardDTO> {
  const res = await fetch(`${API_BASE}/api/flashcards/create`, {
    method: 'POST',
    headers: { ...getAuthHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create flashcard');
  return res.json();
}

export async function getDueFlashcards(token: string): Promise<FlashcardDTO[]> {
  const res = await fetch(`${API_BASE}/api/flashcards/due`, { headers: getAuthHeaders(token) });
  if (!res.ok) throw new Error('Failed to fetch due flashcards');
  return res.json();
}

export async function reviewFlashcard(token: string, flashcardId: number, quality: number): Promise<FlashcardDTO> {
  const res = await fetch(`${API_BASE}/api/flashcards/${flashcardId}/review`, {
    method: 'POST',
    headers: { ...getAuthHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ quality }),
  });
  if (!res.ok) throw new Error('Failed to review flashcard');
  return res.json();
}