// scripts/events.js
const { ethers } = require("ethers");

// 合约配置
const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const TIME_BANK_ABI = [
    // AccessControl 事件
    {
        name: "RoleGranted",
        type: "event",
        inputs: [
            { name: "role", type: "bytes32", indexed: true },
            { name: "account", type: "address", indexed: true },
            { name: "sender", type: "address", indexed: true }
        ]
    },
    {
        name: "RoleRevoked",
        type: "event",
        inputs: [
            { name: "role", type: "bytes32", indexed: true },
            { name: "account", type: "address", indexed: true },
            { name: "sender", type: "address", indexed: true }
        ]
    },
    // ERC20 事件
    {
        name: "Transfer",
        type: "event",
        inputs: [
            { name: "from", type: "address", indexed: true },
            { name: "to", type: "address", indexed: true },
            { name: "value", type: "uint256", indexed: false }
        ]
    },
    // 用户相关事件
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
    },
    // 服务相关事件
    {
        name: "ServiceCreated",
        type: "event",
        inputs: [
            { name: "serviceId", type: "uint256", indexed: true },
            { name: "provider", type: "address", indexed: true },
            { name: "infoHash", type: "bytes32", indexed: false }
        ]
    },
    {
        name: "ServiceApproved",
        type: "event",
        inputs: [
            { name: "serviceId", type: "uint256", indexed: true },
            { name: "approver", type: "address", indexed: true }
        ]
    },
    {
        name: "ServiceCompleted",
        type: "event",
        inputs: [
            { name: "serviceId", type: "uint256", indexed: true },
            { name: "provider", type: "address", indexed: true },
            { name: "requestor", type: "address", indexed: true },
            { name: "timeCoins", type: "uint256", indexed: false }
        ]
    }
];

// 角色常量
const ROLES = {
    DEFAULT_ADMIN_ROLE: '0x0000000000000000000000000000000000000000000000000000000000000000',
    ADMIN_ROLE: ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE")),
    VOLUNTEER_ROLE: ethers.keccak256(ethers.toUtf8Bytes("VOLUNTEER_ROLE")),
    ELDERS_ROLE: ethers.keccak256(ethers.toUtf8Bytes("ELDERS_ROLE"))
};

// 事件描述
const EVENT_DESCRIPTIONS = {
    RoleGranted: "授予角色",
    RoleRevoked: "撤销角色",
    Transfer: "转账",
    UserRegistered: "用户注册",
    UserRoleChanged: "角色变更",
    RegistrationReward: "注册奖励",
    ServiceCreated: "创建服务",
    ServiceApproved: "审核通过",
    ServiceCompleted: "完成服务"
};

// 已处理事件的哈希集合
const processedEvents = new Set();

// 工具函数
const formatAddress = (address) => {
    if (!address) return 'N/A';
    try {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    } catch (error) {
        return 'Invalid Address';
    }
};

const formatRole = (roleHash) => {
    if (!roleHash) return 'N/A';
    const roleNames = {
        [ROLES.DEFAULT_ADMIN_ROLE]: "超级管理员",
        [ROLES.ADMIN_ROLE]: "管理员",
        [ROLES.VOLUNTEER_ROLE]: "志愿者",
        [ROLES.ELDERS_ROLE]: "老人"
    };
    return roleNames[roleHash] || `未知角色(${roleHash.slice(0, 10)}...)`;
};

const formatValue = (value) => {
    if (value === undefined || value === null) return 'N/A';
    if (typeof value === 'bigint') {
        return ethers.formatEther(value) + ' TIME';
    }
    return value.toString();
};

// 序列化事件参数，处理BigInt
const serializeArgs = (args) => {
    if (!args) return '';
    
    // 将args转换为数组并格式化每个元素
    const serialized = Array.from(args).map(value => {
        if (typeof value === 'bigint') {
            return value.toString();
        }
        return value;
    });
    
    return JSON.stringify(serialized);
};

async function getBlockTime(provider, blockNumber) {
    if (!blockNumber) return 'Pending';
    try {
        const block = await provider.getBlock(blockNumber);
        return block ? new Date(block.timestamp * 1000).toLocaleString() : 'Unknown';
    } catch (error) {
        return 'Error getting timestamp';
    }
}

// 获取事件的唯一标识符
function getEventId(event) {
    const eventName = event.eventName || event.event;
    if (event.transactionHash && event.logIndex !== undefined) {
        return `${eventName}-${event.transactionHash}-${event.logIndex}`;
    }
    // 如果是pending事件，使用参数创建唯一标识
    if (event.args) {
        return `${eventName}-${serializeArgs(event.args)}`;
    }
    return null; // 无法识别的事件
}

