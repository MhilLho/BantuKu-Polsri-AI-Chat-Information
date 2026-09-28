import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ChatMessage } from './components/ChatMessage';
import { TypingIndicator } from './components/TypingIndicator';
import { ChatInput } from './components/ChatInput';
import { ScrollToBottomButton } from './components/ScrollToBottomButton';
import { InfoModal } from './components/InfoModal';
import { AdminUploadModal } from './components/AdminUploadModal';
import { ChatMessageItem, ChatSession, CampusDocument } from './types';

const SESSIONS_STORAGE_KEY = 'bantuku_gemini_sessions_v1';
const CURRENT_SESSION_ID_KEY = 'bantuku_gemini_current_session_id';
const THEME_STORAGE_KEY = 'bantuku_gemini_theme';
const ADMIN_TOKEN_KEY = 'bantuku_admin_token';
const ADMIN_USER_KEY = 'bantuku_admin_username';

export default function App() {
  // Theme state: 'light' or 'dark'
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
      if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch (e) {
      console.error('Failed to load theme preference:', e);
    }
    return 'light';
  });

  // Sync theme class to document.documentElement
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (e) {
      console.error('Failed to save theme preference:', e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // All chat sessions in history
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(SESSIONS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load sessions from localStorage:', e);
    }
    return [];
  });

  // Current session ID
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(CURRENT_SESSION_ID_KEY);
    } catch {
      return null;
    }
  });

  // Active messages stream
  const [messages, setMessages] = useState<ChatMessageItem[]>(() => {
    try {
      const savedSessions = localStorage.getItem(SESSIONS_STORAGE_KEY);
      const activeId = localStorage.getItem(CURRENT_SESSION_ID_KEY);
      if (savedSessions && activeId) {
        const parsed: ChatSession[] = JSON.parse(savedSessions);
        const active = parsed.find((s) => s.id === activeId);
        if (active) return active.messages;
      }
    } catch (e) {
      console.error('Failed to load active messages:', e);
    }
    return [];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [documents, setDocuments] = useState<CampusDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);

  // Admin Auth State (stored in localStorage)
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(ADMIN_TOKEN_KEY);
    } catch {
      return null;
    }
  });

  const [adminUsername, setAdminUsername] = useState<string | null>(() => {
    try {
      return localStorage.getItem(ADMIN_USER_KEY);
    } catch {
      return null;
    }
  });

  const handleAdminLogin = (token: string, username: string) => {
    setAdminToken(token);
    setAdminUsername(username);
    try {
      localStorage.setItem(ADMIN_TOKEN_KEY, token);
      localStorage.setItem(ADMIN_USER_KEY, username);
    } catch (e) {
      console.error('Failed to save admin token:', e);
    }
  };

  const handleAdminLogout = () => {
    setAdminToken(null);
    setAdminUsername(null);
    try {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(ADMIN_USER_KEY);
    } catch (e) {
      console.error('Failed to clear admin token:', e);
    }
  };

  // Load campus documents from backend
  const fetchDocuments = async () => {
    setDocsLoading(true);
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.documents)) {
          setDocuments(data.documents);
        }
      }
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setDocsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleAddDocument = async (doc: Omit<CampusDocument, 'id' | 'isBuiltIn'>): Promise<boolean> => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (adminToken) {
        headers['Authorization'] = `Bearer ${adminToken}`;
      }

      const res = await fetch('/api/documents', {
        method: 'POST',
        headers,
        body: JSON.stringify(doc),
      });
      if (res.ok) {
        await fetchDocuments();
        return true;
      }
    } catch (err) {
      console.error('Failed to add document:', err);
    }
    return false;
  };

  const handleDeleteDocument = async (id: string): Promise<boolean> => {
    try {
      const headers: Record<string, string> = {};
      if (adminToken) {
        headers['Authorization'] = `Bearer ${adminToken}`;
      }

      const res = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (res.ok) {
        await fetchDocuments();
        return true;
      }
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
    return false;
  };

  const handleResetDocuments = async (): Promise<boolean> => {
    try {
      const headers: Record<string, string> = {};
      if (adminToken) {
        headers['Authorization'] = `Bearer ${adminToken}`;
      }

      const res = await fetch('/api/documents/reset', {
        method: 'POST',
        headers,
      });
      if (res.ok) {
        await fetchDocuments();
        return true;
      }
    } catch (err) {
      console.error('Failed to reset documents:', err);
    }
    return false;
  };

  // Responsive sidebar open state: default open on desktop (>=1024px), closed on mobile/tablet
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return false;
  });

  // Scroll to bottom detection
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Persist sessions
  useEffect(() => {
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.error('Error saving sessions:', e);
    }
  }, [sessions]);

  // Persist currentSessionId
  useEffect(() => {
    try {
      if (currentSessionId) {
        localStorage.setItem(CURRENT_SESSION_ID_KEY, currentSessionId);
      } else {
        localStorage.removeItem(CURRENT_SESSION_ID_KEY);
      }
    } catch (e) {
      console.error('Error saving currentSessionId:', e);
    }
  }, [currentSessionId]);

  // Update session object whenever messages change
  useEffect(() => {
    if (!currentSessionId) return;

    setSessions((prev) => {
      const idx = prev.findIndex((s) => s.id === currentSessionId);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          messages,
          updatedAt: new Date().toISOString(),
        };
        return updated;
      }
      return prev;
    });
  }, [messages, currentSessionId]);

  // Auto-scroll on new message or typing state
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Detect scroll position to show/hide "Scroll to bottom" button
  const handleScroll = () => {
    if (chatScrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatScrollContainerRef.current;
      const isUp = scrollHeight - scrollTop - clientHeight > 160;
      setShowScrollBottom(isUp);
    }
  };

  // Start new chat
  const handleNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    setInput('');
  };

  // Select previous session
  const handleSelectSession = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      setMessages(session.messages);
      setInput('');
    }
  };

  // Delete session
  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      handleNewChat();
    }
  };

  // Send message
  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    const userMessageId = `user-${Date.now()}`;
    const newUserMessage: ChatMessageItem = {
      id: userMessageId,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    let activeSessionId = currentSessionId;
    if (!activeSessionId) {
      // Create new session entry
      activeSessionId = `session-${Date.now()}`;
      const title = trimmed.length > 36 ? `${trimmed.substring(0, 36)}...` : trimmed;
      const newSession: ChatSession = {
        id: activeSessionId,
        title,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [newUserMessage],
      };
      setSessions((prev) => [newSession, ...prev]);
      setCurrentSessionId(activeSessionId);
    }

    const currentHistory = [...messages, newUserMessage];
    setMessages(currentHistory);
    setInput('');
    setIsLoading(true);

    try {
      // Build history payload for backend
      const historyPayload = messages
        .filter((m) => !m.isError)
        .map((m) => ({
          role: m.role === 'user' ? 'user' : 'model',
          text: m.content,
        }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: trimmed,
          history: historyPayload,
        }),
      });

      let data: any = {};
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const textResp = await res.text();
        if (!res.ok) {
          throw new Error(
            res.status === 404
              ? 'Server backend API (/api/chat) belum terhubung atau tidak ditemukan. Jika menggunakan Vercel, pastikan file vercel.json dan api/index.ts sudah diunggah.'
              : `Terjadi kendala pada server (Kode ${res.status}).`
          );
        }
      }

      if (!res.ok) {
        throw new Error(data.error || 'Gagal memproses pesan.');
      }

      const botMessageId = `bot-${Date.now()}`;
      const newBotMessage: ChatMessageItem = {
        id: botMessageId,
        role: 'assistant',
        content: data.text || 'Maaf, tidak ada respon yang dapat ditampilkan.',
        sources: Array.isArray(data.sources) && data.sources.length > 0 ? data.sources : undefined,
        timestamp: data.timestamp || new Date().toISOString(),
      };

      setMessages((prev) => [...prev, newBotMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg =
        err?.message ||
        'Terjadi kendala saat menghubungi server helpdesk. Silakan periksa koneksi internet Anda atau coba sesaat lagi.';

      const errorBotMessage: ChatMessageItem = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: errorMsg,
        timestamp: new Date().toISOString(),
        isError: true,
      };

      setMessages((prev) => [...prev, errorBotMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = (messageId: string, feedback: 'like' | 'dislike') => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          return {
            ...msg,
            feedback: msg.feedback === feedback ? null : feedback,
            feedbackSubmitted: true,
          };
        }
        return msg;
      })
    );
  };

  const handleRetry = (messageId: string) => {
    const msgIndex = messages.findIndex((m) => m.id === messageId);
    if (msgIndex <= 0) return;

    const userMsg = messages[msgIndex - 1];
    if (userMsg && userMsg.role === 'user') {
      setMessages((prev) => prev.filter((_, idx) => idx !== msgIndex));
      sendMessage(userMsg.content);
    }
  };

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-white dark:bg-[#131314] text-[#1F1F1F] dark:text-[#E3E3E3] transition-colors">
      {/* Google Gemini Collapsible Left Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((prev) => !prev)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onOpenInfo={() => setInfoModalOpen(true)}
        onOpenAdmin={() => setAdminModalOpen(true)}
        isAdminLoggedIn={!!adminToken}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative">
        {/* Top Bar Header */}
        <Header
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          onNewChat={handleNewChat}
          onOpenInfo={() => setInfoModalOpen(true)}
          onOpenAdmin={() => setAdminModalOpen(true)}
          isAdminLoggedIn={!!adminToken}
          hasMessages={messages.length > 0}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        {/* Scrollable Chat Area Taking Full Width (Scrollbar sits at far right edge of viewport) */}
        <div
          ref={chatScrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto w-full px-4 sm:px-6 md:px-8 pt-4 pb-4 scroll-smooth"
        >
          {/* Centered Content Column (max-width around 768px / max-w-3xl) */}
          <div className="max-w-3xl mx-auto min-h-full flex flex-col justify-between">
            {messages.length === 0 ? (
              <WelcomeScreen onSelectPrompt={(prompt) => sendMessage(prompt)} />
            ) : (
              <div className="flex-1 flex flex-col justify-end pt-2 pb-6">
                {messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    onFeedback={handleFeedback}
                    onRetry={handleRetry}
                  />
                ))}

                {/* Shimmer / Pulsing Dots Typing Indicator in place of bot answer */}
                {isLoading && <TypingIndicator />}

                <div ref={messagesEndRef} className="h-4" />
              </div>
            )}
          </div>
        </div>

        {/* Floating Scroll-To-Bottom Button */}
        <ScrollToBottomButton
          visible={showScrollBottom}
          onClick={() => scrollToBottom('smooth')}
        />

        {/* Sticky/Floating Bottom Input Area */}
        <div className="w-full bg-gradient-to-t from-white via-white to-transparent dark:from-[#131314] dark:via-[#131314] dark:to-transparent pt-3 z-10">
          <ChatInput
            input={input}
            setInput={setInput}
            onSend={() => sendMessage(input)}
            isLoading={isLoading}
            onOpenInfo={() => setInfoModalOpen(true)}
          />
        </div>
      </div>

      {/* Campus Info Modal */}
      <InfoModal
        isOpen={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
      />

      {/* Admin Upload & Management Modal (Restricted with Password) */}
      <AdminUploadModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        documents={documents}
        onAddDocument={handleAddDocument}
        onDeleteDocument={handleDeleteDocument}
        onResetDocuments={handleResetDocuments}
        isAdminLoggedIn={!!adminToken}
        onAdminLogin={handleAdminLogin}
        onAdminLogout={handleAdminLogout}
      />
    </div>
  );
}
