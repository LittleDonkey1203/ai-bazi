import React from 'react';
import { getWuxingColor } from '../logic';

export type HiddenStemName = '主气' | '中气' | '余气';
export type HiddenStemValue = {
  天干: string;
  十神: string;
};

export interface BaziCompactGridColumn {
  key: string;
  title: string;
  subtitle?: string;
  stemTenGod?: string;
  stem: string;
  stemWuxing: string;
  branch: string;
  branchWuxing: string;
  hiddenStems: Partial<Record<HiddenStemName, HiddenStemValue>>;
  nayin?: string;
  xun?: string;
  kongwang?: string;
  xingyun?: string;
  zizuo?: string;
  gods: string[];
  relations: string[];
}

export interface BaziCompactGridProps {
  columns: BaziCompactGridColumn[];
  hideRows?: string[];
  dataMinWidth?: number;
  labelWidth?: number;
  hideColumnSubtitle?: boolean;
}

const SHORT_GODS_MAP: Record<string, string> = {
  '天乙贵人': '天乙',
  '福星贵人': '福星',
  '德秀贵人': '德秀',
  '文昌贵人': '文昌',
  '太极贵人': '太极',
  '天德贵人': '天德',
  '月德贵人': '月德',
  '天厨贵人': '天厨',
  '天官贵人': '天官',
  '国印贵人': '国印',
};

const Dash: React.FC = () => <span className="text-[#b7a892]">—</span>;

const HIDDEN_STEM_KEYS: HiddenStemName[] = ['主气', '中气', '余气'];

interface GridRow {
  label: string;
  render: (col: BaziCompactGridColumn) => React.ReactNode;
}

const ROWS: GridRow[] = [
  {
    label: '主星',
    render: (col) =>
      col.stemTenGod ? (
        <span className="text-[12px] leading-5 text-[#5f4a33]">{col.stemTenGod}</span>
      ) : (
        <Dash />
      ),
  },
  {
    label: '天干',
    render: (col) => (
      <span
        data-testid={`compact-stem-${col.key}`}
        className="text-[22px] leading-7 font-bold font-serif"
        style={{ color: getWuxingColor(col.stemWuxing) }}
      >
        {col.stem || '—'}
      </span>
    ),
  },
  {
    label: '地支',
    render: (col) => (
      <span
        data-testid={`compact-branch-${col.key}`}
        className="text-[22px] leading-7 font-bold font-serif"
        style={{ color: getWuxingColor(col.branchWuxing) }}
      >
        {col.branch || '—'}
      </span>
    ),
  },
  {
    label: '藏干',
    render: (col) => {
      const items = HIDDEN_STEM_KEYS.map((k) => col.hiddenStems[k]).filter(
        (v): v is HiddenStemValue => Boolean(v),
      );
      if (items.length === 0) return <Dash />;
      return (
        <div className="flex flex-col items-center gap-0.5 leading-4">
          {items.map((item, i) => (
            <span key={`${col.key}-h-${i}`} className="text-[11px] text-[#5f4a33]">
              <span className="font-semibold">{item.天干}</span>
              <span className="ml-0.5 text-[10px] text-[#8b775e]">{item.十神}</span>
            </span>
          ))}
        </div>
      );
    },
  },
  {
    label: '星运',
    render: (col) => <span className="text-[12px] text-[#5f4a33]">{col.xingyun || '—'}</span>,
  },
  {
    label: '自坐',
    render: (col) => <span className="text-[12px] text-[#5f4a33]">{col.zizuo || '—'}</span>,
  },
  {
    label: '空亡',
    render: (col) => <span className="text-[12px] text-[#5f4a33]">{col.kongwang || '—'}</span>,
  },
  {
    label: '纳音',
    render: (col) => <span className="text-[11px] text-[#5f4a33] break-keep">{col.nayin || '—'}</span>,
  },
  {
    label: '神煞',
    render: (col) =>
      col.gods.length > 0 ? (
        <div
          data-testid={`compact-gods-${col.key}`}
          className="flex flex-col items-center gap-0.5 leading-4"
        >
          {col.gods.map((item) => (
            <span key={`${col.key}-g-${item}`} className="text-[11px] text-[#7a6243] break-keep">
              {item}
            </span>
          ))}
        </div>
      ) : (
        <Dash />
      ),
  },
  {
    label: '刑冲合会',
    render: (col) =>
      col.relations.length > 0 ? (
        <div
          data-testid={`compact-relations-${col.key}`}
          className="flex flex-col items-center gap-0.5 leading-4"
        >
          {col.relations.map((item, i) => (
            <span key={`${col.key}-r-${i}`} className="text-[11px] text-[#7a6243] break-keep">
              {item}
            </span>
          ))}
        </div>
      ) : (
        <Dash />
      ),
  },
];

