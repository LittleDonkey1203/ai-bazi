import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '八字 AI · Bazi AI',
  description: '基于确定性排盘引擎 + Gemini 3 Pro 的八字解读工具',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen">
        <header className="border-b border-bazi-gold/40 bg-bazi-paper">
          <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
            <a href="/" className="font-kai text-2xl font-bold text-bazi-red">
              八字 AI
            </a>
            <nav className="text-sm text-bazi-ink/70">
              <span>排盘 · 解读 · 对话</span>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="mt-16 border-t border-bazi-gold/20 py-6 text-center text-xs text-bazi-ink/50">
          AI 解读仅供参考 · 不构成任何医疗、法律、金融建议
        </footer>
      </body>
    </html>
  );
}
