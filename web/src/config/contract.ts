// config/contract.ts

// 合约地址(根据实际部署地址修改)
export const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3' // Hardhat 默认部署地址

// TimeBank合约ABI
export const TIME_BANK_ABI = [
  // 用户注册
  {
    name: "registerUser",
    type: "function",
    inputs: [
      { name: "infoHash", type: "bytes32" },
      { name: "isMale", type: "bool" },
      { name: "age", type: "uint256" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  // 获取用户信息
  {
    name: "getUserInfo",
    type: "function",
    inputs: [{ name: "userAddr", type: "address" }],
    outputs: [
      { name: "infoHash", type: "bytes32" },
      { name: "role", type: "bytes32" }
    ],
    stateMutability: "view"
  },
  // 事件定义
  {
    name: "UserRegistered",
    type: "event",
    inputs: [
      { name: "userAddr", type: "address", indexed: true },
      { name: "infoHash", type: "bytes32", indexed: false }
    ]
  },
  {
    name: "UserRoleChanged",
    type: "event",
    inputs: [
      { name: "userAddr", type: "address", indexed: true },
      { name: "role", type: "bytes32", indexed: false },
      { name: "processor", type: "address", indexed: false }
    ]
  },
  {
    name: "RegistrationReward",
    type: "event",
    inputs: [
      { name: "userAddr", type: "address", indexed: true },
      { name: "reward", type: "uint256", indexed: false }
    ]
  }
]

// 合约基础配置
export const CONTRACT_CONFIG = {
  address: CONTRACT_ADDRESS,
  abi: TIME_BANK_ABI
}
