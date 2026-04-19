import type { DaYun } from '@bazi/engine';

export default function DayunTimeline({ dayun }: { dayun: DaYun[] }) {
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-2 min-w-max pb-2">
        {dayun.map((d) => (
          <div key={d.index}
            className="flex-shrink-0 w-24 border border-bazi-gold/30 bg-bazi-paper rounded p-2 text-center">
            <div className="text-xs text-bazi-ink/50">{d.startYear}</div>
            <div className="text-xs text-bazi-ink/70">{d.startAge}-{d.endAge} 岁</div>
            <div className="font-kai text-lg font-bold text-bazi-red my-1">{d.ganZhi}</div>
            <div className="text-xs text-bazi-ink/70">{d.tenGod}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
