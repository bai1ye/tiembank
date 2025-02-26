// API基础URL
// API基础URL
export const BASE_URL = 'http://localhost:3001/api'

// 用户认证相关接口
export const AUTH_API = {
  // 检查钱包地址
  CHECK_WALLET: `${BASE_URL}/users/check-wallet`,
  // 验证注册信息
  VALIDATE_REGISTER: `${BASE_URL}/users/validate`,
  // 用户注册
  REGISTER: `${BASE_URL}/users/register`,
  // 用户登录
  LOGIN: `${BASE_URL}/users/login`
}
