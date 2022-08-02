<script setup lang="ts">
import { onMounted, ref } from 'vue'
import * as fcl from '@onflow/fcl'
import { useTransactionWorker } from '~/transaction-worker'
import { ElMessage } from 'element-plus';
import { ElRadioGroup } from 'element-plus';
import { ElRadio } from 'element-plus';

// 使用交易查询工具
const worker = useTransactionWorker()

// 当前连接的 flow 用户
const flowUser = ref<any>()
// 设置 flow 用户
const setUser = async (userInfo: any) => {
  flowUser.value = userInfo
  if (!userInfo || !userInfo.addr)
    return
  ElMessage.success('packagePage.connectSuccess')
  // 获取账户里面所有的盲盒
  getAllOwnedBox(flowUser.value.addr)
}
// 盲盒 ID
const ids = ref<number[]>([])
const selectedId = ref(0)
/**
 * 获取钱包地址拥有的所有猫咪盲盒
 */
const getAllOwnedBox = async(address: string) => {
  try {
    const res = await fcl.query({
      cadence: `
import MonoCatMysteryBox from 0xa01dd6e82b7352be

// 获取猫咪盲盒的 NFT ID
pub fun getOwnedMonoCatMysteryBoxData(acc: PublicAccount): [UInt64] {
  // 获取集合，没有集合就返回空
  let collection = acc.getCapability<&{MonoCatMysteryBox.MonoCatMysteryBoxCollectionPublic}>(MonoCatMysteryBox.CollectionPublicPath).borrow()
  if collection == nil {
    return []
  }
  // 获取到用户拥有的所有 ID
  return collection!.getIDs()
}

pub fun main(): [UInt64] {
  // 获取账号
  let account = getAccount(${address})
  var ret: [UInt64] = []
  ret = ret.concat(getOwnedMonoCatMysteryBoxData(acc: account))
  return ret
}`,
      args: () => [],
      limit: 9999,
    })
    console.log(res)
    ids.value = res
    selectedId.value = ids.value[0]
  }
  catch (e) {
    return e as Error
  }
}

/**
 * 销毁用户的盲盒并返回交易 ID
 * @param tokenId 要销毁的盲盒 ID
 * @returns 交易 ID
 */
const destroyAndInitCollection = async(tokenId: number) => {
  const txId = await fcl.mutate({ 
    cadence: `
import NonFungibleToken from 0x631e88ae7f1d7c20
import MonoCat from 0xa01dd6e82b7352be
import MonoCatMysteryBox from 0xa01dd6e82b7352be
transaction {
  prepare(recipientAccount: AuthAccount) {
    // 尝试从账号中获取盲盒集合
    let boxCol = recipientAccount.borrow<&MonoCatMysteryBox.Collection>(from: MonoCatMysteryBox.CollectionStoragePath)
    // 获取到猫咪盲盒
    let nft <- boxCol!.withdraw(withdrawID: ${tokenId})
    // 销毁盲盒
    destroy nft
    // 尝试从账号中获取猫咪集合
    let catCol = recipientAccount.borrow<&MonoCat.Collection>(from: MonoCat.CollectionStoragePath)
    // 没有获取到集合
    if (catCol == nil) {
      // 创建空集合
      let collection <- MonoCat.createEmptyCollection()
      // 存入账号中去
      recipientAccount.save(<-collection,to: MonoCat.CollectionStoragePath)
      // 允许外界访问此集合
      recipientAccount.link<&MonoCat.Collection{NonFungibleToken.Receiver, NonFungibleToken.CollectionPublic, MonoCat.MonoCatCollectionPublic}>(
        MonoCat.CollectionPublicPath,
        target: MonoCat.CollectionStoragePath
      )
    }
  }
}
`,
    args: () => [],
    limit: 9999,
    proposer: fcl.authz,
    payer: fcl.authz,
    authorizer: [fcl.authz],
  })
  worker.newWorker(txId, 'Start', 'Success', 'Error')
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
  <ElButton @click="destroyAndInitCollection(selectedId)">
    销毁
  </ElButton>
  <ElButton @click="fcl.unauthenticate">
    登出
  </ElButton>
  {{ flowUser?.addr }}
  <div>
    <ElRadioGroup>
      <ElRadio border v-for="id of ids" :key="id">Box #{{ id }}</ElRadio>
    </ElRadioGroup>
  </div>
</template>

<style scoped>
</style>
