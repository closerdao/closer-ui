import React, { useContext, useEffect, useRef, useState } from 'react';

import { PromptGetInTouchContext } from 'closer/components/PromptGetInTouchContext';

import { Spinner } from 'closer';
import { X, MessageCircle, Send } from 'lucide-react';

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
    <div className="bg-black text-white font-sans -mx-4 md:-mx-0">
      {/* Hero Section */}
      <section
        ref={heroRef}
        className="min-h-screen relative pt-20 flex flex-col items-center justify-center text-center px-6 md:px-[5vw]"
      >
        {isClient && (
          <canvas
            ref={canvasRef}
            className='absolute top-0 left-0 w-full h-full z-0 opacity-20'
          />
        )}

        <div className="relative z-10 px-6 py-32">
          <p className="text-lg text-[#86868b] mb-4">The operating system for regenerative communities</p>
          <h1 className="font-serif text-6xl md:text-8xl lg:text-[8rem] font-normal leading-[0.95] tracking-[-0.03em] mb-8 max-w-5xl mx-auto">
            Decentralized<br />Autonomous <em className="italic">Villages</em>
          </h1>
          <p className="text-xl text-[#86868b] max-w-[500px] mx-auto mb-12">
            Manage guests, spaces, events and resources. Token-powered governance when you&apos;re ready.
          </p>
          <a
            href="#features"
            className="inline-block px-7 py-3.5 bg-white text-black rounded-full text-base hover:bg-gray-100 transition-colors"
          >
            Explore
          </a>
        </div>
        
        {SHOW_CHATBOT && (
          <>
            {!isExpanded && (
              <button
                onClick={toggleExpanded}
                className="fixed bottom-6 right-6 z-[60] w-14 h-14 bg-black text-white rounded-full shadow-2xl hover:shadow-3xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center"
                aria-label="Open chat"
              >
                <MessageCircle className="w-6 h-6" />
              </button>
            )}

            {isExpanded && (
              <div className="fixed bottom-6 right-6 z-[60] w-[calc(100vw-3rem)] md:w-full md:max-w-md h-[600px] md:h-[600px] bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">Closer AI</h3>
                  <button
                    onClick={toggleExpanded}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
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
                    <div className="text-center text-gray-500 py-8">
                      <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm">Ask me anything about Closer</p>
                    </div>
                  )}

                  {conversation.map((item, index) => (
                    <div key={index} className="space-y-3">
                      <div className="flex justify-end">
                        <div className="bg-black text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%]">
                          <p className="text-sm leading-relaxed">{item.question}</p>
                        </div>
                      </div>
                      {item.answer && (
                        <div className="flex justify-start">
                          <div className="bg-gray-50 text-gray-900 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[80%]">
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
                      <div className="bg-gray-50 rounded-2xl rounded-tl-sm px-4 py-2.5">
                        <div className="flex items-center space-x-2">
                          <Spinner />
                          <span className="text-sm text-gray-500">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="border-t border-gray-100 p-4 bg-white"
                >
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="flex-1 border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-0 focus:border-gray-300"
                      disabled={isLoading}
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      aria-label="Send message"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
