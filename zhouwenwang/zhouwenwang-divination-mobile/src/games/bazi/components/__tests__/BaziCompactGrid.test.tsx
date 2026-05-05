import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { BaziCompactGrid, type BaziCompactGridColumn } from '../BaziCompactGrid';

const yearCol: BaziCompactGridColumn = {
  key: 'year',
  title: '年柱',
  stemTenGod: '食神',
  stem: '癸',
  stemWuxing: '水',
  branch: '酉',
  branchWuxing: '金',
  hiddenStems: { 主气: { 天干: '辛', 十神: '比肩' } },
  nayin: '剑锋金',
  xun: '甲子旬',
  kongwang: '戌亥',
  xingyun: '临官',
  zizuo: '比肩',
  gods: ['德秀贵人', '红艳煞', '禄神', '将星', '太极贵人'],
  relations: [],
};

const monthCol: BaziCompactGridColumn = {
  key: 'month',
  title: '月柱',
  stemTenGod: '正财',
  stem: '甲',
  stemWuxing: '木',
  branch: '子',
  branchWuxing: '水',
  hiddenStems: { 主气: { 天干: '癸', 十神: '食神' } },
  nayin: '海中金',
  xun: '甲子旬',
  kongwang: '戌亥',
  xingyun: '长生',
  zizuo: '食神',
  gods: ['文昌贵人', '天厨贵人'],
  relations: ['子卯刑'],
};

const dayCol: BaziCompactGridColumn = {
  key: 'day',
  title: '日柱',
  stemTenGod: '日主',
  stem: '辛',
  stemWuxing: '金',
  branch: '巳',
  branchWuxing: '火',
  hiddenStems: {
    主气: { 天干: '丙', 十神: '正官' },
    中气: { 天干: '庚', 十神: '劫财' },
    余气: { 天干: '戊', 十神: '正印' },
  },
  nayin: '白蜡金',
  xun: '甲子旬',
  kongwang: '申酉',
  xingyun: '死',
  zizuo: '死',
  gods: ['十恶大败', '天乙贵人'],
  relations: [],
};

describe('BaziCompactGrid (问真八字风格紧凑网格)', () => {
  it('renders the row labels in 问真 order', () => {
    render(<BaziCompactGrid columns={[yearCol]} />);

    const grid = screen.getByTestId('bazi-compact-grid');
    [
      '日期',
      '主星',
      '天干',
      '地支',
      '藏干',
      '星运',
      '自坐',
      '空亡',
      '纳音',
      '神煞',
      '刑冲合会',
    ].forEach((label) => {
      expect(within(grid).getByText(label)).toBeInTheDocument();
    });
  });

  it('renders one column per pillar with its title', () => {
    render(<BaziCompactGrid columns={[yearCol, monthCol, dayCol]} />);

    expect(screen.getByText('年柱')).toBeInTheDocument();
    expect(screen.getByText('月柱')).toBeInTheDocument();
    expect(screen.getByText('日柱')).toBeInTheDocument();
  });

  it('colors stem and branch by 五行 (inline color, not background)', () => {
    render(<BaziCompactGrid columns={[dayCol]} />);

    const stem = screen.getByTestId('compact-stem-day');
    expect(stem).toHaveTextContent('辛');
    expect(stem.getAttribute('style') || '').toMatch(/color:\s*(rgb\(255,\s*215,\s*0\)|#FFD700)/i);

    const branch = screen.getByTestId('compact-branch-day');
    expect(branch).toHaveTextContent('巳');
    expect(branch.getAttribute('style') || '').toMatch(/color:\s*(rgb\(239,\s*68,\s*68\)|#EF4444)/i);
  });

  it('lists multiple hidden stems vertically with their ten gods', () => {
    render(<BaziCompactGrid columns={[dayCol]} />);

    const grid = screen.getByTestId('bazi-compact-grid');
    expect(within(grid).getByText('丙')).toBeInTheDocument();
    expect(within(grid).getByText('正官')).toBeInTheDocument();
    expect(within(grid).getByText('庚')).toBeInTheDocument();
    expect(within(grid).getByText('劫财')).toBeInTheDocument();
    expect(within(grid).getByText('戊')).toBeInTheDocument();
    expect(within(grid).getByText('正印')).toBeInTheDocument();
  });

  it('renders 神煞 as a vertical list per column', () => {
    render(<BaziCompactGrid columns={[yearCol]} />);

    const gods = screen.getByTestId('compact-gods-year');
    expect(within(gods).getByText('德秀贵人')).toBeInTheDocument();
    expect(within(gods).getByText('红艳煞')).toBeInTheDocument();
    expect(within(gods).getByText('禄神')).toBeInTheDocument();
    expect(within(gods).getByText('将星')).toBeInTheDocument();
    expect(within(gods).getByText('太极贵人')).toBeInTheDocument();
    // each item should be in its own <span>
    expect(gods.children.length).toBe(5);
  });

  it('falls back to a single dash when 神煞 / 刑冲合会 / 藏干 are empty', () => {
    const empty: BaziCompactGridColumn = {
      ...yearCol,
      key: 'flow',
      title: '流年',
      gods: [],
      relations: [],
      hiddenStems: {},
    };
    render(<BaziCompactGrid columns={[empty]} />);

    const grid = screen.getByTestId('bazi-compact-grid');
    const dashes = within(grid).getAllByText('—');
    // 藏干 + 神煞 + 刑冲合会 = at least 3 dashes
    expect(dashes.length).toBeGreaterThanOrEqual(3);
  });

  it('lays out as a CSS grid with one label column + N data columns', () => {
    render(<BaziCompactGrid columns={[yearCol, monthCol, dayCol]} />);

    const inner = screen.getByTestId('bazi-compact-grid').firstElementChild as HTMLElement;
    expect(inner.className).toMatch(/\bgrid\b/);
    const tpl = inner.style.gridTemplateColumns || '';
    expect(tpl).toContain('38px');
    // jsdom keeps the original "repeat(N, minmax(...))" string; assert by N
    expect(tpl).toMatch(/repeat\(\s*3\s*,/);
    expect(tpl).toContain('minmax(');
  });

  it('uses overflow-x-auto on the wrapper so wide column counts can scroll horizontally', () => {
    const many: BaziCompactGridColumn[] = Array.from({ length: 9 }, (_, i) => ({
      ...yearCol,
      key: `c${i}`,
      title: `柱${i}`,
    }));
    render(<BaziCompactGrid columns={many} />);

    const wrapper = screen.getByTestId('bazi-compact-grid');
    expect(wrapper.className).toMatch(/overflow-x-auto/);
  });
});
