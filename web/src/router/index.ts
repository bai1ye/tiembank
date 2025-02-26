// router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { authRoutes } from './routes/auth'
import { useUserStore } from "@/stores/user.ts";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    ...authRoutes,
    // 后续添加其他路由
    {
      path: '/volunteer',
      name: 'VolunteerHome',
      component: () => import('@/views/volunteer/Home.vue'),
      meta: {
        requiresAuth: true,
        role: 'volunteer'
      }
    },
    {
      path: '/elder',
      name: 'ElderHome',
      component: () => import('@/views/elder/Home.vue'),
      meta: {
        requiresAuth: true,
        role: 'elder'
      }
    },
    {
      path: '/admin',
      name: 'AdminHome',
      component: () => import('@/views/admin/Home.vue'),
      meta: {
        requiresAuth: true,
        role: 'admin'
      }
    },
    // 全局 404 路由
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/NotFound.vue')
    }
  ]
})

// 路由守卫
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()
  const userStore = useUserStore()

  // 初始化用户信息 - 新增这段
  userStore.initUserInfo()

  // 刷新页面时重新获取钱包状态
  if (!authStore.walletAddress) {
    try {
      await authStore.initWallet()
    } catch(e) {
      console.error("Failed to initialize wallet:", e)
    }
  }

  // 需要认证的路由
  if (to.meta.requiresAuth) {
    // 检查是否已认证且钱包保持连接
    if (!authStore.isAuthenticated || !authStore.isWalletConnected) {
      // 未认证或钱包未连接，重定向到登录页
      next({ path: '/', query: { redirect: to.fullPath } })
      return
    }

    // 如果认证了但没有用户信息，说明需要重新登录 - 新增这段
    if (!userStore.userInfo) {
      console.error("Authenticated but no user info found")
      authStore.logout()
      next({ path: '/' })
      return
    }

    // 检查角色权限（如果有角色要求）
    if (to.meta.role) {
      const hasRole = to.meta.role === userStore.role
      console.log("Role check:", {
        required: to.meta.role,
        current: userStore.role,
        hasRole
      })

      if (!hasRole) {
        // 如果不具备所需角色，根据当前角色重定向
        if (userStore.isVolunteer) {
          next('/volunteer')
        } else if (userStore.isElder) {
          next('/elder')
        } else if (userStore.isAdmin) {
          next('/admin')
        } else {
          // 角色未知，重定向到登录页
          next('/')
        }
        return
      }
    }

    // 通过所有检查，允许继续
    next()
    return
  }

  // 未认证路由（游客可访问）
  // 如果已登录且访问登录页，重定向到相应的首页
  if (to.meta.guest && authStore.isAuthenticated && authStore.isWalletConnected) {
    const userStore = useUserStore()
    console.log(userStore.isVolunteer, userStore.isElder, userStore.isAdmin)
    if (userStore.isVolunteer) {
      next('/volunteer')
    } else if (userStore.isElder) {
      next('/elder')
    } else if (userStore.isAdmin) {
      next('/admin')
    } else {
      // 默认行为，允许继续
      next()
    }
    return
  }

  // 默认行为
  next()
})

export default router