// 打印事件详情
async function printEventDetails(event, provider, isNew = false) {
    try {
        const eventName = event.eventName || event.event;
        const description = EVENT_DESCRIPTIONS[eventName] || eventName;
        
        console.log(`\n${isNew ? '📢 新' : ''}事件: ${description}`);
        
        if (event.blockNumber) {
            const timestamp = await getBlockTime(provider, event.blockNumber);
            console.log(`📅 时间: ${timestamp}`);
            console.log(`🔢 区块: ${event.blockNumber}`);
        }
        
        if (event.transactionHash) {
            console.log(`🔗 交易: ${formatAddress(event.transactionHash)}`);
            // 提供Etherscan链接(假设是本地网络，实际部署时可修改)
            console.log(`   完整哈希: ${event.transactionHash}`);
        }
        
        if (event.args && event.args.length > 0) {
            console.log(`📋 参数:`);
            const eventAbi = TIME_BANK_ABI.find(x => x.name === eventName);
            if (eventAbi) {
                eventAbi.inputs.forEach((input, index) => {
                    let value = event.args[index];
                    let displayValue = value;

                    if (input.name === 'role') {
                        displayValue = formatRole(value);
                    } else if (input.type === 'address') {
                        displayValue = formatAddress(value);
                    } else if (input.type === 'uint256') {
                        displayValue = formatValue(value);
                    }

                    console.log(`   ${input.name}: ${displayValue}`);
                });
            }
        }
        
        // 如果是特定事件类型，显示额外的可读信息
        if (eventName === 'UserRegistered') {
            console.log(`📌 说明: 新用户注册，现在可以使用服务了`);
        } else if (eventName === 'ServiceCompleted') {
            console.log(`📌 说明: 服务完成，TIME代币已转账`);
        } else if (eventName === 'Transfer') {
            const from = formatAddress(event.args[0]);
            const to = formatAddress(event.args[1]);
            const amount = formatValue(event.args[2]);
            console.log(`📌 说明: ${from} 向 ${to} 转账 ${amount}`);
        }
    } catch (error) {
        console.error('处理事件详情失败:', error);
    }
}

async function getAllEvents() {
    try {
        const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
        const contract = new ethers.Contract(CONTRACT_ADDRESS, TIME_BANK_ABI, provider);
        
        const latestBlock = await provider.getBlockNumber();
        console.log(`\n当前区块高度: ${latestBlock}`);

        const events = await contract.queryFilter('*', 0, latestBlock);
        console.log(`共找到 ${events.length} 个事件\n`);

        if (events.length === 0) {
            console.log("暂无历史事件，等待新事件...");
            return;
        }

        // 按事件类型分类
        const eventsByType = {};
        for (const event of events) {
            const eventName = event.eventName || event.event;
            if (!eventsByType[eventName]) {
                eventsByType[eventName] = [];
            }
            eventsByType[eventName].push(event);
            
            // 添加到已处理列表
            const eventId = getEventId(event);
            if (eventId) {
                processedEvents.add(eventId);
            }
        }

        // 输出统计信息
        console.log("=== 事件统计 ===");
        for (const [eventName, eventList] of Object.entries(eventsByType)) {
            const description = EVENT_DESCRIPTIONS[eventName] || eventName;
            console.log(`${description}: ${eventList.length}个`);
        }
        console.log("");

        // 显示详细事件信息
        for (const [eventName, eventList] of Object.entries(eventsByType)) {
            const description = EVENT_DESCRIPTIONS[eventName] || eventName;
            console.log(`\n=== ${description} (${eventList.length}个) ===`);
            
            for (const event of eventList) {
                await printEventDetails(event, provider);
            }
        }

    } catch (error) {
        console.error('获取事件失败:', error);
    }
}

async function listenToNewEvents() {
    try {
        const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
        const contract = new ethers.Contract(CONTRACT_ADDRESS, TIME_BANK_ABI, provider);

        console.log('\n开始监听新事件 - 等待交易中...\n');

        // 使用事件过滤器监听所有事件
        contract.on('*', async (event) => {
            try {
                // 首先检查是否有区块号，只处理已确认的事件
                if (event.blockNumber) {
                    const eventId = getEventId(event);
                    
                    // 检查是否已处理过此事件
                    if (eventId && !processedEvents.has(eventId)) {
                        processedEvents.add(eventId);
                        await printEventDetails(event, provider, true);
                    }
                }
                // 对于pending事件，不处理
            } catch (error) {
                console.error('处理事件失败:', error);
            }
        });

    } catch (error) {
        console.error('监听事件失败:', error);
    }
}

async function main() {
    console.log('====== 时间银行合约事件监控 ======');
    console.log('合约地址:', CONTRACT_ADDRESS);
    
    await getAllEvents();
    await listenToNewEvents();
    
    // 保持脚本运行
    console.log('\n按 Ctrl+C 退出监控\n');
    process.stdin.resume();
}

main().catch(error => {
    console.error('错误:', error);
    process.exit(1);
});