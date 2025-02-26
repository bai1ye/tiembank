<!-- components/layout/Header.vue -->
<template>
  <header class="bg-white shadow-sm">
    <div class="container mx-auto px-4 h-16 flex items-center justify-between">
      <!-- Logo -->
      <div class="flex items-center">
        <h1 class="text-xl font-semibold text-gray-800">
          Time Bank
        </h1>
      </div>

      <!-- Navigation -->
      <nav v-if="isAuthenticated" class="flex items-center space-x-8">
        <template v-if="isVolunteer">
          <router-link
            to="/volunteer/services"
            class="text-gray-600 hover:text-primary"
          >
            我的服务
          </router-link>
          <router-link
            to="/volunteer/requests"
            class="text-gray-600 hover:text-primary"
          >
            服务请求
          </router-link>
        </template>

        <template v-if="isElder">
          <router-link
            to="/elder/services"
            class="text-gray-600 hover:text-primary"
          >
            我的请求
          </router-link>
          <router-link
            to="/elder/volunteers"
            class="text-gray-600 hover:text-primary"
          >
            志愿者服务
          </router-link>
        </template>

        <template v-if="isAdmin">
          <router-link
            to="/admin/users"
            class="text-gray-600 hover:text-primary"
          >
            用户管理
          </router-link>
          <router-link
            to="/admin/services"
            class="text-gray-600 hover:text-primary"
          >
            服务管理
          </router-link>
        </template>
      </nav>

      <!-- User Area -->
      <div class="flex items-center space-x-4">
        <template v-if="isAuthenticated">
          <!-- User Info -->
          <el-dropdown trigger="click">
            <div class="flex items-center cursor-pointer">
              <div class="text-sm text-gray-700">{{ userName }}</div>
              <el-icon class="ml-1"><arrow-down /></el-icon>
            </div>

            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>
                  <div class="text-gray-500 text-xs mb-1">钱包地址</div>
                  <div class="font-mono text-sm">{{ formatAddress(walletAddress) }}</div>
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <!-- Balance -->
          <div class="flex items-center bg-gray-50 px-3 py-1.5 rounded">
            <span class="text-sm text-gray-600 mr-1">余额:</span>
            <span class="font-medium">100</span>
            <span class="text-xs text-gray-500 ml-1">TIME</span>
          </div>
        </template>

        <template v-else>
          <WalletConnect />
        </template>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ArrowDown } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useUserStore } from '@/stores/user'
import WalletConnect from '../auth/WalletConnect.vue'

const router = useRouter()
const authStore = useAuthStore()
const userStore = useUserStore()

// 从store获取状态
const { isAuthenticated, walletAddress } = storeToRefs(authStore)
const { isAdmin, isVolunteer, isElder } = storeToRefs(userStore)
const userName = computed(() => userStore.name)

// 格式化钱包地址
const formatAddress = (address: string | null) => {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// 处理登出
const handleLogout = () => {
  authStore.logout()
  router.push('/')
}
</script>
