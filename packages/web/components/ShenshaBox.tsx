import type { ShenShaTable } from '@bazi/engine';

export default function ShenshaBox({ shensha }: { shensha: ShenShaTable }) {
  const rows: Array<[string, string[]]> = [
    ['年柱', shensha.year],
    ['月柱', shensha.month],
    ['日柱', shensha.day],
    ['时柱', shensha.hour],
  ];
  return (
    <div className="bg-bazi-paper border border-bazi-gold/30 rounded p-4 space-y-2">
      {rows.map(([label, tags]) => (
        <div key={label} className="flex items-start gap-2 text-sm">
          <div className="w-12 text-bazi-ink/70 font-bold">{label}</div>
          <div className="flex-1 flex flex-wrap gap-1">
            {tags.length === 0 ? (
              <span className="text-bazi-ink/40 text-xs">—</span>
            ) : (
              tags.map((t, i) => (
                <span key={i} className="px-2 py-0.5 bg-bazi-gold/20 text-xs rounded text-bazi-ink/80">
                  {t}
                </span>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
