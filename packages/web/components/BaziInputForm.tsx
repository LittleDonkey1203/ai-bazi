'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { encodeBaziId } from '@/lib/encode';

const HOUR_OPTIONS = [
  { label: '子时 (23:00-00:59)', hour: 23, minute: 0 },
  { label: '丑时 (01:00-02:59)', hour: 1, minute: 0 },
  { label: '寅时 (03:00-04:59)', hour: 3, minute: 0 },
  { label: '卯时 (05:00-06:59)', hour: 5, minute: 0 },
  { label: '辰时 (07:00-08:59)', hour: 7, minute: 0 },
  { label: '巳时 (09:00-10:59)', hour: 9, minute: 0 },
  { label: '午时 (11:00-12:59)', hour: 11, minute: 0 },
  { label: '未时 (13:00-14:59)', hour: 13, minute: 0 },
  { label: '申时 (15:00-16:59)', hour: 15, minute: 0 },
  { label: '酉时 (17:00-18:59)', hour: 17, minute: 0 },
  { label: '戌时 (19:00-20:59)', hour: 19, minute: 0 },
  { label: '亥时 (21:00-22:59)', hour: 21, minute: 0 },
];

export default function BaziInputForm() {
  const router = useRouter();
  const [year, setYear] = useState(1990);
  const [month, setMonth] = useState(8);
  const [day, setDay] = useState(15);
  const [hourIdx, setHourIdx] = useState(7);
  const [useExact, setUseExact] = useState(false);
  const [exactHour, setExactHour] = useState(14);
  const [exactMinute, setExactMinute] = useState(30);
  const [gender, setGender] = useState<'male' | 'female'>('male');

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hm = useExact
      ? { hour: exactHour, minute: exactMinute }
      : HOUR_OPTIONS[hourIdx]!;
    const id = encodeBaziId({ year, month, day, ...hm, gender });
    router.push(`/chart/${id}`);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-bold mb-1">公历生日</label>
        <div className="flex gap-2">
          <input type="number" min="1900" max="2100" value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="flex-1 border border-bazi-gold/40 rounded px-3 py-2" />
          <input type="number" min="1" max="12" value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="flex-1 border border-bazi-gold/40 rounded px-3 py-2" />
          <input type="number" min="1" max="31" value={day}
            onChange={(e) => setDay(Number(e.target.value))}
            className="flex-1 border border-bazi-gold/40 rounded px-3 py-2" />
        </div>
        <div className="text-xs text-bazi-ink/50 mt-1">年 / 月 / 日(1900-2100)</div>
      </div>

      <div>
        <label className="block text-sm font-bold mb-1">出生时辰</label>
        {!useExact ? (
          <select value={hourIdx} onChange={(e) => setHourIdx(Number(e.target.value))}
            className="w-full border border-bazi-gold/40 rounded px-3 py-2">
            {HOUR_OPTIONS.map((o, i) => (
              <option key={i} value={i}>{o.label}</option>
            ))}
          </select>
        ) : (
          <div className="flex gap-2">
            <input type="number" min="0" max="23" value={exactHour}
              onChange={(e) => setExactHour(Number(e.target.value))}
              className="flex-1 border border-bazi-gold/40 rounded px-3 py-2" />
            <input type="number" min="0" max="59" value={exactMinute}
              onChange={(e) => setExactMinute(Number(e.target.value))}
              className="flex-1 border border-bazi-gold/40 rounded px-3 py-2" />
          </div>
        )}
        <label className="flex items-center gap-2 text-xs text-bazi-ink/60 mt-2">
          <input type="checkbox" checked={useExact}
            onChange={(e) => setUseExact(e.target.checked)} />
          我知道精确的出生时分(24 小时制)
        </label>
      </div>

      <div>
        <label className="block text-sm font-bold mb-1">性别</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input type="radio" name="gender" value="male"
              checked={gender === 'male'} onChange={() => setGender('male')} />
            男
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="gender" value="female"
              checked={gender === 'female'} onChange={() => setGender('female')} />
            女
          </label>
        </div>
      </div>

      <button type="submit"
        className="w-full bg-bazi-red text-white font-kai text-lg py-3 rounded hover:bg-bazi-red/90 transition">
        开始排盘
      </button>
    </form>
  );
}
