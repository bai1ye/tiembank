<!-- App.vue -->
<template>
  <div
    v-loading="loading"
    element-loading-text="正在初始化..."
    element-loading-background="rgba(255, 255, 255, 0.8)"
    class="h-screen"
  >
    <!-- 路由视图 -->
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const loading = ref(true)

onMounted(async () => {
  try {
    // 初始化钱包状态
    await authStore.initWallet()
    // 设置钱包事件监听
    authStore.setupWalletListeners()
  } catch (error) {
    console.error('初始化失败:', error)
  } finally {
    loading.value = false
  }
})
</script>
