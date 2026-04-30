/**
 * 历史记录列表组件
 * 显示指定游戏类型的占卜历史记录
 */

import React, { useState, useEffect } from 'react';
import type { DivinationRecord } from '../../types';
import { getRecords, clearHistory, deleteRecord } from '../../core/history';
import { Calendar, Clock, User, Trash2, Eye, RefreshCw } from 'lucide-react';

interface HistoryListProps {
  /** 游戏类型 */
  gameType: string;
  /** 是否显示清除所有按钮 */
  showClearAll?: boolean;
  /** 最大显示记录数 */
  maxRecords?: number;
  /** 组件样式类名 */
  className?: string;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  gameType,
  showClearAll = true,
  maxRecords = 10,
  className = ''
}) => {
  const [records, setRecords] = useState<DivinationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<DivinationRecord | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // 加载历史记录
  const loadRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRecords(gameType);
      setRecords(data.slice(0, maxRecords));
    } catch (err) {
      console.error('加载历史记录失败:', err);
      setError('加载历史记录失败');
    } finally {
      setLoading(false);
    }
  };

  // 清除所有记录
  const handleClearAll = async () => {
    if (!confirm(`确定要清除所有${gameType}类型的历史记录吗？此操作不可恢复。`)) {
      return;
    }

    try {
      await clearHistory(gameType);
      await loadRecords(); // 重新加载
    } catch (err) {
      console.error('清除历史记录失败:', err);
      setError('清除历史记录失败');
    }
  };

  // 删除单条记录
  const handleDeleteRecord = async (id: string) => {
    if (!confirm('确定要删除这条记录吗？')) {
      return;
    }

    try {
      const success = await deleteRecord(id);
      if (success) {
        await loadRecords(); // 重新加载
        // 如果删除的是当前查看的记录，关闭详情
        if (selectedRecord?.id === id) {
          setShowDetails(false);
          setSelectedRecord(null);
        }
      } else {
        setError('删除记录失败');
      }
    } catch (err) {
      console.error('删除记录失败:', err);
      setError('删除记录失败');
    }
  };

  // 查看记录详情
  const handleViewDetails = (record: DivinationRecord) => {
    setSelectedRecord(record);
    setShowDetails(true);
  };

  // 格式化时间戳
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('zh-CN'),
      time: date.toLocaleTimeString('zh-CN', { hour12: false })
    };
  };

  // 生成记录摘要
  const generateSummary = (record: DivinationRecord) => {
    try {
      if (typeof record.data === 'object' && record.data) {
        switch (record.type) {
          case 'liuyao':
            return `${record.data.originalHexagram || '未知卦象'}${record.data.hasChangingLines ? ' (有变爻)' : ''}`;
          case 'bazi':
            return record.data?.chartData?.baziText
              ? `${record.data.chartData.name || '命盘'} · ${record.data.chartData.baziText}`
              : '八字推命';
          case 'qimen':
            return record.data.title || '奇门遁甲占卜';
          case 'palmistry':
            return '手相分析';
          default:
            return record.type;
        }
      }
      return record.type;
    } catch {
      return record.type;
    }
  };

  // 组件挂载时加载数据
  useEffect(() => {
    loadRecords();
  }, [gameType, maxRecords]);

  // 加载状态
  if (loading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="flex items-center justify-center">
          <RefreshCw className="animate-spin h-5 w-5 text-white mr-2" />
          <span className="text-white">加载历史记录中...</span>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-red-400 mr-3">⚠️</div>
              <div>
                <h3 className="text-red-400 font-medium">加载失败</h3>
                <p className="text-red-300 text-sm mt-1">{error}</p>
              </div>
            </div>
            <button
              onClick={loadRecords}
              className="text-red-300 hover:text-red-200 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* 标题和操作栏 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-medium text-lg">历史记录</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={loadRecords}
            className="text-[#CCCCCC] hover:text-white transition-colors"
            title="刷新"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          {showClearAll && records.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-red-400 hover:text-red-300 transition-colors"
              title="清除所有"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* 记录列表 */}
      {records.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-[#CCCCCC] mb-2">📝</div>
          <p className="text-[#CCCCCC]">暂无历史记录</p>
          <p className="text-[#999999] text-sm mt-1">进行占卜后记录会显示在这里</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => {
            const { date, time } = formatTimestamp(record.timestamp);
            const summary = generateSummary(record);

            return (
              <div
                key={record.id}
                className="bg-[#222222] border border-[#333333] rounded-lg p-4 hover:border-[#555555] transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* 摘要 */}
                    <h4 className="text-white font-medium mb-2">{summary}</h4>
                    
                    {/* 元信息 */}
                    <div className="flex items-center space-x-4 text-sm text-[#CCCCCC]">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {date}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {time}
                      </div>
                      <div className="flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {record.master?.name || '未知大师'}
                      </div>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleViewDetails(record)}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                      title="查看详情"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteRecord(record.id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                      title="删除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 详情模态框 */}
      {showDetails && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#111111] border border-[#333333] rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">占卜记录详情</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-[#CCCCCC] hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* 基本信息 */}
              <div className="bg-[#222222] rounded-lg p-4">
                <h4 className="text-white font-medium mb-3">基本信息</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-[#CCCCCC]">类型：</span>
                    <span className="text-white">{selectedRecord.type}</span>
                  </div>
                  <div>
                    <span className="text-[#CCCCCC]">大师：</span>
                    <span className="text-white">{selectedRecord.master?.name || '未知大师'}</span>
                  </div>
                  <div>
                    <span className="text-[#CCCCCC]">时间：</span>
                    <span className="text-white">
                      {new Date(selectedRecord.timestamp).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#CCCCCC]">ID：</span>
                    <span className="text-white font-mono text-xs">{selectedRecord.id}</span>
                  </div>
                </div>
              </div>

              {/* 占卜数据 */}
              <div className="bg-[#222222] rounded-lg p-4">
                <h4 className="text-white font-medium mb-3">占卜数据</h4>
                <pre className="text-[#CCCCCC] text-sm bg-[#111111] rounded p-3 overflow-x-auto">
                  {JSON.stringify(selectedRecord.data, null, 2)}
                </pre>
              </div>

              {/* AI分析结果 */}
              <div className="bg-[#222222] rounded-lg p-4">
                <h4 className="text-white font-medium mb-3">AI分析结果</h4>
                <div className="text-[#CCCCCC] whitespace-pre-wrap leading-relaxed">
                  {selectedRecord.analysis}
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => setShowDetails(false)}
                className="bg-[#FF9900] text-black px-6 py-2 rounded-lg font-medium hover:bg-[#E68A00] transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 
