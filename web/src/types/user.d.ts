// 用户角色
export type UserRole = 'volunteer' | 'elder' | 'admin'

// 用户性别 (0-女性,1-男性)
export type UserGender = 0 | 1

// 基础用户信息
export interface User {
  id: number
  name: string
  role: UserRole
  wallet_address: string
  age?: number
  gender?: UserGender
  tx_hash?: string
}

// API响应基础接口
export interface ApiResponse<T = any> {
  code: number
  message: string
  data?: T
}

// 钱包地址检查响应
export interface WalletCheckResponse {
  exists: boolean
  user: Pick<User, 'id' | 'name' | 'role' | 'wallet_address'> | null
}

// 注册验证响应
export interface ValidateRegisterResponse {
  valid: boolean
  role: UserRole
  gender: UserGender
  birth_date: string
  id_card_hash: string
}

// 注册请求参数
export interface RegisterRequest {
  name: string
  idCard: string
  walletAddress: string
  txHash: string
}

// 登录请求参数
export interface LoginRequest {
  walletAddress: string
}

// 注册响应
export interface RegisterResponse {
  id: number
  name: string
  role: UserRole
  wallet_address: string
  token: string
}

// 登录响应
export interface LoginResponse extends User {
  token: string
}

// 用户认证状态
export interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  walletAddress: string | null
  isWalletConnected: boolean
}
