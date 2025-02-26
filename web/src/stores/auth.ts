//stores/auth.ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  connectWallet,
  getCurrentAccount,
  getCurrentChainId,
  onAccountChanged,
  onChainChanged,
  removeMetaMaskListeners
} from "@/utils/ethers";
import request from '@/utils/request'
import { AUTH_API } from '@/config/api'
import type {
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ValidateRegisterResponse,
} from '@/types/user'
import { useRouter } from 'vue-router'
import { useUserStore } from './user'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const router = useRouter()

  // 状态
  const token = ref<string | null>(localStorage.getItem('token'))
  const walletAddress = ref<string | null>(null)
  const isWalletConnected = computed(() => !!walletAddress.value)
  const isAuthenticated = computed(() => !!token.value)
  const chainId = ref<string | null>(null)
  const isCorrectNetwork = ref(true) // 默认假设是正确网络

  // 连接钱包
  const connect = async () => {
    try {
      chainId.value = await getCurrentChainId()
      console.log('Connected chain ID:', chainId)
      // 检查是否是正确的链ID
      isCorrectNetwork.value = chainId.value === '0x7a69';
      console.log('Correct network:', isCorrectNetwork.value)
      if (!isCorrectNetwork.value) {
        // noinspection ExceptionCaughtLocallyJS
        throw new Error('请切换到正确的网络')
      }
      const address = await connectWallet()
      console.log('Connected wallet:', address)
      walletAddress.value = address
      // 检查钱包地址是否已注册
      return await request.get(`${AUTH_API.CHECK_WALLET}?walletAddress=${address}`)
    } catch (error) {
      walletAddress.value = null
      throw error
    }
  }

  // 验证注册信息
  const validateRegister = async (registerData: Omit<RegisterRequest, 'txHash'>) => {
    try {
      const { data } = await request.post<ValidateRegisterResponse>(
        AUTH_API.VALIDATE_REGISTER,
        registerData,
      )
      return data
    } catch (error) {
      throw error
    }
  }

  // 登录
  const login = async ({ walletAddress }: { walletAddress: string }) => {
    try {
      const { data } = await request.post<LoginResponse>(AUTH_API.LOGIN, { walletAddress })

      // 保存认证信息
      token.value = data.token
      localStorage.setItem('token', data.token)

      // 保存用户信息到user store
      const userStore = useUserStore()
      userStore.setUserInfo(data) // 这行已有，setUserInfo现在会同时保存到localStorage

      // 根据角色跳转
      if (data.role === 'volunteer') {
        await router.push('/volunteer')
      } else if (data.role === 'elder') {
        await router.push('/elder')
      } else {
        await router.push('/admin')
      }

      return data
    } catch (error) {
      token.value = null
      localStorage.removeItem('token')
      throw error
    }
  }

  // 注册
  const register = async (registerData: RegisterRequest) => {
    try {
      const { data } = await request.post<RegisterResponse>(AUTH_API.REGISTER, registerData)
      // 保存token
      token.value = data.token
      localStorage.setItem('token', data.token)

      // 保存用户信息到user store
      const userStore = useUserStore()
      userStore.setUserInfo(data) // 这行已有，setUserInfo现在会同时保存到localStorage

      return data
    } catch (error) {
      token.value = null
      localStorage.removeItem('token')
      throw error
    }
  }

  // 注销
  const logout = () => {
    // 清理认证状态
    token.value = null
    localStorage.removeItem('token')

    // 如果是网络选择错误，则不清理用户状态，反之清理
    if (isCorrectNetwork.value) {
      const userStore = useUserStore()
      userStore.clearUserInfo()
    }

    // 重定向到登录页
    if (router.currentRoute.value.path !== '/') {
      router.push('/').then(r => r)
    }
  }

  // 初始化钱包状态
  const initWallet = async () => {
    try {
      const address = await getCurrentAccount()
      const chainId = await getCurrentChainId()
      walletAddress.value = address
      return address && chainId
    } catch (error) {
      walletAddress.value = null
      throw error
    }
  }

  // 设置钱包监听器
  const setupWalletListeners = () => {
    // 先移除可能存在的旧监听器
    removeMetaMaskListeners()

    // 监听账户变更
    onAccountChanged((accounts: string[]) => {
      const newAddress = accounts[0] || null
      const previousAddress = walletAddress.value
      console.log('Wallet address changed:', previousAddress, '->', newAddress)

      walletAddress.value = newAddress

      // 如果钱包地址改变
      if (previousAddress !== newAddress) {
        // 如果断开连接（没有新地址）
        if (!newAddress) {
          // 执行登出
          logout()
        }
        // 如果切换到新钱包
        else {
          // 当前已登录但切换了钱包，也要登出并重定向到登录页
          logout()
          try {
            // 检查新钱包地址是否已注册
            request.get(`${AUTH_API.CHECK_WALLET}?walletAddress=${newAddress}`)
              .then(response => {
                if (response?.data?.exists && response.data.user) {
                  // 已注册用户自动登录
                  login({ walletAddress: newAddress }).then(r => r)
                }
              })
          } catch (error) {
            console.error('重新认证失败:', error)
          }
        }
      }
    })

    // 监听链网络变更
    onChainChanged((newChainId: string) => {
      console.log('Chain ID changed:', chainId.value, '->', newChainId);
      chainId.value = newChainId;

      // 检查是否是正确的链ID：31337 (0x7a69) - Hardhat本地网络
      const isCorrectChain = newChainId === '0x7a69';
      isCorrectNetwork.value = isCorrectChain;
      // 如果链ID不正确
      if (!isCorrectChain) {
        isCorrectNetwork.value = false;
        console.error('网络错误: 请切换到正确的测试网络');
        // 执行登出
        logout();
      }else {
        isCorrectNetwork.value = true;
      }
    })
  }

  // 确保在组件卸载时清理监听器
  const cleanupWalletListeners = () => {
    removeMetaMaskListeners()
  }

  return {
    // 状态
    token,
    walletAddress,
    isWalletConnected,
    isAuthenticated,
    chainId,
    isCorrectNetwork,

    // 方法
    connect,
    validateRegister,
    login,
    register,
    logout,
    initWallet,
    setupWalletListeners,
    cleanupWalletListeners,
  }
})
