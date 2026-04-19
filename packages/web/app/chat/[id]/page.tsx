import { calculateBazi } from '@bazi/engine';
import { decodeBaziId } from '@/lib/encode';
import ChatClient from '@/components/ChatClient';
import Link from 'next/link';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ChatPage({ params }: Props) {
  const { id } = await params;
  let chart;
  try {
    chart = calculateBazi(decodeBaziId(id));
  } catch {
    return (
      <div className="text-center py-20 text-bazi-red">
        <p>无效的 chart id</p>
        <Link href="/" className="text-bazi-red underline mt-4 inline-block">回到首页</Link>
      </div>
    );
  }

  const p = chart.fourPillars;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-kai text-2xl font-bold text-bazi-red">
            {p.year.stem}{p.year.branch} {p.month.stem}{p.month.branch} {p.day.stem}{p.day.branch} {p.hour.stem}{p.hour.branch}
          </h1>
          <div className="text-xs text-bazi-ink/60">
            {chart.pattern} · {chart.wuxing.dayMasterStrength === 'strong' ? '身强' :
              chart.wuxing.dayMasterStrength === 'weak' ? '身弱' : '中和'}
          </div>
        </div>
        <Link href={`/chart/${id}`} className="text-sm text-bazi-red underline">← 看排盘</Link>
      </div>

      <ChatClient chartId={id} />
    </div>
  );
}
