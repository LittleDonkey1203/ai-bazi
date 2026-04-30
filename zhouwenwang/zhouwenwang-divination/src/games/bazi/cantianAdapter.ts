/**
 * Adapted from cantian-ai/bazi-mcp.
 * Keeps the integration local so the app can reuse the open-source engine
 * without importing TS sources outside the project.
 */

import { calculateRelation, getShen } from 'cantian-tymext';
import { toDate, toZonedTime } from 'date-fns-tz';
import {
  ChildLimit,
  DefaultEightCharProvider,
  EightChar,
  type Gender,
  HeavenStem,
  LunarHour,
  LunarSect2EightCharProvider,
  SixtyCycle,
  SolarTerm,
  SolarTime,
} from 'tyme4ts';

const SHANGHAI_OFFSET = '+08:00';
const eightCharProvider1 = new DefaultEightCharProvider();
const eightCharProvider2 = new LunarSect2EightCharProvider();

export interface CantianHiddenStem {
  天干: string;
  十神: string;
}

export interface CantianPillarStem {
  天干: string;
  五行: string;
  阴阳: string;
  十神?: string;
}

export interface CantianPillarBranch {
  地支: string;
  五行: string;
  阴阳: string;
  藏干?: {
    主气?: CantianHiddenStem;
    中气?: CantianHiddenStem;
    余气?: CantianHiddenStem;
  };
}

export interface CantianPillarDetail {
  天干: CantianPillarStem;
  地支: CantianPillarBranch;
  纳音: string;
  旬: string;
  空亡: string;
  星运: string;
  自坐: string;
}

export interface CantianDecadeFortuneItem {
  干支: string;
  开始年份: number;
  结束: number;
  天干十神: string;
  地支十神: string[];
  地支藏干: string[];
  开始年龄: number;
  结束年龄: number;
}

export interface CantianDecadeFortune {
  起运日期: string;
  起运年龄: number;
  大运: CantianDecadeFortuneItem[];
}

export interface CantianGods {
  年柱: string[];
  月柱: string[];
  日柱: string[];
  时柱: string[];
}

export interface CantianBaziDetail {
  性别: '男' | '女';
  阳历: string;
  农历: string;
  八字: string;
  生肖: string;
  日主: string;
  年柱: CantianPillarDetail;
  月柱: CantianPillarDetail;
  日柱: CantianPillarDetail;
  时柱: CantianPillarDetail;
  胎元: string;
  胎息: string;
  命宫: string;
  身宫: string;
  神煞: CantianGods;
  大运: CantianDecadeFortune;
  刑冲合会: unknown;
  solarDateIso: string;
}

export interface CantianBirthInput {
  birthDate: Date;
  birthTime: number;
  gender: '男' | '女';
  isLunar: boolean;
}

export interface CantianPillarInput {
  year: string;
  month: string;
  day: string;
  hour: string;
}

export interface CantianFourPillars {
  year: { stem: string; branch: string };
  month: { stem: string; branch: string };
  day: { stem: string; branch: string };
  hour: { stem: string; branch: string };
}

export type CantianRelationInput = Record<string, { 天干: string; 地支: string }>;

export interface CantianFlowBoundary {
  term: string;
  start: Date;
  end: Date;
  ganzhi: string;
  label: string;
}

