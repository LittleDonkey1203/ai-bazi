import { getItem, setItem } from '../../core/storage';
import { StorageKeys } from '../../core/types';

export type BaziInputMode = 'solar' | 'lunar' | 'pillars';

export interface BaziLunarInput {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
}

export interface BaziPillarInput {
  year: string;
  month: string;
  day: string;
  hour: string;
}

export interface BaziCaseRecord {
  id: string;
  title: string;
  name: string;
  gender: '男' | '女';
  question: string;
  inputMode: BaziInputMode;
  solarDateTime?: string;
  lunarInput?: BaziLunarInput;
  pillarInput?: BaziPillarInput;
  selectedPillarSolarTime?: string;
  createdAt: number;
  updatedAt: number;
}

function createCaseId(seed: number, index = 0): string {
  return `bazi_case_${seed}_${index}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeCases(cases: BaziCaseRecord[]): BaziCaseRecord[] {
  return [...cases].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getBaziCases(): BaziCaseRecord[] {
  const result = getItem<BaziCaseRecord[]>(StorageKeys.BAZI_CASES);
  if (!result.success || !Array.isArray(result.data)) {
    return [];
  }

  let didMigrate = false;
  const hydrated = result.data.map((item, index) => {
    if (item?.id) {
      return item;
    }

    didMigrate = true;
    const fallbackTime = item?.updatedAt || item?.createdAt || Date.now();
    return {
      ...item,
      id: createCaseId(fallbackTime, index),
      createdAt: item?.createdAt || fallbackTime,
      updatedAt: item?.updatedAt || fallbackTime,
    } as BaziCaseRecord;
  });

  const normalized = normalizeCases(hydrated);
  if (didMigrate) {
    void setItem(StorageKeys.BAZI_CASES, normalized);
  }

  return normalized;
}

export function saveBaziCase(
  input: Omit<BaziCaseRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
): BaziCaseRecord {
  const existing = getBaziCases();
  const now = Date.now();
  const previous = input.id ? existing.find((item) => item.id === input.id) : undefined;
  const { id, ...rest } = input;

  const nextRecord: BaziCaseRecord = {
    ...rest,
    id: id || createCaseId(now),
    createdAt: previous?.createdAt || now,
    updatedAt: now,
  };

  const nextList = normalizeCases([
    nextRecord,
    ...existing.filter((item) => item.id !== nextRecord.id),
  ]);

  const result = setItem(StorageKeys.BAZI_CASES, nextList);
  if (!result.success) {
    throw new Error(result.error || '保存命例失败');
  }

  return nextRecord;
}

export function deleteBaziCase(id: string): BaziCaseRecord[] {
  const nextList = getBaziCases().filter((item) => item.id !== id);
  const result = setItem(StorageKeys.BAZI_CASES, nextList);
  if (!result.success) {
    throw new Error(result.error || '删除命例失败');
  }
  return nextList;
}
