import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  generateBaZiChart, 
  formatBaZiChart, 
  getGanZhiWuxing,
  getWuxingColor,
  getTimeRangeByHour,
  type BaZiChartData,
  type BirthInfo
} from './logic';
import { getAIConversationAnalysisStream } from '../../masters/service';
import { addRecord } from '../../core/history';
import { useMaster, useUI } from '../../core/store';
import { StreamingMarkdown, ErrorToast, useAutoScroll } from '../../components/common';
import { getVideoPath } from '../../utils/resources';
import { TIME_SLOTS } from '../../utils/ganzhiUtils';
import {
  calculateCantianRelationSummary,
  getCantianBaziDetail,
  getCantianExtraGods,
  getCantianFlowMonthBoundaries,
  getCantianFlowYearGanzhi,
  getCantianFourPillarsAtSolarDate,
  getCantianPillarDetailFromGanzhi,
  getCantianSolarMatchesForFourPillars,
  type CantianSolarCandidate,
} from './cantianAdapter';
import type { DivinationRecord } from '../../types';
import {
  appendBaziChatMessage,
  buildBaziChatContents,
  clearBaziChatSession,
  getBaziChatSession,
  getBaziMemorySummary,
  saveBaziChatSession,
  type BaziChatSession,
} from './chatMemory';
import {
  deleteBaziCase,
  getBaziCases,
  saveBaziCase,
  type BaziCaseRecord,
  type BaziInputMode,
  type BaziLunarInput,
  type BaziPillarInput,
} from './caseStorage';
import {
  buildBaziAiBridgeFocusV3,
  buildBlindThreePassActionFocusV3,
} from './advancedAnalysis';
import {
  buildYongShenStageAnalysis,
  formatYongShenV2Elements,
  formatYongShenV2Scores,
} from './yongshenV2Analysis';

type PillarName = '年柱' | '月柱' | '日柱' | '时柱';
type HiddenStemName = '主气' | '中气' | '余气';
type HiddenStemValue = {
  天干: string;
  十神: string;
};

type RelationItem = {
  柱: string;
  知识点: string;
  元素?: string;
};

type RelationGroup = Record<string, RelationItem[]>;
type RelationSection = {
  天干?: RelationGroup;
  地支?: RelationGroup;
};
type RelationSummary = Partial<Record<string, RelationSection>>;

type MatrixColumn = {
  key: string;
  title: string;
  subtitle?: string;
  stemTenGod?: string;
  stem: string;
  stemWuxing: string;
  stemYinyang: string;
  branch: string;
  branchWuxing: string;
  branchYinyang: string;
  hiddenStems: Partial<Record<HiddenStemName, HiddenStemValue>>;
  nayin?: string;
  xun?: string;
  kongwang?: string;
  xingyun?: string;
  zizuo?: string;
  gods: string[];
  relations: string[];
};

type FlowYearOption = {
  key: string;
  year: number;
  age: number;
  ganzhi: string;
  label: string;
};

type FlowMonthOption = {
  key: string;
  startDate: Date;
  endDate: Date;
  term: string;
  representativeDate: Date;
  ganzhi: string;
  label: string;
};

type FlowDayOption = {
  key: string;
  date: Date;
  ganzhi: string;
  label: string;
};

type FlowHourOption = {
  hour: number;
  ganzhi: string;
  label: string;
  range: string;
  slotName: string;
};

type InputPreview = {
  solarText: string;
  lunarText: string;
  baziText: string;
  note?: string;
};

type ConsultTriggerOptions = {
  userMessage?: string;
  focusQuestion?: string;
  activeFocus?: string;
};

const hiddenStemLabels: Record<HiddenStemName, string> = {
  主气: '主气',
  中气: '中气',
  余气: '余气',
};

const relationAreaLabels = {
  天干: '天干关系',
  地支: '地支关系',
} as const;

const stemYinYangMap: Record<string, '阳' | '阴'> = {
  甲: '阳',
  乙: '阴',
  丙: '阳',
  丁: '阴',
  戊: '阳',
  己: '阴',
  庚: '阳',
  辛: '阴',
  壬: '阳',
  癸: '阴',
};

const branchYinYangMap: Record<string, '阳' | '阴'> = {
  子: '阳',
  丑: '阴',
  寅: '阳',
  卯: '阴',
  辰: '阳',
  巳: '阴',
  午: '阳',
  未: '阴',
  申: '阳',
  酉: '阴',
  戌: '阳',
  亥: '阴',
};

const branchHiddenStemMap: Record<string, string[]> = {
  子: ['癸'],
  丑: ['己', '癸', '辛'],
  寅: ['甲', '丙', '戊'],
  卯: ['乙'],
  辰: ['戊', '乙', '癸'],
  巳: ['丙', '庚', '戊'],
  午: ['丁', '己'],
  未: ['己', '丁', '乙'],
  申: ['庚', '壬', '戊'],
  酉: ['辛'],
  戌: ['戊', '辛', '丁'],
  亥: ['壬', '甲'],
};

const wuxingGenerateMap: Record<string, string> = {
  木: '火',
  火: '土',
  土: '金',
  金: '水',
  水: '木',
};

const wuxingControlMap: Record<string, string> = {
  木: '土',
  火: '金',
  土: '水',
  金: '木',
  水: '火',
};

function splitGanZhi(ganzhi: string) {
  return {
    stem: ganzhi.charAt(0),
    branch: ganzhi.charAt(1),
  };
}

function getStemTenGod(dayMaster: string, targetStem: string): string {
  const selfElement = getGanZhiWuxing(dayMaster);
  const targetElement = getGanZhiWuxing(targetStem);
  const isSamePolarity = stemYinYangMap[dayMaster] === stemYinYangMap[targetStem];

  if (selfElement === targetElement) {
    return isSamePolarity ? '比肩' : '劫财';
  }

  if (wuxingGenerateMap[targetElement] === selfElement) {
    return isSamePolarity ? '偏印' : '正印';
  }

  if (wuxingGenerateMap[selfElement] === targetElement) {
    return isSamePolarity ? '食神' : '伤官';
  }

  if (wuxingControlMap[targetElement] === selfElement) {
    return isSamePolarity ? '七杀' : '正官';
  }

  if (wuxingControlMap[selfElement] === targetElement) {
    return isSamePolarity ? '偏财' : '正财';
  }

  return '—';
}

function buildHiddenStems(dayMaster: string, stems: string[]): Partial<Record<HiddenStemName, HiddenStemValue>> {
  const keys: HiddenStemName[] = ['主气', '中气', '余气'];
  return keys.reduce<Partial<Record<HiddenStemName, HiddenStemValue>>>((result, key, index) => {
    const stem = stems[index];
    if (stem) {
      result[key] = {
        天干: stem,
        十神: getStemTenGod(dayMaster, stem),
      };
    }
    return result;
  }, {});
}

function formatRelationLines(groups: Array<{ area: keyof typeof relationAreaLabels; type: string; items: RelationItem[] }>): string[] {
  return groups.flatMap(({ area, type, items }) =>
    items.map((item) => `${relationAreaLabels[area]}·${type}：${item.知识点}`)
  );
}

function buildRelationLinesByKey(summary: RelationSummary, keys: string[]): Record<string, string[]> {
  return keys.reduce<Record<string, string[]>>((result, key) => {
    const section = summary[key];
    const groups = (['天干', '地支'] as const).flatMap((area) => {
      const areaGroup = section?.[area];
      if (!areaGroup) {
        return [];
      }

      return Object.entries(areaGroup)
        .filter(([, items]) => Array.isArray(items) && items.length > 0)
        .map(([type, items]) => ({
          area,
          type,
          items: items as RelationItem[],
        }));
    });

    result[key] = formatRelationLines(groups);
    return result;
  }, {});
}

function buildNatalMatrixColumn(
  key: PillarName,
  detail: BaZiChartData['rawBaziData'][PillarName],
  gods: string[],
  relations: string[],
): MatrixColumn {
  return {
    key,
    title: key,
    stemTenGod: detail.天干.十神 || (key === '日柱' ? '日主' : '—'),
    stem: detail.天干.天干,
    stemWuxing: detail.天干.五行,
    stemYinyang: detail.天干.阴阳,
    branch: detail.地支.地支,
    branchWuxing: detail.地支.五行,
    branchYinyang: detail.地支.阴阳,
    hiddenStems: detail.地支.藏干 || {},
    nayin: detail.纳音,
    xun: detail.旬,
    kongwang: detail.空亡,
    xingyun: detail.星运,
    zizuo: detail.自坐,
    gods,
    relations,
  };
}

function buildFortuneMatrixColumn(
  item: BaZiChartData['decadeFortune']['大运'][number],
  dayMaster: string,
): MatrixColumn {
  const detail = getCantianPillarDetailFromGanzhi(item.干支, dayMaster);
  const { stem, branch } = splitGanZhi(item.干支);
  const hiddenStems = detail.地支.藏干 ? { ...detail.地支.藏干 } : buildHiddenStems(dayMaster, item.地支藏干);

  (['主气', '中气', '余气'] as const).forEach((key, index) => {
    if (hiddenStems[key] && item.地支十神[index]) {
      hiddenStems[key] = {
        天干: hiddenStems[key]!.天干,
        十神: item.地支十神[index],
      };
    }
  });

  return {
    key: `fortune-${item.干支}-${item.开始年份}`,
    title: '大运',
    subtitle: `${item.干支} · ${item.开始年份}-${item.结束}`,
    stemTenGod: item.天干十神,
    stem: detail.天干.天干 || stem,
    stemWuxing: detail.天干.五行,
    stemYinyang: detail.天干.阴阳,
    branch: detail.地支.地支 || branch,
    branchWuxing: detail.地支.五行,
    branchYinyang: detail.地支.阴阳,
    hiddenStems,
    nayin: detail.纳音,
    xun: detail.旬,
    kongwang: detail.空亡,
    xingyun: detail.星运,
    zizuo: detail.自坐,
    gods: [],
    relations: [],
  };
}

function buildFlowMatrixColumn(
  title: '流年' | '流月' | '流日' | '流时',
  subtitle: string,
  ganzhi: string,
  dayMaster: string,
): MatrixColumn {
  const detail = getCantianPillarDetailFromGanzhi(ganzhi, dayMaster);

  return {
    key: `${title}-${subtitle}-${ganzhi}`,
    title,
    subtitle: `${subtitle} · ${ganzhi}`,
    stemTenGod: detail.天干.十神 || '—',
    stem: detail.天干.天干,
    stemWuxing: detail.天干.五行,
    stemYinyang: detail.天干.阴阳,
    branch: detail.地支.地支,
    branchWuxing: detail.地支.五行,
    branchYinyang: detail.地支.阴阳,
    hiddenStems: detail.地支.藏干 || {},
    nayin: detail.纳音,
    xun: detail.旬,
    kongwang: detail.空亡,
    xingyun: detail.星运,
    zizuo: detail.自坐,
    gods: [],
    relations: [],
  };
}

function formatDateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function formatMonthDay(date: Date): string {
  return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function buildFlowDayOptionsForBoundary(boundaryStart: Date, boundaryEnd: Date): FlowDayOption[] {
  const options: FlowDayOption[] = [];
  const cursor = new Date(boundaryStart);
  cursor.setHours(0, 0, 0, 0);

  while (cursor.getTime() < boundaryEnd.getTime()) {
    const dayStart = new Date(cursor);
    const nextDayStart = new Date(cursor);
    nextDayStart.setDate(nextDayStart.getDate() + 1);

    const overlapStart = new Date(Math.max(dayStart.getTime(), boundaryStart.getTime()));
    const overlapEnd = new Date(Math.min(nextDayStart.getTime(), boundaryEnd.getTime()));

    if (overlapStart.getTime() < overlapEnd.getTime()) {
      const representativeTime = new Date(
        overlapStart.getTime() + Math.max(60 * 1000, Math.floor((overlapEnd.getTime() - overlapStart.getTime()) / 2)),
      );
      const pillars = getCantianFourPillarsAtSolarDate(representativeTime);

      options.push({
        key: formatDateKey(dayStart),
        date: representativeTime,
        ganzhi: `${pillars.day.stem}${pillars.day.branch}`,
        label: formatMonthDay(dayStart),
      });
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return options;
}

function getTimeSlotRepresentativeHour(date: Date): number {
  const currentHour = date.getHours();
  const matchedSlot = TIME_SLOTS.find((slot) => slot.hours.includes(currentHour));
  return matchedSlot ? matchedSlot.hours[0] : currentHour;
}

const selectorStepMap: Record<string, string> = {
  大运: '01',
  流年: '02',
  流月: '03',
  流日: '04',
  流时: '05',
};


function createDefaultBirthDate() {
  const defaultDate = new Date();
  defaultDate.setFullYear(1990);
  defaultDate.setMonth(0);
  defaultDate.setDate(1);
  defaultDate.setHours(12, 0, 0, 0);
  return defaultDate;
}

function createLunarInputFromDate(date: Date): BaziLunarInput {
  return {
    year: String(date.getFullYear()),
    month: String(date.getMonth() + 1),
    day: String(date.getDate()),
    hour: String(date.getHours()),
    minute: String(date.getMinutes()),
  };
}

function formatDateTimeForInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatDateTimeWithSeconds(date: Date) {
  return `${formatDateTimeForInput(date)}:00`;
}

function parseLocalDateTime(value: string) {
  return new Date(value);
}

function formatDateTimeLabel(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function getInputModeLabel(mode: BaziInputMode) {
  switch (mode) {
    case 'solar':
      return '阳历';
    case 'lunar':
      return '农历';
    case 'pillars':
      return '四柱';
    default:
      return mode;
  }
}

function formatCaseBirthLabel(record: BaziCaseRecord) {
  if (record.inputMode === 'lunar' && record.lunarInput) {
    const { year, month, day, hour, minute } = record.lunarInput;
    return `农历 ${year}年${month}月${day}日 ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  const solarValue = record.selectedPillarSolarTime || record.solarDateTime;
  if (solarValue) {
    const date = parseLocalDateTime(solarValue);
    if (!Number.isNaN(date.getTime())) {
      return formatDateTimeLabel(date);
    }
  }

  return `保存于 ${new Date(record.updatedAt).toLocaleDateString('zh-CN')}`;
}

const BaZiPage = () => {
  const [chartData, setChartData] = useState<BaZiChartData | null>(null);
  const [birthInfo, setBirthInfo] = useState<BirthInfo>({
    name: '',
    gender: '男',
    birthDate: createDefaultBirthDate(),
    isLunar: false,
    birthTime: 12
  });
  const [inputMode, setInputMode] = useState<BaziInputMode>('solar');
  const [selectedBirthTime, setSelectedBirthTime] = useState<Date>(() => createDefaultBirthDate());
  const [lunarInput, setLunarInput] = useState<BaziLunarInput>(() => createLunarInputFromDate(createDefaultBirthDate()));
  const [pillarInput, setPillarInput] = useState<BaziPillarInput>({
    year: '',
    month: '',
    day: '',
    hour: '',
  });
  const [pillarCandidates, setPillarCandidates] = useState<CantianSolarCandidate[]>([]);
  const [selectedPillarCandidateIso, setSelectedPillarCandidateIso] = useState('');
  const [savedCases, setSavedCases] = useState<BaziCaseRecord[]>([]);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [inputPreview, setInputPreview] = useState<InputPreview | null>(null);
  const [pendingBirthInfo, setPendingBirthInfo] = useState<BirthInfo | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiAnalysis, setAIAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [question, setQuestion] = useState<string>(''); // 改为问事，可选
  const [chatInput, setChatInput] = useState<string>('');
  const [streamingReply, setStreamingReply] = useState<string>('');
  const [chatSession, setChatSession] = useState<BaziChatSession | null>(null);
  const [hasPerformedDivination, setHasPerformedDivination] = useState(false);
  const fallbackTimerRef = useRef<number | null>(null);
  const generationStartedRef = useRef(false);

  const { selectedMaster } = useMaster();
  const { error, setError } = useUI();
  const navigate = useNavigate();
  const chatScrollContent = `${chatSession?.messages.map((item) => `${item.role}:${item.content}`).join('\n') || ''}\n${streamingReply}`;
  
  // 使用通用的自动滚动Hook
  const { contentRef: analysisRef } = useAutoScroll({
    isAnalyzing,
    content: chatScrollContent
  });

  const dashboardTabs = [
    { id: 'consult', label: '咨询AI' },
    { id: 'basic', label: '基本信息' },
    { id: 'fortune', label: '大运流年' },
    { id: 'annual', label: '2026年度报告' },
    { id: 'personality', label: '个性报告' },
    { id: 'deep', label: '深度报告' },
  ] as const;

  type DashboardTab = typeof dashboardTabs[number]['id'];
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>('basic');
  const [selectedFortuneIndex, setSelectedFortuneIndex] = useState<number | null>(null);
  const [selectedFlowYear, setSelectedFlowYear] = useState<number | null>(null);
  const [selectedFlowMonth, setSelectedFlowMonth] = useState<string | null>(null);
  const [selectedFlowDay, setSelectedFlowDay] = useState<string | null>(null);
  const [selectedFlowHour, setSelectedFlowHour] = useState<number | null>(null);

  useEffect(() => {
    if (chartData) {
      const now = new Date();
      const currentYear = now.getFullYear();
      const fortunes = chartData.decadeFortune.大运;
      const matchedFortuneIndex = fortunes.findIndex(
        (item) => currentYear >= item.开始年份 && currentYear <= item.结束
      );
      const defaultFortuneIndex = matchedFortuneIndex >= 0 ? matchedFortuneIndex : (fortunes.length > 0 ? 0 : null);
      const defaultFortune = defaultFortuneIndex !== null ? fortunes[defaultFortuneIndex] : null;
      const defaultFlowYear = defaultFortune
        ? (currentYear >= defaultFortune.开始年份 && currentYear <= defaultFortune.结束 ? currentYear : defaultFortune.开始年份)
        : null;
      const defaultFlowMonth = defaultFlowYear === currentYear
        ? getCantianFlowMonthBoundaries(currentYear).find(
            (item) => now.getTime() >= item.start.getTime() && now.getTime() < item.end.getTime()
          )
        : null;
      const defaultFlowDayOptions = defaultFlowMonth
        ? buildFlowDayOptionsForBoundary(defaultFlowMonth.start, defaultFlowMonth.end)
        : [];
      const defaultFlowDay = defaultFlowMonth
        ? defaultFlowDayOptions.find((item) => item.key === formatDateKey(now)) || null
        : null;

      setDashboardTab('basic');
      setSelectedFortuneIndex(defaultFortuneIndex);
      setSelectedFlowYear(defaultFlowYear);
      setSelectedFlowMonth(defaultFlowMonth ? `${defaultFlowMonth.term}-${formatDateKey(defaultFlowMonth.start)}` : null);
      setSelectedFlowDay(defaultFlowDay?.key || null);
      setSelectedFlowHour(defaultFlowDay ? getTimeSlotRepresentativeHour(now) : null);

      const restoredSession = getBaziChatSession(chartData, selectedMaster);
      const lastAssistantMessage = [...restoredSession.messages].reverse().find((item) => item.role === 'assistant');
      setChatSession(restoredSession);
      setStreamingReply('');
      setAIAnalysis(lastAssistantMessage?.content || '');
      setAnalysisComplete(Boolean(lastAssistantMessage));
      setChatInput(restoredSession.messages.length === 0 ? question.trim() : '');
    }
  }, [chartData, question, selectedMaster]);

  useEffect(() => {
    if (chatSession && chatSession.messages.length === 0 && !chatInput.trim() && question.trim()) {
      setChatInput(question.trim());
    }
  }, [chatInput, chatSession, question]);

  // 自动清除错误提示
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [error, setError]);

  useEffect(() => {
    return () => {
      if (fallbackTimerRef.current !== null) {
        window.clearTimeout(fallbackTimerRef.current);
      }
    };
  }, []);

  // 动画变体
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const resetGeneratedState = () => {
    setChartData(null);
    setHasPerformedDivination(false);
    setAIAnalysis('');
    setAnalysisComplete(false);
    setChatSession(null);
    setChatInput('');
    setStreamingReply('');
    setPendingBirthInfo(null);
  };

  useEffect(() => {
    setSavedCases(getBaziCases());
  }, []);

  useEffect(() => {
    let cancelled = false;

    const buildPreview = async () => {
      try {
        if (inputMode === 'pillars') {
          const pillarText = [pillarInput.year, pillarInput.month, pillarInput.day, pillarInput.hour].filter(Boolean).join(' ');
          if (!pillarText) {
            if (!cancelled) {
              setInputPreview(null);
            }
            return;
          }

          if (!selectedPillarCandidateIso) {
            if (!cancelled) {
              setInputPreview({
                solarText: '请先反查候选阳历时间',
                lunarText: '待反查',
                baziText: pillarText,
                note: '四柱模式需要先从候选阳历时间里选定一条记录，后续大运和流年才能保持准确。',
              });
            }
            return;
          }

          const selectedDate = parseLocalDateTime(selectedPillarCandidateIso);
          const detail = await getCantianBaziDetail({
            birthDate: selectedDate,
            birthTime: selectedDate.getHours(),
            gender: birthInfo.gender,
            isLunar: false,
          });

          if (!cancelled) {
            setInputPreview({
              solarText: detail.阳历,
              lunarText: detail.农历,
              baziText: detail.八字,
              note: '当前按四柱反查出的候选时间预览。',
            });
          }
          return;
        }

        const previewDate = inputMode === 'solar'
          ? selectedBirthTime
          : new Date(
              Number(lunarInput.year || 0),
              Math.max(0, Number(lunarInput.month || 1) - 1),
              Number(lunarInput.day || 1),
              Number(lunarInput.hour || 0),
              Number(lunarInput.minute || 0),
              0,
            );

        if (Number.isNaN(previewDate.getTime())) {
          if (!cancelled) {
            setInputPreview(null);
          }
          return;
        }

        const detail = await getCantianBaziDetail({
          birthDate: previewDate,
          birthTime: previewDate.getHours(),
          gender: birthInfo.gender,
          isLunar: inputMode === 'lunar',
        });

        if (!cancelled) {
          setInputPreview({
            solarText: detail.阳历,
            lunarText: detail.农历,
            baziText: detail.八字,
            note: inputMode === 'solar' ? '当前阳历录入的即时预览。' : '当前农历录入的即时预览。',
          });
        }
      } catch {
        if (!cancelled) {
          setInputPreview(null);
        }
      }
    };

    void buildPreview();

    return () => {
      cancelled = true;
    };
  }, [birthInfo.gender, inputMode, lunarInput, pillarInput, selectedBirthTime, selectedPillarCandidateIso]);

  const handleBirthTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputDateTime = e.target.value;
    const selectedDate = new Date(inputDateTime);
    setSelectedBirthTime(selectedDate);
    setBirthInfo((prev) => ({
      ...prev,
      birthDate: selectedDate,
      birthTime: selectedDate.getHours(),
    }));
    resetGeneratedState();
  };

  const handleLunarInputChange = (field: keyof BaziLunarInput, value: string) => {
    setLunarInput((prev) => ({ ...prev, [field]: value }));
    resetGeneratedState();
  };

  const handlePillarInputChange = (field: keyof BaziPillarInput, value: string) => {
    setPillarInput((prev) => ({ ...prev, [field]: value.trim() }));
    setPillarCandidates([]);
    setSelectedPillarCandidateIso('');
    resetGeneratedState();
  };

  const runPillarLookup = () => {
    const ganzhiPattern = /^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/;
    const fields = [
      { label: '年柱', value: pillarInput.year },
      { label: '月柱', value: pillarInput.month },
      { label: '日柱', value: pillarInput.day },
      { label: '时柱', value: pillarInput.hour },
    ];

    const invalidField = fields.find((item) => !ganzhiPattern.test(item.value));
    if (invalidField) {
      throw new Error(`${invalidField.label}请输入标准干支，例如甲子`);
    }

    return getCantianSolarMatchesForFourPillars(pillarInput);
  };

  const handleReversePillarLookup = () => {
    try {
      const matches = runPillarLookup();
      setPillarCandidates(matches);

      if (matches.length === 0) {
        setSelectedPillarCandidateIso('');
        setError('当前四柱在 1900-2099 范围内未找到匹配阳历时间');
        return;
      }

      setSelectedPillarCandidateIso((current) => {
        if (current && matches.some((item) => item.iso === current)) {
          return current;
        }
        return matches[0].iso;
      });
      setError(null);
    } catch (lookupError) {
      setPillarCandidates([]);
      setSelectedPillarCandidateIso('');
      setError(lookupError instanceof Error ? lookupError.message : '四柱反查失败');
    }
  };

  const resolveBirthInfoForGeneration = async (): Promise<BirthInfo | null> => {
    if (inputMode === 'solar') {
      return {
        ...birthInfo,
        birthDate: selectedBirthTime,
        birthTime: selectedBirthTime.getHours(),
        isLunar: false,
      };
    }

    if (inputMode === 'lunar') {
      const year = Number(lunarInput.year);
      const month = Number(lunarInput.month);
      const day = Number(lunarInput.day);
      const hour = Number(lunarInput.hour);
      const minute = Number(lunarInput.minute);

      if ([year, month, day, hour, minute].some((value) => Number.isNaN(value))) {
        setError('请完整输入农历出生时间');
        return null;
      }

      if (month < 1 || month > 12 || day < 1 || day > 30 || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
        setError('农历输入范围有误，请检查年月日时分');
        return null;
      }

      const lunarDate = new Date(year, month - 1, day, hour, minute, 0);
      return {
        ...birthInfo,
        birthDate: lunarDate,
        birthTime: hour,
        isLunar: true,
      };
    }

    let matches = pillarCandidates;
    if (matches.length === 0) {
      try {
        matches = runPillarLookup();
        setPillarCandidates(matches);
      } catch (lookupError) {
        setError(lookupError instanceof Error ? lookupError.message : '四柱反查失败');
        return null;
      }
    }

    if (matches.length === 0) {
      setError('当前四柱未找到可用的阳历候选时间');
      return null;
    }

    if (!selectedPillarCandidateIso) {
      if (matches.length > 1) {
        setError('当前四柱匹配到多条阳历时间，请先手动选择一条');
        return null;
      }
      setSelectedPillarCandidateIso(matches[0].iso);
    }

    const selectedMatch = matches.find((item) => item.iso === selectedPillarCandidateIso) || matches[0];
    const selectedDate = selectedMatch.date;

    return {
      ...birthInfo,
      birthDate: selectedDate,
      birthTime: selectedDate.getHours(),
      isLunar: false,
    };
  };

  const handleModeChange = (mode: BaziInputMode) => {
    setInputMode(mode);
    resetGeneratedState();
  };

  const buildCaseDraft = (id?: string) => {
    const nextSolarDateTime =
      inputMode === 'solar'
        ? formatDateTimeWithSeconds(selectedBirthTime)
        : inputMode === 'pillars'
          ? selectedPillarCandidateIso || undefined
          : undefined;
    const nextLunarInput = inputMode === 'lunar' ? { ...lunarInput } : undefined;
    const nextPillarInput = inputMode === 'pillars' ? { ...pillarInput } : undefined;

    return {
      id,
      title: `${birthInfo.name} · ${getInputModeLabel(inputMode)}`,
      name: birthInfo.name.trim(),
      gender: birthInfo.gender,
      question: question.trim(),
      inputMode,
      solarDateTime: nextSolarDateTime,
      lunarInput: nextLunarInput,
      pillarInput: nextPillarInput,
      selectedPillarSolarTime: inputMode === 'pillars' ? selectedPillarCandidateIso || undefined : undefined,
    };
  };

  const handleSaveCase = (options?: { forceNew?: boolean }) => {
    if (!birthInfo.name.trim()) {
      setError('请先输入姓名，再保存命例');
      return;
    }

    try {
      const saved = saveBaziCase(
        buildCaseDraft(options?.forceNew ? undefined : activeCaseId || undefined),
      );
      setSavedCases(getBaziCases());
      setActiveCaseId(saved.id);
      setError(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '保存命例失败');
    }
  };

  const handleLoadCase = (record: BaziCaseRecord) => {
    setBirthInfo((prev) => ({
      ...prev,
      name: record.name,
      gender: record.gender,
    }));
    setQuestion(record.question || '');
    setInputMode(record.inputMode);
    setActiveCaseId(record.id);

    if (record.inputMode === 'solar' && record.solarDateTime) {
      const savedDate = parseLocalDateTime(record.solarDateTime);
      if (!Number.isNaN(savedDate.getTime())) {
        setSelectedBirthTime(savedDate);
      }
    }

    if (record.inputMode === 'pillars' && record.selectedPillarSolarTime) {
      const selectedDate = parseLocalDateTime(record.selectedPillarSolarTime);
      if (!Number.isNaN(selectedDate.getTime())) {
        setSelectedBirthTime(selectedDate);
      }
    }

    setLunarInput(record.lunarInput || createLunarInputFromDate(createDefaultBirthDate()));
    setPillarInput(record.pillarInput || { year: '', month: '', day: '', hour: '' });
    setSelectedPillarCandidateIso(record.selectedPillarSolarTime || '');

    if (record.inputMode === 'pillars' && record.pillarInput) {
      try {
        const matches = getCantianSolarMatchesForFourPillars(record.pillarInput);
        setPillarCandidates(matches);
      } catch {
        setPillarCandidates([]);
      }
    } else {
      setPillarCandidates([]);
    }

    resetGeneratedState();
  };

  const handleDeleteCase = (id: string) => {
    try {
      const nextCases = deleteBaziCase(id);
      setSavedCases(nextCases);
      if (activeCaseId === id) {
        setActiveCaseId(null);
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : '删除命例失败');
    }
  };

  const handleCreateNewCase = () => {
    const defaultBirthDate = createDefaultBirthDate();
    setBirthInfo({
      name: '',
      gender: '男',
      birthDate: defaultBirthDate,
      isLunar: false,
      birthTime: 12,
    });
    setQuestion('');
    setInputMode('solar');
    setSelectedBirthTime(defaultBirthDate);
    setLunarInput(createLunarInputFromDate(defaultBirthDate));
    setPillarInput({ year: '', month: '', day: '', hour: '' });
    setPillarCandidates([]);
    setSelectedPillarCandidateIso('');
    setActiveCaseId(null);
    resetGeneratedState();
  };

  const clearFallbackTimer = () => {
    if (fallbackTimerRef.current !== null) {
      window.clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  };

  const finishChartGeneration = async (source: 'video' | 'timeout') => {
    if (generationStartedRef.current) {
      return;
    }

    generationStartedRef.current = true;
    clearFallbackTimer();

    try {
      await generateChart();
      setHasPerformedDivination(true);
      console.log(`八字起盘已通过${source === 'video' ? '视频回调' : '超时兜底'}完成`);
    } finally {
      setIsGenerating(false);
    }
  };

  // 视频播放完成的回调
  const handleVideoEnded = () => {
    void finishChartGeneration('video');
  };

  // 执行起盘
  const performDivination = async () => {
    if (!birthInfo.name.trim()) {
      setError('请输入您的姓名');
      return;
    }

    const resolvedBirthInfo = await resolveBirthInfoForGeneration();
    if (!resolvedBirthInfo) {
      return;
    }

    setIsGenerating(true);
    setChartData(null);
    setAIAnalysis('');
    setIsAnalyzing(false);
    setAnalysisComplete(false);
    setHasPerformedDivination(false);
    setChatSession(null);
    setChatInput(question.trim());
    setStreamingReply('');
    setPendingBirthInfo(resolvedBirthInfo);
    generationStartedRef.current = false;
    clearFallbackTimer();
    
    // 备用超时机制，防止视频加载失败（最长等待8秒）
    fallbackTimerRef.current = window.setTimeout(() => {
      console.log('视频超时，使用备用机制完成起盘');
      void finishChartGeneration('timeout');
    }, 8000);
  };

  const generateChart = async () => {
    try {
      const finalBirthInfo = pendingBirthInfo || await resolveBirthInfoForGeneration();
      if (!finalBirthInfo) {
        throw new Error('未能解析出生信息');
      }
      
      const chart = await generateBaZiChart(finalBirthInfo);
      setChartData(chart);
      setAIAnalysis('');
      setPendingBirthInfo(finalBirthInfo);
      
      console.log('八字推命起盘成功:', {
        finalBirthInfo,
        chart
      });
    } catch (error) {
      console.error('生成八字盘失败:', error);
      setError('起盘失败，请重试');
      throw error;
    }
  };

  // 处理姓名变化
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBirthInfo(prev => ({ ...prev, name: e.target.value }));
  };

  // 处理性别变化
  const handleGenderChange = (gender: '男' | '女') => {
    setBirthInfo(prev => ({ ...prev, gender }));
    resetGeneratedState();
  };

  const getDefaultOpeningQuestion = () => {
    if (question.trim()) {
      return question.trim();
    }

    return '请先基于当前命盘给我一份结构化总览，优先说明命局核心、五行强弱、当前大运，以及最近三年的重点。';
  };

  const buildFoundationalConsultFocus = (focusQuestion: string) => {
    if (!chartData) {
      return '';
    }

    return buildBaziAiBridgeFocusV3(chartData, focusQuestion);
  };

  const buildLocalYongShenMarkdown = (focusQuestion?: string) => {
    if (!chartData) {
      return '';
    }

    const { finalResult, snapshots } = buildYongShenStageAnalysis(chartData);
    const finalSnapshot = snapshots[snapshots.length - 1];
    const climateAdjustment = finalResult.yongShenMapping.climateAdjustment;
    const changedStages = snapshots.filter((item) =>
      item.changeSummary.some((summary) => !summary.includes('作为第一阶段基准盘') && !summary.includes('未翻转')),
    );

    return [
      '## 喜用神规则分析 V2',
      '',
      focusQuestion ? `当前关注：${focusQuestion}` : '当前关注：命局总览',
      '',
      '### 最终结论',
      `- 最终格局：${finalResult.yongShenMapping.patternType}`,
      `- 最终用神：${formatYongShenV2Elements(finalResult.yongShenMapping.yongElements)}`,
      `- 最终忌神：${formatYongShenV2Elements(finalResult.yongShenMapping.jiElements)}`,
      `- 有效日主：${finalResult.yongShenMapping.effectiveDayMasterElement}`,
      `- 调候修正：${climateAdjustment.applied ? climateAdjustment.reasons.join('；') : '当前未触发最终调候修正'}`,
      '',
      '### 关键拐点',
      ...(changedStages.length > 0
        ? changedStages.flatMap((item) => [`- ${item.stageLabel}：${item.changeSummary.join('；')}`])
        : ['- 这张盘在当前五个阶段里没有出现喜忌翻转，只有分数结构变化。']),
      '',
      '### 阶段演变',
      ...snapshots.flatMap((snapshot) => [
        `#### ${snapshot.stageLabel}`,
        `- 总分：${snapshot.totalScore}`,
        `- 五行：${formatYongShenV2Scores(snapshot.scores)}`,
        `- 格局：${snapshot.patternType}`,
        `- 同党百分比：${snapshot.tongDangPercent}%`,
        `- 同党最高单一五行：${snapshot.maxSelfElement || '待定'} ${snapshot.maxSelfPercent}%`,
        `- 异党最高单一五行：${snapshot.maxOpposingElement || '待定'} ${snapshot.maxOpposingPercent}%`,
        `- 用神：${formatYongShenV2Elements(snapshot.yongElements)}`,
        `- 忌神：${formatYongShenV2Elements(snapshot.jiElements)}`,
        `- 阶段说明：${snapshot.changeSummary.join('；')}`,
        '',
      ]),
      '### 当前解释',
      `- 这次页面展示已经直接接入 yongshen-v2，本地会把 Step1To3 到 Step1To8 的变化全部展开。`,
      `- 当前页面最终采用 ${finalSnapshot.stageLabel} 的结论作为本地喜用神输出。`,
      '',
      '### 说明',
      '- 这一结果由本地 yongshen-v2 规则引擎直接生成，没有等待 AI 裁决。',
      '- 当前 AI 咨询链也已经同步以前置的 yongshen-v2 结果为准，不再和页面展示使用两套口径。',
    ].join('\n');
  };

  const handleLocalYongShenAnalysis = () => {
    if (!chartData) {
      setError('请先起盘');
      return;
    }

    const currentSession = chatSession || getBaziChatSession(chartData, selectedMaster);
    const focusQuestion = (chatInput.trim() || question.trim());
    const userMessage = focusQuestion
      ? `请给出当前命盘的喜用神详解，并重点回应这个问题：${focusQuestion}`
      : '请给出当前命盘的喜用神详解。';
    const assistantMessage = buildLocalYongShenMarkdown(focusQuestion);

    const withUser = appendBaziChatMessage(currentSession, 'user', userMessage);
    const finalizedSession = appendBaziChatMessage(withUser, 'assistant', assistantMessage);

    setChatSession(finalizedSession);
    saveBaziChatSession(finalizedSession);
    setChatInput('');
    setStreamingReply('');
    setAIAnalysis(assistantMessage);
    setAnalysisComplete(true);
    setIsAnalyzing(false);
    setError(null);
  };

  const handleLocalBlindThreePassAnalysis = async () => {
    if (!chartData) {
      setError('请先起盘');
      return;
    }

    try {
      const focusQuestion = (chatInput.trim() || question.trim());
      const userMessage = focusQuestion
        ? `请做过三关直断，并重点回答这个问题：${focusQuestion}`
        : '请做过三关直断，直接给出当前命盘的重点结论。';
      await getAnalysis({
        userMessage,
        focusQuestion,
        activeFocus: buildBlindThreePassActionFocusV3(focusQuestion),
      });
    } catch (error) {
      console.error('过三关直断 AI 分析失败:', error);
      setIsAnalyzing(false);
      setError(error instanceof Error ? error.message : '过三关直断分析失败，请稍后重试');
    }
  };

  const clearConsultSession = () => {
    if (!chartData) {
      return;
    }

    clearBaziChatSession(chartData);
    setChatSession(getBaziChatSession(chartData, selectedMaster));
    setChatInput(question.trim());
    setStreamingReply('');
    setAIAnalysis('');
    setAnalysisComplete(false);
    setError(null);
  };

  // 获取AI分析（升级为多轮会话）
  const getAnalysis = async (options?: ConsultTriggerOptions) => {
    if (!chartData) {
      setError('请先起盘');
      return;
    }

    if (!selectedMaster) {
      setError('请先选择大师');
      return;
    }

    const currentSession = chatSession || getBaziChatSession(chartData, selectedMaster);
    const userMessage = (
      options?.userMessage
      || chatInput.trim()
      || (currentSession.messages.length === 0 ? getDefaultOpeningQuestion() : '')
    ).trim();

    if (!userMessage) {
      setError('请输入你想追问的问题');
      return;
    }

    const hadAssistantReply = currentSession.messages.some((item) => item.role === 'assistant');
    const focusQuestion = (options?.focusQuestion || userMessage).trim();
    const resolvedActiveFocus = [
      buildFoundationalConsultFocus(focusQuestion),
      options?.activeFocus,
    ].filter(Boolean).join('\n\n');
    const nextSession = appendBaziChatMessage(currentSession, 'user', userMessage);

    setChatSession(nextSession);
    saveBaziChatSession(nextSession);
    setIsAnalyzing(true);
    setAnalysisComplete(false);
    setError(null);
    setChatInput('');
    setStreamingReply('');
    setAIAnalysis('');

    try {
      const contents = buildBaziChatContents({
        chartData,
        master: selectedMaster,
        session: nextSession,
        activeFocus: resolvedActiveFocus,
      });

      const analysisResult = await getAIConversationAnalysisStream(contents, (streamText) => {
        setStreamingReply(streamText);
        setAIAnalysis(streamText);
      });

      const finalizedSession = appendBaziChatMessage(nextSession, 'assistant', analysisResult);
      setChatSession(finalizedSession);
      saveBaziChatSession(finalizedSession);
      setStreamingReply('');
      setAIAnalysis(analysisResult);
      setAnalysisComplete(true);

      if (!hadAssistantReply) {
        const memorySummary = getBaziMemorySummary(finalizedSession);
        const analysisData = {
          type: 'bazi',
          engineSource: 'cantian-ai/bazi-mcp',
          question: userMessage,
          birthTimeText: getTimeRangeByHour(chartData.birthTime),
          chartData,
          conversation: {
            sessionId: finalizedSession.sessionId,
            memorySummary,
            messageCount: finalizedSession.messages.length,
          },
        };

        const record: DivinationRecord = {
          id: chartData.id,
          type: 'bazi',
          timestamp: chartData.timestamp,
          data: analysisData,
          master: {
            id: selectedMaster.id,
            name: selectedMaster.name,
            description: selectedMaster.description,
          },
          analysis: analysisResult,
        };

        addRecord(record);
      }
    } catch (error) {
      console.error('AI分析失败:', error);
      setChatSession(currentSession);
      saveBaziChatSession(currentSession);
      setChatInput(userMessage);
      setAIAnalysis([...currentSession.messages].reverse().find((item) => item.role === 'assistant')?.content || '');
      setError(error instanceof Error ? error.message : '分析过程中发生错误');
      setAnalysisComplete(false);
      setStreamingReply('');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const displayYear = new Date().getFullYear();
  const currentFortune = chartData?.decadeFortune.大运.find(
    (item: BaZiChartData['decadeFortune']['大运'][number]) => displayYear >= item.开始年份 && displayYear <= item.结束
  );
  const fortuneItems = chartData?.decadeFortune.大运 || [];

  const renderDashboardContent = () => {
    if (!chartData) {
      return null;
    }

    const basicInfoCards = [
      { label: '姓名', value: chartData.name || '未填写' },
      { label: '性别', value: chartData.gender },
      { label: '阳历', value: chartData.solarDateText },
      { label: '农历', value: chartData.lunarDateText },
      { label: '八字', value: chartData.baziText || formatBaZiChart(chartData) },
      { label: '日主', value: chartData.dayMaster },
      { label: '生肖', value: chartData.zodiacAnimal },
      { label: '本命佛', value: chartData.guardianBuddha },
      { label: '命宫', value: chartData.mingGong },
      { label: '身宫', value: chartData.shenGong },
      { label: '胎元', value: chartData.rawBaziData.胎元 },
      { label: '胎息', value: chartData.rawBaziData.胎息 },
      { label: '星座', value: chartData.constellation },
      { label: '出生时段', value: getTimeRangeByHour(chartData.birthTime) },
    ];

    const relationSummary = (chartData.relationSummary ?? {}) as RelationSummary;
    const natalRelationKeys = ['年', '月', '日', '时'];
    const relationLinesByPillar = buildRelationLinesByKey(relationSummary, natalRelationKeys);
    const maxWuxingCount = Math.max(...Object.values(chartData.wuxingAnalysis), 1);

    const natalMatrixColumns: MatrixColumn[] = [
      buildNatalMatrixColumn('年柱', chartData.rawBaziData.年柱, chartData.gods.年柱, relationLinesByPillar['年'] || []),
      buildNatalMatrixColumn('月柱', chartData.rawBaziData.月柱, chartData.gods.月柱, relationLinesByPillar['月'] || []),
      buildNatalMatrixColumn('日柱', chartData.rawBaziData.日柱, chartData.gods.日柱, relationLinesByPillar['日'] || []),
      buildNatalMatrixColumn('时柱', chartData.rawBaziData.时柱, chartData.gods.时柱, relationLinesByPillar['时'] || []),
    ];

    const selectedFortune = selectedFortuneIndex !== null ? fortuneItems[selectedFortuneIndex] || null : null;
    const flowYearOptions: FlowYearOption[] = selectedFortune
      ? Array.from({ length: selectedFortune.结束 - selectedFortune.开始年份 + 1 }, (_, index) => {
          const year = selectedFortune.开始年份 + index;
          return {
            key: String(year),
            year,
            age: selectedFortune.开始年龄 + index,
            ganzhi: getCantianFlowYearGanzhi(year),
            label: `${year}`,
          };
        })
      : [];
    const selectedYearOption = flowYearOptions.find((item) => item.year === selectedFlowYear) || null;

    const flowMonthOptions: FlowMonthOption[] = selectedYearOption
      ? getCantianFlowMonthBoundaries(selectedYearOption.year).map((item) => ({
          key: `${item.term}-${formatDateKey(item.start)}`,
          startDate: item.start,
          endDate: item.end,
          term: item.term,
          representativeDate: new Date(item.start.getTime() + 60 * 60 * 1000),
          ganzhi: item.ganzhi,
          label: item.label,
        }))
      : [];
    const selectedMonthOption = flowMonthOptions.find((item) => item.key === selectedFlowMonth) || null;

    const flowDayOptions: FlowDayOption[] = selectedYearOption && selectedMonthOption
      ? buildFlowDayOptionsForBoundary(selectedMonthOption.startDate, selectedMonthOption.endDate)
      : [];
    const selectedDayOption = flowDayOptions.find((item) => item.key === selectedFlowDay) || null;

    const flowHourOptions: FlowHourOption[] = selectedYearOption && selectedMonthOption && selectedDayOption
      ? TIME_SLOTS.map((slot) => {
          const representativeHour = slot.hours[0];
          const sampleDate = new Date(selectedDayOption.date);
          sampleDate.setHours(representativeHour, 0, 0, 0);
          const pillars = getCantianFourPillarsAtSolarDate(sampleDate);
          return {
            hour: representativeHour,
            ganzhi: `${pillars.hour.stem}${pillars.hour.branch}`,
            label: slot.name,
            range: slot.range,
            slotName: slot.name,
          };
        })
      : [];
    const selectedHourOption = flowHourOptions.find((item) => item.hour === selectedFlowHour) || null;

    const fortuneColumnEntries: Array<{ relationKey: string; ganzhi: string; column: MatrixColumn; gods: string[] }> = [
      {
        relationKey: '年',
        ganzhi: `${chartData.fourPillars.year.stem}${chartData.fourPillars.year.branch}`,
        column: buildNatalMatrixColumn('年柱', chartData.rawBaziData.年柱, chartData.gods.年柱, []),
        gods: chartData.gods.年柱,
      },
      {
        relationKey: '月',
        ganzhi: `${chartData.fourPillars.month.stem}${chartData.fourPillars.month.branch}`,
        column: buildNatalMatrixColumn('月柱', chartData.rawBaziData.月柱, chartData.gods.月柱, []),
        gods: chartData.gods.月柱,
      },
      {
        relationKey: '日',
        ganzhi: `${chartData.fourPillars.day.stem}${chartData.fourPillars.day.branch}`,
        column: buildNatalMatrixColumn('日柱', chartData.rawBaziData.日柱, chartData.gods.日柱, []),
        gods: chartData.gods.日柱,
      },
      {
        relationKey: '时',
        ganzhi: `${chartData.fourPillars.hour.stem}${chartData.fourPillars.hour.branch}`,
        column: buildNatalMatrixColumn('时柱', chartData.rawBaziData.时柱, chartData.gods.时柱, []),
        gods: chartData.gods.时柱,
      },
    ];

    const dynamicFortuneEntries: Array<{ relationKey: string; ganzhi: string; column: MatrixColumn }> = [];
    if (selectedFortune) {
      dynamicFortuneEntries.push({
        relationKey: '大运',
        ganzhi: selectedFortune.干支,
        column: buildFortuneMatrixColumn(selectedFortune, chartData.dayMaster),
      });
    }
    if (selectedYearOption) {
      dynamicFortuneEntries.push({
        relationKey: '流年',
        ganzhi: selectedYearOption.ganzhi,
        column: buildFlowMatrixColumn('流年', `${selectedYearOption.year}`, selectedYearOption.ganzhi, chartData.dayMaster),
      });
    }
    if (selectedMonthOption) {
      dynamicFortuneEntries.push({
        relationKey: '流月',
        ganzhi: selectedMonthOption.ganzhi,
        column: buildFlowMatrixColumn('流月', selectedMonthOption.label, selectedMonthOption.ganzhi, chartData.dayMaster),
      });
    }
    if (selectedDayOption) {
      dynamicFortuneEntries.push({
        relationKey: '流日',
        ganzhi: selectedDayOption.ganzhi,
        column: buildFlowMatrixColumn('流日', selectedDayOption.label, selectedDayOption.ganzhi, chartData.dayMaster),
      });
    }
    if (selectedHourOption) {
      dynamicFortuneEntries.push({
        relationKey: '流时',
        ganzhi: selectedHourOption.ganzhi,
        column: buildFlowMatrixColumn('流时', `${selectedHourOption.slotName} ${selectedHourOption.range}`, selectedHourOption.ganzhi, chartData.dayMaster),
      });
    }

    const dynamicGods = getCantianExtraGods(
      chartData.baziText,
      chartData.gender,
      dynamicFortuneEntries.map((item) => item.ganzhi),
    );
    const fortuneRelationSummary = calculateCantianRelationSummary(
      [...fortuneColumnEntries, ...dynamicFortuneEntries].reduce<Record<string, { 天干: string; 地支: string }>>((result, item) => {
        result[item.relationKey] = {
          天干: item.ganzhi.charAt(0),
          地支: item.ganzhi.charAt(1),
        };
        return result;
      }, {}),
    ) as RelationSummary;
    const fortuneRelationLinesByKey = buildRelationLinesByKey(
      fortuneRelationSummary,
      [...fortuneColumnEntries, ...dynamicFortuneEntries].map((item) => item.relationKey),
    );

    const fortuneMatrixColumns: MatrixColumn[] = [
      ...fortuneColumnEntries.map((item) => ({
        ...item.column,
        gods: item.gods,
        relations: fortuneRelationLinesByKey[item.relationKey] || [],
      })),
      ...dynamicFortuneEntries.map((item, index) => ({
        ...item.column,
        gods: dynamicGods[index] || [],
        relations: fortuneRelationLinesByKey[item.relationKey] || [],
      })),
    ];

    const currentFlowTrail = [
      { label: '大运', value: selectedFortune?.干支 || currentFortune?.干支 || '未定位' },
      { label: '流年', value: selectedYearOption ? `${selectedYearOption.year} ${selectedYearOption.ganzhi}` : '等待选择' },
      { label: '流月', value: selectedMonthOption ? `${selectedMonthOption.term} ${selectedMonthOption.ganzhi}` : '等待选择' },
      { label: '流日', value: selectedDayOption ? `${selectedDayOption.label} ${selectedDayOption.ganzhi}` : '等待选择' },
      { label: '流时', value: selectedHourOption ? `${selectedHourOption.label} ${selectedHourOption.ganzhi}` : '等待选择' },
    ];
    const selectedFlowCount = [selectedFortune, selectedYearOption, selectedMonthOption, selectedDayOption, selectedHourOption].filter(Boolean).length;

    const renderMatrix = (
      columns: MatrixColumn[],
      options?: {
        compact?: boolean;
        eyebrow?: string;
        title?: string;
        note?: string;
      },
    ) => {
      const compact = options?.compact ?? false;
      const wrapperClass = compact
        ? 'rounded-[28px] border border-[#e4d6bf] bg-[#fffaf2] p-5 shadow-[0_12px_30px_rgba(54,38,19,0.05)]'
        : 'rounded-[32px] border border-[#eadbc4] bg-[#fffaf2] p-6 shadow-[0_18px_45px_rgba(54,38,19,0.06)]';
      const tableClass = compact
        ? 'min-w-[1120px] w-full border-separate border-spacing-y-[6px] text-[13px]'
        : 'min-w-[1080px] w-full border-separate border-spacing-y-2 text-sm';
      const headerCellClass = compact
        ? 'rounded-[14px] bg-[#efe4d3] px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8e7758]'
        : 'rounded-[16px] bg-[#efe4d3] px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.24em] text-[#8e7758]';
      const columnHeaderClass = compact
        ? 'rounded-[14px] bg-[#efe4d3] px-3 py-3 text-left text-[13px] font-semibold text-[#654c32]'
        : 'rounded-[16px] bg-[#efe4d3] px-4 py-4 text-left text-sm font-semibold text-[#654c32]';
      const rowLabelClass = compact
        ? 'rounded-[14px] bg-[#f5ecdf] px-3 py-3 font-medium text-[#866c4e]'
        : 'rounded-[16px] bg-[#f5ecdf] px-4 py-4 font-medium text-[#866c4e]';
      const valueCellClass = compact
        ? 'rounded-[14px] bg-white px-3 py-3 text-[#5f4a33]'
        : 'rounded-[16px] bg-white px-4 py-4 text-[#5f4a33]';
      const iconSizeClass = compact ? 'h-10 w-10 rounded-[14px] text-xl' : 'h-12 w-12 rounded-2xl text-2xl';
      const metaTextClass = compact ? 'text-xs leading-5 text-[#6b5842]' : 'text-sm leading-6 text-[#6b5842]';

      return (
      <div className={wrapperClass}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-[#9f8c72]">{options?.eyebrow || 'Four Pillars Matrix'}</p>
            <h3 className={`mt-2 font-semibold text-[#4f3924] ${compact ? 'text-xl' : 'text-2xl'}`}>{options?.title || '四柱矩阵'}</h3>
          </div>
          <div className={`rounded-full border border-[#dfcfb8] bg-[#f5eddf] text-xs text-[#876d4c] ${compact ? 'px-3 py-1.5' : 'px-4 py-2'}`}>
            {options?.note || '原局四柱与选中时序会一起展示在同一张矩阵里'}
          </div>
        </div>

        <div className={compact ? 'mt-4 overflow-x-auto' : 'mt-5 overflow-x-auto'}>
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={`w-28 ${headerCellClass}`}>
                  字段
                </th>
                {columns.map((column) => (
                  <th key={column.key} className={columnHeaderClass}>
                    <div>{column.title}</div>
                    {column.subtitle && <div className="mt-1 text-[11px] font-normal leading-5 text-[#8f7758]">{column.subtitle}</div>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={rowLabelClass}>天干十神</td>
                {columns.map((column) => (
                  <td key={`${column.key}-stem-god`} className={valueCellClass}>
                    {column.stemTenGod || '—'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className={rowLabelClass}>天干</td>
                {columns.map((column) => {
                  const color = getWuxingColor(column.stemWuxing);
                  return (
                    <td key={`${column.key}-stem`} className={valueCellClass}>
                      <div className={`flex items-center ${compact ? 'gap-2.5' : 'gap-3'}`}>
                        <div
                          className={`flex items-center justify-center font-bold text-white ${iconSizeClass}`}
                          style={{ backgroundColor: color, boxShadow: `0 10px 24px ${color}35` }}
                        >
                          {column.stem}
                        </div>
                        <div className={metaTextClass}>
                          <div>{column.stemWuxing}</div>
                          <div>{column.stemYinyang}</div>
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className={rowLabelClass}>地支</td>
                {columns.map((column) => {
                  const color = getWuxingColor(column.branchWuxing);
                  return (
                    <td key={`${column.key}-branch`} className={valueCellClass}>
                      <div className={`flex items-center ${compact ? 'gap-2.5' : 'gap-3'}`}>
                        <div
                          className={`flex items-center justify-center font-bold text-white ${iconSizeClass}`}
                          style={{ backgroundColor: color, boxShadow: `0 10px 24px ${color}35` }}
                        >
                          {column.branch}
                        </div>
                        <div className={metaTextClass}>
                          <div>{column.branchWuxing}</div>
                          <div>{column.branchYinyang}</div>
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
              {(['主气', '中气', '余气'] as const).map((stemKey) => (
                <tr key={stemKey}>
                  <td className={rowLabelClass}>藏干{hiddenStemLabels[stemKey]}</td>
                  {columns.map((column) => {
                    const hiddenStem = column.hiddenStems[stemKey];
                    return (
                      <td key={`${column.key}-${stemKey}`} className={valueCellClass}>
                        {hiddenStem ? (
                          <div className={compact ? 'space-y-0.5' : 'space-y-1'}>
                            <div className="font-semibold">{hiddenStem.天干}</div>
                            <div className="text-[11px] leading-5 text-[#8b775e]">{hiddenStem.十神}</div>
                          </div>
                        ) : (
                          <span className="text-[#b7a892]">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {[
                { label: '纳音', value: (column: MatrixColumn) => column.nayin || '—' },
                { label: '旬', value: (column: MatrixColumn) => column.xun || '—' },
                { label: '空亡', value: (column: MatrixColumn) => column.kongwang || '—' },
                { label: '星运', value: (column: MatrixColumn) => column.xingyun || '—' },
                { label: '自坐', value: (column: MatrixColumn) => column.zizuo || '—' },
              ].map((row) => (
                <tr key={row.label}>
                  <td className={rowLabelClass}>{row.label}</td>
                  {columns.map((column) => (
                    <td key={`${column.key}-${row.label}`} className={valueCellClass}>
                      {row.value(column)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className={`${rowLabelClass} align-top`}>神煞</td>
                {columns.map((column) => (
                  <td key={`${column.key}-gods`} className={valueCellClass}>
                    {column.gods.length > 0 ? (
                      <div className={`flex flex-col items-start text-[#6b5842] ${compact ? 'gap-1 text-[12px] leading-5' : 'gap-2 text-sm'}`}>
                        {column.gods.map((item) => (
                          <span key={`${column.key}-god-${item}`}>{item}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[#b7a892]">—</span>
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className={`${rowLabelClass} align-top`}>刑冲合会</td>
                {columns.map((column) => (
                  <td key={`${column.key}-relation`} className={valueCellClass}>
                    {column.relations.length > 0 ? (
                      <div className={`flex flex-col items-start text-[#6b5842] ${compact ? 'gap-1.5 text-[12px] leading-5' : 'gap-2 text-sm leading-6'}`}>
                        {column.relations.map((item, index) => (
                          <span key={`${column.key}-relation-${index}`}>{item}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[#b7a892]">—</span>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
    };

    const renderSelectorRow = (
      title: string,
      options: Array<{ key: string; label: string; meta?: string }>,
      selectedKey: string | null,
      onSelect: (key: string) => void,
      placeholder: string,
    ) => {
      const selectedOption = options.find((option) => option.key === selectedKey) || null;

      return (
      <div className="rounded-[24px] border border-[#e4d6bf] bg-[#fffaf3] p-4 shadow-[0_10px_24px_rgba(54,38,19,0.04)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#ddcdb4] bg-[#f5ecde] text-[11px] font-semibold tracking-[0.18em] text-[#8c7351]">
              {selectorStepMap[title] || '00'}
            </div>
            <div>
              <p className="text-sm font-semibold text-[#5a452f]">{title}</p>
              <p className="mt-1 text-[11px] leading-5 text-[#9a866f]">点击后会在上方矩阵中自动增加一列</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-full border border-[#e1d3bf] bg-white px-3 py-1.5 text-[11px] text-[#967e5f]">
              {options.length > 0 ? `${options.length} 个选项` : '等待上层'}
            </div>
            {selectedOption && (
              <div className="rounded-full border border-[#d8b77a] bg-[#fff2da] px-3 py-1.5 text-[11px] font-medium text-[#8a6122]">
                当前：{selectedOption.label}
              </div>
            )}
          </div>
        </div>

        {options.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {options.map((option) => {
              const isActive = selectedKey === option.key;
              return (
                <button
                  key={option.key}
                  onClick={() => onSelect(option.key)}
                  className={`min-w-[118px] rounded-[18px] border px-3 py-2.5 text-left transition ${
                    isActive
                      ? 'border-[#cf9e4c] bg-[linear-gradient(180deg,#fff4dd_0%,#f8dfb0_100%)] text-[#744a17] shadow-[0_10px_18px_rgba(207,158,76,0.16)]'
                      : 'border-[#e7d8c2] bg-white text-[#6a563e] hover:border-[#dbc3a3] hover:bg-[#faf3e7]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm font-medium">{option.label}</span>
                    {isActive && <span className="text-[11px] font-semibold tracking-[0.18em]">ON</span>}
                  </div>
                  {option.meta && <div className="mt-1 text-[11px] leading-5 text-inherit/80">{option.meta}</div>}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-[18px] border border-dashed border-[#e5d6bf] bg-white px-4 py-4 text-sm text-[#b19e88]">
            {placeholder}
          </div>
        )}
      </div>
    );
    };

    if (dashboardTab === 'consult') {
      const chatMessages = chatSession?.messages || [];
      const sendButtonLabel = isAnalyzing
        ? '生成中...'
        : chatMessages.length > 0
          ? '发送追问'
          : (question.trim() ? '开始问事解盘' : '开始命盘总览');
      const statusLabel = isAnalyzing
        ? '正在生成中'
        : chatMessages.length > 0
          ? '会话已建立'
          : '等待开始';
      const quickQuestions = [
        '先给我一份整体命盘总览。',
        '事业和财运最值得注意的点是什么？',
        '感情关系里最容易出现的问题是什么？',
        '结合当前大运，最近三年重点看什么？',
      ];

      return (
        <div className="space-y-5">
          <div className="rounded-[28px] border border-[#2a2a2a] bg-[#131313] p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.32em] text-[#7c7c7c]">AI Master Chat</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">
                  {question.trim() ? '问事会话' : '命盘会话'}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#9f9f9f]">
                  已接入多轮上下文和本地会话记忆。模型会优先延续前文结论，并始终以结构化命盘为最高优先级依据。
                </p>
              </div>

              <div className="flex flex-col items-start gap-3 md:items-end">
                <div className="rounded-full border border-[#2f2f2f] bg-[#191919] px-4 py-2 text-xs text-[#c9c9c9]">
                  {statusLabel}
                </div>
                <div className="flex flex-wrap gap-2">
                  <motion.button
                    onClick={() => { void getAnalysis(); }}
                    disabled={isAnalyzing || !selectedMaster}
                    className={`rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300 ${
                      isAnalyzing || !selectedMaster
                        ? 'cursor-not-allowed bg-[#2d2d2d] text-[#777777]'
                        : 'bg-[#f4f1e8] text-black hover:bg-white'
                    }`}
                    whileHover={!isAnalyzing && selectedMaster ? { scale: 1.02 } : {}}
                    whileTap={!isAnalyzing && selectedMaster ? { scale: 0.98 } : {}}
                  >
                    {sendButtonLabel}
                  </motion.button>
                  <button
                    onClick={clearConsultSession}
                    disabled={isAnalyzing || !chatSession || chatMessages.length === 0}
                    className={`rounded-full border px-5 py-3 text-sm font-semibold transition ${
                      isAnalyzing || !chatSession || chatMessages.length === 0
                        ? 'cursor-not-allowed border-[#2d2d2d] bg-[#161616] text-[#666666]'
                        : 'border-[#353535] bg-[#171717] text-[#d8d1c3] hover:bg-[#1d1d1d]'
                    }`}
                  >
                    清空会话
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {[
              `八字 ${chartData.baziText}`,
              `日主 ${chartData.dayMaster}`,
              `当前大运 ${currentFortune?.干支 || '待推算'}`,
              `会话 ${chatMessages.length} 条消息`,
            ].map((item) => (
              <div key={item} className="rounded-[22px] border border-[#262626] bg-[#141414] px-5 py-4 text-sm text-[#dad4c4]">
                {item}
              </div>
            ))}
          </div>

          <div className="rounded-[30px] border border-[#242424] bg-[#101010] p-6">
            {chatMessages.length > 0 || streamingReply ? (
              <div ref={analysisRef} className="space-y-4">
                {chatMessages.map((message) => {
                  const isAssistant = message.role === 'assistant';
                  return (
                    <div
                      key={message.id}
                      className={`rounded-[24px] border px-5 py-4 ${
                        isAssistant
                          ? 'border-[#2f2c26] bg-[#151311]'
                          : 'border-[#272727] bg-[#161616]'
                      }`}
                    >
                      <div className="mb-3 flex items-center justify-between gap-3 text-xs">
                        <span className={isAssistant ? 'text-[#d9b36a]' : 'text-[#9fb7ff]'}>
                          {isAssistant ? 'AI 命理师' : '你'}
                        </span>
                        <span className="text-[#6f6f6f]">
                          {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {isAssistant ? (
                        <StreamingMarkdown content={message.content} showCursor={false} isStreaming={false} />
                      ) : (
                        <div className="whitespace-pre-wrap text-sm leading-7 text-[#ece6da]">{message.content}</div>
                      )}
                    </div>
                  );
                })}

                {isAnalyzing && streamingReply && (
                  <div className="rounded-[24px] border border-[#2f2c26] bg-[#151311] px-5 py-4">
                    <div className="mb-3 flex items-center justify-between gap-3 text-xs">
                      <span className="text-[#d9b36a]">AI 命理师</span>
                      <span className="text-[#6f6f6f]">正在生成</span>
                    </div>
                    <StreamingMarkdown content={streamingReply} showCursor isStreaming />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[24px] border border-dashed border-[#333333] bg-[#141414] px-6 text-center">
                <p className="text-sm uppercase tracking-[0.3em] text-[#7e7e7e]">Conversation Ready</p>
                <h4 className="mt-3 text-2xl font-semibold text-white">先发起第一轮命盘咨询</h4>
                <p className="mt-3 max-w-xl text-sm leading-7 text-[#9c9c9c]">
                  这一页现在不是一次性解读，而是真正的多轮会话。你可以先做总览，再继续追问事业、感情、财运、流年等具体问题。
                </p>
              </div>
            )}
          </div>

          <div className="rounded-[30px] border border-[#242424] bg-[#101010] p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.28em] text-[#7b7b7b]">Composer</p>
                  <h4 className="mt-2 text-xl font-semibold text-white">继续追问</h4>
                </div>
                <div className="text-xs text-[#838383]">
                  {selectedMaster ? `当前大师：${selectedMaster.name}` : '请先选择大师'}
                </div>
              </div>

              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={chatMessages.length > 0 ? '继续输入你的追问，例如：那感情和婚姻具体怎么看？' : '输入你的首轮问题，留空则默认先做命盘总览'}
                className="min-h-[140px] w-full rounded-[24px] border border-[#2c2c2c] bg-[#141414] px-5 py-4 text-sm leading-7 text-white outline-none transition focus:border-[#b88944]"
                disabled={isAnalyzing}
              />

              <div className="rounded-[24px] border border-[#252525] bg-[#121212] px-4 py-4">
                <p className="text-sm uppercase tracking-[0.28em] text-[#7b7b7b]">Special Actions</p>
                <h4 className="mt-2 text-lg font-semibold text-white">专用分析入口</h4>
                <p className="mt-2 text-sm leading-6 text-[#919191]">
                  `喜用神详解` 仍走本地规则直出；`过三关直断` 会把本地规则结果作为隐藏上下文送入 AI，页面只展示 AI 最终成文结果。
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={handleLocalYongShenAnalysis}
                    disabled={isAnalyzing}
                    className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                      isAnalyzing
                        ? 'cursor-not-allowed border border-[#2d2d2d] bg-[#171717] text-[#6d6d6d]'
                        : 'border border-[#5d4729] bg-[#1d1710] text-[#f1d6a2] hover:bg-[#251d14]'
                    }`}
                  >
                    喜用神详解
                  </button>
                  <button
                    onClick={handleLocalBlindThreePassAnalysis}
                    disabled={isAnalyzing || !selectedMaster}
                    className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                      isAnalyzing || !selectedMaster
                        ? 'cursor-not-allowed border border-[#2d2d2d] bg-[#171717] text-[#6d6d6d]'
                        : 'border border-[#36445f] bg-[#131924] text-[#b8d1ff] hover:bg-[#182131]'
                    }`}
                  >
                    过三关直断
                  </button>
                </div>
              </div>

              <div className="rounded-[24px] border border-[#252525] bg-[#121212] px-4 py-4">
                <p className="text-sm uppercase tracking-[0.28em] text-[#7b7b7b]">Quick Start</p>
                <h4 className="mt-2 text-lg font-semibold text-white">常用追问</h4>
                <div className="mt-4 flex flex-wrap gap-2">
                  {quickQuestions.map((item) => (
                    <button
                      key={item}
                      onClick={() => setChatInput(item)}
                      className="rounded-full border border-[#303030] bg-[#171717] px-3 py-2 text-xs text-[#d9d2c6] transition hover:bg-[#1d1d1d]"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs leading-6 text-[#8c8c8c]">
                  上下文管理策略：保留最近多轮对话，并把已确认的关注点与结论沉淀进会话记忆。
                </div>
                <motion.button
                  onClick={() => { void getAnalysis(); }}
                  disabled={isAnalyzing || !selectedMaster}
                  className={`rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300 ${
                    isAnalyzing || !selectedMaster
                      ? 'cursor-not-allowed bg-[#2d2d2d] text-[#777777]'
                      : 'bg-[#f4f1e8] text-black hover:bg-white'
                  }`}
                  whileHover={!isAnalyzing && selectedMaster ? { scale: 1.02 } : {}}
                  whileTap={!isAnalyzing && selectedMaster ? { scale: 0.98 } : {}}
                >
                  {sendButtonLabel}
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (dashboardTab === 'basic') {
      return (
        <div className="space-y-5 text-[#5f4a33]">
          <div className="rounded-[32px] border border-[#eadbc4] bg-[#f7f1e5] p-6 shadow-[0_22px_60px_rgba(54,38,19,0.08)]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-[#9f8c72]">MCP Structured Chart</p>
                <h3 className="mt-2 text-3xl font-semibold text-[#4f3924]">八字原盘信息</h3>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-[#7b6753]">
                  这一页只保留原盘字段。神煞和刑冲合会已经收进四柱矩阵，不再单独拆出卡片。
                </p>
              </div>
              <div className="rounded-full border border-[#ddcbb2] bg-white/70 px-4 py-2 text-sm font-medium text-[#7b5b38]">
                {chartData.baziText || formatBaZiChart(chartData)}
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {basicInfoCards.map((item) => (
                <div key={item.label} className="rounded-[20px] border border-[#eadfcf] bg-[#fffaf2] px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-[#a18f79]">{item.label}</p>
                  <p className="mt-2 text-sm leading-6 text-[#5d4731]">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {renderMatrix(natalMatrixColumns)}

          <div className="rounded-[32px] border border-[#eadbc4] bg-[#fffaf2] p-6 shadow-[0_18px_45px_rgba(54,38,19,0.06)]">
            <p className="text-xs uppercase tracking-[0.32em] text-[#9f8c72]">Five Elements</p>
            <h3 className="mt-2 text-2xl font-semibold text-[#4f3924]">五行分析</h3>
            <div className="mt-6 space-y-4">
              {Object.entries(chartData.wuxingAnalysis).map(([element, count]) => {
                const color = getWuxingColor(element);
                const fillPercentage = maxWuxingCount > 0 ? (count / maxWuxingCount) * 100 : 0;

                return (
                  <div key={element} className="flex items-center gap-4">
                    <div className="w-10 text-center text-2xl font-black" style={{ color }}>
                      {element}
                    </div>
                    <div className="relative h-5 flex-1 overflow-hidden rounded-full bg-[#efe4d3]">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                        style={{
                          width: `${fillPercentage}%`,
                          background: `linear-gradient(90deg, ${color}, ${color}BB)`
                        }}
                      />
                    </div>
                    <div className="w-16 text-right text-sm text-[#6b5842]">
                      {count} <span className="text-[#9c886d]">{count > 2 ? '旺' : count > 1 ? '平' : count === 1 ? '弱' : '缺'}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {chartData.personalityTraits.map((item) => (
                <div key={item} className="rounded-[18px] border border-[#eadfcf] bg-white px-4 py-3 text-sm leading-6 text-[#6b5842]">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (dashboardTab === 'fortune') {
      return (
        <div className="space-y-5 text-[#5f4a33]">
          <div className="overflow-hidden rounded-[30px] border border-[#e6d8c2] bg-[linear-gradient(180deg,#fcf8ef_0%,#f4ead8_100%)] p-5 shadow-[0_18px_40px_rgba(54,38,19,0.05)]">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs uppercase tracking-[0.34em] text-[#a08b70]">Fortune Cycle Dashboard</p>
                <h3 className="mt-2 text-[28px] font-semibold tracking-tight text-[#4f3924]">大运流年</h3>
                <p className="mt-2 text-sm leading-7 text-[#77624a]">
                  这页按时间层级逐步展开 `大运 / 流年 / 流月 / 流日 / 流时`。每向下选中一层，上方矩阵就会自动追加对应列，并同步重算神煞与刑冲合会。
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {currentFlowTrail.map((item) => (
                    <div key={item.label} className="rounded-full border border-[#deceba] bg-white/80 px-3 py-1.5 text-[11px] text-[#7d694f]">
                      <span className="font-medium text-[#5d4731]">{item.label}</span>
                      <span className="mx-1 text-[#baa588]">/</span>
                      <span>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="min-w-0 xl:w-[360px]">
                <div className="rounded-[22px] border border-[#deceb7] bg-white/75 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-[#a08b70]">Current Focus</p>
                      <p className="mt-2 text-base font-semibold text-[#5a432c]">{currentFlowTrail[selectedFlowCount - 1]?.value || currentFlowTrail[0].value}</p>
                    </div>
                    <div className="rounded-full border border-[#dbc5a0] bg-[#fbedd2] px-3 py-1.5 text-[11px] font-medium text-[#8c6729]">
                      已展开 {selectedFlowCount}/5
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                    {[
                      { label: '当前大运', value: currentFortune?.干支 || '待识别' },
                      { label: '起运年龄', value: `${chartData.decadeFortune.起运年龄} 岁` },
                      { label: '起运日期', value: chartData.decadeFortune.起运日期 },
                    ].map((item) => (
                      <div key={item.label} className="rounded-[18px] border border-[#eadbc6] bg-[#fffaf3] px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-[#a18f79]">{item.label}</p>
                        <p className="mt-1.5 text-sm font-medium text-[#614b34]">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {renderMatrix(fortuneMatrixColumns, {
            compact: true,
            eyebrow: 'Dynamic Time Matrix',
            title: '流转矩阵',
            note: '原局与所选时序共用一张矩阵，便于直接对照',
          })}

          <div className="space-y-4">
            {renderSelectorRow(
              '大运',
              fortuneItems.map((item, index) => ({
                key: String(index),
                label: item.干支,
                meta: `${item.开始年份}-${item.结束}`,
              })),
              selectedFortuneIndex !== null ? String(selectedFortuneIndex) : null,
              (key) => {
                setSelectedFortuneIndex(Number(key));
                setSelectedFlowYear(null);
                setSelectedFlowMonth(null);
                setSelectedFlowDay(null);
                setSelectedFlowHour(null);
              },
              '先选择一个大运，下面才会展开对应的流年。',
            )}

            {renderSelectorRow(
              '流年',
              flowYearOptions.map((item) => ({
                key: String(item.year),
                label: item.label,
                meta: `${item.ganzhi} · ${item.age}岁`,
              })),
              selectedFlowYear !== null ? String(selectedFlowYear) : null,
              (key) => {
                setSelectedFlowYear(Number(key));
                setSelectedFlowMonth(null);
                setSelectedFlowDay(null);
                setSelectedFlowHour(null);
              },
              '选中大运后，这里会列出该大运区间内的全部流年。',
            )}

            {renderSelectorRow(
              '流月',
              flowMonthOptions.map((item) => ({
                key: item.key,
                label: item.label,
                meta: `${item.term} · ${formatMonthDay(item.startDate)}-${formatMonthDay(new Date(item.endDate.getTime() - 1))} · ${item.ganzhi}`,
              })),
              selectedFlowMonth !== null ? String(selectedFlowMonth) : null,
              (key) => {
                setSelectedFlowMonth(key);
                setSelectedFlowDay(null);
                setSelectedFlowHour(null);
              },
              '选中流年后，这里会按节气列出该流年的 12 个流月。',
            )}

            {renderSelectorRow(
              '流日',
              flowDayOptions.map((item) => ({
                key: item.key,
                label: item.label,
                meta: item.ganzhi,
              })),
              selectedFlowDay !== null ? String(selectedFlowDay) : null,
              (key) => {
                setSelectedFlowDay(key);
                setSelectedFlowHour(null);
              },
              '选中流月后，这里会按该节气月的实际日期范围列出全部流日。',
            )}

            {renderSelectorRow(
              '流时',
              flowHourOptions.map((item) => ({
                key: String(item.hour),
                label: item.label,
                meta: `${item.range} · ${item.ganzhi}`,
              })),
              selectedFlowHour !== null ? String(selectedFlowHour) : null,
              (key) => {
                setSelectedFlowHour(Number(key));
              },
              '选中流日后，这里会列出 12 个时辰，继续把矩阵精确到流时。',
            )}
          </div>
        </div>
      );
    }

    if (dashboardTab === 'annual') {
      return (
        <div className="space-y-5">
          <div className="rounded-[30px] border border-[#252525] bg-[#121212] p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-[#7c7c7c]">Annual Focus</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">2026 年度报告</h3>
            <p className="mt-2 text-sm leading-6 text-[#9d9d9d]">
              先以当前命盘和大运定位年度主题。后续如要更接近参天形态，再单独拆年度报告生成链路。
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              `所在大运：${currentFortune?.干支 || '待识别'}`,
              `起运节奏：${chartData.decadeFortune.起运年龄}岁起运`,
              `核心命轴：${chartData.dayMaster}日主 / ${chartData.mingGong}命宫`,
            ].map((item) => (
              <div key={item} className="rounded-[24px] border border-[#262626] bg-[#141414] p-5 text-sm leading-6 text-[#e0dbcf]">
                {item}
              </div>
            ))}
          </div>

          <div className="rounded-[30px] border border-[#252525] bg-[#121212] p-6">
            <h4 className="text-lg font-semibold text-white">建议的年度报告结构</h4>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {['年度主题判断', '事业与财务节奏', '关系与情感侧重点', '风险与避忌窗口', '可把握的阶段机会', '适合继续追问的具体问题'].map((item) => (
                <div key={item} className="rounded-[18px] border border-[#242424] bg-[#171717] px-4 py-3 text-sm text-[#d9d4ca]">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (dashboardTab === 'personality') {
      return (
        <div className="space-y-5">
          <div className="rounded-[30px] border border-[#252525] bg-[#121212] p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-[#7c7c7c]">Personality</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">个性报告</h3>
            <p className="mt-2 text-sm leading-6 text-[#9d9d9d]">
              当前先基于日主、五行强弱和已有命理要点展示个性侧重点，后续再单独拆成完整 persona 报告。
            </p>
          </div>

          <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[30px] border border-[#252525] bg-[#121212] p-6">
              <h4 className="text-lg font-semibold text-white">性格特征</h4>
              <div className="mt-4 space-y-3">
                {chartData.personalityTraits.map((item) => (
                  <div key={item} className="rounded-[18px] border border-[#242424] bg-[#171717] px-4 py-3 text-sm leading-6 text-[#dbd6cb]">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[30px] border border-[#252525] bg-[#121212] p-6">
              <h4 className="text-lg font-semibold text-white">命盘画像</h4>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {[
                  `日主：${chartData.dayMaster}`,
                  `生肖：${chartData.zodiacAnimal}`,
                  `本命佛：${chartData.guardianBuddha}`,
                  `星座：${chartData.constellation}`,
                  `命宫：${chartData.mingGong}`,
                  `身宫：${chartData.shenGong}`,
                ].map((item) => (
                  <div key={item} className="rounded-[18px] bg-[#171717] px-4 py-3 text-sm text-[#d8d2c7]">
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {chartData.keyPoints.map((item) => (
                  <span key={item} className="rounded-full border border-[#2d2d2d] bg-[#191919] px-3 py-2 text-xs text-[#cfc8b9]">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        <div className="rounded-[30px] border border-[#252525] bg-[#121212] p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-[#7c7c7c]">Deep Reading</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">深度报告</h3>
          <p className="mt-2 text-sm leading-6 text-[#9d9d9d]">
            当前先复用现有 AI 解读通道承载深度报告展示，后续再拆成独立的报告生成任务和多章节模板。
          </p>
        </div>

        <div className="rounded-[30px] border border-[#252525] bg-[#111111] p-6">
          {aiAnalysis ? (
            <div ref={analysisRef}>
              <StreamingMarkdown
                content={aiAnalysis}
                showCursor={isAnalyzing && !analysisComplete}
                isStreaming={isAnalyzing}
              />
            </div>
          ) : (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[24px] border border-dashed border-[#333333] bg-[#151515] px-6 text-center">
              <h4 className="text-2xl font-semibold text-white">深度报告尚未生成</h4>
              <p className="mt-3 max-w-xl text-sm leading-7 text-[#9b9b9b]">
                先在“咨询AI”页生成首轮解读，后面再把输出拆成参天那种更完整的多章节报告。
              </p>
              <button
                onClick={() => setDashboardTab('consult')}
                className="mt-6 rounded-full bg-[#f4f1e8] px-6 py-3 text-sm font-semibold text-black transition hover:bg-white"
              >
                前往咨询AI
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      className="min-h-screen bg-black text-white"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* 页面标题 */}
        <motion.div variants={itemVariants} className="text-center mb-2">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[#EEEEEE] via-[#CCCCCC] to-[#FF9900] bg-clip-text text-transparent">八字推命</h1>
          <p className="text-xl text-[#CCCCCC] max-w-3xl mx-auto leading-relaxed">承古圣贤智慧，析命理玄机，知己知命方能改运</p>
        </motion.div>

        <div className="space-y-8">
          {/* 信息输入区域 */}
          <motion.div className="space-y-6 p-8" variants={itemVariants}>
            <div className="mx-auto w-full max-w-5xl rounded-[28px] border border-[#2b2b2b] bg-[#121212] p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.34em] text-[#8e8e8e]">Case Manager</p>
                  <h3 className="mt-3 text-2xl font-semibold text-white">八字命例信息管理</h3>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-[#9f9f9f]">
                    保存常用命例，支持按阳历、农历或四柱录入后随时载入。当前会话与命盘结果不会写进命例，只保存基础录入信息。
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeCaseId ? (
                    <button
                      onClick={() => handleSaveCase()}
                      disabled={isGenerating}
                      className="rounded-full bg-[#f4f1e8] px-5 py-3 text-sm font-semibold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:bg-[#3b3b3b] disabled:text-[#8c8c8c]"
                    >
                      更新当前命例
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSaveCase()}
                      disabled={isGenerating}
                      className="rounded-full bg-[#f4f1e8] px-5 py-3 text-sm font-semibold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:bg-[#3b3b3b] disabled:text-[#8c8c8c]"
                    >
                      保存为命例
                    </button>
                  )}
                  {activeCaseId && (
                    <button
                      onClick={() => handleSaveCase({ forceNew: true })}
                      disabled={isGenerating}
                      className="rounded-full border border-[#4d3a1b] bg-[#20170d] px-5 py-3 text-sm font-semibold text-[#f1c782] transition hover:bg-[#291e11] disabled:cursor-not-allowed disabled:border-[#3b3b3b] disabled:bg-[#181818] disabled:text-[#7d7d7d]"
                    >
                      另存为新命例
                    </button>
                  )}
                  <button
                    onClick={handleCreateNewCase}
                    disabled={isGenerating}
                    className="rounded-full border border-[#333333] bg-[#181818] px-5 py-3 text-sm font-semibold text-[#ded6c8] transition hover:bg-[#1f1f1f] disabled:cursor-not-allowed disabled:text-[#7d7d7d]"
                  >
                    新建命例
                  </button>
                </div>
              </div>

              {savedCases.length > 0 ? (
                <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {savedCases.map((record) => (
                    <div
                      key={record.id}
                      className={`rounded-[22px] border px-4 py-4 transition ${
                        activeCaseId === record.id
                          ? 'border-[#b88944] bg-[#191612]'
                          : 'border-[#272727] bg-[#161616]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{record.title}</p>
                          <p className="mt-2 text-xs text-[#9a9a9a]">
                            {record.gender} · {getInputModeLabel(record.inputMode)} · {formatCaseBirthLabel(record)}
                          </p>
                        </div>
                        {activeCaseId === record.id && (
                          <span className="rounded-full border border-[#4d3a1b] bg-[#2b2216] px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-[#f1c782]">
                            当前
                          </span>
                        )}
                      </div>
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#c9c1b3]">
                        {record.question || '未填写问事，默认命盘总览'}
                      </p>
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => handleLoadCase(record)}
                          className="rounded-full bg-[#222222] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#2b2b2b]"
                        >
                          载入
                        </button>
                        <button
                          onClick={() => handleDeleteCase(record.id)}
                          className="rounded-full border border-[#3a2b2b] bg-[#1c1414] px-4 py-2 text-xs font-semibold text-[#e2a5a5] transition hover:bg-[#221818]"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-[22px] border border-dashed border-[#333333] bg-[#151515] px-5 py-5 text-sm leading-7 text-[#8f8f8f]">
                  还没有保存命例。录入好基础信息后，可以先保存，后面直接载入继续起盘。
                </div>
              )}
            </div>

            <div className="mx-auto w-full max-w-5xl rounded-[28px] border border-[#2b2b2b] bg-[#111111] p-6">
              <div className="grid gap-5 lg:grid-cols-2">
                <div>
                  <label className="text-sm font-medium tracking-[0.2em] text-[#b8b0a2]">* 姓名</label>
                  <input
                    type="text"
                    value={birthInfo.name}
                    onChange={handleNameChange}
                    className="mt-3 w-full rounded-2xl border-2 border-[#333333] bg-[#1a1a1a] px-5 py-4 text-lg font-medium text-white outline-none transition focus:border-[#FF9900] focus:ring-2 focus:ring-[#FF9900]/30 placeholder:text-[#888888]"
                    placeholder="请输入命主姓名"
                    disabled={isGenerating}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium tracking-[0.2em] text-[#b8b0a2]">问事</label>
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="有具体想问的事情吗？"
                    className="mt-3 w-full rounded-2xl border-2 border-[#333333] bg-[#1a1a1a] px-5 py-4 text-lg font-medium text-white outline-none transition focus:border-[#FF9900] focus:ring-2 focus:ring-[#FF9900]/30 placeholder:text-[#888888]"
                    disabled={isGenerating}
                  />
                </div>
              </div>

              <div className="mt-6 grid gap-5 lg:grid-cols-[220px_1fr]">
                <div>
                  <p className="text-sm font-medium tracking-[0.2em] text-[#b8b0a2]">性别</p>
                  <div className="mt-3 flex gap-3">
                    {(['男', '女'] as const).map((gender) => (
                      <button
                        key={gender}
                        onClick={() => handleGenderChange(gender)}
                        disabled={isGenerating}
                        className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
                          birthInfo.gender === gender
                            ? 'bg-[#f4f1e8] text-black'
                            : 'border border-[#333333] bg-[#1a1a1a] text-[#d3cbbb] hover:bg-[#202020]'
                        }`}
                      >
                        {gender}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium tracking-[0.2em] text-[#b8b0a2]">录入方式</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {([
                      { id: 'solar', label: '阳历输入' },
                      { id: 'lunar', label: '农历输入' },
                      { id: 'pillars', label: '四柱反查' },
                    ] as Array<{ id: BaziInputMode; label: string }>).map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => handleModeChange(mode.id)}
                        disabled={isGenerating}
                        className={`rounded-full px-4 py-3 text-sm font-semibold transition ${
                          inputMode === mode.id
                            ? 'bg-[#FF9900] text-black'
                            : 'border border-[#333333] bg-[#1a1a1a] text-[#d3cbbb] hover:bg-[#202020]'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-[24px] border border-[#272727] bg-[#151515] p-5">
                  {inputMode === 'solar' && (
                    <div>
                      <p className="text-sm uppercase tracking-[0.28em] text-[#8a8a8a]">Solar Birth</p>
                      <h4 className="mt-3 text-xl font-semibold text-white">阳历出生时间</h4>
                      <input
                        type="datetime-local"
                        value={formatDateTimeForInput(selectedBirthTime)}
                        onChange={handleBirthTimeChange}
                        className="mt-5 w-full rounded-2xl border border-[#333333] bg-black px-4 py-3 text-base text-white outline-none transition focus:border-[#FF9900] [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:invert"
                        style={{
                          colorScheme: 'dark',
                          WebkitTextFillColor: 'white',
                        }}
                        disabled={isGenerating}
                      />
                    </div>
                  )}

                  {inputMode === 'lunar' && (
                    <div>
                      <p className="text-sm uppercase tracking-[0.28em] text-[#8a8a8a]">Lunar Birth</p>
                      <h4 className="mt-3 text-xl font-semibold text-white">农历出生时间</h4>
                      <div className="mt-5 grid gap-3 md:grid-cols-5">
                        {([
                          { key: 'year', label: '年', placeholder: '1990' },
                          { key: 'month', label: '月', placeholder: '1-12' },
                          { key: 'day', label: '日', placeholder: '1-30' },
                          { key: 'hour', label: '时', placeholder: '0-23' },
                          { key: 'minute', label: '分', placeholder: '0-59' },
                        ] as Array<{ key: keyof BaziLunarInput; label: string; placeholder: string }>).map((item) => (
                          <div key={item.key}>
                            <label className="text-xs uppercase tracking-[0.24em] text-[#8a8a8a]">{item.label}</label>
                            <input
                              type="number"
                              value={lunarInput[item.key]}
                              onChange={(e) => handleLunarInputChange(item.key, e.target.value)}
                              placeholder={item.placeholder}
                              className="mt-2 w-full rounded-2xl border border-[#333333] bg-[#1a1a1a] px-4 py-3 text-white outline-none transition focus:border-[#FF9900]"
                              disabled={isGenerating}
                            />
                          </div>
                        ))}
                      </div>
                      <p className="mt-4 text-xs leading-6 text-[#8f8f8f]">
                        当前先支持常规农历年月日时分输入；闰月场景后续再单独补开关。
                      </p>
                    </div>
                  )}

                  {inputMode === 'pillars' && (
                    <div>
                      <p className="text-sm uppercase tracking-[0.28em] text-[#8a8a8a]">Four Pillars Lookup</p>
                      <h4 className="mt-3 text-xl font-semibold text-white">四柱反查阳历时间</h4>
                      <div className="mt-5 grid gap-3 md:grid-cols-4">
                        {([
                          { key: 'year', label: '年柱', placeholder: '例如 庚午' },
                          { key: 'month', label: '月柱', placeholder: '例如 甲申' },
                          { key: 'day', label: '日柱', placeholder: '例如 壬子' },
                          { key: 'hour', label: '时柱', placeholder: '例如 丁未' },
                        ] as Array<{ key: keyof BaziPillarInput; label: string; placeholder: string }>).map((item) => (
                          <div key={item.key}>
                            <label className="text-xs uppercase tracking-[0.24em] text-[#8a8a8a]">{item.label}</label>
                            <input
                              type="text"
                              value={pillarInput[item.key]}
                              onChange={(e) => handlePillarInputChange(item.key, e.target.value)}
                              placeholder={item.placeholder}
                              className="mt-2 w-full rounded-2xl border border-[#333333] bg-[#1a1a1a] px-4 py-3 text-white outline-none transition focus:border-[#FF9900]"
                              disabled={isGenerating}
                            />
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 flex flex-wrap items-center gap-3">
                        <button
                          onClick={handleReversePillarLookup}
                          disabled={isGenerating}
                          className="rounded-full bg-[#f4f1e8] px-5 py-3 text-sm font-semibold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:bg-[#3b3b3b] disabled:text-[#8c8c8c]"
                        >
                          反查候选阳历时间
                        </button>
                        <span className="text-sm text-[#9b9b9b]">
                          已找到 {pillarCandidates.length} 条候选
                        </span>
                      </div>

                      <div className="mt-4">
                        <label className="text-xs uppercase tracking-[0.24em] text-[#8a8a8a]">候选阳历时间</label>
                        <select
                          value={selectedPillarCandidateIso}
                          onChange={(e) => setSelectedPillarCandidateIso(e.target.value)}
                          className="mt-2 w-full rounded-2xl border border-[#333333] bg-[#1a1a1a] px-4 py-3 text-white outline-none transition focus:border-[#FF9900]"
                          disabled={isGenerating || pillarCandidates.length === 0}
                        >
                          <option value="">请选择候选阳历时间</option>
                          {pillarCandidates.map((item) => (
                            <option key={item.iso} value={item.iso}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-[24px] border border-[#272727] bg-[#151515] p-5">
                  <p className="text-sm uppercase tracking-[0.28em] text-[#8a8a8a]">Input Preview</p>
                  <h4 className="mt-3 text-xl font-semibold text-white">录入预览</h4>

                  {inputPreview ? (
                    <div className="mt-5 space-y-4">
                      <div className="rounded-[18px] bg-[#1b1b1b] px-4 py-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-[#9b9b9b]">阳历</p>
                        <p className="mt-2 text-sm leading-7 text-white">{inputPreview.solarText}</p>
                      </div>
                      <div className="rounded-[18px] bg-[#1b1b1b] px-4 py-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-[#9b9b9b]">农历</p>
                        <p className="mt-2 text-sm leading-7 text-white">{inputPreview.lunarText}</p>
                      </div>
                      <div className="rounded-[18px] bg-[#1b1b1b] px-4 py-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-[#9b9b9b]">四柱</p>
                        <p className="mt-2 text-sm leading-7 text-white">{inputPreview.baziText}</p>
                      </div>
                      {inputPreview.note && (
                        <p className="text-sm leading-7 text-[#9b9b9b]">{inputPreview.note}</p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-5 rounded-[18px] border border-dashed border-[#333333] bg-[#131313] px-4 py-5 text-sm leading-7 text-[#8f8f8f]">
                      录入完整后，这里会即时显示阳历、农历和四柱预览，方便确认命例信息是否正确。
                    </div>
                  )}

                  <div className="mt-5 rounded-[18px] border border-[#2b2b2b] bg-[#121212] px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-[#9b9b9b]">当前模式</p>
                    <p className="mt-2 text-sm text-white">{getInputModeLabel(inputMode)}</p>
                    {inputMode === 'pillars' && selectedPillarCandidateIso && (
                      <p className="mt-3 text-sm leading-6 text-[#b9b2a5]">
                        当前选中候选：{formatDateTimeLabel(parseLocalDateTime(selectedPillarCandidateIso))}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 开始起盘按钮 */}
            <div className="flex justify-center">
              <motion.button 
                onClick={performDivination}
                disabled={isGenerating || !birthInfo.name.trim()}
                className={`px-12 py-4 rounded-xl font-bold text-xl transition-all duration-300 shadow-lg flex items-center justify-center ${
                  isGenerating || !birthInfo.name.trim()
                    ? 'bg-[#444444] text-[#888888] cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#FF9900] to-[#E68A00] text-black hover:from-[#E68A00] hover:to-[#CC7700] hover:shadow-xl hover:shadow-[#FF9900]/30'
                }`}
                whileHover={!isGenerating && birthInfo.name.trim() ? { scale: 1.05, y: -2 } : {}}
                whileTap={!isGenerating && birthInfo.name.trim() ? { scale: 0.98 } : {}}
              >
                {isGenerating ? (
                  <span className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current"></div>
                    正在起盘...
                  </span>
                ) : (
                  '开始八字推命'
                )}
              </motion.button>
            </div>
          </motion.div>

          {/* 起盘动画区域 */}
          <AnimatePresence>
            {isGenerating && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center">
                  <h3 className="text-2xl font-semibold text-white mb-6">八字推演，命理推测</h3>
                  
                  {/* 起盘动画区域 */}
                  <div className="flex justify-center">
                    <div className="bg-black flex items-center justify-center relative overflow-hidden rounded-xl" style={{ width: '560px', height: '315px' }}>
                      {/* 实际使用MP4视频 */}
                      <video 
                        autoPlay 
                        muted 
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-cover rounded-xl"
                        style={{ width: '560px', height: '315px' }}
                        onEnded={handleVideoEnded}
                        onError={(e) => {
                          console.log('八字视频加载失败，显示备用动画');
                          const video = e.target as HTMLVideoElement;
                          video.style.display = 'none';
                        }}
                        onCanPlayThrough={() => {
                          console.log('八字视频可以播放');
                        }}
                      >
                        <source src={getVideoPath('bazi.mp4')} type="video/mp4" />
                        {/* 如果视频加载失败，显示备用动画 */}
                        <div className="relative">
                          <motion.div
                            className="w-16 h-16 border-4 border-[#FF9900] border-t-transparent rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          />
                          <motion.div
                            className="absolute inset-4 border-2 border-[#CCCCCC] border-b-transparent rounded-full"
                            animate={{ rotate: -360 }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                          />
                          <motion.div
                            className="absolute inset-8 w-16 h-16 flex items-center justify-center"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <span className="text-[#FF9900] text-2xl font-bold">命</span>
                          </motion.div>
                        </div>
                      </video>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 八字排盘结果 */}
          {chartData && !isGenerating && hasPerformedDivination && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="mx-auto w-full max-w-[1280px] space-y-6">
                <motion.div
                  className="overflow-hidden rounded-[36px] border border-[#242424] bg-[radial-gradient(circle_at_top_left,_rgba(245,236,215,0.18),_rgba(18,18,18,0.96)_40%)]"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.08 }}
                >
                  <div className="grid gap-5 px-6 py-7 lg:grid-cols-[1.3fr_0.7fr] lg:px-8">
                    <div>
                      <p className="text-xs uppercase tracking-[0.36em] text-[#8d887c]">Cantian Style Dashboard</p>
                      <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">{chartData.name || '命盘用户'} 的八字仪表盘</h2>
                      <p className="mt-3 max-w-2xl text-sm leading-7 text-[#bdb6a8]">
                        结构沿参天 dashboard 靠拢：先给顶部摘要、左侧导航与右侧内容区。当前保留原有交互链路，重点先把版式和信息层级拉齐。
                      </p>
                      <div className="mt-5 flex flex-wrap gap-2">
                        {[chartData.baziText, `${chartData.dayMaster}日主`, `属${chartData.zodiacAnimal}`, `${chartData.decadeFortune.起运年龄}岁起运`].map((item) => (
                          <span key={item} className="rounded-full border border-[#3a362d] bg-[#181614] px-4 py-2 text-xs text-[#e4dccd]">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1">
                      {[
                        { label: '阳历', value: chartData.solarDateText },
                        { label: '农历', value: chartData.lunarDateText },
                        { label: '当前大运', value: currentFortune?.干支 || '待识别' },
                        { label: '命宫 / 身宫', value: `${chartData.mingGong} / ${chartData.shenGong}` },
                      ].map((item) => (
                        <div key={item.label} className="rounded-[22px] border border-[#2a2a2a] bg-[#121212]/90 px-4 py-4">
                          <p className="text-xs uppercase tracking-[0.28em] text-[#7f7a70]">{item.label}</p>
                          <p className="mt-3 text-sm leading-6 text-[#f2ede3]">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
                  <motion.div
                    className="space-y-5 xl:sticky xl:top-6 xl:self-start"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.12 }}
                  >
                    <div className="rounded-[32px] border border-[#242424] bg-[#101010] p-5">
                      <p className="text-xs uppercase tracking-[0.34em] text-[#7e7e7e]">Navigation</p>
                      <div className="mt-4 space-y-2">
                        {dashboardTabs.map((tab) => {
                          const isActive = dashboardTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => setDashboardTab(tab.id)}
                              className={`flex w-full items-center justify-between rounded-[20px] px-4 py-3 text-left text-sm font-medium transition ${
                                isActive
                                  ? 'border border-[#3b362d] bg-[#efe6d4] text-black'
                                  : 'border border-transparent bg-[#171717] text-[#d5cec0] hover:border-[#2d2d2d] hover:bg-[#1b1b1b]'
                              }`}
                            >
                              <span>{tab.label}</span>
                              <span className={`text-xs ${isActive ? 'text-black/60' : 'text-[#7d7d7d]'}`}>0{dashboardTabs.findIndex((item) => item.id === tab.id) + 1}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-[32px] border border-[#242424] bg-[#121212] p-5">
                      <p className="text-xs uppercase tracking-[0.34em] text-[#7e7e7e]">Action</p>
                      <h3 className="mt-3 text-xl font-semibold text-white">继续深挖命盘</h3>
                      <p className="mt-3 text-sm leading-7 text-[#9b9b9b]">
                        这里先保留原项目的分析链路。需要追问时，直接切到“咨询AI”并生成解读。
                      </p>
                      <div className="mt-5 space-y-3">
                        <button
                          onClick={() => setDashboardTab('consult')}
                          className="w-full rounded-full bg-[#f4f1e8] px-5 py-3 text-sm font-semibold text-black transition hover:bg-white"
                        >
                          前往咨询AI
                        </button>
                        {!selectedMaster && (
                          <button
                            onClick={() => navigate('/settings')}
                            className="w-full rounded-full border border-[#303030] bg-[#181818] px-5 py-3 text-sm font-semibold text-[#d9d2c4] transition hover:bg-[#1d1d1d]"
                          >
                            选择大师
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.16 }}
                  >
                    {renderDashboardContent()}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* 错误提示 */}
      <ErrorToast
        isVisible={!!error}
        message={error || ''}
        onClose={() => setError(null)}
      />
    </motion.div>
  );
};

export default BaZiPage; 

