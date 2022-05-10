<script lang="ts" setup>
import '../flow/config'
import * as fcl from '@onflow/fcl'
import { onMounted, ref } from 'vue'
import 'element-plus/es/components/message/style/css'
import { ElMessage } from 'element-plus/es'

const user = ref<any>({})
const addressProfileName = ref('')
const profileNameWillUpdateTo = ref('')
const profileChangeStatus = ref<any>(null)

const queryAddress = async () => {
  try {
    const profile = await fcl.query({
      cadence: `
      import Profile from 0xProfile

      pub fun main(address: Address): Profile.ReadOnly? {
        return Profile.read(address)
      }
    `,
      args: (arg: any, t: any) => [arg(user.value.addr, t.Address)],
    })

    addressProfileName.value = profile?.name ?? 'No Profile'
    ElMessage.success('获取账户信息成功')
  }
  catch (e) {
    addressProfileName.value = 'Get Profile Error'
    ElMessage.error('获取账户信息失败')
  }
}

/**
 * 初始化账户
 */
const initAccount = async () => {
  try {
    const txid = await fcl.mutate({
      cadence: `
        import Profile from 0xProfile

        transaction {
          prepare(account: AuthAccount) {
            if (!Profile.check(account.address)) {
              account.save(<- Profile.new(), to: Profile.privatePath)
              account.link<&Profile.Base{Profile.Public}>(Profile.publicPath, target: Profile.privatePath)
            }
          }
        }
      `,
      player: fcl.authz,
      proposer: fcl.authz,
      authorizations: [fcl.authz],
      limit: 50,
    })
    await fcl.tx(txid).onceSealed()
    ElMessage.success('账户初始化成功')
  }
  catch (e) {
    const err = e as Error
    ElMessage.error(`初始化账户失败: ${err.message}`)
  }
}

/**
 * 更新账户名称
 */
const setProfileName = async () => {
  try {
    const transactionId = await fcl.mutate({
      cadence: `
      import Profile from 0xProfile

      transaction(name: String) {
        prepare(account: AuthAccount) {
          account
            .borrow<&Profile.Base{Profile.Owner}>(from: Profile.privatePath)!
            .setName(name)
        }
      }
    `,
      args: (arg: any, t: any) => [arg(profileNameWillUpdateTo.value, t.String)],
      payer: fcl.authz,
      proposer: fcl.authz,
      authorizations: [fcl.authz],
      limit: 50,
    })

    fcl.tx(transactionId).subscribe((res: any) => {
      profileChangeStatus.value = ['未知状态', '等待中', '已定型', '已执行', '已完成'][res.status]
      if (res.status === 4)
        ElMessage.success('账户名称更新成功')
    })
  }
  catch (e) {
    const err = e as Error
    ElMessage.error(`更新账户名称失败: ${err.message}`)
  }
}

/**
 * 当 Flow 的账户登录或退出操作执行后，会执行的回调
 * @param userInfo
 */
const setUser = (userInfo: any) => {
  user.value = userInfo
}

onMounted(() => {
  // 设置登录或退出后要执行的回调
  fcl.currentUser.subscribe(setUser)
})
</script>
<template>
  <a href="https://docs.onflow.org/fcl/tutorials/flow-app-quickstart" target="_blank">原始链接：https://docs.onflow.org/fcl/tutorials/flow-app-quickstart</a>
  <div v-if="user.addr">
    <div>已登录</div>
    <div>地址：{{ user.addr }}</div>
    <ElButton @click="fcl.unauthenticate">
      退出登录
    </ElButton>
    <div>账户名称 {{ addressProfileName }}</div>
    <ElButton @click="queryAddress">
      查询你的账户信息
    </ElButton>
    <ElButton @click="initAccount">
      初始化账户
    </ElButton>
    <ElInput v-model="profileNameWillUpdateTo" />
    <ElButton @click="setProfileName">
      更新账户名称
    </ElButton>
    {{ profileChangeStatus }}
  </div>
  <div v-else>
    <ElButton @click="fcl.logIn">
      登录
    </ElButton>
  </div>
</template>
