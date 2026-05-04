import type { CSSProperties } from 'react';

export type SealSize = 'sm' | 'md' | 'lg';

export interface SealProps {
  /** 印章中显示的单字。建议 1 字最佳, 2 字也可。 */
  char: string;
  /** true = 高亮 (实心绛红描边), false / undefined = 弱化 (半透明描边) */
  active?: boolean;
  /** 尺寸档位, 对应 --seal-size-{sm,md,lg};默认 md */
  size?: SealSize;
  /** 自定义 className, 合并到根元素 */
  className?: string;
}

const SIZE_VAR: Record<SealSize, string> = {
  sm: 'var(--seal-size-sm)',
  md: 'var(--seal-size-md)',
  lg: 'var(--seal-size-lg)',
};

const SIZE_FONT: Record<SealSize, string> = {
  sm: '12px',
  md: '18px',
  lg: '24px',
};

/**
 * Seal — 印章 (中式装饰组件)
 *
 * 装饰位见 docs/design-system.md §5.1:
 *   - 大师卡片激活态 (MasterSelector)
 *   - AI 流式输出署名前缀 (StreamingMarkdown 头部插槽)
 *   - SettingsModal 章节标记
 *
 * 严禁 children prop, 防止业务节点污染装饰语义。
 */
export function Seal({ char, active = false, size = 'md', className }: SealProps) {
  const dim = SIZE_VAR[size];
  const style: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: dim,
    height: dim,
    border: active ? 'var(--seal-border)' : 'var(--seal-border-off)',
    background: active ? 'var(--seal-bg)' : 'transparent',
    transform: active ? 'rotate(var(--seal-rotate))' : 'none',
    fontFamily: 'var(--font-serif-cn)',
    fontSize: SIZE_FONT[size],
    fontWeight: 500,
    color: active ? 'var(--color-brand)' : 'rgba(196, 30, 58, 0.45)',
    borderRadius: '4px',
    transition: 'all 0.3s',
    flexShrink: 0,
  };

  return (
    <span
      role="presentation"
      aria-hidden="true"
      data-testid="seal"
      data-active={active}
      data-size={size}
      className={className}
      style={style}
    >
      {char}
    </span>
  );
}

export default Seal;
