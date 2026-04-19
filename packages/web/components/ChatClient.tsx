'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatClient({ chartId }: { chartId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = async (userMessage: string) => {
    if (streaming) return;
    const newUserMsg: Message = { role: 'user', content: userMessage };
    const historyToSend = messages;
    setMessages((prev) => [...prev, newUserMsg, { role: 'assistant', content: '' }]);
    setInput('');
    setStreaming(true);

    try {
      const resp = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chartId, message: userMessage, history: historyToSend }),
      });
      if (!resp.ok || !resp.body) {
        const err = await resp.text().catch(() => 'unknown error');
        setMessages((prev) => replaceLast(prev, `[错误] ${err}`));
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
    } catch (err) {
      setMessages((prev) => replaceLast(prev, `[请求失败] ${err instanceof Error ? err.message : String(err)}`));
    } finally {
      setStreaming(false);
    }
  };

  // 首次进入自动请求全景解读
  useEffect(() => {
    if (messages.length === 0) send('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="border border-bazi-gold/40 rounded bg-white flex flex-col h-[70vh]">
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
