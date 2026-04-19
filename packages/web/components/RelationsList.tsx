import type { Relation } from '@bazi/engine';

const COLORS: Record<string, string> = {
  '冲': 'text-red-700 bg-red-50',
  '刑': 'text-orange-700 bg-orange-50',
  '害': 'text-purple-700 bg-purple-50',
  '破': 'text-amber-700 bg-amber-50',
  '六合': 'text-green-700 bg-green-50',
  '三合': 'text-emerald-700 bg-emerald-50',
  '三会': 'text-teal-700 bg-teal-50',
  '半合': 'text-blue-700 bg-blue-50',
  '暗合': 'text-indigo-700 bg-indigo-50',
  '自刑': 'text-rose-700 bg-rose-50',
};

export default function RelationsList({ relations }: { relations: Relation[] }) {
  if (relations.length === 0) {
    return (
      <div className="bg-bazi-paper border border-bazi-gold/30 rounded p-4 text-sm text-bazi-ink/50">
        无明显刑冲合害关系
      </div>
    );
  }
  return (
    <div className="bg-bazi-paper border border-bazi-gold/30 rounded p-4 space-y-1">
      {relations.map((r, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className={`px-2 py-0.5 rounded text-xs ${COLORS[r.type] ?? 'text-gray-700 bg-gray-100'}`}>
            {r.type}
          </span>
          <span className="text-bazi-ink/80">{r.description}</span>
        </div>
      ))}
    </div>
  );
}
