/**
 * 手相分析页面
 * 支持图像上传、预览和AI分析功能
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { convertImageToBase64, getPalmistryAnalysisStream } from '../../masters/service';
import { useMaster, useUI } from '../../core/store';
import { addRecord } from '../../core/history';
import { StreamingMarkdown, ErrorToast, useAutoScroll } from '../../components/common';
import { getVideoPath } from '../../utils/resources';
import type { DivinationRecord } from '../../types';

interface ImageData {
  file: File;
  base64: string;
  mimeType: string;
  preview: string; // data URL for preview
}

interface PalmistryData {
  fileName: string;
  fileSize: number;
  mimeType: string;
  timestamp: number;
}

const PalmistryPage: React.FC = () => {
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { selectedMaster } = useMaster();
  const { error, setError } = useUI();
  
  // 使用通用的自动滚动Hook
  const { contentRef: analysisRef } = useAutoScroll({
    isAnalyzing: isAnalyzing,
    content: analysisResult || ''
  });

  // 自动清除错误提示
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [error, setError]);

  // 动画变体
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  // 处理文件选择
  const handleFileSelect = async (file: File) => {
    try {
      setIsLoading(true);
      setError(null);

      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        throw new Error('请选择图片文件');
      }

          // 验证文件大小 (2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('图片文件大小不能超过2MB');
    }

      // 转换为base64
      const { base64, mimeType } = await convertImageToBase64(file);
      
      // 创建预览URL
      const preview = URL.createObjectURL(file);

      setImageData({
        file,
        base64,
        mimeType,
        preview
      });

      // 重置分析结果
      setAnalysisResult(null);
      setAnalysisComplete(false);
      setShowLoadingAnimation(false);

    } catch (err) {
      console.error('文件处理失败:', err);
      setError(err instanceof Error ? err.message : '文件处理失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 文件输入变化处理
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // 清理旧的预览URL
      if (imageData?.preview) {
        URL.revokeObjectURL(imageData.preview);
      }
      // 重置分析结果
      setAnalysisResult(null);
      setAnalysisComplete(false);
      setShowLoadingAnimation(false);
      
      handleFileSelect(files[0]);
    }
  };

  // 拖拽处理
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);

    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // 点击上传区域
  const handleUploadAreaClick = () => {
    fileInputRef.current?.click();
  };

  // 重新选择图片 - 直接打开文件选择框
  const handleClearImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 保存到历史记录
  const saveToHistory = async (analysisText: string, palmistryData: PalmistryData) => {
    try {
      const record: DivinationRecord = {
        id: `palmistry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'palmistry',
        timestamp: Date.now(),
        data: palmistryData,
        master: selectedMaster ? {
          id: selectedMaster.id,
          name: selectedMaster.name,
          description: selectedMaster.description
        } : null,
        analysis: analysisText
      };

      await addRecord(record);
      console.log('手相分析记录已保存到历史');
      return true;
    } catch (err) {
      console.error('保存历史记录失败:', err);
      return false;
    }
  };

  // 开始分析
  const handleStartAnalysis = async () => {
    if (!imageData) {
      setError('请先上传手相图片');
      return;
    }

    if (!selectedMaster) {
      setError('请先在设置中选择一位大师');
      return;
    }

    try {
      setIsAnalyzing(true);
      setError(null);
      setAnalysisResult('');
      setAnalysisComplete(false);
      setShowLoadingAnimation(true);

      const palmistryData: PalmistryData = {
        fileName: imageData.file.name,
        fileSize: imageData.file.size,
        mimeType: imageData.mimeType,
        timestamp: Date.now()
      };

      // 使用流式分析，实时更新结果
      const analysisText = await getPalmistryAnalysisStream(
        imageData.base64,
        imageData.mimeType,
        selectedMaster,
        (streamText: string) => {
          // 流式更新回调 - 当开始有内容返回时，隐藏动画显示结果
          if (streamText && streamText.trim()) {
            setShowLoadingAnimation(false);
            setAnalysisResult(streamText);
          }
        }
      );

      // 分析完成
      setAnalysisComplete(true);

      // 保存到历史记录
      if (analysisText) {
        await saveToHistory(analysisText, palmistryData);
      }

    } catch (err) {
      console.error('分析失败:', err);
      setError(err instanceof Error ? err.message : '分析失败，请重试');
    } finally {
      setIsAnalyzing(false);
      setShowLoadingAnimation(false);
    }
  };

  const canStartAnalysis = imageData && selectedMaster && !isAnalyzing && !analysisComplete;

  return (
    <motion.div
      className="min-h-screen bg-black text-white"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* 页面标题 */}
          <motion.div 
            className="text-center mb-2"
            variants={itemVariants}
          >
            <h1
              className="text-4xl md:text-5xl font-bold font-serif mb-4 bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(135deg, #f5f0e3 0%, #d4a03e 60%, #c41e3a 100%)',
              }}
            >
              手相分析
            </h1>
            <p className="text-xl text-neutral-2 max-w-3xl mx-auto leading-relaxed">
              掌中有乾坤，上传手相图片探寻命运轨迹
            </p>
          </motion.div>

          {/* 主内容卡片 */}
          <motion.div 
            className="card card-interactive"
            variants={itemVariants}
          >
            {/* 隐藏的文件输入元素 - 始终存在 */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
            
            {/* 图片上传或预览区域 */}
            <div className="mb-2">
              {!imageData ? (
                <div
                  onClick={handleUploadAreaClick}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`
                    relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300
                    ${dragOver
                      ? 'border-brand bg-brand/10'
                      : 'border-divider hover:border-brand-gray-400 hover:bg-brand-gray-900/50'
                    }
                  `}
                >

                  
                  <div className="space-y-6">
                    <div className="text-6xl text-brand-gray-400">📷</div>
                    <div>
                      <p className="text-white text-xl font-semibold mb-3">
                        {dragOver ? '释放以上传图片' : '上传手相图片'}
                      </p>
                      <p className="text-brand-gray-300">
                        支持 JPG、PNG、WEBP 格式，文件大小不超过2M
                      </p>
                    </div>
                  </div>
                  
                  {isLoading && (
                    <div className="absolute inset-0 bg-black/70 rounded-xl flex items-center justify-center">
                      <div className="flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand"></div>
                        <span className="text-white">处理图片中...</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* 图片预览区域 - 缩小尺寸 */
                <div className="space-y-6">
                  <div className="flex justify-center">
                    <div style={{ width: '300px', maxWidth: '100%' }}>
                      {/* 图片预览 */}
                      <motion.div 
                        className="bg-brand-gray-900 border border-divider rounded-xl p-[1rem]"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-white font-semibold text-lg">手相图片</h3>
                          <button
                            onClick={handleClearImage}
                            className="text-brand hover:text-brand-active transition-colors font-medium"
                          >
                            重新选择
                          </button>
                        </div>
                        
                        <div className="text-center">
                          <img
                            src={imageData.preview}
                            alt="手相预览"
                            className="max-w-full h-auto rounded-lg border border-brand-gray-600 max-h-60 mx-auto object-contain"
                          />
                        </div>
                        
                        <div className="mt-4 text-center text-sm text-brand-gray-400">
                          {imageData.file.name} • {(imageData.file.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* 分析按钮 */}
            {imageData && (
              <motion.div 
                className="text-center mb-8"
                variants={itemVariants}
              >
                <motion.button
                  onClick={handleStartAnalysis}
                  disabled={!canStartAnalysis}
                  className={`
                    px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg
                    ${canStartAnalysis
                      ? 'bg-gradient-to-r from-brand to-brand-active text-black hover:shadow-xl'
                      : 'bg-[#444444] text-neutral-mid cursor-not-allowed'
                    }
                  `}
                  whileHover={canStartAnalysis ? { scale: 1.05, y: -2 } : {}}
                  whileTap={canStartAnalysis ? { scale: 0.98 } : {}}
                >
                  {isAnalyzing ? (
                    <span className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                      <span>{selectedMaster?.name || 'AI'}正在分析...</span>
                    </span>
                  ) : (
                    <span>
                      {analysisComplete ? `${selectedMaster?.name}手相分析完成` : '开始手相分析'}
                    </span>
                  )}
                </motion.button>
                
                {!selectedMaster && imageData && (
                  <motion.p 
                    className="text-brand-gray-300 text-sm mt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    请先在设置中选择一位大师进行分析
                  </motion.p>
                )}
              </motion.div>
            )}
          </motion.div>

          {/* 手相分析介绍 - 只在没有上传图片时显示 */}
          {!imageData && (
            <motion.div 
              className="card card-interactive"
              variants={itemVariants}
            >

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-brand-gray-900/50 border border-divider rounded-xl p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-3 h-3 bg-brand rounded-full mr-3"></div>
                    <h3 className="text-white font-semibold text-lg">生命线</h3>
                  </div>
                  <p className="text-brand-gray-300">
                    健康状况和生命力分析
                  </p>
                </div>

                <div className="bg-brand-gray-900/50 border border-divider rounded-xl p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-3 h-3 bg-brand rounded-full mr-3"></div>
                    <h3 className="text-white font-semibold text-lg">智慧线</h3>
                  </div>
                  <p className="text-brand-gray-300">
                    思维能力和性格特征解读
                  </p>
                </div>

                <div className="bg-brand-gray-900/50 border border-divider rounded-xl p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-3 h-3 bg-brand rounded-full mr-3"></div>
                    <h3 className="text-white font-semibold text-lg">感情线</h3>
                  </div>
                  <p className="text-brand-gray-300">
                    情感状态和人际关系分析
                  </p>
                </div>

                <div className="bg-brand-gray-900/50 border border-divider rounded-xl p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-3 h-3 bg-brand rounded-full mr-3"></div>
                    <h3 className="text-white font-semibold text-lg">事业线</h3>
                  </div>
                  <p className="text-brand-gray-300">
                    职业发展和成就潜力预测
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* 分析动画区域 - 参考六爻页面的摇卦动画 */}
          <AnimatePresence>
            {showLoadingAnimation && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center">
                  <h3 className="text-2xl font-semibold text-white mb-6">
                    {selectedMaster?.name || 'AI大师'}正在细观掌纹，解读命运...
                  </h3>
                  
                  {/* 分析动画区域 */}
                  <div className="flex justify-center">
                    <div className="bg-black flex items-center justify-center relative overflow-hidden rounded-xl w-full max-w-[560px] aspect-video">
                      {/* 使用MP4视频作为加载动画 */}
                      <video
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-cover rounded-xl"
                        onError={(e) => {
                          console.log('手相视频加载失败，显示备用动画');
                          const video = e.target as HTMLVideoElement;
                          video.style.display = 'none';
                        }}
                        onCanPlayThrough={() => {
                          console.log('手相视频可以播放');
                        }}
                      >
                        <source src={getVideoPath("palmistry.mp4")} type="video/mp4" />
                        {/* 如果视频加载失败，显示备用动画 */}
                        <div className="relative">
                          <motion.div
                            className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          <motion.div
                            className="absolute inset-4 border-2 border-[#CCCCCC] border-b-transparent rounded-full"
                            animate={{ rotate: -360 }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                          />
                          <motion.div
                            className="absolute inset-8 w-16 h-16 flex items-center justify-center"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <span className="text-brand text-2xl font-bold">相</span>
                          </motion.div>
                        </div>
                      </video>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 分析结果显示 - 参考六爻页面的结果展示 */}
          {analysisResult && (
            <motion.div 
              ref={analysisRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              variants={itemVariants}
            >
              <div 
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: '20rem',
                }}
              >
                <StreamingMarkdown
                  content={analysisResult}
                  showCursor={isAnalyzing && !analysisComplete}
                  isStreaming={isAnalyzing}
                />
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* 错误提示 */}
      <ErrorToast
        isVisible={!!error}
        message={error || ''}
        onClose={() => setError(null)}
      />
    </motion.div>
  );
};

export default PalmistryPage; 