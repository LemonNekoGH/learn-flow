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
        <ElMenuItem index="/transfer-kitty-items">
          转移 KittyItems NFT
        </ElMenuItem>
        <ElMenuItem index="/destroy_selected_mono_cat">
          销毁猫咪盲盒
        </ElMenuItem>
      </ElMenu>
    </ElAside>
    <ElContainer>
      <ElHeader class="flex bg-[#fc7299] h-4rem text-white px-1rem text-1.5rem items-center">
        柠喵的可交互 Flow 链学习笔记
      </ElHeader>
      <ElMain>
        <RouterView />
      </ElMain>
    </ElContainer>
  </ElContainer>
</template>
