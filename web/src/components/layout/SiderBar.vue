<!-- components/layout/Sidebar.vue -->
<template>
  <div
    class="sidebar bg-white"
    :class="{ 'sidebar--collapsed': collapsed }"
  >
    <div class="h-full flex flex-col">
      <!-- Toggle Button -->
      <div
        class="p-4 flex justify-end cursor-pointer text-gray-500 hover:text-gray-700"
        @click="toggleCollapse"
      >
        <el-icon>
          <Fold v-if="!collapsed" />
          <Expand v-else />
        </el-icon>
      </div>

      <!-- Menu -->
      <el-menu
        :default-active="activeMenu"
        class="flex-1 border-none"
        :collapse="collapsed"
      >
        <template v-for="menu in filteredMenus" :key="menu.path">
          <!-- 分组菜单 -->
          <template v-if="menu.children">
            <el-sub-menu :index="menu.path">
              <template #title>
                <el-icon v-if="menu.icon">
                  <component :is="menu.icon" />
                </el-icon>
                <span>{{ menu.title }}</span>
              </template>

              <el-menu-item
                v-for="submenu in menu.children"
                :key="submenu.path"
                :index="submenu.path"
                @click="handleMenuClick(submenu.path)"
              >
                <el-icon v-if="submenu.icon">
                  <component :is="submenu.icon" />
                </el-icon>
                <span>{{ submenu.title }}</span>
              </el-menu-item>
            </el-sub-menu>
          </template>

          <!-- 普通菜单 -->
          <template v-else>
            <el-menu-item
              :index="menu.path"
              @click="handleMenuClick(menu.path)"
            >
              <el-icon v-if="menu.icon">
                <component :is="menu.icon" />
              </el-icon>
              <span>{{ menu.title }}</span>
            </el-menu-item>
          </template>
        </template>
      </el-menu>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'
import { Fold, Expand } from '@element-plus/icons-vue'

// Props 定义
interface MenuItem {
  path: string
  title: string
  icon?: string
  role?: string[]
  children?: MenuItem[]
}

interface Props {
  // 菜单配置
  menus: MenuItem[]
  // 是否折叠
  collapsed?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  collapsed: false
})

const emit = defineEmits<{
  (e: 'update:collapsed', value: boolean): void
}>()

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 获取用户角色
const { role } = storeToRefs(userStore)

// 菜单展开/收起状态
const collapsed = computed({
  get: () => props.collapsed,
  set: (value) => emit('update:collapsed', value)
})

// 切换展开/收起
const toggleCollapse = () => {
  collapsed.value = !collapsed.value
}

// 当前激活的菜单
const activeMenu = computed(() => route.path)

// 根据用户角色过滤菜单
const filteredMenus = computed(() => {
  return props.menus.filter(menu => {
    if (!menu.role) return true
    return role.value && menu.role.includes(role.value)
  })
})

// 处理菜单点击
const handleMenuClick = (path: string) => {
  router.push(path)
}
</script>

<style>
.sidebar {
  width: 240px;
  transition: width 0.3s ease;
  height: 100%;
  border-right: 1px solid #e5e7eb;
}

.sidebar--collapsed {
  width: 64px;
}

/* Element Plus Menu 样式覆盖 */
.el-menu {
  background-color: transparent;
}

.el-menu-item {
  height: 48px;
}

.el-menu-item.is-active {
  background-color: rgba(var(--el-color-primary-rgb), 0.1);
  color: var(--el-color-primary);
}
</style>
