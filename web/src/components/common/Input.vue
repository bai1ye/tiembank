<!-- components/common/Input.vue -->
<template>
  <div class="custom-input">
    <el-input
      v-bind="$attrs"
      :class="[
        {
          'is-error': error,
          'w-full': block
        }
      ]"
      :value="modelValue"
      @input="handleInput"
      :disabled="disabled"
      :size="size"
      :placeholder="placeholder"
    >
      <template v-if="$slots.prefix" #prefix>
        <slot name="prefix" />
      </template>

      <template v-if="$slots.suffix" #suffix>
        <slot name="suffix" />
      </template>
    </el-input>

    <div v-if="error" class="custom-input__error">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  // v-model绑定值
  modelValue?: string | number
  // 占位文本
  placeholder?: string
  // 输入框大小
  size?: 'large' | 'default' | 'small'
  // 是否禁用
  disabled?: boolean
  // 错误信息
  error?: string
  // 是否为块级元素
  block?: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
}>()

// 处理输入
const handleInput = (value: string) => {
  emit('update:modelValue', value)
  emit('change', value)
}
</script>

<style>
.custom-input {
    width: 100%;
}

.custom-input .el-input__wrapper {
    transition: all 0.3s ease;
}

.custom-input .el-input__wrapper.is-focus {
    box-shadow: 0 0 0 2px rgba(var(--el-color-primary-rgb), 0.5);
}

.custom-input .is-error .el-input__wrapper {
    border-color: var(--el-color-danger);
    box-shadow: 0 0 0 2px rgba(var(--el-color-danger-rgb), 0.5);
}

.custom-input__error {
    margin-top: 0.25rem;
    font-size: 0.875rem;
    color: var(--el-color-danger);
}
</style>
