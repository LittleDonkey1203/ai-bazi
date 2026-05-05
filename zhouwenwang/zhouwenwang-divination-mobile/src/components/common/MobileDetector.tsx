import React from 'react';

/**
 * 移动端访问拦截弹窗 — 已停用。
 *
 * 在 zhouwenwang-divination-mobile 工程中,UI 已通过 BottomNav 适配手机端,
 * 不再需要"建议在电脑访问"的拦截弹窗。保留组件文件与默认导出,
 * 以避免外部 import 报错;如需恢复旧行为,见 git 历史。
 */
const MobileDetector: React.FC = () => {
  return null;
};

export default MobileDetector;
