import BaziInputForm from '@/components/BaziInputForm';

export default function HomePage() {
  return (
    <div>
      <section className="text-center mb-10">
        <h1 className="font-kai text-4xl font-bold text-bazi-red mb-3">
          八字排盘 · AI 解读
        </h1>
        <p className="text-bazi-ink/70">
          确定性引擎排盘 + Gemini 3 Pro 命理师解读 · 输入生辰开始
        </p>
      </section>

      <section className="max-w-2xl mx-auto border border-bazi-gold/40 bg-bazi-paper rounded-lg p-6 shadow-sm">
        <BaziInputForm />
      </section>

      <section className="mt-10 max-w-2xl mx-auto text-sm text-bazi-ink/60 space-y-2">
        <p>
          <span className="font-bold text-bazi-ink">排盘准确度:</span>{' '}
          四柱、十神、藏干、纳音、大运、流年、空亡、神煞、命宫、胎元、格局、日主强弱 等全部
          基于确定性算法,经问真八字交叉验证。
        </p>
        <p>
          <span className="font-bold text-bazi-ink">AI 解读:</span>{' '}
          Gemini 3 Pro 命理师人设,基于排盘数据输出;不做绝对化断言,不代替专业建议。
        </p>
      </section>
    </div>
  );
}
