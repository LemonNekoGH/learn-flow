import * as fcl from '@onflow/fcl'
import { ElNotification } from 'element-plus'
import localforage from 'localforage'

// 交易状态，将要放到本地存储的内容
interface TransactionStatus {
  status: number
  successText: string
  errText: string
  startText: string
}

const newlocalforageKey = (transactionId: string) => {
  return `transaction:${transactionId}`
}

export const useTransactionWorker = (() => {
  /**
   * 创建新的获取交易状态的任务
   * @param transactionId
   * @param successText
   * @param endText
   * @param errText
   */
  const newWorker = async (
    transactionId: string,
    startText: string,
    successText: string,
    errText: string,
    showFirstMessage = true,
  ) => {
    try {
      const localforageKey = newlocalforageKey(transactionId)
      // 把交易从本地存储取出
      const statusStr: string | null = await localforage.getItem(localforageKey)
      let status: TransactionStatus | null = null
      if (statusStr)
        status = JSON.parse(statusStr)

      if (!status) {
        status = {
          status: 0,
          startText,
          successText,
          errText,
        }
        // 把交易状态存入本地存储
        localforage.setItem(localforageKey, JSON.stringify(status))
      }
      if (showFirstMessage) {
        ElNotification.info?.({
          title: `${startText}`,
          message: `Transaction id: ${transactionId}`,
          duration: 0,
        })
      }
      // 获取交易状态
      const res = await fcl.send([
        fcl.getTransactionStatus(transactionId),
      ])
      const decoded = await fcl.decode(res)
      // 如果包含错误信息，表示交易失败
      if (decoded.errorMessage) {
        localforage.removeItem(localforageKey)
        ElNotification.error?.({
          title: `${errText}`,
          message: `Transaction id: ${transactionId}`,
          duration: 0,
        })
      }
      else
      // 如果交易状态大于 4，就表示交易成功
      if (decoded.status >= 4) {
        localforage.removeItem(transactionId)
        ElNotification.success?.({
          title: `${successText}`,
          message: `Transaction id: ${transactionId}`,
          duration: 0,
        })
      }
      else {
        // 交易状态小于 4，还需要继续获取
        setTimeout(() => newWorker(transactionId, startText, successText, errText, false), 2000)
      }
    }
    catch (e) {
      ElNotification.error?.({
        title: `${errText}`,
        message: `Transaction id：${transactionId}`,
        duration: 0,
      })
    }
  }
  // 获取本地存储里存储的交易状态
  // 获取所有的键
  (async () => {
    const keys = await localforage.keys()
    for (const key of keys) {
      if (key.startsWith('transaction:')) {
        // 获取到完成时要发送的通知消息，和错误时要发送的通知消息
        const str: string | null = await localforage.getItem(key)
        if (!str)
          continue
        // 获取任务的状态
        const status = JSON.parse(str) as TransactionStatus
        // 重新创建交易状态获取任务
        const id = key.substring(key.length)
        if (!id) {
          localforage.removeItem(key)
          continue
        }
        newWorker(id, status.startText, status.successText, status.errText, true)
      }
    }
  })()

  return () => ({
    newWorker,
  })
})()
