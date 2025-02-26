// router/routes/auth.ts
import { RouteRecordRaw } from 'vue-router'

export const authRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Auth',
    component: () => import('@/views/Auth.vue'),
    meta: {
      title: '用户认证',
      guest: true // 游客可访问
    }
  }
]
