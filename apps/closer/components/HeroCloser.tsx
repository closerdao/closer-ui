import React, { useContext, useEffect, useRef, useState } from 'react';

import { PromptGetInTouchContext } from 'closer/components/PromptGetInTouchContext';

import { Spinner } from 'closer';
import { X } from 'lucide-react';

const SHOW_CHATBOT = true;

function useCanvasNeuronNetwork(canvasRef: React.RefObject<HTMLCanvasElement>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === 'undefined') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const neurons = Array.from({ length: 72 }).map(() => {
      const color = 'rgb(128, 128, 128)';

      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        color,
      };
    });

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      neurons.forEach((n1, i) => {
        n1.vx += (Math.random() - 0.5) * 0.0001;
        n1.vy += (Math.random() - 0.5) * 0.0001;
        n1.x += n1.vx;
        n1.y += n1.vy;

        ctx.beginPath();
        ctx.arc(n1.x, n1.y, 2, 0, 2 * Math.PI); // radius = 3 for 6px diameter
        ctx.fillStyle = n1.color;
        ctx.fill();
        ctx.stroke();

        const synapseCount = Math.floor(Math.random() * 10) + 3;
        let connections = 0;

        for (let j = 0; j < neurons.length; j++) {
          if (i === j || connections >= synapseCount) continue;
          const n2 = neurons[j];
          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            connections++;
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.quadraticCurveTo(
              (n1.x + n2.x) / 2 + (Math.random() - 0.5) * 2,
              (n1.y + n2.y) / 2 + (Math.random() - 0.5) * 2,
              n2.x,
              n2.y,
            );
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });

      requestAnimationFrame(draw);
    }

    draw();
  }, [canvasRef]);
}

