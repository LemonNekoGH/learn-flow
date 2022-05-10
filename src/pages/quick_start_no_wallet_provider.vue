<script lang="ts" setup>
import '../flow/config'
import * as buffer from 'buffer'
import * as fcl from '@onflow/fcl'
import * as elliptic from 'elliptic'
import { BigNumber } from 'bignumber.js'
import { SHA3 } from 'sha3'
import { computed, onMounted, ref } from 'vue'
import 'element-plus/es/components/message/style/css'
import { ElMessage } from 'element-plus/es'

const address = ref('') // 用户钱包地址
const publicKey = ref('') // 用户公钥
const privateKey = ref('') // 用户私钥

const user = ref<any>({})
const balanceForShow = computed(() => new BigNumber(user.value.balance).div(new BigNumber(10 ** 8)).toFixed(3))
const addressProfileName = ref('')
const profileNameWillUpdateTo = ref('')
const profileChangeStatus = ref<any>(null)

/**
 * 使用私钥对消息进行签名
 * @param privateKey 私钥
 * @param msg 要被签名的消息
 */
const signWithKey = (privateKey: string, msg: string) => {
  // 从私钥的 hex 字符串中获取到私钥
  // eslint-disable-next-line new-cap
  const ec = new elliptic.ec('p256') // p256 是什么
  const key = ec.keyFromPrivate(buffer.Buffer.from(privateKey, 'hex'))
  // 把消息转成 sha3 hash
  const sha = new SHA3(256) // 忘记写 256 可能会出现问题?
  sha.update(buffer.Buffer.from(msg, 'hex'))
  const hash = sha.digest()
  // 签名
  const signature = key.sign(hash)
  // 提取并合并签名字段
  const r = signature.r.toArrayLike(buffer.Buffer, 'be', 32) // r 是什么，be 是什么，为什么最后一个参数是 32
  const s = signature.s.toArrayLike(buffer.Buffer, 'be', 32) // s 是什么，be 是什么，为什么最后一个参数是 32
  return buffer.Buffer.concat([r, s]).toString('hex') // 为什么 r 和 s 是这样排列，为什么格式要输出为 hex
}

/**
 * 返回一个会被 fcl 调用的函数
 */
const getAuthorization = (address: string, privateKey: string) => {
  return async (account: any = {}) => {
    const userLocal = (await fcl.account(address))
    const key = userLocal.keys[0]

    return {
      ...account,
      keyId: parseInt(key.index),
      tempId: `${userLocal.address}-${key.index}`, // 用获取来的账户地址的原因，可能是因为不需要 0x 前缀？
      addr: fcl.withPrefix(userLocal.address),
      signingFunction: (signable: any) => {
        const ret = {
          addr: fcl.withPrefix(userLocal.address),
          keyId: parseInt(key.index),
          signature: signWithKey(privateKey, signable.message),
        }
        return ret
      },
    }
  }
}

/**
 * 查询的时候不会弹出钱包框，所以可以放心调用
 */
const queryAddress = async () => {
  try {
    const profile = await fcl.query({
      cadence: `
      import Profile from 0xProfile

      pub fun main(address: Address): Profile.ReadOnly? {
        return Profile.read(address)
      }
    `,
      args: (arg: any, t: any) => [arg(fcl.withPrefix(user.value.address), t.Address)],
    })

    console.log(profile)
    addressProfileName.value = profile?.name ?? 'No Profile'
    ElMessage.success('获取账户信息成功')
  }
  catch (e) {
    addressProfileName.value = 'Get Profile Error'
    ElMessage.error('获取账户信息失败')
  }
}

/**
 * 移除账户信息
 */
const removeUserProfile = () => {
  address.value = ''
  publicKey.value = ''
  user.value = null
}

/**
 * 初始化账户
 */
const initAccount = async () => {
  try {
    const auth = getAuthorization(address.value, privateKey.value)
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
      payer: auth,
      proposer: auth,
      authorizations: [auth],
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
 * 获取账户信息（较简单）
 */
const getAccount = async () => {
  if (!privateKey.value) {
    ElMessage.error('没有输入私钥')
    return
  }
  if (!publicKey.value) {
    ElMessage.error('没有输入公钥')
    return
  }
  if (!address.value) {
    ElMessage.error('没有输入地址')
    return
  }
  try {
    const userLocal = await fcl.account(address.value)
    user.value = userLocal
    ElMessage.success('绕过钱包供应商获取账户信息成功')
    localStorage.setItem('no-wallet-provider:privateKey', privateKey.value)
    localStorage.setItem('no-wallet-provider:publicKey', publicKey.value)
    localStorage.setItem('no-wallet-provider:address', address.value)
  }
  catch (e) {
    const err = e as Error
    ElMessage.error(`绕过钱包供应商获取账户信息失败 ${err.message}`)
  }
}

/**
 * 更新账户名称
 */
const setProfileName = async () => {
  try {
    const authorizations = getAuthorization(address.value, privateKey.value)
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
      authorizations: [authorizations],
      proposer: authorizations,
      payer: authorizations,
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

onMounted(() => {
  // 当页面挂载时，去获取一下保存的私钥和公钥和地址
  privateKey.value = localStorage.getItem('no-wallet-provider:privateKey') ?? ''
  publicKey.value = localStorage.getItem('no-wallet-provider:publicKey') ?? ''
  address.value = localStorage.getItem('no-wallet-provider:address') ?? ''
})
</script>
<template>
  <a href="https://docs.onflow.org/fcl/tutorials/flow-app-quickstart" target="_blank">原始链接：https://docs.onflow.org/fcl/tutorials/flow-app-quickstart</a>
  <div v-if="user.address">
    <div>账户地址 {{ user.address }}</div>
    <div>账户余额 {{ balanceForShow }} FLOW</div>
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
    <ElButton @click="removeUserProfile">
      移除账户信息
    </ElButton>
  </div>
  <div v-else>
    <ElInput v-model="publicKey" placeholder="请输入你的公钥" />
    <ElInput v-model="privateKey" placeholder="请输入你的私钥" />
    <ElInput v-model="address" placeholder="请输入你的钱包地址" />
    <ElButton @click="getAccount">
      获取账户信息
    </ElButton>
  </div>
</template>
