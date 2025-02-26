// stores/user.ts

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, UserRole } from '@/types/user'

export const useUserStore = defineStore('user', () => {
  // 状态
  const userInfo = ref<User | null>(null)

  // 计算属性
  const isVolunteer = computed(() => userInfo.value?.role === 'volunteer')
  const isElder = computed(() => userInfo.value?.role === 'elder')
  const isAdmin = computed(() => userInfo.value?.role === 'admin')
  const role = computed(() => userInfo.value?.role)
  const name = computed(() => userInfo.value?.name)
  const id = computed(() => userInfo.value?.id)

  // 初始化用户信息
  const initUserInfo = () => {
    const storedUserInfo = localStorage.getItem('userInfo')
    if (storedUserInfo) {
      try {
        userInfo.value = JSON.parse(storedUserInfo)
        console.log("Restored user info from localStorage:", userInfo.value)
      } catch (e) {
        console.error('Failed to parse stored user info:', e)
        localStorage.removeItem('userInfo') // 清除无效数据
      }
    }
  }

  // 设置用户信息
  const setUserInfo = (user: User) => {
    userInfo.value = user
    // 保存到localStorage - 新增此行
    localStorage.setItem('userInfo', JSON.stringify(user))
  }

  // 清除用户信息
  const clearUserInfo = () => {
    userInfo.value = null
    // 从localStorage中删除 - 新增此行
    localStorage.removeItem('userInfo')
  }

  // 更新用户角色
  const updateRole = (newRole: UserRole) => {
    if (userInfo.value) {
      userInfo.value.role = newRole
      // 更新localStorage - 新增此行
      localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
    }
  }

  return {
    // 状态
    userInfo,

    // 计算属性
    isVolunteer,
    isElder,
    isAdmin,
    role,
    name,
    id,

    // 方法
    initUserInfo,
    setUserInfo,
    clearUserInfo,
    updateRole
  }
})
