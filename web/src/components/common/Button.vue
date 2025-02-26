<!-- components/common/Button.vue -->
<template>
  <el-button
    class="custom-button"
    :class="[
      {
        'w-full': block,
        'custom-button--wallet': variant === 'wallet'
      }
    ]"
    v-bind="$attrs"
    :loading="loading"
    :disabled="disabled"
    :type="type"
    :size="size"
  >
    <template v-if="$slots.icon || (variant === 'wallet' && !loading)">
      <span class="mr-2 inline-flex items-center">
        <slot name="icon">
          <svg v-if="variant === 'wallet'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M3 7v10a2 2 0 0 0 2 2h16v-5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M18 14h.01" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </slot>
      </span>
    </template>
    <slot></slot>
  </el-button>
</template>

<script setup lang="ts">
interface Props {
  // 按钮类型
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'text' | 'default'
  // 按钮大小
  size?: 'large' | 'default' | 'small'
  // 加载状态
  loading?: boolean
  // 禁用状态
  disabled?: boolean
  // 是否为块级元素
  block?: boolean
  // 变体类型
  variant?: 'wallet' | 'default'
}

// 属性默认值
withDefaults(defineProps<Props>(), {
  type: 'primary',
  size: 'default',
  loading: false,
  disabled: false,
  block: false,
  variant: 'default'
})
</script>

<style>
.custom-button {
    font-weight: 500;
    transition: all 0.3s ease;
}

.custom-button--wallet {
    background-color: rgb(31, 41, 55);
    color: white;
}

.custom-button--wallet:hover {
    background-color: rgb(55, 65, 81);
}

/* 加载状态样式优化 */
.custom-button.is-loading {
    opacity: 0.8;
    cursor: not-allowed;
}

/* 禁用状态样式优化 */
.custom-button.is-disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
</style>
