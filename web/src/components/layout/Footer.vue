<!-- components/layout/Footer.vue -->
<template>
  <footer class="bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <div class="flex flex-col items-center">
        <div class="mb-4 text-gray-600">
          <span>© {{ currentYear }} Time Bank. All rights reserved.</span>
        </div>

        <div class="text-sm text-gray-500">
          <div>合约地址：{{ CONTRACT_ADDRESS }}</div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CONTRACT_ADDRESS } from '@/config/contract'

const currentYear = computed(() => new Date().getFullYear())
</script>