export const BaziCompactGrid: React.FC<BaziCompactGridProps> = ({
  columns,
  hideRows = [],
  dataMinWidth = 56,
  labelWidth = 38,
  hideColumnSubtitle = false,
}) => {
  const dataColCount = columns.length;
  const minWidth = labelWidth + dataColCount * dataMinWidth;
  const isCompact = dataMinWidth < 40;

  const gridStyle: React.CSSProperties = {
    gridTemplateColumns: `${labelWidth}px repeat(${dataColCount}, minmax(${dataMinWidth}px, 1fr))`,
    minWidth: `${minWidth}px`,
  };

  const visibleRows = ROWS.filter((row) => !hideRows.includes(row.label));

  const useShortGods = dataColCount >= 7;
  const processedColumns = useShortGods
    ? columns.map((col) => ({
        ...col,
        gods: col.gods.map((name) => SHORT_GODS_MAP[name] ?? name),
      }))
    : columns;

  return (
    <div data-testid="bazi-compact-grid" className="overflow-x-auto -mx-1">
      <div className="grid items-center bg-[var(--c-paper-50)] rounded-[18px] border border-[#ead9bf] overflow-hidden" style={gridStyle}>
        {/* 列头行:左空 + N 列标题 */}
        <div
          className="sticky left-0 z-10 bg-[#f5ecdf] py-2 text-[10px] font-medium text-[#866c4e] border-b border-[#f0e4cf] text-center"
          style={{ paddingLeft: 0, paddingRight: 0 }}
        >
          <div className="leading-4 font-serif whitespace-nowrap">日期</div>
        </div>
        {processedColumns.map((col) => (
          <div
            key={`h-${col.key}`}
            className="py-2 text-center text-[12px] font-semibold text-[#5a452f] border-b border-[#f0e4cf]"
            style={{ paddingLeft: isCompact ? 0 : 4, paddingRight: isCompact ? 0 : 4 }}
          >
            <div className="leading-4 font-serif">{col.title}</div>
            {col.subtitle && !hideColumnSubtitle && (
              <div className="mt-0.5 text-[10px] font-normal leading-3 text-[#8f7758] line-clamp-2">
                {col.subtitle}
              </div>
            )}
          </div>
        ))}

        {/* 数据行 */}
        {visibleRows.map((row, rowIndex) => (
          <React.Fragment key={`row-${row.label}`}>
            <div
              className={`sticky left-0 z-10 bg-[#f5ecdf] px-1.5 py-2 text-[11px] font-medium text-[#866c4e] font-serif flex items-center justify-center h-full ${
                rowIndex < visibleRows.length - 1 ? 'border-b border-[#f0e4cf]' : ''
              }`}
            >
              {row.label}
            </div>
            {processedColumns.map((col) => (
              <div
                key={`${row.label}-${col.key}`}
                className={`py-2 text-center flex items-center justify-center h-full ${
                  rowIndex < visibleRows.length - 1 ? 'border-b border-[#f0e4cf]' : ''
                }`}
                style={{ paddingLeft: isCompact ? 0 : 4, paddingRight: isCompact ? 0 : 4 }}
              >
                {row.render(col)}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default BaziCompactGrid;
