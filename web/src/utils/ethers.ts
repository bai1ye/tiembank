import { BrowserProvider, JsonRpcSigner } from "ethers";


declare global {
  // noinspection JSUnusedGlobalSymbols
  interface Window {
    ethereum?: any
  }
}

/**
 * 检查是否安装了MetaMask
 */
export const checkMetaMask = (): boolean => {
  return typeof window !== 'undefined' && !!window.ethereum
}

/**
 * 获取MetaMask Provider：Provider 是一个连接到以太坊网络的接口，它可以发送交易、查询区块链数据等
 */
export const getProvider = () => {
  if (!checkMetaMask()) {
    throw new Error('请安装MetaMask钱包')
  }
  return new BrowserProvider(window.ethereum)
}

/**
 * 获取签名者(当前账户)
 */
export const getSigner = async (): Promise<JsonRpcSigner> => {
  const provider = getProvider()
  return await provider.getSigner()
}

/**
 * 连接MetaMask
 * @returns 连接的钱包地址
 */
export const connectWallet = async (): Promise<string> => {
  try {
    const provider = getProvider()
    // 请求用户连接
    const accounts = await provider.send('eth_requestAccounts', [])
    return accounts[0]
  } catch (error: any) {
    // MetaMask 错误类型
    switch (error.code) {
      case 4001:
        throw new Error('用户拒绝连接钱包')
      case -32002:
        throw new Error('请在MetaMask中确认连接')
      default:
        console.error('连接钱包错误:', error)
        throw new Error('连接钱包失败')
    }
  }
}

// 存储事件监听器引用，方便移除
const eventListeners = {
  accountsChanged: null as ((accounts: string[]) => void) | null,
  chainChanged: null as ((chainId: string) => void) | null
}

/**
 * 监听账户变更
 * @param callback 账户变更回调函数
 */
export const onAccountChanged = (callback: (accounts: string[]) => void): void => {
  if (checkMetaMask()) {
    // 存储回调引用
    eventListeners.accountsChanged = callback

    // 移除可能存在的旧监听器，避免重复
    window.ethereum.removeListener('accountsChanged', callback)

    // 添加新的监听器
    window.ethereum.on('accountsChanged', callback)
  }
}

/**
 * 监听链网络变更
 * @param callback 网络变更回调函数
 */
export const onChainChanged = (callback: (chainId: string) => void): void => {
  if (checkMetaMask()) {
    // 存储回调引用
    eventListeners.chainChanged = callback

    // 移除可能存在的旧监听器，避免重复
    window.ethereum.removeListener('chainChanged', callback)

    // 添加新的监听器
    window.ethereum.on('chainChanged', callback)
  }
}

/**
 * 移除MetaMask事件监听
 */
export const removeMetaMaskListeners = (): void => {
  if (checkMetaMask()) {
    // 移除账户变更监听器
    if (eventListeners.accountsChanged) {
      window.ethereum.removeListener('accountsChanged', eventListeners.accountsChanged)
      eventListeners.accountsChanged = null
    }

    // 移除链变更监听器
    if (eventListeners.chainChanged) {
      window.ethereum.removeListener('chainChanged', eventListeners.chainChanged)
      eventListeners.chainChanged = null
    }
  }
}

/**
 * 获取当前连接的账户地址
 */
export const getCurrentAccount = async (): Promise<string | null> => {
  try {
    const provider = getProvider()
    const accounts = await provider.send('eth_accounts', [])
    return accounts[0] || null
  } catch (error) {
    console.error('获取当前账户错误:', error)
    return null
  }
}

/**
 * 获取当前网络链ID
 */
export const getCurrentChainId = async (): Promise<string | null> => {
  try {
    const provider = getProvider()
    return await provider.send('eth_chainId', [])
  } catch (error) {
    console.error('获取当前链ID错误:', error)
    return null
  }
}
