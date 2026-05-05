/**
 * 大师选择器演示组件
 * 用于测试和展示大师选择功能
 */

import React from 'react';
import { MasterSelector } from '../masters';
import { useMaster, useUI } from '../core/store';

export const MasterSelectorDemo: React.FC = () => {
  const { selectedMaster, setSelectedMaster } = useMaster();
  const { loading } = useUI();

  return (
    <div className="min-h-screen bg-night p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold font-serif text-paper mb-6 md:mb-8 text-center">
          周文王占卜 - 大师选择
        </h1>

        <div className="bg-night-2 rounded-lg">
          <MasterSelector
            selectedMaster={selectedMaster}
            onMasterChange={setSelectedMaster}
            loading={loading}
          />
        </div>

        {/* 调试信息(仅开发环境可见,生产构建会被 Vite tree-shake)*/}
        {import.meta.env.DEV && selectedMaster && (
          <div className="mt-8 p-4 bg-surface-active rounded-lg">
            <h3 className="text-paper font-medium mb-4">调试信息</h3>
            <div className="space-y-2 text-sm">
              <div className="text-neutral-2">
                <span className="text-neutral-mid">选中大师ID:</span> {selectedMaster.id}
              </div>
              <div className="text-neutral-2">
                <span className="text-neutral-mid">大师名称:</span> {selectedMaster.name}
              </div>
              <div className="text-neutral-2">
                <span className="text-neutral-mid">描述:</span> {selectedMaster.description}
              </div>
              <div className="text-neutral-2">
                <span className="text-neutral-mid">提示词长度:</span> {selectedMaster.prompt.length} 字符
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};