export default function HeroCloser() {
  const canvasRef = useRef(null);
  const [isClient, setIsClient] = useState(false);
  const [heroText, setHeroText] = useState('Build Communities That Thrive');
  const [heroSubtext, setHeroSubtext] = useState(
    'Closer is the operating system for regenerative communities. Manage guests, spaces, events and resources through one intuitive platform designed specifically for land-based projects.',
  );
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [conversation, setConversation] = useState<
    Array<{ question: string; answer: string }>
  >([
    // {
    //   question: 'what is closer?',
    //   answer:
    //     'Closer is the operating system for regenerative communities. Manage guests, spaces, events and resources through one intuitive platform designed specifically for land-based projects.',
    // },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { setIsOpen: setPromptGetInTouchOpen } = useContext(
    PromptGetInTouchContext,
  );

  const heroRef = useRef(null);
  const conversationRef = useRef<HTMLDivElement>(null);

  useCanvasNeuronNetwork(canvasRef);

  // Auto-scroll to bottom when conversation updates
  useEffect(() => {
    if (conversationRef.current && conversation.length > 0) {
      conversationRef.current.scrollTo({
        top: conversationRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [conversation, isLoading]);

  useEffect(() => {
    if (isExpanded) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isExpanded]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const currentQuestion = input.trim();
    setInput('');
    setIsLoading(true);
    setIsExpanded(true);

    // Show the question immediately in the conversation
    setConversation((prev) => [
      ...prev,
      { question: currentQuestion, answer: '' },
    ]);

    try {
      const response = await fetch(
        'https://tuoxw2y6xrmhamaiqclxy33c.agents.do-ai.run/api/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer EAioVoeOEQc9ny9qvQlHAK-pkwQGAhbW',
          },
          body: JSON.stringify({
            messages: [
              {
                role: 'user',
                content: currentQuestion,
              },
            ],
          }),
        },
      );
      const data = await response.json();

      // Handle chat completions response format
      const messageContent =
        data.choices?.[0]?.message?.content ||
        'A new vision for your community.';

      // Update the last conversation entry with the answer
      setConversation((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          answer: messageContent,
        };
        return updated;
      });

      // Update hero text for the latest response
      const lines = messageContent
        .split('\n')
        .filter((line: string) => line.trim());
      const title = lines.length > 1 ? lines[0] : 'Transform Your Community';
      const subtitle =
        lines.length > 1 ? lines.slice(1).join(' ') : messageContent;

      setHeroText(title);
      setHeroSubtext(subtitle);
    } catch (error) {
      console.error('Error fetching response:', error);
      setConversation((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          answer: 'Sorry, I encountered an error. Please try again.',
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const clearConversation = () => {
    setConversation([]);
    setIsExpanded(false);
    setHeroText('Build Communities That Thrive');
    setHeroSubtext(
      'Closer is the operating system for regenerative communities. Manage guests, spaces, events and resources through one intuitive platform designed specifically for land-based projects.',
    );
  };

  return (
    <div className="bg-white text-black font-sans">
      {/* Hero Section */}
      <section
        ref={heroRef}
        className="mt-[-32px] relative pt-20 flex flex-col items-center justify-center text-center"
      >
        {isClient && (
          <canvas
            ref={canvasRef}
            className='absolute top-0 left-0 w-full h-full z-0'
          />
        )}

        <div className="relative z-10 px-6">
          <h1 className="font-bold text-4xl md:text-6xl mb-8  max-w-5xl mx-auto">
            {heroText}
          </h1>
          <p className="text-lg max-w-2xl mx-auto mb-8 text-black">
            {heroSubtext}
          </p>
          {SHOW_CHATBOT && (
            <div
              className={`${
                isExpanded
                  ? 'fixed inset-0 z-50 bg-white flex flex-col transition-opacity duration-300 opacity-100'
                  : 'flex justify-center z-50 mx-auto w-[260px] sm:w-[360px] mt-20'
              }`}
              style={
                isExpanded
                  ? {
                      borderRadius: 0,
                      width: '100vw',
                      height: '100vh',
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      overflow: 'hidden',
                    }
                  : {}
              }
            >
              {/* Conversation History - only show when expanded */}
              {isExpanded && (
                <div
                  ref={conversationRef}
                  className="flex-1 overflow-y-auto px-8 py-6 space-y-8 bg-white"
                  style={{ minHeight: 0 }}
                >
                  {conversation.length === 0 && !isLoading && (
                    <div className="text-left text-zinc-500 text-lg py-4">
                      Ask me anything about Closer!
                    </div>
                  )}

                  <div className="max-w-2xl mx-auto flex justify-end z-100 pt-20">
                    <button
                      onClick={toggleExpanded}
                      className="ml-2 text-zinc-500 hover:text-zinc-700 p-1 border-zinc-300"
                      title="Close chat"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {conversation.map((item, index) => (
                    <div key={index} className="space-y-4 max-w-2xl mx-auto">
                      {/* User question in large, left-aligned text */}
                      <div className="w-full flex">
                        <div className="pt-8 text-left text-3xl font-medium text-zinc-900 w-full break-words">
                          {item.question}
                        </div>
                      </div>
                      {/* Closer answer */}
                      <div className=" text-lg py-6">
                        <div className="whitespace-pre-wrap text-left">
                          {/* <span className="font-medium text-accent">
                            Closer:
                          </span>{' '} */}
                          {item.answer}
                        </div>
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="rounded-lg text-lg max-w-2xl mx-auto">
                      <div className="flex items-center space-x-2">
                        <Spinner />
                        <span>Thinking...</span>
                      </div>
                    </div>
                  )}

                  {/* Input Form - always at the bottom in expanded view */}
                  <form
                    onSubmit={handleSubmit}
                    className={`flex items-center space-x-4 max-w-2xl mx-auto ${
                      isExpanded
                        ? ' border-b border-zinc-200 bg-white'
                        : 'px-4 py-2'
                    }`}
                    style={isExpanded ? {} : {}}
                  >
                    <input
                      type="text"
                      placeholder="Ask a follow-up..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className={`text-2xl border-none flex-1 bg-transparent text-black placeholder-zinc-400 focus:outline-none ${
                        isExpanded ? 'py-2 px-0' : ''
                      }`}
                      disabled={isLoading}
                    />
                    {/* {!isExpanded && conversation.length > 0 && (
                      <button
                        type="button"
                        onClick={toggleExpanded}
                        className="text-sm text-zinc-600 hover:text-black px-1"
                        title="Expand chat"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M6 15l6-6 6 6" />
                        </svg>
                      </button>
                    )} */}
                    <button
                      type="submit"
                      className="text-lg text-zinc-600 hover:text-black font-bold px-3 py-2 rounded"
                      disabled={isLoading}
                    >
                      ↵
                    </button>
                  </form>
                </div>
              )}
              {/* Collapsed view: revert to original */}
              {!isExpanded && (
                <form
                  onSubmit={handleSubmit}
                  className="flex items-center space-x-2 px-4 py-2 w-[260px] sm:w-[360px] border bg-white border-accent rounded-full shadow-lg"
                >
                  <input
                    type="text"
                    placeholder="Ask Closer anything..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="border-none flex-1 bg-transparent text-sm text-black placeholder-zinc-400 focus:outline-none"
                    disabled={isLoading}
                  />
                  {/* {conversation.length > 0 && (
                    <button
                      type="button"
                      onClick={toggleExpanded}
                      className="text-sm text-zinc-600 hover:text-black px-1"
                      title="Expand chat"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M6 15l6-6 6 6" />
                      </svg>
                    </button>
                  )} */}
                  <button
                    type="submit"
                    className="text-sm text-zinc-600 hover:text-black"
                    disabled={isLoading}
                  >
                    ↵
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
