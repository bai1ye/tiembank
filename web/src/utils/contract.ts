// utils/contract.ts
import { Contract, keccak256, toUtf8Bytes } from 'ethers'
import { CONTRACT_CONFIG } from '@/config/contract'
import { getSigner } from '@/utils/ethers'

/**
 * 将字符串转换为bytes32格式
 */
export const textToBytes32 = (text: string): string => {
  // 先转换为UTF-8字节
  const utf8Bytes = toUtf8Bytes(text)
  // 计算keccak256哈希
  return keccak256(utf8Bytes)
}

/**
 * 获取合约实例
 */
export const getTimeBankContract = async () => {
  const signer = await getSigner()
  return new Contract(CONTRACT_CONFIG.address, CONTRACT_CONFIG.abi, signer)
}

/**
 * 用户注册
 */
export const registerUser = async (
  infoHash: string,
  isMale: boolean,
  age: number
): Promise<string> => {
  try {
    // 获取合约实例
    const contract = await getTimeBankContract()

    // 直接调用合约方法
    const tx = await contract.registerUser(infoHash, isMale, age)
    console.log('交易已发送:', tx.hash)

    // 等待交易确认
    const receipt = await tx.wait()
    console.log('交易已确认:', {
      status: receipt.status === 1 ? '成功' : '失败',
      hash: receipt.hash,
      blockNumber: receipt.blockNumber
    })

    return receipt.hash
  } catch (error: any) {
    console.error('注册失败:', error)

    if (error.code === 'ACTION_REJECTED') {
      throw new Error('用户拒绝交易')
    } else if (error.code === 'CALL_EXCEPTION') {
      throw new Error('合约调用失败: ' + (error.reason || '未知错误'))
    } else {
      throw new Error(error.message || '注册失败')
    }
  }
}
