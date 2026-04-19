'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * 会话持久化:用 localStorage 按 chartId 存对话,同一命盘返回时秒恢复。
 *   key 约定:bazi:chat:v1:{chartId}
 *   只存已完成的消息(不存流式中间态)。
 *   清空由右上"重新解读"按钮触发。
 */
const STORAGE_VERSION = 'v1';
const storageKey = (chartId: string) => `bazi:chat:${STORAGE_VERSION}:${chartId}`;

function loadMessages(chartId: string): Message[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(storageKey(chartId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((m): m is Message =>
      m && typeof m.role === 'string' && typeof m.content === 'string'
      && (m.role === 'user' || m.role === 'assistant'),
    );
  } catch {
    return [];
  }
}

function saveMessages(chartId: string, messages: Message[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(storageKey(chartId), JSON.stringify(messages));
  } catch {
    // 超出配额或隐私模式 — 忽略
  }
}

function clearMessages(chartId: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(storageKey(chartId));
  } catch {
    // ignore
  }
}

export default function ChatClient({ chartId }: { chartId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoStartedRef = useRef(false);

  // 初次挂载:从 localStorage 恢复会话
  useEffect(() => {
    const restored = loadMessages(chartId);
    setMessages(restored);
    setLoaded(true);
  }, [chartId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = useCallback(async (userMessage: string) => {
    if (streaming) return;
    const newUserMsg: Message = { role: 'user', content: userMessage };
    const historyToSend = messages;
    setMessages((prev) => [...prev, newUserMsg, { role: 'assistant', content: '' }]);
    setInput('');
    setStreaming(true);

    let finalAssistant = '';
    try {
      const resp = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chartId, message: userMessage, history: historyToSend }),
      });
      if (!resp.ok || !resp.body) {
        const err = await resp.text().catch(() => 'unknown error');
        finalAssistant = `[错误] ${err}`;
        setMessages((prev) => replaceLast(prev, finalAssistant));
        return;
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let acc = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf('\n\n')) >= 0) {
          const chunk = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          for (const line of chunk.split('\n')) {
            if (!line.startsWith('data:')) continue;
            const payload = line.slice(5).trim();
            if (payload === '[DONE]') continue;
            try {
              const obj = JSON.parse(payload);
              if (obj.delta) {
                acc += obj.delta;
                setMessages((prev) => replaceLast(prev, acc));
              } else if (obj.error) {
                acc += `\n\n[错误] ${obj.error}`;
                setMessages((prev) => replaceLast(prev, acc));
              }
            } catch {
              // ignore
            }
          }
        }
      }
      finalAssistant = acc;
    } catch (err) {
      finalAssistant = `[请求失败] ${err instanceof Error ? err.message : String(err)}`;
      setMessages((prev) => replaceLast(prev, finalAssistant));
    } finally {
      setStreaming(false);
      // 仅在流式结束后持久化,避免半截消息
      setMessages((prev) => {
        const final = replaceLast(prev, finalAssistant);
        saveMessages(chartId, final);
        return final;
      });
    }
  }, [chartId, messages, streaming]);

  // 首次无历史时自动触发全景解读;已有历史则跳过
  useEffect(() => {
    if (!loaded) return;
    if (autoStartedRef.current) return;
    if (messages.length > 0) return;
    autoStartedRef.current = true;
    send('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  const resetConversation = () => {
    if (streaming) return;
    if (!confirm('确定要清空当前对话,重新解读吗?')) return;
    clearMessages(chartId);
    setMessages([]);
    autoStartedRef.current = false;
    // 触发新的 auto-start
    setLoaded(false);
    setTimeout(() => setLoaded(true), 0);
  };

  return (
    <div className="border border-bazi-gold/40 rounded bg-white flex flex-col h-[70vh]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-bazi-gold/20 bg-bazi-paper text-xs text-bazi-ink/70">
        <span>
          {messages.length === 0
            ? (loaded ? '准备开始…' : '加载会话…')
            : `已保存 ${messages.filter((m) => m.role === 'assistant' && m.content).length} 轮解读 · 关闭浏览器后仍可恢复`}
        </span>
        <button
          type="button"
          onClick={resetConversation}
          disabled={streaming || messages.length === 0}
          className="text-bazi-red/80 hover:text-bazi-red disabled:opacity-40 disabled:cursor-not-allowed"
        >
          重新解读
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : ''}>
            <div className={m.role === 'user'
              ? 'max-w-[80%] bg-bazi-red text-white rounded-lg px-4 py-2 text-sm'
              : 'max-w-[90%] bg-bazi-paper border border-bazi-gold/30 rounded-lg px-4 py-3 text-sm'
            }>
              {m.role === 'assistant' ? (
                <article className="prose prose-sm max-w-none text-bazi-ink">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content || '…'}</ReactMarkdown>
                </article>
              ) : (
                <span className="whitespace-pre-wrap">{m.content}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); if (input.trim()) send(input.trim()); }}
        className="border-t border-bazi-gold/20 p-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={streaming ? '正在回复中,请稍候…' : '追问命盘中的任意维度(事业/感情/健康/大运)'}
          disabled={streaming}
          className="flex-1 border border-bazi-gold/40 rounded px-3 py-2 text-sm"
        />
        <button type="submit" disabled={streaming || !input.trim()}
          className="bg-bazi-red text-white px-4 py-2 rounded text-sm disabled:opacity-50">
          发送
        </button>
      </form>
    </div>
  );
}

function replaceLast(list: Message[], content: string): Message[] {
  if (list.length === 0) return list;
  return [...list.slice(0, -1), { ...list[list.length - 1]!, content }];
}
