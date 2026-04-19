import type { WuXing } from '@bazi/engine';

const COLORS: Record<WuXing, string> = {
  '金': 'bg-yellow-500',
  '木': 'bg-green-600',
  '水': 'bg-blue-600',
  '火': 'bg-red-600',
  '土': 'bg-amber-700',
};

export default function WuxingBars({ counts }: { counts: Record<WuXing, number> }) {
  const max = Math.max(...Object.values(counts));
  return (
    <div className="bg-bazi-paper border border-bazi-gold/30 rounded p-4 space-y-2">
      {(['金', '木', '水', '火', '土'] as WuXing[]).map((el) => {
        const c = counts[el];
        const pct = max === 0 ? 0 : (c / max) * 100;
        return (
          <div key={el} className="flex items-center gap-2">
            <div className="w-6 text-center font-kai font-bold">{el}</div>
            <div className="flex-1 h-5 bg-gray-200 rounded relative">
              <div className={`h-full rounded ${COLORS[el]}`} style={{ width: `${pct}%` }} />
            </div>
            <div className="w-8 text-right text-sm">{c}</div>
          </div>
        );
      })}
    </div>
  );
}
