const rawUrl = (
  import.meta.env.VITE_API_BASE_URL ||
  'https://nmcnpm-quanlithietbihvcs-ds4d.onrender.com/api'
).trim();

// Tự động bỏ dấu gạch chéo ở cuối nếu có
const cleanUrl = rawUrl.replace(/\/+$/, '');

// Tự động đảm bảo luôn có hậu tố /api
export const API_BASE_URL = cleanUrl.endsWith('/api')
  ? cleanUrl
  : `${cleanUrl}/api`;
