<!-- components/auth/RegisterForm.vue -->
<template v-if="!isWalletConnected">
  <div class="register-form">
    <!-- Registration steps indicator -->
    <div class="mb-6">
      <div class="flex items-center">
        <div class="flex-1">
          <div
            class="h-2 rounded-full transition-colors duration-300"
            :class="[currentStep >= 1 ? 'bg-blue-500' : 'bg-gray-200']"
          ></div>
        </div>
        <div class="flex-1 mx-1">
          <div
            class="h-2 rounded-full transition-colors duration-300"
            :class="[currentStep >= 2 ? 'bg-blue-500' : 'bg-gray-200']"
          ></div>
        </div>
        <div class="flex-1">
          <div
            class="h-2 rounded-full transition-colors duration-300"
            :class="[currentStep >= 3 ? 'bg-blue-500' : 'bg-gray-200']"
          ></div>
        </div>
      </div>
      <div class="flex text-xs mt-1 text-gray-500">
        <div class="flex-1 text-center">信息填写</div>
        <div class="flex-1 text-center">身份验证</div>
        <div class="flex-1 text-center">确认注册</div>
      </div>
    </div>

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      @submit.prevent="handleSubmit"
    >
      <!-- Step 1: Basic Information -->
      <template v-if="currentStep === 1">
        <h3 class="text-lg font-medium text-gray-900 mb-4">个人信息</h3>

        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入姓名" :maxlength="20" class="rounded-md">
            <template #prefix>
              <el-icon class="text-gray-400"><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="身份证号" prop="idCard">
          <el-input
            v-model="form.idCard"
            placeholder="请输入身份证号"
            :maxlength="9"
            type="text"
            class="rounded-md"
          >
            <template #prefix>
              <el-icon class="text-gray-400"><Document /></el-icon>
            </template>
          </el-input>
          <div class="mt-1 flex items-center">
            <el-icon class="text-blue-500 mr-1"><InfoFilled /></el-icon>
            <span class="text-sm text-gray-500">格式：yyyyMMdd[mw], 例如: 19900101m</span>
          </div>
        </el-form-item>

        <el-form-item label="钱包地址">
          <div class="font-mono text-sm bg-gray-50 p-3 rounded break-all flex items-center">
            <el-icon class="text-gray-500 mr-2"><Wallet /></el-icon>
            {{ formatAddress(walletAddress) }}
          </div>
        </el-form-item>

        <div class="mt-6">
          <el-button type="primary" :disabled="!canValidate" @click="nextStep" class="w-full">
            下一步
          </el-button>
        </div>
      </template>

      <!-- Step 2: Validation -->
      <template v-else-if="currentStep === 2">
        <h3 class="text-lg font-medium text-gray-900 mb-4">身份验证</h3>

        <div class="bg-gray-50 p-4 rounded-lg mb-4">
          <div class="text-sm mb-2 flex items-center gap-2">
            <span class="font-medium text-gray-700">验证通过后，将根据规定确定您的角色分类</span>
            <el-tooltip
              content="男性小于63岁、女性小于58岁为志愿者，其余为老人需求者"
              placement="top"
            >
              <el-icon class="text-gray-500"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </div>

        <div class="space-y-3 mb-4">
          <div class="flex items-center">
            <div
              class="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center"
              :class="[
                validationStatus >= 1 ? 'bg-green-100 text-green-500' : 'bg-gray-100 text-gray-400',
              ]"
            >
              <el-icon v-if="validationStatus >= 1"><Check /></el-icon>
              <el-icon v-else><Loading /></el-icon>
            </div>
            <div
              class="ml-3 text-sm"
              :class="[validationStatus >= 1 ? 'text-gray-900' : 'text-gray-500']"
            >
              验证姓名格式
            </div>
          </div>

          <div class="flex items-center">
            <div
              class="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center"
              :class="[
                validationStatus >= 2 ? 'bg-green-100 text-green-500' : 'bg-gray-100 text-gray-400',
              ]"
            >
              <el-icon v-if="validationStatus >= 2"><Check /></el-icon>
              <el-icon v-else><Loading /></el-icon>
            </div>
            <div
              class="ml-3 text-sm"
              :class="[validationStatus >= 2 ? 'text-gray-900' : 'text-gray-500']"
            >
              验证身份证号格式
            </div>
          </div>

          <div class="flex items-center">
            <div
              class="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center"
              :class="[
                validationStatus >= 3 ? 'bg-green-100 text-green-500' : 'bg-gray-100 text-gray-400',
              ]"
            >
              <el-icon v-if="validationStatus >= 3"><Check /></el-icon>
              <el-icon v-else><Loading /></el-icon>
            </div>
            <div
              class="ml-3 text-sm"
              :class="[validationStatus >= 3 ? 'text-gray-900' : 'text-gray-500']"
            >
              根据年龄确定角色
            </div>
          </div>
        </div>

        <!-- Validation result -->
        <div v-if="validationResult" class="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h4 class="text-sm font-medium text-blue-800 mb-2">验证结果</h4>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">用户角色：</span>
              <span
                class="text-sm font-medium"
                :class="{
                  'text-green-600': roleText === '志愿者',
                  'text-purple-600': roleText === '老人',
                }"
                >{{ roleText }}</span
              >
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">出生日期：</span>
              <span class="text-sm font-medium text-gray-800">{{ formatBirthDate }}</span>
            </div>
          </div>
        </div>

        <div class="flex gap-3">
          <el-button @click="currentStep = 1" class="flex-1"> 上一步 </el-button>

          <el-button
            type="primary"
            :loading="validating"
            :disabled="!canValidate"
            @click="handleValidate"
            class="flex-1"
          >
            {{ validationResult ? '重新验证' : validating ? '验证中...' : '验证信息' }}
          </el-button>

          <el-button
            type="success"
            :disabled="!validationResult"
            @click="currentStep = 3"
            class="flex-1"
          >
            下一步
          </el-button>
        </div>
      </template>

      <!-- Step 3: Confirmation -->
      <template v-else-if="currentStep === 3">
        <h3 class="text-lg font-medium text-gray-900 mb-4">确认注册</h3>

        <div class="bg-green-50 p-4 rounded-lg mb-6 border border-green-100">
          <h4 class="text-sm font-medium text-green-800 mb-2">将执行以下步骤</h4>
          <ol class="text-sm space-y-2 text-gray-700">
            <li class="flex items-center gap-2">
              <div
                class="w-6 h-6 rounded-full bg-white flex items-center justify-center text-green-600 flex-shrink-0"
              >
                1
              </div>
              <span>生成用户信息哈希</span>
            </li>
            <li class="flex items-center gap-2">
              <div
                class="w-6 h-6 rounded-full bg-white flex items-center justify-center text-green-600 flex-shrink-0"
              >
                2
              </div>
              <span>调用智能合约完成链上注册（需要确认交易）</span>
            </li>
            <li class="flex items-center gap-2">
              <div
                class="w-6 h-6 rounded-full bg-white flex items-center justify-center text-green-600 flex-shrink-0"
              >
                3
              </div>
              <span>确认交易后完成系统注册</span>
            </li>
          </ol>
        </div>

        <div class="bg-gray-50 p-4 rounded-lg mb-6">
          <h4 class="text-sm font-medium text-gray-700 mb-2">您的身份信息</h4>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">姓名：</span>
              <span class="text-sm font-medium text-gray-800">{{ form.name }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">身份证号：</span>
              <span class="text-sm font-medium text-gray-800">{{ maskIdCard(form.idCard) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">钱包地址：</span>
              <span class="text-sm font-mono text-gray-800">{{
                formatAddress(walletAddress)
              }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">用户角色：</span>
              <span
                class="text-sm font-medium"
                :class="{
                  'text-green-600': roleText === '志愿者',
                  'text-purple-600': roleText === '老人',
                }"
                >{{ roleText }}</span
              >
            </div>
          </div>
        </div>

        <div class="flex gap-3">
          <el-button @click="currentStep = 2" class="flex-1"> 上一步 </el-button>

          <el-button
            type="primary"
            :loading="registering"
            :disabled="!canRegister"
            @click="handleSubmit"
            class="flex-1"
          >
            {{ registering ? '注册中...' : '确认注册' }}
          </el-button>
        </div>
      </template>

      <!-- Error message -->
      <el-alert v-if="error" :title="error" type="error" class="mt-6" :closable="false" show-icon />
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { registerUser, textToBytes32 } from '@/utils/contract'
import { isValidIdCard, isValidName, ValidationMessages } from '@/utils/validation'
import type { ValidateRegisterResponse } from '@/types/user'
import type { FormInstance } from 'element-plus'
import {
  Check,
  Document,
  InfoFilled,
  Loading,
  QuestionFilled,
  User,
  Wallet,
} from '@element-plus/icons-vue'

const authStore = useAuthStore()
const { walletAddress } = storeToRefs(authStore)

// 表单实例
const formRef = ref<FormInstance>()

// 表单数据
const form = ref({
  name: '',
  idCard: '',
  walletAddress: walletAddress,
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: ValidationMessages.REQUIRED_FIELD },
    {
      validator: (_: any, value: string, callback: Function) => {
        if (!isValidName(value)) {
          callback(new Error(ValidationMessages.INVALID_NAME))
        } else {
          callback()
        }
      },
    },
  ],
  idCard: [
    { required: true, message: ValidationMessages.REQUIRED_FIELD },
    {
      validator: (_: any, value: string, callback: Function) => {
        if (!isValidIdCard(value)) {
          callback(new Error(ValidationMessages.INVALID_ID_CARD))
        } else {
          callback()
        }
      },
    },
  ],
}

// 状态
const validating = ref(false)
const registering = ref(false)
const error = ref('')
const validationResult = ref<ValidateRegisterResponse | null>(null)
const currentStep = ref(1)
const validationStatus = ref(0)

// 是否可以验证
const canValidate = computed(() => {
  return !!form.value.name && !!form.value.idCard && !!walletAddress.value
})

// 是否可以注册
const canRegister = computed(() => {
  return validationResult.value && !validating.value && !registering.value
})

// 角色文本
const roleText = computed(() => {
  if (!validationResult.value) return ''
  return validationResult.value.role === 'volunteer' ? '志愿者' : '老人'
})

// 格式化出生日期
const formatBirthDate = computed(() => {
  if (!validationResult.value?.birth_date) return ''
  const date = validationResult.value.birth_date
  // 确保是8位数字格式
  if (!/^\d{8}$/.test(date)) return '日期格式错误'
  return `${date.substring(0, 4)}年${date.substring(4, 6)}月${date.substring(6, 8)}日`
})

// 格式化钱包地址
const formatAddress = (address: string | null) => {
  if (!address) return ''
  return `${address.slice(0, 10)}...${address.slice(-8)}`
}

// 掩码身份证号
const maskIdCard = (idCard: string) => {
  if (!idCard || idCard.length < 9) return idCard
  return `${idCard.slice(0, 4)}****${idCard.slice(-1)}`
}

// 进入下一步
const nextStep = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    currentStep.value++
  } catch (err) {
    // 表单验证失败
    console.error('Form validation failed:', err)
  }
}

