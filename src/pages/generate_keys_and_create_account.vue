<script lang="ts" setup>
import { ElMessage } from 'element-plus/es'
import { reactive } from 'vue'

const keys = reactive({
  private: '',
  public: '',
})
const generateKeys = async () => {
  const crypto = new SubtleCrypto()
  try {
    const key = await crypto.generateKey({
      name: 'ECDSA',
      namedCurve: 'P-256',
    }, true, ['sign', 'verify', 'decrypt', 'deriveBits', 'deriveKey', 'unwrapKey', 'wrapKey']) // 用途全写上了，到时候再研究具体只需要哪些用户
  }
  catch (e) {
    const err = e as Error
    console.log(`生成密钥对时出错: ${err.message}`)
    ElMessage.error(`生成密钥对时出错: ${err.message}`)
  }
}
</script>
<template>
  <ElButton @click="generateKeys">
    生成密钥对
  </ElButton>
  <ElInput disabled>
    <template #prepend>
      公钥
    </template>
  </ElInput>
  <ElInput disabled>
    <template #prepend>
      私钥
    </template>
  </ElInput>
</template>
