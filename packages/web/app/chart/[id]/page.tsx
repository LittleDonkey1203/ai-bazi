import { calculateBazi } from '@bazi/engine';
import { decodeBaziId } from '@/lib/encode';
import FourPillarsTable from '@/components/FourPillarsTable';
import WuxingBars from '@/components/WuxingBars';
import DayunTimeline from '@/components/DayunTimeline';
import RelationsList from '@/components/RelationsList';
import ShenshaBox from '@/components/ShenshaBox';
import Link from 'next/link';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ChartPage({ params }: Props) {
  const { id } = await params;
  let chart;
  try {
    const input = decodeBaziId(id);
    chart = calculateBazi(input);
  } catch (err) {
    return (
      <div className="text-center py-20 text-bazi-red">
        <p>排盘 id 解析失败:{err instanceof Error ? err.message : String(err)}</p>
        <Link href="/" className="text-bazi-red underline mt-4 inline-block">回到首页</Link>
      </div>
    );
  }

  const { input, fourPillars, wuxing, pattern, kongwang, mingGong, taiYuan, chengGu } = chart;
  const gender = input.gender === 'male' ? '男' : '女';
  const minute = input.minute ?? 0;

  return (
    <div className="space-y-8">
      <section className="flex items-center justify-between">
        <div>
          <h1 className="font-kai text-3xl font-bold text-bazi-red">
            {fourPillars.year.stem}{fourPillars.year.branch}{' '}
            {fourPillars.month.stem}{fourPillars.month.branch}{' '}
            {fourPillars.day.stem}{fourPillars.day.branch}{' '}
            {fourPillars.hour.stem}{fourPillars.hour.branch}
          </h1>
          <p className="text-sm text-bazi-ink/60 mt-1">
            公历 {input.year}-{String(input.month).padStart(2, '0')}-{String(input.day).padStart(2, '0')}{' '}
            {String(input.hour).padStart(2, '0')}:{String(minute).padStart(2, '0')} · {gender}
          </p>
        </div>
        <Link href={`/chat/${id}`}
          className="bg-bazi-red text-white px-5 py-2 rounded font-kai text-lg hover:bg-bazi-red/90 transition">
          AI 解读 →
        </Link>
      </section>

      <section>
        <h2 className="font-kai text-xl font-bold mb-3 border-l-4 border-bazi-gold pl-2">四柱</h2>
        <FourPillarsTable chart={chart} />
      </section>

      <section className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="font-kai text-xl font-bold mb-3 border-l-4 border-bazi-gold pl-2">格局 · 强弱</h2>
          <div className="bg-bazi-paper border border-bazi-gold/30 rounded p-4 space-y-2">
            <div>格局:<span className="font-kai text-lg font-bold text-bazi-red">{pattern}</span></div>
            <div>日主:<span className={
              wuxing.dayMasterStrength === 'strong' ? 'text-green-700' :
              wuxing.dayMasterStrength === 'weak' ? 'text-orange-700' : 'text-gray-700'
            }>
              {wuxing.dayMasterStrength === 'strong' ? '身强' :
               wuxing.dayMasterStrength === 'weak' ? '身弱' : '中和'}
            </span></div>
            {wuxing.favorableElements.length > 0 && (
              <div>喜用:<span className="text-green-700">{wuxing.favorableElements.join('、')}</span></div>
            )}
            {wuxing.unfavorableElements.length > 0 && (
              <div>忌神:<span className="text-orange-700">{wuxing.unfavorableElements.join('、')}</span></div>
            )}
          </div>
        </div>
        <div>
          <h2 className="font-kai text-xl font-bold mb-3 border-l-4 border-bazi-gold pl-2">五行统计</h2>
          <WuxingBars counts={wuxing.counts} />
        </div>
      </section>

      <section>
        <h2 className="font-kai text-xl font-bold mb-3 border-l-4 border-bazi-gold pl-2">大运</h2>
        <DayunTimeline dayun={chart.dayun} />
      </section>

      <section className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="font-kai text-xl font-bold mb-3 border-l-4 border-bazi-gold pl-2">刑冲合害破</h2>
          <RelationsList relations={chart.relations} />
        </div>
        <div>
          <h2 className="font-kai text-xl font-bold mb-3 border-l-4 border-bazi-gold pl-2">神煞</h2>
          <ShenshaBox shensha={chart.shensha} />
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        <InfoCard title="空亡" content={
          <>
            <div>日空:{kongwang.dayKong.join('、')}</div>
            <div>年空:{kongwang.yearKong.join('、')}</div>
          </>
        } />
        <InfoCard title="命宫 / 胎元" content={
          <>
            <div>命宫:{mingGong.stem}{mingGong.branch}</div>
            <div>胎元:{taiYuan.stem}{taiYuan.branch}</div>
          </>
        } />
        <InfoCard title="称骨" content={
          <>
            <div className="text-lg font-bold text-bazi-red">{chengGu.weight}</div>
            {chengGu.description && (
              <div className="text-xs text-bazi-ink/70 mt-2 leading-relaxed">{chengGu.description}</div>
            )}
          </>
        } />
      </section>
    </div>
  );
}

function InfoCard({ title, content }: { title: string; content: React.ReactNode }) {
  return (
    <div className="bg-bazi-paper border border-bazi-gold/30 rounded p-4">
      <div className="text-sm font-bold mb-2 text-bazi-ink/80">{title}</div>
      <div className="text-sm space-y-1">{content}</div>
    </div>
  );
}
