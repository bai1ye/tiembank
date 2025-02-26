<!-- components/common/Modal.vue -->
<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    :width="width"
    :close-on-click-modal="closeOnClickModal"
    :close-on-press-escape="closeOnPressEscape"
    :show-close="showClose"
    class="custom-dialog"
    :class="{ 'custom-dialog--centered': centered }"
    @close="handleClose"
  >
    <template #header v-if="$slots.header">
      <slot name="header" />
    </template>

    <div class="custom-dialog__body">
      <slot />
    </div>

    <template #footer>
      <slot name="footer">
        <div class="custom-dialog__footer">
          <Button
            v-if="showCancel"
            @click="handleCancel"
            type="default"
            :loading="cancelLoading"
          >
            {{ cancelText }}
          </Button>
          <Button
            v-if="showConfirm"
            @click="handleConfirm"
            type="primary"
            :loading="confirmLoading"
          >
            {{ confirmText }}
          </Button>
        </div>
      </slot>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import Button from './Button.vue'
import { ref, watch } from 'vue'

interface Props {
  // 是否显示
  modelValue?: boolean
  // 标题
  title?: string
  // 宽度
  width?: string | number
  // 是否可通过点击 modal 关闭
  closeOnClickModal?: boolean
  // 是否可通过按下 ESC 关闭
  closeOnPressEscape?: boolean
  // 是否显示关闭按钮
  showClose?: boolean
  // 是否垂直居中
  centered?: boolean
  // 是否显示取消按钮
  showCancel?: boolean
  // 是否显示确认按钮
  showConfirm?: boolean
  // 取消按钮文本
  cancelText?: string
  // 确认按钮文本
  confirmText?: string
  // 取消按钮加载状态
  cancelLoading?: boolean
  // 确认按钮加载状态
  confirmLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  title: '',
  width: '500px',
  closeOnClickModal: true,
  closeOnPressEscape: true,
  showClose: true,
  centered: true,
  showCancel: true,
  showConfirm: true,
  cancelText: '取消',
  confirmText: '确认',
  cancelLoading: false,
  confirmLoading: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'cancel'): void
  (e: 'confirm'): void
  (e: 'close'): void
}>()

const dialogVisible = ref(props.modelValue)

// 监听modelValue变化
watch(
  () => props.modelValue,
  (val) => {
    dialogVisible.value = val
  }
)

// 监听dialogVisible变化
watch(dialogVisible, (val) => {
  emit('update:modelValue', val)
})

// 处理取消
const handleCancel = () => {
  emit('cancel')
}

// 处理确认
const handleConfirm = () => {
  emit('confirm')
}

// 处理关闭
const handleClose = () => {
  emit('close')
}
</script>

<style>
.custom-dialog {
  border-radius: 0.5rem;
}

.custom-dialog--centered :deep(.el-dialog) {
  margin-top: 0;
  position: relative;
  top: 50%;
  transform: translateY(-50%);
}

.custom-dialog__body {
  padding: 1rem 0;
}

.custom-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

/* 标题样式优化 */
.custom-dialog :deep(.el-dialog__header) {
  margin-bottom: 0;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

/* 内容区域样式优化 */
.custom-dialog :deep(.el-dialog__body) {
  padding: 1rem 1.5rem;
}

/* 底部样式优化 */
.custom-dialog :deep(.el-dialog__footer) {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
}
</style>
