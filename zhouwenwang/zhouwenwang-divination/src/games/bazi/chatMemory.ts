import { getItem, removeItem, setItem } from '../../core/storage';
import type { Master } from '../../types';
import type { BaZiChartData } from './logic';

const BAZI_CHAT_STORAGE_KEY = 'zhouwenwang_bazi_chat_sessions';
const MAX_MESSAGES = 30;
const MAX_MEMORY_ITEMS = 12;
const MAX_CONTEXT_MESSAGES = 10;

export type BaziChatRole = 'user' | 'assistant';
export type BaziMemoryKind = 'user_focus' | 'assistant_insight';

export interface BaziChatMessage {
  id: string;
  role: BaziChatRole;
  content: string;
  timestamp: number;
}

export interface BaziChatMemoryItem {
  id: string;
  kind: BaziMemoryKind;
  content: string;
  timestamp: number;
}

export interface BaziChatSession {
  sessionId: string;
  chartId: string;
  chartFingerprint: string;
  chartLabel: string;
  masterId?: string;
  masterName?: string;
  createdAt: number;
  updatedAt: number;
  messages: BaziChatMessage[];
  memories: BaziChatMemoryItem[];
}

interface BaziChatStorage {
  sessions: Record<string, BaziChatSession>;
  lastUpdated: number;
}

