import React, { useEffect, useRef, useState } from 'react';

import { Spinner } from 'closer';
import { MessageCircle, Send, X } from 'lucide-react';

const AGENT_URL =
  'https://tuoxw2y6xrmhamaiqclxy33c.agents.do-ai.run/api/v1/chat/completions';
const AGENT_TOKEN = process.env.NEXT_PUBLIC_CLOSER_AGENT_TOKEN;

/**
 * Floating "ask Closer AI" widget. Lives on its own rather than inside the
 * hero so the landing hero can change without taking the chat down with it.
 */
export default function CloserChatWidget() {
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [conversation, setConversation] = useState<
    Array<{ question: string; answer: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const conversationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversationRef.current && conversation.length > 0) {
      conversationRef.current.scrollTo({
        top: conversationRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [conversation, isLoading]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const currentQuestion = input.trim();
    setInput('');
    setIsLoading(true);
    setConversation((prev) => [
      ...prev,
      { question: currentQuestion, answer: '' },
    ]);

    const setLastAnswer = (answer: string) =>
      setConversation((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          answer,
        };
        return updated;
      });

    try {
      const response = await fetch(AGENT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(AGENT_TOKEN && { Authorization: `Bearer ${AGENT_TOKEN}` }),
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: currentQuestion }],
        }),
      });
      const data = await response.json();
      setLastAnswer(
        data.choices?.[0]?.message?.content ||
          'A new vision for your community.',
      );
    } catch (error) {
      console.error('Error fetching response:', error);
      setLastAnswer('Sorry, I encountered an error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-6 right-6 z-[60] w-14 h-14 bg-[#0E1E16] text-[#3EE08F] rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center"
        aria-label="Open chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-[60] w-[calc(100vw-3rem)] md:w-full md:max-w-md h-[600px] bg-white border border-[#C2F0DA] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#C2F0DA]">
        <h3 className="text-lg font-semibold text-[#10201A]">Closer AI</h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-[#5C6E64] hover:text-[#10201A] transition-colors"
          aria-label="Close chat"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div
        ref={conversationRef}
        className="flex-1 overflow-y-auto px-5 py-4 space-y-6"
      >
        {conversation.length === 0 && !isLoading && (
          <div className="text-center text-[#5C6E64] py-8">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-[#C2F0DA]" />
            <p className="text-sm">Ask me anything about Closer</p>
          </div>
        )}

        {conversation.map((item, index) => (
          <div key={index} className="space-y-3">
            <div className="flex justify-end">
              <div className="bg-[#0E1E16] text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%]">
                <p className="text-sm leading-relaxed">{item.question}</p>
              </div>
            </div>
            {item.answer && (
              <div className="flex justify-start">
                <div className="bg-[#E2FAEE] text-[#10201A] rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[80%]">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {item.answer}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#E2FAEE] rounded-2xl rounded-tl-sm px-4 py-2.5">
              <div className="flex items-center space-x-2">
                <Spinner />
                <span className="text-sm text-[#5C6E64]">Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-[#C2F0DA] p-4 bg-white"
      >
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 border border-[#C2F0DA] rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-[#0FA968]"
            disabled={isLoading}
            autoFocus
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="w-10 h-10 bg-[#0E1E16] text-[#3EE08F] rounded-full flex items-center justify-center hover:bg-[#0B7A4C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
