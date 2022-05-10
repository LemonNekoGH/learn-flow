<script setup lang="ts">
</script>

<template>
  <ElContainer>
    <ElAside>
      <ElMenu router>
        <ElMenuItem index="/quick_start">
          快速入门
        </ElMenuItem>
        <ElMenuItem index="/quick_start_no_wallet_provider">
          快速入门（绕过钱包供应商的版本）
        </ElMenuItem>
      </ElMenu>
    </ElAside>
    <ElContainer>
      <ElHeader class="bg-[#fc7299] text-white h-4rem text-1.5rem flex items-center px-1rem">
        柠喵的可交互 Flow 链学习笔记
      </ElHeader>
      <ElMain>
        <RouterView />
      </ElMain>
    </ElContainer>
  </ElContainer>
</template>
