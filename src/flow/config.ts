import * as fcl from '@onflow/fcl'

// Flow 的配置
fcl.config({
  'accessNode.api': 'https://rest-testnet.onflow.org', // Mainnet: "https://rest-mainnet.onflow.org"
  'discovery.wallet': 'https://fcl-discovery.onflow.org/testnet/authn', // Mainnet: "https://fcl-discovery.onflow.org/authn"
  '0xProfile': '0xba1132bc08f82fe2', // 这个合约是用来查询账户信息的
})