export interface CantianSolarCandidate {
  key: string;
  date: Date;
  iso: string;
  label: string;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function normalizeBirthDate(birthDate: Date, birthTime: number): Date {
  const normalizedDate = new Date(birthDate);
  normalizedDate.setHours(birthTime);
  return normalizedDate;
}

function formatSolarDatetime(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00${SHANGHAI_OFFSET}`;
}

function formatLunarDatetime(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}

function formatLocalIsoDateTime(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}

function getSolarTime(isoDate: string): SolarTime {
  const date = toDate(isoDate);
  const zonedDate = toZonedTime(date, SHANGHAI_OFFSET);

  return SolarTime.fromYmdHms(
    zonedDate.getFullYear(),
    zonedDate.getMonth() + 1,
    zonedDate.getDate(),
    zonedDate.getHours(),
    zonedDate.getMinutes(),
    0,
  );
}

function solarTimeToDate(solarTime: SolarTime): Date {
  return new Date(
    solarTime.getYear(),
    solarTime.getMonth() - 1,
    solarTime.getDay(),
    solarTime.getHour(),
    solarTime.getMinute(),
    solarTime.getSecond(),
  );
}

function getEightCharFromSolarDate(date: Date) {
  LunarHour.provider = eightCharProvider2;
  return getSolarTime(formatSolarDatetime(date)).getLunarHour().getEightChar();
}

function buildHideHeavenObject(heavenStem: HeavenStem | null | undefined, me: HeavenStem): CantianHiddenStem | undefined {
  if (!heavenStem) {
    return undefined;
  }

  return {
    天干: heavenStem.toString(),
    十神: me.getTenStar(heavenStem).toString(),
  };
}

function buildSixtyCycleObject(sixtyCycle: SixtyCycle, me?: HeavenStem): CantianPillarDetail {
  const heavenStem = sixtyCycle.getHeavenStem();
  const earthBranch = sixtyCycle.getEarthBranch();
  const currentMe = me ?? heavenStem;

  return {
    天干: {
      天干: heavenStem.toString(),
      五行: heavenStem.getElement().toString(),
      阴阳: heavenStem.getYinYang() === 1 ? '阳' : '阴',
      十神: currentMe === heavenStem ? undefined : currentMe.getTenStar(heavenStem).toString(),
    },
    地支: {
      地支: earthBranch.toString(),
      五行: earthBranch.getElement().toString(),
      阴阳: earthBranch.getYinYang() === 1 ? '阳' : '阴',
      藏干: {
        主气: buildHideHeavenObject(earthBranch.getHideHeavenStemMain(), currentMe),
        中气: buildHideHeavenObject(earthBranch.getHideHeavenStemMiddle(), currentMe),
        余气: buildHideHeavenObject(earthBranch.getHideHeavenStemResidual(), currentMe),
      },
    },
    纳音: sixtyCycle.getSound().toString(),
    旬: sixtyCycle.getTen().toString(),
    空亡: sixtyCycle.getExtraEarthBranches().join(''),
    星运: currentMe.getTerrain(earthBranch).toString(),
    自坐: heavenStem.getTerrain(earthBranch).toString(),
  };
}

function buildGodsObject(eightCharText: string, gender: 0 | 1): CantianGods {
  const gods = getShen(eightCharText, gender);
  return {
    年柱: gods[0],
    月柱: gods[1],
    日柱: gods[2],
    时柱: gods[3],
  };
}

function buildDecadeFortuneObject(solarTime: SolarTime, gender: Gender, me: HeavenStem): CantianDecadeFortune {
  const childLimit = ChildLimit.fromSolarTime(solarTime, gender);
  const startDate = childLimit.getEndTime();

  let decadeFortune = childLimit.getStartDecadeFortune();
  const firstStartAge = decadeFortune.getStartAge();
  const decadeFortuneObjects: CantianDecadeFortuneItem[] = [];

  for (let index = 0; index < 10; index += 1) {
    const sixtyCycle = decadeFortune.getSixtyCycle();
    const heavenStem = sixtyCycle.getHeavenStem();
    const earthBranch = sixtyCycle.getEarthBranch();

    decadeFortuneObjects.push({
      干支: sixtyCycle.toString(),
      开始年份: decadeFortune.getStartSixtyCycleYear().getYear(),
      结束: decadeFortune.getEndSixtyCycleYear().getYear(),
      天干十神: me.getTenStar(heavenStem).getName(),
      地支十神: earthBranch.getHideHeavenStems().map((hideStem) => me.getTenStar(hideStem.getHeavenStem()).getName()),
      地支藏干: earthBranch.getHideHeavenStems().map((hideStem) => hideStem.toString()),
      开始年龄: decadeFortune.getStartAge(),
      结束年龄: decadeFortune.getEndAge(),
    });

    decadeFortune = decadeFortune.next(1);
  }

  return {
    起运日期: `${startDate.getYear()}-${startDate.getMonth()}-${startDate.getDay()}`,
    起运年龄: firstStartAge,
    大运: decadeFortuneObjects,
  };
}

function buildBazi(lunarHour: LunarHour, gender: 0 | 1, eightCharProviderSect: 1 | 2): CantianBaziDetail {
  LunarHour.provider = eightCharProviderSect === 2 ? eightCharProvider2 : eightCharProvider1;

  const eightChar = lunarHour.getEightChar();
  const me = eightChar.getDay().getHeavenStem();
  const solarDate = solarTimeToDate(lunarHour.getSolarTime());

  return {
    solarDateIso: formatLocalIsoDateTime(solarDate),
    性别: ['女', '男'][gender] as '男' | '女',
    阳历: lunarHour.getSolarTime().toString(),
    农历: lunarHour.toString(),
    八字: eightChar.toString(),
    生肖: eightChar.getYear().getEarthBranch().getZodiac().toString(),
    日主: me.toString(),
    年柱: buildSixtyCycleObject(eightChar.getYear(), me),
    月柱: buildSixtyCycleObject(eightChar.getMonth(), me),
    日柱: buildSixtyCycleObject(eightChar.getDay()),
    时柱: buildSixtyCycleObject(eightChar.getHour(), me),
    胎元: eightChar.getFetalOrigin().toString(),
    胎息: eightChar.getFetalBreath().toString(),
    命宫: eightChar.getOwnSign().toString(),
    身宫: eightChar.getBodySign().toString(),
    神煞: buildGodsObject(eightChar.toString(), gender),
    大运: buildDecadeFortuneObject(lunarHour.getSolarTime(), gender as Gender, me),
    刑冲合会: calculateRelation({
      年: { 天干: eightChar.getYear().getHeavenStem().toString(), 地支: eightChar.getYear().getEarthBranch().toString() },
      月: { 天干: eightChar.getMonth().getHeavenStem().toString(), 地支: eightChar.getMonth().getEarthBranch().toString() },
      日: { 天干: eightChar.getDay().getHeavenStem().toString(), 地支: eightChar.getDay().getEarthBranch().toString() },
      时: { 天干: eightChar.getHour().getHeavenStem().toString(), 地支: eightChar.getHour().getEarthBranch().toString() },
    }),
  };
}

export async function getCantianBaziDetail(input: CantianBirthInput): Promise<CantianBaziDetail> {
  const normalizedDate = normalizeBirthDate(input.birthDate, input.birthTime);
  const gender: 0 | 1 = input.gender === '男' ? 1 : 0;

  let lunarHour: LunarHour;
  if (input.isLunar) {
    lunarHour = LunarHour.fromYmdHms(
      normalizedDate.getFullYear(),
      normalizedDate.getMonth() + 1,
      normalizedDate.getDate(),
      normalizedDate.getHours(),
      normalizedDate.getMinutes(),
      normalizedDate.getSeconds(),
    );
  } else {
    lunarHour = getSolarTime(formatSolarDatetime(normalizedDate)).getLunarHour();
  }

  return buildBazi(lunarHour, gender, 2);
}

export function getCantianSolarMatchesForFourPillars(
  input: CantianPillarInput,
  startYear = 1900,
  endYear = 2099,
): CantianSolarCandidate[] {
  const eightChar = new EightChar(
    SixtyCycle.fromName(input.year),
    SixtyCycle.fromName(input.month),
    SixtyCycle.fromName(input.day),
    SixtyCycle.fromName(input.hour),
  );

  return eightChar.getSolarTimes(startYear, endYear).map((solarTime) => {
    const date = solarTimeToDate(solarTime);
    const iso = formatLocalIsoDateTime(date);

    return {
      key: iso,
      date,
      iso,
      label: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`,
    };
  });
}

