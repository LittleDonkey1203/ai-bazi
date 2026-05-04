import type { CSSProperties } from 'react';

export interface GuaWatermarkProps {
  /** 卦象符号字符, 如 '☰' '☲' '☵' '☳' '☴' '☱' (或任意 Unicode 字符) */
  symbol: string;
  /** 颜色;默认 var(--color-text-accent) */
  color?: string;
  /** 不透明度, 0-1, 默认 0.06 */
  opacity?: number;
  /** 字号;默认 var(--font-3xl) */
  size?: string;
  /** 自定义 className */
  className?: string;
}

/**
 * GuaWatermark — 卦象水印 (中式装饰组件)
 *
 * 用于卡片角落的卦象浅水印 (六十四卦或八卦符号), 装饰但不抢内容。
 * **必须**放在 position: relative 的父元素内才正确定位。
 *
 * 装饰位见 docs/design-system.md §5.1:
 *   - HomePage 游戏卡片右上角
 *   - 占卜功能卡片角落微装饰
 *
 * 严禁 children prop, 防止业务节点污染装饰语义。
 */
export function GuaWatermark({
  symbol,
  color = 'var(--color-text-accent)',
  opacity = 0.06,
  size = 'var(--font-3xl)',
  className,
}: GuaWatermarkProps) {
  const style: CSSProperties = {
    position: 'absolute',
    top: 6,
    right: 8,
    fontSize: size,
    opacity,
    color,
    pointerEvents: 'none',
    userSelect: 'none',
    fontFamily: 'serif',
  };

  return (
    <span
      role="presentation"
      aria-hidden="true"
      data-testid="gua-watermark"
      className={className}
      style={style}
    >
      {symbol}
    </span>
  );
}

export default GuaWatermark;
