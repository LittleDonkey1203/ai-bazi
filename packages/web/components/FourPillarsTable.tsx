import type { BaziChart } from '@bazi/engine';

export default function FourPillarsTable({ chart }: { chart: BaziChart }) {
  const pillars = ['year', 'month', 'day', 'hour'] as const;
  const headers = ['年柱', '月柱', '日柱', '时柱'];
  const p = chart.fourPillars;

  return (
    <div className="grid grid-cols-4 gap-0 border border-bazi-gold/30 rounded overflow-hidden">
      {headers.map((h, i) => (
        <div key={i} className="bg-bazi-red/90 text-white text-center py-2 font-kai">{h}</div>
      ))}
      {pillars.map((pos) => (
        <div key={`stem-${pos}`} className="bazi-cell py-4">
          <div className="bazi-stem">{p[pos].stem}</div>
          <div className="text-xs text-bazi-ink/60 mt-1">{p[pos].stemElement}</div>
          {pos !== 'day' && p[pos].tenGod && (
            <div className="text-xs text-bazi-ink/70 mt-1">{p[pos].tenGod}</div>
          )}
          {pos === 'day' && <div className="text-xs text-bazi-red mt-1">日主</div>}
        </div>
      ))}
      {pillars.map((pos) => (
        <div key={`branch-${pos}`} className="bazi-cell py-4">
          <div className="bazi-branch">{p[pos].branch}</div>
          <div className="text-xs text-bazi-ink/60 mt-1">{p[pos].branchElement}</div>
        </div>
      ))}
      {pillars.map((pos) => (
        <div key={`hidden-${pos}`} className="bazi-cell text-xs py-3">
          <div className="font-bold text-bazi-ink/70 mb-1">藏干</div>
          {p[pos].hiddenStems.map((h, i) => (
            <div key={i} className="text-bazi-ink/80">
              {h.stem}{h.tenGod && <span className="text-bazi-ink/60">({h.tenGod})</span>}
            </div>
          ))}
        </div>
      ))}
      {pillars.map((pos) => (
        <div key={`nayin-${pos}`} className="bazi-cell text-xs py-2">
          <div className="text-bazi-ink/60">{p[pos].nayin}</div>
        </div>
      ))}
    </div>
  );
}
