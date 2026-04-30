/**
 * URL 工具函数
 */

function normalizeServerUrl(url: string): string {
  return url.replace(/\/$/, '');
}

function getEnvServerUrl(): string | null {
  const envUrl = import.meta.env.VITE_SERVER_URL?.trim();
  return envUrl ? normalizeServerUrl(envUrl) : null;
}

/**
 * 获取动态服务器URL
 * 开发环境默认走同主机 3001 端口；生产环境默认走当前站点同源地址
 * @returns 服务器URL，例如 http://10.10.9.123:3001 或 http://115.190.35.66:3001
 */
export function getDynamicServerUrl(): string {
  const envServerUrl = getEnvServerUrl();
  if (envServerUrl) {
    return envServerUrl;
  }

  // 获取当前页面的协议信息
  const { origin, protocol, hostname, port } = window.location;

  // 本地 Vite 开发环境维持既有约定：前端 5173，对应后端 3001
  if (port === '5173') {
    return `${protocol}//${hostname}:3001`;
  }

  // 生产环境默认走同源部署，避免公网环境固定端口不可达
  return normalizeServerUrl(origin);
}

/**
 * 获取默认服务器URL
 * 如果是浏览器环境，返回动态URL；否则返回硬编码的默认值
 * @returns 服务器URL
 */
export function getDefaultServerUrl(): string {
  // 检查是否在浏览器环境中
  if (typeof window !== 'undefined' && window.location) {
    return getDynamicServerUrl();
  }

  const envServerUrl = getEnvServerUrl();
  if (envServerUrl) {
    return envServerUrl;
  }

  // 服务器端渲染或其他环境的后备选项
  return 'http://127.0.0.1:3001';
}
