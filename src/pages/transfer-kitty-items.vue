<script setup lang="ts">
import { onMounted, ref } from 'vue'
import * as fcl from '@onflow/fcl'
import { useTransactionWorker } from '~/transaction-worker'

// 使用交易查询工具
const worker = useTransactionWorker()

// 当前连接的 flow 用户
const flowUser = ref<any>()
// 设置 flow 用户
const setUser = async (userInfo: any) => {
  flowUser.value = userInfo
  if (!userInfo || !userInfo.addr)
    return
  console.log('packagePage.connectSuccess')
}
const doTransfer = async () => {
  const tx = await fcl.mutate({
    cadence: `
import NonFungibleToken from 0x631e88ae7f1d7c20
import KittyItems from 0xfc7afb972fc52cb5

transaction() {
	prepare(sender: AuthAccount) {
		let recipient = getAccount(0xe33af37fcbef8e84)
		// 尝试获取接收者的集合
		let recCollection = recipient.getCapability(KittyItems.CollectionPublicPath).borrow<&{KittyItems.KittyItemsCollectionPublic}>()
			?? panic("recipient account dose not has a KittyItemsCollectionPublic Collection.")
		// 尝试获取发送者的集合
		let senderCollection = sender.borrow<&KittyItems.Collection>(from: KittyItems.CollectionStoragePath)
			?? panic("sender account dose not has a KittyItems.CollectionStoragePath Collection.")
		// 取出发送者的 NFT
		let nft <- senderCollection.withdraw(withdrawID: 5)
		// 放入到接收者的集合
		recCollection.deposit(token: <- nft)
	}
}
`,
    args: () => [],
    limit: 9999,
    proposer: fcl.authz,
    payer: fcl.authz,
    authorizer: [fcl.authz],
  })
  console.log(tx)
  worker.newWorker(tx, 'packagePage.transferStart', 'packagePage.transferSuccess', 'packagePage.transferError')
}
onMounted(() => {
  // 监听 flow 用户信息
  fcl.currentUser.subscribe(setUser)
})
</script>

<template>
  <ElButton @click="fcl.logIn">
    登录
  </ElButton>
  <ElButton @click="doTransfer">
    转移
  </ElButton>
  <ElButton @click="fcl.unauthenticate">
    登出
  </ElButton>
  {{ flowUser?.addr }}
</template>

<style scoped>
</style>