// 验证信息
const handleValidate = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    validating.value = true
    error.value = ''
    validationStatus.value = 0

    // 模拟验证过程
    setTimeout(() => {
      validationStatus.value = 1
    }, 500)
    setTimeout(() => {
      validationStatus.value = 2
    }, 1000)
    setTimeout(() => {
      validationStatus.value = 3
    }, 1500)

    // 调用后端验证接口
    validationResult.value = await authStore.validateRegister({
      name: form.value.name,
      idCard: form.value.idCard,
      walletAddress: walletAddress.value as string,
    })
  } catch (err: any) {
    error.value = err.message || '验证失败'
    validationResult.value = null
    validationStatus.value = 0
  } finally {
    validating.value = false
  }
}

// 提交注册
const handleSubmit = async () => {
  if (!validationResult.value || !walletAddress.value) return

  try {
    registering.value = true
    error.value = ''

    console.log('开始注册流程:', {
      name: form.value.name,
      idCard: form.value.idCard,
      walletAddress: walletAddress.value,
      validationResult: validationResult.value,
    })

    // 1. 生成用户信息哈希
    const infoText = form.value.name + form.value.idCard
    const infoHash = textToBytes32(infoText)
    console.log('生成的信息哈希:', infoHash)

    // 计算年龄
    const calculateAge = (birthYear: number): number => {
      const currentYear = new Date().getFullYear()
      return currentYear - birthYear
    }

    const birthYear = parseInt(validationResult.value.birth_date.slice(0, 4))
    const age = calculateAge(birthYear)

    // 2. 调用智能合约注册
    console.log('准备调用智能合约:', {
      infoHash,
      isMale: validationResult.value.gender === 1,
      age,
    })

    const txHash = await registerUser(infoHash, validationResult.value.gender === 1, age)
    console.log('智能合约交易哈希:', txHash)

    // 3. 调用后端注册接口
    await authStore.register({
      name: form.value.name,
      idCard: form.value.idCard,
      walletAddress: walletAddress.value,
      txHash,
    })

    console.log('注册成功!')
  } catch (err: any) {
    console.error('注册失败:', err)
    error.value = err.message || '注册失败'
  } finally {
    registering.value = false
  }
}
</script>

<style scoped>
.register-form :deep(.el-input__wrapper) {
  border-radius: 0.375rem;
}

.register-form :deep(.el-form-item__label) {
  font-weight: 500;
}
</style>
