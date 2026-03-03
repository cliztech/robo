'use client';

import React, { useState } from 'react';
import { Bot, Mic2, RefreshCw, Send, Sparkles } from 'lucide-react';

import { cn } from '../../lib/utils';
import { AIMessageType, generateHostScript } from '@/lib/aiApi';

interface AIMessage {
  id: string;
  type: AIMessageType;
  content: string;
  status: 'ready' | 'failed';
  timestamp: string;
  correlationId: string;
}

interface DegenAIHostProps {
  persona?: {
    name: string;
    style: string;
    voice: string;
  };
  className?: string;
}

const TYPE_LABELS: Record<AIMessageType, string> = {
  intro: 'Intro',
  outro: 'Outro',
  commentary: 'Commentary',
  news: 'News',
};

export function DegenAIHost({
  persona = { name: 'DGN Host', style: 'Edgy & Energetic', voice: 'Voice #7 (Bass)' },
  className,
}: DegenAIHostProps) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [promptInput, setPromptInput] = useState('');
  const [selectedType, setSelectedType] = useState<AIMessageType>('commentary');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  const generate = async (promptOverride?: string, typeOverride?: AIMessageType) => {
    const prompt = (promptOverride ?? promptInput).trim();
    const messageType = typeOverride ?? selectedType;
    if (!prompt) {
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const { response, correlationId } = await generateHostScript({
        message_type: messageType,
        prompt,
        persona_name: persona.name,
        persona_style: persona.style,
        voice: persona.voice,
      });

      if (!response.success || !response.data) {
        throw new Error(response.error ?? 'AI generation failed');
      }

      const newMessage: AIMessage = {
        id: `${Date.now()}-${correlationId}`,
        type: messageType,
        content: response.data.script,
        status: 'ready',
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        correlationId,
      };

      setMessages((prev) => [newMessage, ...prev]);
      setPromptInput('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown inference error';
      setError(message);
      setRetryToken((prev) => prev + 1);
      setMessages((prev) => [
        {
          id: `${Date.now()}-failed-${retryToken}`,
          type: messageType,
          content: prompt,
          status: 'failed',
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
          correlationId: 'pending',
        },
        ...prev,
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={cn('glass-panel overflow-hidden flex flex-col', className)}>
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <Bot size={12} className="text-cyan-400/70" />
          <span className="panel-header-title">AI Host</span>
        </div>
      </div>

      <div className="px-3 py-2.5 border-b border-white/[0.03] bg-white/[0.01] flex items-center gap-3">
        <Mic2 size={16} className="text-cyan-400/60" />
        <div className="min-w-0">
          <div className="text-[11px] font-bold text-zinc-200">{persona.name}</div>
          <div className="text-[8px] text-zinc-500">{persona.style} · {persona.voice}</div>
        </div>
        <button
          className="ml-auto p-1.5 rounded text-zinc-600 hover:text-zinc-300"
          aria-label="Retry last generation"
          onClick={() => generate(messages[0]?.content, messages[0]?.type)}
          disabled={isGenerating || messages.length === 0}
        >
          <RefreshCw size={12} />
        </button>
      </div>

      {error && (
        <div className="mx-3 mt-2 p-2 text-[10px] rounded border border-red-500/30 text-red-300 bg-red-500/10">
          {error}
          <button className="ml-2 underline" onClick={() => generate()} disabled={isGenerating}>
            Retry
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1.5">
        {messages.map((msg) => (
          <div key={msg.id} className="rounded-lg p-2.5 border bg-black/20 border-white/[0.05]">
            <div className="flex justify-between text-[8px] text-zinc-500">
              <span>{TYPE_LABELS[msg.type]}</span>
              <span>{msg.timestamp}</span>
            </div>
            <p className="text-[10px] text-zinc-300 leading-relaxed mt-1">{msg.content}</p>
            <div className="text-[8px] mt-1 text-zinc-500">
              status={msg.status} · correlation={msg.correlationId}
            </div>
          </div>
        ))}
      </div>

      <div className="px-3 py-2.5 border-t border-white/[0.04] bg-white/[0.01]">
        <div className="flex gap-1 mb-2">
          {(Object.keys(TYPE_LABELS) as AIMessageType[]).map((key) => (
            <button
              key={key}
              onClick={() => setSelectedType(key)}
              className={cn(
                'text-[7px] font-black uppercase px-2 py-1 rounded-sm border transition-all tracking-wider',
                selectedType === key
                  ? 'border-cyan-500/30 text-cyan-300 bg-cyan-500/10'
                  : 'border-white/[0.04] text-zinc-600 hover:text-zinc-400'
              )}
            >
              {TYPE_LABELS[key]}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Custom prompt for AI host..."
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && generate()}
            className="flex-1 bg-black/30 border border-white/[0.05] rounded-md px-3 py-2 text-[11px] text-zinc-200"
          />
          <button
            onClick={() => generate()}
            disabled={isGenerating || !promptInput.trim()}
            className="px-3 py-2 rounded-md text-[10px] font-bold flex items-center gap-1.5 border bg-cyan-500/10 border-cyan-500/20 text-cyan-400 disabled:opacity-40"
          >
            {isGenerating ? <Sparkles size={10} className="animate-spin" /> : <Send size={10} />}
            {isGenerating ? 'Generating' : 'Generate'}
          </button>
        </div>
      </div>
    </div>
  );
}
