<!-- components/auth/WalletConnect.vue -->
<template>
  <div class="wallet-connect">
    <!-- 未连接状态 -->
    <template v-if="!isWalletConnected||!isCorrectNetwork">
      <div class="mb-6 text-center">
        <div class="inline-flex p-3 mb-2 bg-gray-50 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 0 0 2 2h16v-5" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 14h.01" />
          </svg>
        </div>
      </div>

      <!-- MetaMask Connect Button -->
      <div>
        <Button
          variant="wallet"
          :loading="connecting"
          :disabled="!isMetaMaskInstalled"
          @click="handleConnect"
          class="w-full mb-3 py-3 flex items-center justify-center transition-all"
          :class="{'opacity-50 cursor-not-allowed': !isMetaMaskInstalled}"
        >
          <template #icon>
            <img v-if="!connecting" src="https://cdn.iconscout.com/icon/free/png-256/metamask-2728406-2261817.png" class="h-5 w-5 mr-2" alt="MetaMask" />
          </template>
          {{ connecting ? '连接中...' : '通过 MetaMask 连接钱包' }}
        </Button>

        <!-- MetaMask Not Installed Warning -->
        <div v-if="!isMetaMaskInstalled" class="p-3 bg-orange-50 rounded-md border border-orange-100 text-left mb-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div class="ml-3">
              <div class="mt-1 text-sm text-orange-700">
                <p>请先安装 MetaMask 钱包或打开 MetaMask 拓展以使用时间银行平台</p>
              </div>
              <div class="mt-2">
                <a
                  href="https://metamask.io/download.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-sm font-medium text-orange-800 hover:text-orange-600 inline-flex items-center"
                >
                  获取 MetaMask
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Network Info -->
      <div v-if="isMetaMaskInstalled" class="mt-4 text-center">
        <p class="text-sm text-gray-500 mb-1">请在 MetaMask 中选择网络</p>
        <div class="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm">
          <span class="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
          Localhost
        </div>
      </div>

      <!-- Network Change Error -->
      <div v-if="isWalletConnected && !isCorrectNetwork" class="mt-4 bg-yellow-50 p-3 rounded-md border border-yellow-100">
        <div class="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h3 class="text-sm font-medium text-yellow-800">请确保连接正确的网络</h3>
            <div class="mt-1 text-sm text-yellow-700">
              <p>本应用仅支持Hardhat本地测试网络</p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 错误提示 -->
    <el-alert
      v-if="error"
      :title="error"
      type="error"
      class="mt-4"
      :closable="true"
      @close="error = ''"
      show-icon
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { checkMetaMask} from '@/utils/ethers'
import Button from '../common/Button.vue'

const authStore = useAuthStore()
const { isWalletConnected, walletAddress,isCorrectNetwork } = storeToRefs(authStore)

const connecting = ref(false)
const error = ref('')
const isMetaMaskInstalled = ref(false)


// 连接钱包
const handleConnect = async () => {
  if (!isMetaMaskInstalled.value || connecting.value)
    return

  try {
    connecting.value = true
    error.value = ''

    // 连接钱包并检查注册状态
    const response = await authStore.connect()
    console.log('钱包连接检查结果:', response)

    // 检查 data 中的状态
    if (response?.data?.exists && response.data.user) {
      // 已注册用户自动登录
      await authStore.login({
        walletAddress: walletAddress.value as string
      })
    }
  } catch (err: any) {
    error.value = err.message || '连接钱包失败'
  } finally {
    connecting.value = false
  }
}

onMounted(async () => {

  isMetaMaskInstalled.value = checkMetaMask()

  if (isMetaMaskInstalled.value) {
    try {
      const address = await authStore.initWallet()
      if (address) {
        // 自动检测已连接的钱包
        const response = await authStore.connect()

        if (response?.data?.exists && response.data.user) {
          // 已注册用户自动登录
          await authStore.login({
            walletAddress: walletAddress.value as string
          })
        }
        authStore.setupWalletListeners()
      }
    } catch (err: any) {
      error.value = err.message || '初始化钱包失败'
    }
  }
})
</script>

<style>
</style>