export interface BaziGeminiContent {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

function getEmptyStorage(): BaziChatStorage {
  return {
    sessions: {},
    lastUpdated: Date.now(),
  };
}

function getStorage(): BaziChatStorage {
  const result = getItem<BaziChatStorage>(BAZI_CHAT_STORAGE_KEY);
  if (result.success && result.data && typeof result.data === 'object') {
    return result.data;
  }

  return getEmptyStorage();
}

function saveStorage(storage: BaziChatStorage) {
  storage.lastUpdated = Date.now();
  const result = setItem(BAZI_CHAT_STORAGE_KEY, storage);
  if (!result.success) {
    throw new Error(result.error || '保存八字聊天记录失败');
  }
}

function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^[>#*\-\d.\s]+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateText(text: string, maxLength: number): string {
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}...` : text;
}

function createMessageId(role: BaziChatRole, timestamp: number): string {
  return `${role}_${timestamp}_${Math.random().toString(36).slice(2, 8)}`;
}

function createMemoryId(kind: BaziMemoryKind, timestamp: number): string {
  return `${kind}_${timestamp}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeForCompare(text: string): string {
  return stripMarkdown(text).toLowerCase();
}

function upsertMemoryItem(
  memories: BaziChatMemoryItem[],
  kind: BaziMemoryKind,
  content: string,
  timestamp: number,
): BaziChatMemoryItem[] {
  const cleaned = truncateText(stripMarkdown(content), kind === 'user_focus' ? 80 : 120);
  if (!cleaned) {
    return memories;
  }

  const compareKey = normalizeForCompare(cleaned);
  const filtered = memories.filter((item) => normalizeForCompare(item.content) !== compareKey);
  filtered.push({
    id: createMemoryId(kind, timestamp),
    kind,
    content: cleaned,
    timestamp,
  });

  return filtered.slice(-MAX_MEMORY_ITEMS);
}

function isLocalEngineAssistantContent(content: string): boolean {
  return content.startsWith('## 喜用神规则分析 V2')
    || content.startsWith('## 过三关直断');
}

function extractAssistantInsights(content: string): string[] {
  const cleaned = stripMarkdown(content);
  if (!cleaned) {
    return [];
  }

  const segments = cleaned
    .split(/[\n。！？]/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 10);

  const maxInsights = isLocalEngineAssistantContent(content) ? 4 : 2;
  return segments.slice(0, maxInsights).map((item) => truncateText(item, 120));
}

function updateMemories(
  existing: BaziChatMemoryItem[],
  message: BaziChatMessage,
): BaziChatMemoryItem[] {
  if (message.role === 'user') {
    return upsertMemoryItem(existing, 'user_focus', message.content, message.timestamp);
  }

  return extractAssistantInsights(message.content).reduce(
    (current, insight) => upsertMemoryItem(current, 'assistant_insight', insight, message.timestamp),
    existing,
  );
}

export function buildBaziChartFingerprint(chartData: BaZiChartData): string {
  const name = chartData.name.trim() || 'anonymous';
  const birthTime = `${chartData.birthDate.getFullYear()}-${String(chartData.birthDate.getMonth() + 1).padStart(2, '0')}-${String(chartData.birthDate.getDate()).padStart(2, '0')} ${String(chartData.birthTime).padStart(2, '0')}:00`;
  return [
    'bazi-chat',
    name,
    chartData.gender,
    birthTime,
    chartData.isLunar ? 'lunar' : 'solar',
    chartData.baziText,
  ].join('|');
}

function createSession(chartData: BaZiChartData, master?: Master | null): BaziChatSession {
  const timestamp = Date.now();
  const fingerprint = buildBaziChartFingerprint(chartData);

  return {
    sessionId: fingerprint,
    chartId: chartData.id,
    chartFingerprint: fingerprint,
    chartLabel: `${chartData.name || '未命名'} · ${chartData.baziText}`,
    masterId: master?.id,
    masterName: master?.name,
    createdAt: timestamp,
    updatedAt: timestamp,
    messages: [],
    memories: [],
  };
}

export function getBaziChatSession(chartData: BaZiChartData, master?: Master | null): BaziChatSession {
  const storage = getStorage();
  const fingerprint = buildBaziChartFingerprint(chartData);
  const existing = storage.sessions[fingerprint];

  if (!existing) {
    return createSession(chartData, master);
  }

  return {
    ...existing,
    chartId: chartData.id,
    chartLabel: `${chartData.name || '未命名'} · ${chartData.baziText}`,
    masterId: master?.id || existing.masterId,
    masterName: master?.name || existing.masterName,
  };
}

export function saveBaziChatSession(session: BaziChatSession) {
  const storage = getStorage();
  storage.sessions[session.chartFingerprint] = {
    ...session,
    updatedAt: Date.now(),
  };
  saveStorage(storage);
}

export function clearBaziChatSession(chartData: BaZiChartData) {
  const storage = getStorage();
  const fingerprint = buildBaziChartFingerprint(chartData);
  delete storage.sessions[fingerprint];
  saveStorage(storage);
}

export function removeAllBaziChatSessions() {
  removeItem(BAZI_CHAT_STORAGE_KEY);
}

export function appendBaziChatMessage(
  session: BaziChatSession,
  role: BaziChatRole,
  content: string,
): BaziChatSession {
  const cleaned = content.trim();
  if (!cleaned) {
    return session;
  }

  const timestamp = Date.now();
  const message: BaziChatMessage = {
    id: createMessageId(role, timestamp),
    role,
    content: cleaned,
    timestamp,
  };

  const nextMessages = [...session.messages, message].slice(-MAX_MESSAGES);
  const nextMemories = updateMemories(session.memories, message);

  return {
    ...session,
    updatedAt: timestamp,
    messages: nextMessages,
    memories: nextMemories,
  };
}

export function getRecentContextMessages(session: BaziChatSession): BaziChatMessage[] {
  return session.messages.slice(-MAX_CONTEXT_MESSAGES);
}

export function getBaziMemorySummary(session: BaziChatSession): string {
  const userFocuses = session.memories
    .filter((item) => item.kind === 'user_focus')
    .slice(-4)
    .map((item) => `- ${item.content}`);
  const assistantInsights = session.memories
    .filter((item) => item.kind === 'assistant_insight')
    .slice(-4)
    .map((item) => `- ${item.content}`);

  const blocks: string[] = [];

  if (userFocuses.length > 0) {
    blocks.push(['用户持续关注：', ...userFocuses].join('\n'));
  }

  if (assistantInsights.length > 0) {
    blocks.push(['已形成的关键结论：', ...assistantInsights].join('\n'));
  }

  return blocks.join('\n\n');
}

function buildSystemInstruction(_master: Master, _hasSpecialContext: boolean): string {
  return [
    '补充规则：',
    '- 不要使用任何“大师人设”“古风口吻”或角色扮演式语气，按正常、直接、专业的命理分析口径输出。',
    '- 不要模仿某个大师团队成员的说话方式，也不要加入表演性寒暄、神秘化铺垫或人格化设定。',
    '- 当前是一个多轮八字咨询会话，必须承接前文，不要把每次回复都当作全新请求。',
    '- 命盘数据里 chartData.rawBaziData 为最高优先级依据，不得自行改盘，不得捏造额外四柱信息。',
    '- 回答必须使用简体中文。',
    '- 若用户追问局部问题，优先直接回答该问题，再给出依据和建议。',
    '- 若用户追问大运、流年、流月，必须结合已提供命盘和当前上下文，不要泛泛而谈。',
    '- 当结论存在不确定性时，要明确指出依据边界，不要假装确定。',
    '- 不要重复整份命盘，除非用户明确要求重新总览。',
    '- 若命盘上下文里已经带有本地规则引擎结果，必须优先吸收这些结果，不要另起一套互相打架的判断。',
    '- 默认不要复述内部推导过程，不要展开“第一关 / 第二关 / 第三关”，不要转述隐藏 JSON 或规则表。',
    '- 默认输出口径收敛为：1. 流年验事 2. 六亲断语 3. 直接回答当前问题。',
    '- 只有用户明确追问“为什么”或“依据是什么”时，才补充简短证据，不要把整套规则分析全文贴出来。',
    '- 上下文中的本地规则不是可随意忽略的装饰信息，而是强参考；尤其兄弟数量排行、头胎男女、同胎、多子少子等定式，默认以本地规则为主。',
    '- 八字原盘、十神结构、宫位关系、大运流年、喜用神结论和当前问题必须合参，不允许只抓单一角度下结论。',
    '- 流年验事必须同时结合喜用神、神煞、刑冲合害、打中宫位、触发十神和牵动六亲，不能只讲空泛年份。',
    '- 如果本地规则提示与命盘结构、现实年龄常识或当前提问方向冲突，优先做综合校验后再作答，并明确保留不确定性，而不是简单丢弃规则结果。',
  ]
    .filter(Boolean)
    .join('\n\n');
}

function buildChartContextPayload(chartData: BaZiChartData, activeFocus?: string) {
  return {
    profile: {
      name: chartData.name,
      gender: chartData.gender,
      solarDate: chartData.solarDateText,
      lunarDate: chartData.lunarDateText,
      birthTimeRange: `${chartData.birthTime}:00-${String((chartData.birthTime + 1) % 24).padStart(2, '0')}:00`,
    },
    chartSummary: {
      bazi: chartData.baziText,
      dayMaster: chartData.dayMaster,
      zodiacAnimal: chartData.zodiacAnimal,
      guardianBuddha: chartData.guardianBuddha,
      constellation: chartData.constellation,
      mingGong: chartData.mingGong,
      shenGong: chartData.shenGong,
      wuxingAnalysis: chartData.wuxingAnalysis,
    },
    activeFocus: activeFocus || null,
    decadeFortune: chartData.decadeFortune,
    relationSummary: chartData.relationSummary,
    rawBaziData: chartData.rawBaziData,
  };
}

export function buildBaziChatContents(params: {
  chartData: BaZiChartData;
  master: Master;
  session: BaziChatSession;
  activeFocus?: string;
}): BaziGeminiContent[] {
  const { chartData, master, session, activeFocus } = params;
  const recentMessages = getRecentContextMessages(session);
  const memorySummary = getBaziMemorySummary(session);
  const hasSpecialContext = recentMessages.some((item) => item.role === 'user' && item.content.trim().length > 0);

  const contents: BaziGeminiContent[] = [
    {
      role: 'user',
      parts: [
        {
          text: `【系统规则】\n${buildSystemInstruction(master, hasSpecialContext)}`,
        },
      ],
    },
    {
      role: 'user',
      parts: [
        {
          text: `【命盘上下文】\n${JSON.stringify(buildChartContextPayload(chartData, activeFocus), null, 2)}`,
        },
      ],
    },
  ];

  if (memorySummary) {
    contents.push({
      role: 'user',
      parts: [
        {
          text: `【会话记忆】\n${memorySummary}`,
        },
      ],
    });
  }

  return contents.concat(
    recentMessages.map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }],
    })),
  );
}
