import type { CSSProperties } from 'react';

export interface DividerProps {
  /** 中间装饰标记, 例如 '❖' '·' 或短文本。省略则纯线 */
  label?: string;
  /** 自定义 className */
  className?: string;
}

const LINE_STYLE: CSSProperties = {
  flex: 1,
  height: 'var(--divider-thickness)',
  background: 'var(--divider-line)',
};

const LABEL_STYLE: CSSProperties = {
  fontSize: 'var(--font-xs)',
  color: 'var(--color-text-accent)',
  letterSpacing: '4px',
  fontFamily: 'var(--font-serif-cn)',
};

/**
 * Divider — 毛笔分隔线 (中式装饰组件)
 *
 * 渐变线 + 中间可选标签的装饰分隔, 由黄铜色 (var(--c-bronze-500)) 渐入渐出。
 *
 * 装饰位见 docs/design-system.md §5.1:
 *   - HomePage hero 与各 section 之间
 *   - SettingsModal tabs 章节分割
 *   - 占卜结果分段标题前
 *
 * 严禁 children prop, 防止业务节点污染装饰语义。
 */
export function Divider({ label, className }: DividerProps) {
  const hasLabel = label !== undefined;
  const containerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    opacity: 'var(--divider-opacity)',
    margin: 'var(--space-5) 0',
  };

  return (
    <div
      role="presentation"
      aria-hidden="true"
      data-testid="divider"
      data-has-label={hasLabel}
      className={className}
      style={containerStyle}
    >
      <span style={LINE_STYLE} />
      {hasLabel && (
        <span data-testid="divider-label" style={LABEL_STYLE}>
          {label}
        </span>
      )}
      <span style={LINE_STYLE} />
    </div>
  );
}

export default Divider;
