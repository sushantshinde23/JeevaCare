import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../services/api';
import { useTranslation } from '../../i18n/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import {
  Bot,
  Send,
  X,
  Sparkles,
  Volume2,
  VolumeX,
  Copy,
  Check,
  RotateCcw,
  Trash2,
  Mic,
  MicOff,
  Maximize2,
  Minimize2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { JeevaCareLogo } from '../common/JeevaCareLogo';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  source?: string;
  isError?: boolean;
}

export const AiTriageAssistant: React.FC = () => {
  const { language } = useTranslation();
  const { user, role } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSpeakingId, setIsSpeakingId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initial greeting
  const getInitialGreeting = (lang: string) => {
    if (lang === 'mr') {
      return 'नमस्कार! मी JeevaCare AI सहाय्यक आहे. संदर्भ प्रक्रिया (Referral Workflow), १०८ रुग्णवाहिका, जवळची प्रमाणित CEmONC रुग्णालये, रक्तपेढी किंवा क्लिनिकल प्रोटोकॉलबद्दल प्रश्न विचारा.';
    }
    if (lang === 'hi') {
      return 'नमस्ते! मैं JeevaCare AI सहायक हूँ। रेफरल प्रक्रिया, 108 एम्बुलेंस समन्वय, नजदीकी CEmONC अस्पताल, ब्लड बैंक उपलब्धता या दक्षता प्रोटोकॉल के बारे में पूछ सकते हैं।';
    }
    return 'Hello! I am your JeevaCare AI Assistant. How can I help you coordinate emergency maternal referrals, check FRU capabilities, or navigate protocols?';
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'msg-0',
      sender: 'assistant',
      text: getInitialGreeting(language),
      timestamp: new Date(),
      source: 'JeevaCare Clinical Engine',
    },
  ]);

  // Update initial message if empty and language changes
  useEffect(() => {
    if (messages.length <= 1) {
      setMessages([
        {
          id: 'msg-0',
          sender: 'assistant',
          text: getInitialGreeting(language),
          timestamp: new Date(),
          source: 'JeevaCare Clinical Engine',
        },
      ]);
    }
  }, [language]);

  // Check speech synthesis & recognition support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSpeechRecognition = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
      setSpeechSupported(hasSpeechRecognition);
    }
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  // Suggested Prompts based on Role and Language
  const getSuggestedPrompts = () => {
    if (language === 'mr') {
      if (role === 'health_worker') {
        return [
          'एक्लॅम्पसियासाठी कोणती सुविधा हवी?',
          'नवीन आपत्कालीन रेफरल कसे करावे?',
          'पुण्यातील CEmONC रुग्णालये दाखवा',
          '१०८ रुग्णवाहिका कशी बोलवायची?',
        ];
      }
      if (role === 'hospital_coordinator') {
        return [
          'प्रलंबित रेफरल कसे स्वीकारायचे?',
          'रक्तपेढी व ओटी सज्जता प्रोटोकॉल काय आहे?',
          'डिजिटल हँडओव्हर कसा पूर्ण करावा?',
        ];
      }
      return [
        '१०८ आपत्कालीन मदत कशी मिळवावी?',
        'माझ्या रेफरलची स्थिती काय आहे?',
        'जवळचे सरकारी सिझेरियन रुग्णालय कोणते?',
      ];
    }

    if (language === 'hi') {
      if (role === 'health_worker') {
        return [
          'एक्लम्पसिया के लिए कौन सी सुविधा चाहिए?',
          'नया आपातकालीन रेफरल कैसे बनाएँ?',
          'पुणे में CEmONC अस्पताल दिखाएँ',
          '108 एम्बुलेंस कैसे डिस्पैच करें?',
        ];
      }
      return [
        '108 आपातकालीन सहायता कैसे लें?',
        'रेफरल की स्थिति क्या है?',
        'निकटतम सरकारी सी-सेक्शन अस्पताल कौन सा है?',
      ];
    }

    // English
    if (role === 'health_worker') {
      return [
        'What facilities are needed for Eclampsia?',
        'How to dispatch 108 ALS ambulance?',
        'Which Pune hospitals have 24x7 CEmONC?',
        'How do I sync offline referral drafts?',
      ];
    }
    if (role === 'hospital_coordinator') {
      return [
        'How to acknowledge incoming transfer?',
        'Check verified CEmONC readiness',
        'Complete digital arrival handover',
      ];
    }
    if (role === 'transport_coordinator') {
      return [
        'How to update in-transit milestones?',
        'Google Maps route ETA calculation',
        'Report transport delay escalation',
      ];
    }
    return [
      'How to track my ambulance & referral?',
      'Find nearest verified CEmONC hospital',
      'How to download my referral slip?',
      '108 emergency maternal guidance',
    ];
  };

  const handleSend = async (userText: string) => {
    if (!userText.trim() || loading) return;

    const trimmed = userText.trim();
    setInput('');

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      // Build conversation history for multi-turn context
      const chatHistory = [...messages, userMsg].map((m) => ({
        role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.text,
      }));

      const res = await apiClient.sendAiChat(chatHistory, language, role, user?.id);

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        text: res.reply,
        timestamp: new Date(),
        source: res.source,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now() + 1}`,
          sender: 'assistant',
          text:
            language === 'mr'
              ? 'क्षमस्व, नेटवर्क त्रुटी आली. सक्रिय वैद्यकीय आणीबाणीमध्ये कृपया त्वरित १०८ वर संपर्क साधा.'
              : language === 'hi'
              ? 'क्षमा करें, नेटवर्क त्रुटि हुई। सक्रिय चिकित्सा आपात स्थिति में कृपया तुरंत 108 पर संपर्क करें।'
              : 'Unable to connect to AI engine. In an active emergency, please dial 108 ambulance immediately.',
          timestamp: new Date(),
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const handleCopy = (text: string, id: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleSpeak = (text: string, id: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isSpeakingId === id) {
      window.speechSynthesis.cancel();
      setIsSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.95;

    utterance.onstart = () => setIsSpeakingId(id);
    utterance.onend = () => setIsSpeakingId(null);
    utterance.onerror = () => setIsSpeakingId(null);

    window.speechSynthesis.speak(utterance);
  };

  const toggleVoiceInput = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  const handleClearChat = () => {
    window.speechSynthesis?.cancel();
    setIsSpeakingId(null);
    setMessages([
      {
        id: 'msg-0',
        sender: 'assistant',
        text: getInitialGreeting(language),
        timestamp: new Date(),
        source: 'JeevaCare Clinical Engine',
      },
    ]);
    setShowClearConfirm(false);
  };

  // Safe formatting of markdown-like text
  const renderMessageContent = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-1">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1" />;

          // Bullet points
          if (line.trim().startsWith('• ') || line.trim().startsWith('- ')) {
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1">
                <span className="text-[#0F766E] dark:text-[#2DD4BF] font-bold">•</span>
                <span>{line.replace(/^[-•]\s*/, '')}</span>
              </div>
            );
          }

          // Numbered lists
          const numMatch = line.match(/^(\d+)\.\s*(.*)/);
          if (numMatch) {
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1">
                <span className="font-bold text-[#0F766E] dark:text-[#2DD4BF] text-[11px]">
                  {numMatch[1]}.
                </span>
                <span>{numMatch[2]}</span>
              </div>
            );
          }

          return <p key={idx}>{line}</p>;
        })}
      </div>
    );
  };

  return (
    <div id="ai-assistant-widget" className="no-print">
      {/* Floating Toggle Button (safely positioned above mobile bottom bar) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 p-3 sm:p-3.5 rounded-full bg-[#0F766E] hover:bg-[#0D635C] text-white shadow-xl shadow-[#0F766E]/30 transition-all flex items-center justify-center cursor-pointer group focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2"
        title="Open JeevaCare AI Assistant"
        aria-label="Open JeevaCare AI Assistant"
      >
        <Bot className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#15803D] rounded-full border-2 border-white dark:border-[#172638] animate-pulse" />
      </button>

      {/* Assistant Modal / Responsive Panel */}
      {isOpen && (
        <div
          className={`fixed z-50 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-2xl overflow-hidden flex flex-col transition-all duration-200 animate-in fade-in slide-in-from-bottom-4 ${
            isExpanded
              ? 'inset-3 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[600px] sm:h-[680px]'
              : 'bottom-20 right-2 sm:bottom-20 sm:right-6 w-[94vw] sm:w-[410px] h-[520px] max-h-[82vh]'
          }`}
        >
          {/* Header */}
          <div className="px-3.5 py-2.5 bg-[#0F766E] text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#2DD4BF]" />
              </div>
              <div>
                <h4 className="text-xs font-bold leading-tight">JeevaCare AI Assistant</h4>
                <div className="flex items-center gap-1.5 text-[10px] text-teal-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2DD4BF]" />
                  <span>Clinical Workflow &amp; Triage Copilot</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition cursor-pointer"
                title="Clear conversation"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="hidden sm:inline-flex text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition cursor-pointer"
                title={isExpanded ? 'Minimize' : 'Expand window'}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition cursor-pointer"
                title="Close Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Clear Confirmation Bar */}
          {showClearConfirm && (
            <div className="px-3 py-2 bg-[#FEF2F2] dark:bg-[#7F1D1D]/40 border-b border-[#FCA5A5] text-xs flex items-center justify-between text-[#DC2626] dark:text-[#F87171] animate-in fade-in">
              <span>Clear conversation history?</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClearChat}
                  className="px-2 py-0.5 bg-[#DC2626] text-white rounded font-bold hover:bg-[#B91C1C] cursor-pointer text-[11px]"
                >
                  Yes, Clear
                </button>
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="px-2 py-0.5 bg-white text-[#334155] rounded border border-slate-300 hover:bg-slate-50 cursor-pointer text-[11px]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Quick Prompts Strip */}
          <div className="p-2 bg-[#F7FAFC] dark:bg-[#203449]/50 border-b border-[#DCE7EC] dark:border-[#334155] flex gap-1.5 overflow-x-auto text-[10px] no-scrollbar">
            {getSuggestedPrompts().map((promptText, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(promptText)}
                className="px-2.5 py-1 bg-white dark:bg-[#172638] rounded-lg border border-[#DCE7EC] dark:border-[#334155] shrink-0 hover:bg-[#E8F5F3] dark:hover:bg-[#203449] hover:border-[#0F766E] text-[#334155] dark:text-[#CBD5E1] transition font-medium cursor-pointer"
              >
                {promptText}
              </button>
            ))}
          </div>

          {/* Message History */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] p-3 rounded-2xl leading-relaxed text-xs ${
                    m.sender === 'user'
                      ? 'bg-[#0F766E] text-white rounded-br-none shadow-xs font-medium'
                      : m.isError
                      ? 'bg-[#FEF2F2] dark:bg-[#7F1D1D]/30 border border-[#FCA5A5] text-[#DC2626] dark:text-[#F87171] rounded-bl-none'
                      : 'bg-[#F7FAFC] dark:bg-[#203449] text-[#12304A] dark:text-[#CBD5E1] border border-[#DCE7EC] dark:border-[#334155] rounded-bl-none shadow-2xs'
                  }`}
                >
                  {renderMessageContent(m.text)}
                </div>

                {/* Message Action Bar for Assistant */}
                {m.sender === 'assistant' && (
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-[#64748B] dark:text-[#94A3B8] px-1">
                    {m.source && (
                      <span className="bg-[#E8F5F3] dark:bg-[#172638] text-[#0F766E] dark:text-[#2DD4BF] px-1.5 py-0.2 rounded font-semibold text-[9px]">
                        {m.source}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleSpeak(m.text, m.id)}
                      className="hover:text-[#0F766E] dark:hover:text-[#2DD4BF] flex items-center gap-0.5 cursor-pointer"
                      title={isSpeakingId === m.id ? 'Stop audio' : 'Listen read-aloud'}
                    >
                      {isSpeakingId === m.id ? (
                        <>
                          <VolumeX className="w-3 h-3 text-[#DC2626]" />
                          <span className="text-[#DC2626]">Stop</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3" />
                          <span>Listen</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopy(m.text, m.id)}
                      className="hover:text-[#0F766E] dark:hover:text-[#2DD4BF] flex items-center gap-0.5 cursor-pointer"
                      title="Copy response"
                    >
                      {copiedId === m.id ? (
                        <>
                          <Check className="w-3 h-3 text-[#15803D]" />
                          <span className="text-[#15803D]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    {m.isError && (
                      <button
                        type="button"
                        onClick={() => {
                          const lastUser = [...messages].reverse().find((msg) => msg.sender === 'user');
                          if (lastUser) handleSend(lastUser.text);
                        }}
                        className="text-[#DC2626] hover:underline flex items-center gap-0.5 cursor-pointer font-bold"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Retry</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex flex-col items-start space-y-1">
                <div className="bg-[#F7FAFC] dark:bg-[#203449] text-[#64748B] dark:text-[#94A3B8] p-3 rounded-2xl rounded-bl-none text-xs flex items-center gap-2 border border-[#DCE7EC] dark:border-[#334155]">
                  <span className="w-2 h-2 bg-[#0F766E] rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-[#0F766E] rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 bg-[#0F766E] rounded-full animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] text-[#64748B]">Consulting JeevaCare protocols...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Safety & Protocol Banner */}
          <div className="px-3 py-1 bg-[#E8F5F3]/60 dark:bg-[#203449]/40 border-t border-[#DCE7EC] dark:border-[#334155] text-[10px] text-[#0F766E] dark:text-[#2DD4BF] flex items-center justify-between">
            <span className="truncate">Decision support only. Follow local hospital protocol.</span>
            <a href="tel:108" className="font-bold underline text-[#DC2626] ml-2 shrink-0">
              108 Emergency
            </a>
          </div>

          {/* Input Form with Multi-line support and Speech */}
          <form
            onSubmit={handleFormSubmit}
            className="p-2 border-t border-[#DCE7EC] dark:border-[#334155] bg-white dark:bg-[#172638] flex items-end gap-1.5"
          >
            {speechSupported && (
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`p-2 rounded-xl transition cursor-pointer shrink-0 ${
                  isListening
                    ? 'bg-[#DC2626] text-white animate-pulse'
                    : 'bg-[#F7FAFC] dark:bg-[#203449] text-[#64748B] hover:text-[#0F766E] border border-[#DCE7EC] dark:border-[#334155]'
                }`}
                title={isListening ? 'Listening... click to stop' : 'Voice input (Speech to Text)'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}

            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder={
                  language === 'mr'
                    ? 'रेफरल, रुग्णालय किंवा प्रोटोकॉलबद्दल विचारा...'
                    : language === 'hi'
                    ? 'रेफरल, अस्पताल या प्रोटोकॉल के बारे में पूछें...'
                    : 'Ask about referrals, CEmONC hospitals, or 108 dispatch...'
                }
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#DCE7EC] dark:border-[#334155] bg-[#F7FAFC] dark:bg-[#203449] text-[#12304A] dark:text-[#CBD5E1] focus:outline-none focus:ring-1 focus:ring-[#0F766E] resize-none max-h-24"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0D635C] text-white disabled:opacity-40 cursor-pointer shadow-xs shrink-0 transition-all"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