export function getCantianPillarDetailFromGanzhi(ganzhi: string, dayMaster: string): CantianPillarDetail {
  const sixtyCycle = SixtyCycle.fromName(ganzhi);
  const me = HeavenStem.fromName(dayMaster);
  return buildSixtyCycleObject(sixtyCycle, me);
}

export function getCantianFourPillarsAtSolarDate(date: Date): CantianFourPillars {
  const eightChar = getEightCharFromSolarDate(date);
  return {
    year: {
      stem: eightChar.getYear().getHeavenStem().toString(),
      branch: eightChar.getYear().getEarthBranch().toString(),
    },
    month: {
      stem: eightChar.getMonth().getHeavenStem().toString(),
      branch: eightChar.getMonth().getEarthBranch().toString(),
    },
    day: {
      stem: eightChar.getDay().getHeavenStem().toString(),
      branch: eightChar.getDay().getEarthBranch().toString(),
    },
    hour: {
      stem: eightChar.getHour().getHeavenStem().toString(),
      branch: eightChar.getHour().getEarthBranch().toString(),
    },
  };
}

export function getCantianFlowYearGanzhi(year: number): string {
  const sampleDate = new Date(year, 6, 1, 12, 0, 0);
  const pillars = getCantianFourPillarsAtSolarDate(sampleDate);
  return `${pillars.year.stem}${pillars.year.branch}`;
}

