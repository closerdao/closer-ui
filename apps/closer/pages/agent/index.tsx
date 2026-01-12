import Head from 'next/head';
import Link from 'next/link';

import { useContext } from 'react';

import { PromptGetInTouchContext } from 'closer/components/PromptGetInTouchContext';
import { GeneralConfig, api, useConfig } from 'closer';
import { parseMessageFromError } from 'closer/utils/common';
import { loadLocaleData } from 'closer/utils/locale.helpers';

import { NextPageContext } from 'next';

interface Props {
  generalConfig: GeneralConfig | null;
}

const AgentPage = ({ generalConfig }: Props) => {
  const { setIsOpen } = useContext(PromptGetInTouchContext) as {
    setIsOpen: (open: boolean) => void;
  };

  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;

  return (
    <div className="bg-black text-white min-h-screen">
      <Head>
        <title>Closer Agent — Sovereign Intelligence for Regenerative Communities</title>
        <meta
          name="description"
          content="Turn community knowledge into living intelligence. Closer Agent transforms your conversations, documents, and institutional memory into an AI that understands your land, your people, and your mission—running entirely on your infrastructure."
        />
        <meta name="keywords" content="AI agent, sovereign AI, regenerative communities, community intelligence, decentralized AI, Closer Agent" />
        <meta property="og:title" content="Closer Agent — Sovereign Intelligence for Regenerative Communities" />
        <meta property="og:description" content="Turn community knowledge into living intelligence. Closer Agent transforms your conversations, documents, and institutional memory into an AI that understands your land, your people, and your mission." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_PLATFORM_URL || 'https://closer.earth'}/agent`} />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_PLATFORM_URL || 'https://closer.earth'}/agent`} />
      </Head>

      <section className="pt-32 pb-20 px-6 md:px-[5vw]">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-[#86868b] mb-6">
            <span className="w-1.5 h-1.5 bg-[#79FAC1] rounded-full"></span>
            <span>Sovereign AI for regenerative communities</span>
          </div>
          <h1 className="font-serif text-5xl md:text-7xl mb-6 leading-tight">
            Turn community knowledge into <em className="italic">living intelligence</em>
          </h1>
          <p className="text-xl text-[#86868b] max-w-2xl mb-10 leading-relaxed">
            Closer Agent transforms your conversations, documents, and institutional memory into an AI that understands your land, your people, and your mission—running entirely on your infrastructure.
          </p>
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={() => setIsOpen(true)}
              className="px-7 py-3.5 bg-white text-black rounded-full text-base hover:bg-gray-100 transition-colors font-medium"
            >
              Deploy for your community
            </button>
            <a
              href="#capabilities"
              className="px-7 py-3.5 border border-white/30 text-white hover:border-white rounded-full text-base transition-colors font-medium"
            >
              See capabilities →
            </a>
          </div>
        </div>
      </section>

      <div className="h-px bg-white/10 max-w-6xl mx-auto"></div>

      <section className="py-32 px-6 md:px-[5vw]">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs uppercase tracking-wider text-[#86868b] mb-4">Principles</p>
          <h2 className="font-serif text-4xl md:text-5xl mb-16">
            Intelligence that serves the commons
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="border-t border-white/10 pt-6">
              <div className="text-xs text-[#86868b] mb-4">01</div>
              <h3 className="font-serif text-2xl mb-4">Data stays home</h3>
              <p className="text-[#86868b] text-sm leading-relaxed">
                Your community&apos;s knowledge never leaves your infrastructure. Run inference locally, train on your terms, maintain complete control over what the agent learns.
              </p>
            </div>
            <div className="border-t border-white/10 pt-6">
              <div className="text-xs text-[#86868b] mb-4">02</div>
              <h3 className="font-serif text-2xl mb-4">Community-governed</h3>
              <p className="text-[#86868b] text-sm leading-relaxed">
                Token holders decide what data enters the knowledge base, which behaviors the agent exhibits, and when human presence is required for decisions.
              </p>
            </div>
            <div className="border-t border-white/10 pt-6">
              <div className="text-xs text-[#86868b] mb-4">03</div>
              <h3 className="font-serif text-2xl mb-4">Federated by design</h3>
              <p className="text-[#86868b] text-sm leading-relaxed">
                Connect with other Closer communities to share learnings without exposing raw data. Knowledge flows up voluntarily, strengthening the network.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="h-px bg-white/10 max-w-6xl mx-auto"></div>

      <section className="py-32 px-6 md:px-[5vw]">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs uppercase tracking-wider text-[#86868b] mb-4">Domain Expertise</p>
          <h2 className="font-serif text-4xl md:text-5xl mb-6">
            Built for regenerative work
          </h2>
          <p className="text-lg text-[#86868b] max-w-2xl mb-16">
            The agent comes pre-trained on ecological and regenerative domains, with context awareness for your specific environment.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 border border-white/10 rounded-lg hover:border-white/20 transition-colors">
              <h4 className="font-medium text-base mb-2">Water Management</h4>
              <p className="text-sm text-[#86868b] leading-relaxed">
                Watershed analysis, water quality monitoring, hydrology patterns, irrigation optimization
              </p>
            </div>
            <div className="p-6 border border-white/10 rounded-lg hover:border-white/20 transition-colors">
              <h4 className="font-medium text-base mb-2">Biodiversity</h4>
              <p className="text-sm text-[#86868b] leading-relaxed">
                Species conservation, ecosystem health assessment, habitat restoration planning
              </p>
            </div>
            <div className="p-6 border border-white/10 rounded-lg hover:border-white/20 transition-colors">
              <h4 className="font-medium text-base mb-2">Governance</h4>
              <p className="text-sm text-[#86868b] leading-relaxed">
                Policy analysis, stakeholder engagement, regulatory compliance, decision documentation
              </p>
            </div>
            <div className="p-6 border border-white/10 rounded-lg hover:border-white/20 transition-colors">
              <h4 className="font-medium text-base mb-2">Financial</h4>
              <p className="text-sm text-[#86868b] leading-relaxed">
                Project economics, funding strategies, ROI analysis, prospect pipeline management
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-32 px-6 md:px-[5vw] bg-[#1d1d1f]">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs uppercase tracking-wider text-[#86868b] mb-4">Core Features</p>
          <h2 className="font-serif text-4xl md:text-5xl mb-6">
            Everything your community needs
          </h2>
          <p className="text-lg text-[#86868b] max-w-2xl mb-16">
            A complete platform for managing knowledge, tasks, relationships, and collaboration.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/10 border border-white/10">
            <div className="bg-black p-10">
              <div className="w-9 h-9 mb-5 text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <h4 className="font-medium text-base mb-2">Conversational Intelligence</h4>
              <p className="text-sm text-[#86868b] leading-relaxed">
                Natural language interaction with domain expertise. Ask questions, get recommendations, preserve context across conversations.
              </p>
            </div>
            <div className="bg-black p-10">
              <div className="w-9 h-9 mb-5 text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <h4 className="font-medium text-base mb-2">Multi-Format Ingestion</h4>
              <p className="text-sm text-[#86868b] leading-relaxed">
                Drop in documents, audio, video, images. Automatic transcription, extraction, and indexing into searchable knowledge.
              </p>
            </div>
            <div className="bg-black p-10">
              <div className="w-9 h-9 mb-5 text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="3" y1="9" x2="21" y2="9"/>
                  <line x1="9" y1="21" x2="9" y2="9"/>
                </svg>
              </div>
              <h4 className="font-medium text-base mb-2">AI-Enhanced Tasks</h4>
              <p className="text-sm text-[#86868b] leading-relaxed">
                Automated context generation, research findings, document queries, and deliverable tracking with intelligent prioritization.
              </p>
            </div>
            <div className="bg-black p-10">
              <div className="w-9 h-9 mb-5 text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <h4 className="font-medium text-base mb-2">Relationship Management</h4>
              <p className="text-sm text-[#86868b] leading-relaxed">
                Track prospects, funders, contractors, and community members. Pipeline stages, contact details, and interaction history.
              </p>
            </div>
            <div className="bg-black p-10">
              <div className="w-9 h-9 mb-5 text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <h4 className="font-medium text-base mb-2">Project Isolation</h4>
              <p className="text-sm text-[#86868b] leading-relaxed">
                Multi-project support with complete data separation. Conversations, tasks, and prospects scoped to specific initiatives.
              </p>
            </div>
            <div className="bg-black p-10">
              <div className="w-9 h-9 mb-5 text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
              </div>
              <h4 className="font-medium text-base mb-2">Environmental Context</h4>
              <p className="text-sm text-[#86868b] leading-relaxed">
                Season, region, terrain, and rainfall awareness. Recommendations adapt to your specific ecological conditions.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="capabilities" className="py-32 px-6 md:px-[5vw]">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs uppercase tracking-wider text-[#86868b] mb-4">Deep Dive</p>
          <h2 className="font-serif text-4xl md:text-5xl mb-6">
            Capabilities in detail
          </h2>
          <p className="text-lg text-[#86868b] max-w-2xl mb-16">
            A closer look at what the agent can do for your community.
          </p>
          
          <div className="space-y-16">
            <div className="pb-16 border-b border-white/10">
              <h3 className="font-serif text-3xl mb-4">Conversational AI</h3>
              <p className="text-[#86868b] mb-8 max-w-2xl leading-relaxed">
                A natural language interface that understands your domain and remembers your context. Ask questions, get recommendations, explore possibilities.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  'Domain-specific expertise across water, biodiversity, governance, finance',
                  'Environmental context awareness',
                  'Conversation history preservation',
                  'Multi-domain insight synthesis',
                  'Project-scoped conversations',
                  'Actionable recommendations',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="w-1 h-1 bg-[#79FAC1] rounded-full mt-2 flex-shrink-0"></span>
                    <span className="text-sm text-[#86868b]">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="pb-16 border-b border-white/10">
              <h3 className="font-serif text-3xl mb-4">AI-Enhanced Task Management</h3>
              <p className="text-[#86868b] mb-8 max-w-2xl leading-relaxed">
                Tasks that think. Automated context generation pulls in relevant research, documents, and insights so work gets done faster.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  'Automated AI context generation',
                  'Research findings aggregation',
                  'Intelligent document search',
                  'Subtask management',
                  'Status tracking and dependencies',
                  'Deliverable tracking with success criteria',
                  'Hours estimation',
                  'Tag-based organization',
                  'Batch processing',
                  'Decision logging with rationale',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="w-1 h-1 bg-[#79FAC1] rounded-full mt-2 flex-shrink-0"></span>
                    <span className="text-sm text-[#86868b]">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="pb-16 border-b border-white/10">
              <h3 className="font-serif text-3xl mb-4">Multi-Format Data Ingestion</h3>
              <p className="text-[#86868b] mb-8 max-w-2xl leading-relaxed">
                Every format your community produces becomes searchable, indexed knowledge. Meetings become transcripts. Documents become answers.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  'Text: TXT, MD, JSON, CSV, DOCX, PDF',
                  'Images: JPG, PNG, GIF, WebP, SVG with visual analysis',
                  'Audio: MP3, WAV, M4A, OGG, FLAC with transcription',
                  'Video: MP4, AVI, MOV, MKV, WebM with transcription',
                  'Drag-and-drop upload',
                  'Real-time processing status',
                  'Automatic content extraction',
                  'Searchable repository',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="w-1 h-1 bg-[#79FAC1] rounded-full mt-2 flex-shrink-0"></span>
                    <span className="text-sm text-[#86868b]">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-serif text-3xl mb-4">Relationship Management</h3>
              <p className="text-[#86868b] mb-8 max-w-2xl leading-relaxed">
                Track every relationship that matters to your project. From token buyers to foundations, keep your pipeline organized and your outreach personal.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  'Prospect categories: buyers, lenders, foundations, banks, contractors',
                  'Pipeline stages: new → contacted → qualified → proposal → negotiation → closed',
                  'Contact and firm details',
                  'Geographic filtering',
                  'Ticket size and mandate tracking',
                  'Notes and tags',
                  'Project-scoped management',
                  'Relationship history',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="w-1 h-1 bg-[#79FAC1] rounded-full mt-2 flex-shrink-0"></span>
                    <span className="text-sm text-[#86868b]">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-32 px-6 md:px-[5vw] bg-black">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs uppercase tracking-wider text-[#86868b] mb-4">100% Sovereign</p>
          <h2 className="font-serif text-4xl md:text-5xl mb-6">
            Your data. Your hardware. Your <em className="italic text-[#79FAC1]">intelligence</em>.
          </h2>
          <p className="text-lg text-[#86868b] mb-12 max-w-2xl leading-relaxed">
            Traditional AI services create dependency—you rent intelligence, you don&apos;t own it. Models change, prices increase, access gets revoked. Closer Agent inverts this relationship entirely.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: 'Hardware you control', desc: 'Run on your own machines' },
              { title: 'Weights you own', desc: 'The model is community property' },
              { title: 'Training you direct', desc: 'Decide what the agent learns' },
              { title: 'Governance you define', desc: 'Token holders set the rules' },
            ].map((item) => (
              <div key={item.title} className="border-t border-white/10 pt-5">
                <h4 className="font-medium text-sm mb-1">{item.title}</h4>
                <p className="text-xs text-[#86868b]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 px-6 md:px-[5vw]">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs uppercase tracking-wider text-[#86868b] mb-4">Roadmap</p>
          <h2 className="font-serif text-4xl md:text-5xl mb-6">
            What&apos;s coming
          </h2>
          <p className="text-lg text-[#86868b] max-w-2xl mb-16">
            The agent grows with your community&apos;s needs.
          </p>
          
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-8 pb-8 border-b border-white/10">
              <div>
                <div className="text-xs uppercase tracking-wider text-[#86868b] mb-1">Next</div>
                <div className="text-sm font-medium">Q1 2026</div>
              </div>
              <div>
                <h4 className="font-medium text-base mb-3">Workflow Automation</h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Auto task creation from conversations',
                    'Smart prioritization',
                    'Automated follow-ups',
                    'Workflow templates',
                    'Calendar integration',
                  ].map((item) => (
                    <span key={item} className="px-3 py-1.5 bg-[#1d1d1f] rounded text-xs text-[#86868b]">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-8 pb-8 border-b border-white/10">
              <div>
                <div className="text-xs uppercase tracking-wider text-[#86868b] mb-1">Soon</div>
                <div className="text-sm font-medium">Q2 2026</div>
              </div>
              <div>
                <h4 className="font-medium text-base mb-3">Advanced Analytics</h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Project health dashboards',
                    'Performance metrics',
                    'Trend forecasting',
                    'Custom report builder',
                    'GIS integration',
                  ].map((item) => (
                    <span key={item} className="px-3 py-1.5 bg-[#1d1d1f] rounded text-xs text-[#86868b]">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-8">
              <div>
                <div className="text-xs uppercase tracking-wider text-[#86868b] mb-1">Later</div>
                <div className="text-sm font-medium">2026</div>
              </div>
              <div>
                <h4 className="font-medium text-base mb-3">Multi-Agent & Federation</h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Multi-agent collaboration',
                    'Predictive analytics',
                    'Custom model fine-tuning',
                    'Real-time sensor integration',
                    'Cross-community learning',
                    'Mobile apps',
                  ].map((item) => (
                    <span key={item} className="px-3 py-1.5 bg-[#1d1d1f] rounded text-xs text-[#86868b]">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="h-px bg-white/10 max-w-6xl mx-auto"></div>

      <section className="py-32 px-6 md:px-[5vw] text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-5xl md:text-6xl mb-6">
            Ready to grow your commons?
          </h2>
          <p className="text-lg text-[#86868b] mb-10 max-w-xl mx-auto">
            Join the network of regenerative communities building sovereign intelligence together.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1d1d1f] rounded-full text-sm text-[#86868b] mb-8">
            <span className="w-2 h-2 bg-[#79FAC1] rounded-full animate-pulse"></span>
            <span>Currently in alpha — not yet commercially available</span>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="px-7 py-3.5 bg-white text-black rounded-full text-base hover:bg-gray-100 transition-colors font-medium"
          >
            Get in touch
          </button>
        </div>
      </section>
    </div>
  );
};

AgentPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const messages = await loadLocaleData(
      context?.locale,
      process.env.NEXT_PUBLIC_APP_NAME,
    );
    const [generalRes] = await Promise.all([
      api.get('/config/general').catch(() => {
        return null;
      }),
    ]);

    const generalConfig = generalRes?.data?.results?.value;

    return {
      generalConfig,
      messages,
    };
  } catch (err: unknown) {
    return {
      generalConfig: null,
      error: parseMessageFromError(err),
      messages: null,
    };
  }
};

export default AgentPage;
