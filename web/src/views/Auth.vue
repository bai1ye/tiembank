<!-- views/Auth.vue -->
<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <!-- Background pattern -->
    <div class="absolute inset-0 opacity-5 pointer-events-none">
      <div class="absolute inset-0" style="background-image: url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E');"></div>
    </div>

    <!-- Main content -->
    <div class="flex-1 flex flex-col md:flex-row">
      <!-- Left column: Information -->
      <div class="md:w-1/2 p-8 flex flex-col justify-center items-center md:items-start text-center md:text-left">
        <div class="max-w-md">
          <!-- Logo and title -->
          <div class="mb-6">
            <div class="flex items-center justify-center md:justify-start mb-4">
              <div class="flex items-center justify-center h-12 w-12 rounded-full bg-blue-500 text-white mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 class="text-3xl font-bold text-gray-900">Time Bank</h1>
            </div>
            <p class="text-xl text-gray-600">共享时间，互助互爱</p>
          </div>

          <!-- Introduction -->
          <div class="mb-8">
            <h2 class="text-xl font-semibold text-gray-800 mb-3">时间银行是什么？</h2>
            <p class="text-gray-600 mb-3">
              时间银行是一个基于区块链的互助平台，让志愿者和老年人之间建立互信互助的关系。
            </p>
            <p class="text-gray-600">
              志愿者通过提供服务积累时间币，老年人通过获取服务消费时间币，形成互助循环。
            </p>
          </div>

          <!-- How it works -->
          <div>
            <h2 class="text-xl font-semibold text-gray-800 mb-3">如何使用？</h2>
            <div class="space-y-4">
              <div class="flex">
                <div class="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-500 mr-3">
                  1
                </div>
                <div>
                  <p class="text-gray-600">连接您的钱包</p>
                </div>
              </div>
              <div class="flex">
                <div class="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-500 mr-3">
                  2
                </div>
                <div>
                  <p class="text-gray-600">完成身份信息验证</p>
                </div>
              </div>
              <div class="flex">
                <div class="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-500 mr-3">
                  3
                </div>
                <div>
                  <p class="text-gray-600">开始使用时间银行服务</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right column: Authentication -->
      <div class="md:w-1/2 bg-white md:shadow-xl  flex flex-col">
        <div class="flex-1 flex items-center justify-center p-8">
          <div class="w-full max-w-md">
            <!-- Authentication card -->
            <div class="bg-white p-8 rounded-lg shadow-md">
              <!-- Card title -->
              <div class="text-center mb-6">
                <h2 class="text-2xl font-bold text-gray-900">{{ getPageTitle }}</h2>
                <p class="mt-2 text-sm text-gray-600">
                  {{ getPageSubtitle }}
                </p>
              </div>

              <!-- Connect wallet -->
              <div v-if="!isWalletConnected||!isCorrectNetwork" class="space-y-4">
                <WalletConnect />
              </div>

              <!-- Registration form -->
              <div v-else-if="!isAuthenticated && !existingUser && isCorrectNetwork ">
                <RegisterForm />
              </div>

              <!-- Error message -->
              <el-alert
                v-if="error"
                :title="error"
                type="error"
                class="mt-6"
                :closable="false"
                show-icon
              />
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-4 border-t border-gray-100 text-center text-gray-500 text-sm">
          <p>© {{ new Date().getFullYear() }} Time Bank. 基于区块链技术构建的互助社区。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import WalletConnect from '@/components/auth/WalletConnect.vue'
import RegisterForm from '@/components/auth/RegisterForm.vue'

const authStore = useAuthStore()
const { isWalletConnected, isAuthenticated, isCorrectNetwork } = storeToRefs(authStore)

// 状态
const error = ref('')
const existingUser = ref(false)

// 页面标题
const getPageTitle = computed(() => {
  if (!isWalletConnected.value) return '连接钱包'
  if (!isAuthenticated.value && !existingUser.value) return '注册新用户'
  return '登录成功'
})

// 页面子标题
const getPageSubtitle = computed(() => {
  if (!isWalletConnected.value)
    return '请连接您的 MetaMask 钱包以继续'
  if (!isAuthenticated.value && !existingUser.value)
    return '请填写下列信息完成注册'
  return '即将进入时间银行系统'
})
</script>