export function getCantianFlowMonthBoundaries(flowYear: number): CantianFlowBoundary[] {
  const firstTerm = SolarTerm.fromName(flowYear, '立春');

  return Array.from({ length: 12 }, (_, index) => {
    const currentTerm = firstTerm.next(index * 2);
    const nextTerm = currentTerm.next(2);
    const startDate = solarTimeToDate(currentTerm.getJulianDay().getSolarTime());
    const endDate = solarTimeToDate(nextTerm.getJulianDay().getSolarTime());
    const sampleDate = new Date(startDate.getTime() + 60 * 1000);
    const pillars = getCantianFourPillarsAtSolarDate(sampleDate);

    return {
      term: currentTerm.toString(),
      start: startDate,
      end: endDate,
      ganzhi: `${pillars.month.stem}${pillars.month.branch}`,
      label: `${currentTerm.toString()}月`,
    };
  });
}

export function getCantianExtraGods(
  eightCharText: string,
  gender: '男' | '女',
  extraGanzhi: string[],
): string[][] {
  if (extraGanzhi.length === 0) {
    return [];
  }

  const genderValue: 0 | 1 = gender === '男' ? 1 : 0;
  return getShen(eightCharText, genderValue, extraGanzhi).slice(4);
}

export function calculateCantianRelationSummary(input: CantianRelationInput) {
  return calculateRelation(input);
}

export function getFourPillarsFromCantian(detail: CantianBaziDetail): CantianFourPillars {
  return {
    year: {
      stem: detail.年柱.天干.天干,
      branch: detail.年柱.地支.地支,
    },
    month: {
      stem: detail.月柱.天干.天干,
      branch: detail.月柱.地支.地支,
    },
    day: {
      stem: detail.日柱.天干.天干,
      branch: detail.日柱.地支.地支,
    },
    hour: {
      stem: detail.时柱.天干.天干,
      branch: detail.时柱.地支.地支,
    },
  };
}

export function getWuxingAnalysisFromCantian(detail: CantianBaziDetail): Record<string, number> {
  const wuxingCount: Record<string, number> = {
    金: 0,
    木: 0,
    水: 0,
    火: 0,
    土: 0,
  };

  [detail.年柱, detail.月柱, detail.日柱, detail.时柱].forEach((pillar) => {
    if (pillar.天干.五行 in wuxingCount) {
      wuxingCount[pillar.天干.五行] += 1;
    }
    if (pillar.地支.五行 in wuxingCount) {
      wuxingCount[pillar.地支.五行] += 1;
    }
  });

  return wuxingCount;
}
