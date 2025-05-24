import React, { useContext, useEffect, useRef, useState } from 'react';

import { PromptGetInTouchContext } from 'closer/components/PromptGetInTouchContext';

import { Button } from 'closer';

// import { Card, CardContent } from '@/components/ui/card';

function useCanvasNeuronNetwork(canvasRef: React.RefObject<HTMLCanvasElement>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Convert hex to RGB
    const hexToRgb = (hex: string) => {
      const bigint = parseInt(hex.slice(1), 16);
      return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255,
      };
    };

    const startColor = hexToRgb('#5290DB');
    const endColor = hexToRgb('#79FAC1');

    const neurons = Array.from({ length: 72 }).map(() => {
      const t = Math.random();
      const r = Math.round(startColor.r + t * (endColor.r - startColor.r));
      const g = Math.round(startColor.g + t * (endColor.g - startColor.g));
      const b = Math.round(startColor.b + t * (endColor.b - startColor.b));
      const color = `rgb(${r}, ${g}, ${b})`;

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
  const [heroText, setHeroText] = useState('Build Communities That Thrive');
  const [heroSubtext, setHeroSubtext] = useState(
    'Closer is the operating system for regenerative communities. Manage guests, spaces, events and resources through one intuitive platform designed specifically for land-based projects.',
  );
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [conversation, setConversation] = useState<
    Array<{ question: string; answer: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const currentQuestion = input.trim();
    setInput('');
    setIsLoading(true);
    setIsExpanded(true);

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
        "Here's a new vision for your community.";

      // Add to conversation history
      setConversation((prev) => [
        ...prev,
        { question: currentQuestion, answer: messageContent },
      ]);

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
      setConversation((prev) => [
        ...prev,
        {
          question: currentQuestion,
          answer: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
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
      {/* Modern LLM Prompt Input Fixed Top-Left */}

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="mt-[-32px] relative h-[calc(100vh-80px)]  flex flex-col items-center justify-center text-center"
      >
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full z-0"
        />

        <div className="relative z-10 px-6">
          <h1 className="font-bold text-4xl md:text-6xl mb-8">{heroText}</h1>
          <p className="text-lg max-w-2xl mx-auto mb-8 text-black">
            {heroSubtext}
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center ">
            <Button
              onClick={() => {
                setPromptGetInTouchOpen(true);
              }}
              className={
                'px-8 w-fit  bg-foreground text-background border-foreground'
              }
            >
              Launch your space on Closer
            </Button>
            <Button
              className={
                'px-8 w-fit bg-gradient-to-r from-[#5290DB] to-[#79FAC1] border-none'
              }
            >
              Explore $closer
            </Button>
          </div>

          {/* AI Chat Interface */}
          <div
            className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-white shadow-lg border border-zinc-400 transition-all duration-300 ${
              isExpanded
                ? 'w-[480px] max-h-[400px] rounded-xl'
                : 'w-[320px] rounded-full'
            }`}
          >
            {/* Header with controls - only show when expanded */}
            {isExpanded && (
              <div className="flex items-center justify-between p-3 border-b border-zinc-200">
                <h3 className="text-sm font-medium text-zinc-700">
                  Chat with Closer
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={clearConversation}
                    className="text-xs text-zinc-500 hover:text-zinc-700 px-2 py-1 rounded"
                    title="Clear conversation"
                  >
                    Clear
                  </button>
                  <button
                    onClick={toggleExpanded}
                    className="text-zinc-500 hover:text-zinc-700 p-1 rounded"
                    title="Minimize"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Conversation History - only show when expanded */}
            {isExpanded && (
              <div
                ref={conversationRef}
                className="max-h-[250px] overflow-y-auto p-3 space-y-3"
              >
                {conversation.length === 0 && !isLoading && (
                  <div className="text-left text-zinc-500 text-sm py-4">
                    Ask me anything about Closer!
                  </div>
                )}
                {conversation.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="w-full flex justify-end">
                      <div className="text-right bg-zinc-100 rounded-lg p-2 text-sm w-fit">
                        <span className="font-medium text-zinc-600 mb-1">
                          You:
                        </span>{' '}
                        {item.question}
                      </div>
                    </div>
                    <div className="bg-accent-light rounded-lg p-2 text-sm">
                      <div className="whitespace-pre-wrap text-left">
                        <span className="font-medium text-accent ">
                          Closer:
                        </span>{' '}
                        {item.answer}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className=" rounded-lg p-2 text-sm">
                    <div className="font-medium text-left text-accent mb-1">
                      Closer:
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent"></div>
                      <span>Thinking...</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Input Form */}
            <form
              onSubmit={handleSubmit}
              className={`flex items-center space-x-2 ${
                isExpanded ? 'p-3 border-t border-zinc-400' : 'px-4 py-2'
              }`}
            >
              <input
                type="text"
                placeholder="Ask Closer anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="border-none flex-1 bg-transparent text-sm text-black placeholder-zinc-400 focus:outline-none"
                disabled={isLoading}
              />
              {!isExpanded && conversation.length > 0 && (
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
              )}
              <button
                type="submit"
                className="text-sm text-zinc-600 hover:text-black"
                disabled={isLoading}
              >
                ↵
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
