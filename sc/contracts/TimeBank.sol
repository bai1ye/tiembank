// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract TimeBank is AccessControl, ReentrancyGuard, ERC20 {
    using Counters for Counters.Counter;

    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant VOLUNTEER_ROLE = keccak256("VOLUNTEER_ROLE");
    bytes32 public constant ELDERS_ROLE = keccak256("ELDERS_ROLE");

    // Constants
    uint256 public constant PRICE_ADJUSTMENT_LIMIT = 20; // 20% price adjustment limit
    uint256 public constant UNIT_TIME_COIN= 10 ** 18; // 1 TIME = 1e18 wei
    uint256 constant INITIAL_REWARD = 100 * UNIT_TIME_COIN; // Initial reward for new user

    // Variables
    uint256 public currentReward = INITIAL_REWARD;
    uint256 public userCount = 0;

    // Structs
    struct User {
        bytes32 infoHash;        // Hash of user's basic info (name + ID)
        bytes32 role;           // User role (VOLUNTEER or REQUESTER)
    }

    // Service status enum
    enum ServiceStatus {
        Pending,     // 待审核
        Rejected,    // 审核拒绝
        Matching,    // 匹配中
        InProgress,  // 进行中
        Completed,    // 已完成
        Deleted      // 已删除
    }

    // Service type definition
    bytes32 constant SERVICE_TYPE_SHOPPING = keccak256("SHOPPING");
    bytes32 constant SERVICE_TYPE_MEDICAL = keccak256("MEDICAL");
    bytes32 constant SERVICE_TYPE_COOKING = keccak256("COOKING");
    bytes32 constant SERVICE_TYPE_OTHER = keccak256("OTHER");

    struct Service {
        uint256 id;
        address provider;        // 服务提供者地址
        address requestor;       // 服务请求者地址
        address approver;        // 审核者地址（0表示自动审核通过）
        bytes32 infoHash;        // 服务详情哈希值
        uint256 timeCoins;       // 时间币数量
        bytes32 serviceType; // 服务类型
        ServiceStatus status;    // 服务状态
        uint256 createdAt;       // 创建时间戳
        uint256 approvedAt;      // 审核通过时间戳(0表示未审核或审核拒绝)
        uint256 completedAt;     // 完成时间戳（0表示未完成）
    }

    // Mappings
    mapping(address => User) public users;               // 用户地址 => 用户信息
    mapping(uint256 => Service) public services;         // 服务ID => 服务信息
    mapping(address => uint256[]) private _userServices;  // 用户地址 => 服务ID列表
    mapping(address => uint256) public pendingPayments;  // 用户地址 => 待支付时间币总数
    Counters.Counter private _serviceIds;                // 服务ID计数器

    // Events
    event UserRegistered(address indexed userAddr, bytes32 infoHash);
    event UserRoleChanged(address indexed userAddr, bytes32 role, address processor);
    event RegistrationReward(address indexed userAddr, uint256 reward);
    event ServiceCreated(uint256 indexed serviceId, address indexed provider, bytes32 infoHash);
    event ServiceApproved(uint256 indexed serviceId, address indexed approver);
    event ServiceRejected(uint256 indexed serviceId, address indexed approver);
    event ServiceEdited(uint256 indexed serviceId, address indexed editor);
    event ServiceDeleted(uint256 indexed serviceId, address indexed deleter);
    event ServiceMatched(uint256 indexed serviceId, address indexed requestor);
    event ServiceStarted(uint256 indexed serviceId);
    event ServiceCompleted(uint256 indexed serviceId, address indexed provider, address indexed requestor, uint256 timeCoins);
    event TimeCoinTransferred(address indexed from, address indexed to, uint256 amount);

    constructor() ERC20("TimeCoin", "TIME") {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
        _mint(msg.sender, INITIAL_REWARD*1000);
    }

    // 用户注册
    function registerUser(bytes32 infoHash,bool isMale, uint age) external {
        require(users[msg.sender].infoHash == 0, "User already registered");
        bytes32 role = (isMale && age < 63) || (!isMale && age < 58)
            ? keccak256("VOLUNTEER_ROLE")
            : keccak256("ELDERS_ROLE");
        _grantRole(role, msg.sender);
        _mint(msg.sender, currentReward);
        users[msg.sender] = User({infoHash: infoHash, role: role});
        userCount++;
        if (userCount % 200 == 0) {
            currentReward = currentReward * 90 / 100; // 每 200 人减少 10%
        }
        emit UserRegistered(msg.sender, infoHash);
        emit UserRoleChanged(msg.sender, role, address(0));
        emit RegistrationReward(msg.sender, currentReward);
    }

    // 获取用户信息
    function getUserInfo(address userAddr) external view returns (User memory) {
        return users[userAddr];
    }

    // 创建服务
    function createService(bytes32 infoHash, uint256 timeCoins,bytes32 serviceType) external {
        require(users[msg.sender].infoHash != 0, "User not registered");
        bytes32 role = users[msg.sender].role;
        // 如果是老人创建需求，检查余额
        if(role == keccak256("ELDERS_ROLE")) {
            uint256 currentBalance = balanceOf(msg.sender);
            uint256 totalPending = pendingPayments[msg.sender];
            
            // 检查: 当前余额 >= 待支付总额 + 新服务所需时间币
            require(currentBalance >= totalPending + timeCoins*UNIT_TIME_COIN, 
                "Insufficient balance for new service");
            
            // 更新待支付总额
            pendingPayments[msg.sender] += timeCoins*UNIT_TIME_COIN;
        }

        uint256 serviceId = _serviceIds.current();
        _serviceIds.increment();
        address requestor_addr = address(0);
        address provider_addr = address(0);
        if(role == keccak256("VOLUNTEER_ROLE")){
            provider_addr = msg.sender;
        }else{
            requestor_addr = msg.sender;
        }
        services[serviceId] = Service({
            id: serviceId,
            provider: provider_addr,
            requestor: requestor_addr,
            approver: address(0),
            infoHash: infoHash,
            timeCoins: timeCoins*UNIT_TIME_COIN,
            serviceType: serviceType,
            status: ServiceStatus.Pending,
            createdAt: block.timestamp,
            approvedAt: 0,
            completedAt: 0
        });
        _userServices[msg.sender].push(serviceId);

        // 自动审核或提交人工审核
        if (isAutoApproved(timeCoins,serviceType)) {
            _autoApproveService(serviceId);
        } else {
            _submitForManualReview(serviceId);
        }
        emit ServiceCreated(serviceId, msg.sender, infoHash);
    }

    // 编辑服务
    function editService(uint256 serviceId, bytes32 newInfoHash, uint256 newTimeCoins) external {
        require(msg.sender == services[serviceId].provider, "Only provider can edit");
        services[serviceId].infoHash = newInfoHash;
        services[serviceId].timeCoins = newTimeCoins*UNIT_TIME_COIN;
        emit ServiceEdited(serviceId, msg.sender);
    }

    // 删除服务（仅限待审核或匹配中）
    function deleteService(uint256 serviceId) external {
        require(services[serviceId].status == 
        ServiceStatus.Pending || services[serviceId].status == ServiceStatus.Matching,
         "Service is not pending or matching");
        // 只有发起者（志愿者或老人）可以删除服务
        require(msg.sender == services[serviceId].provider || 
        msg.sender == services[serviceId].requestor, "Only provider or requestor can delete");
        // 如果是老人的需求服务，释放预留的时间币
        if(users[msg.sender].role == keccak256("ELDERS_ROLE")) {
            pendingPayments[msg.sender] -= services[serviceId].timeCoins;
        }
        delete services[serviceId];
        emit ServiceDeleted(serviceId, msg.sender);
    }

    // 响应服务
    function matchService(uint256 serviceId) external {
        require(services[serviceId].status == ServiceStatus.Matching, "Service is not in matching state");
        require(users[msg.sender].infoHash != 0, "User not registered");
        require(users[msg.sender].role == keccak256("ELDERS_ROLE"), "Only elders can request service");

        pendingPayments[msg.sender] += services[serviceId].timeCoins;
        services[serviceId].requestor = msg.sender;
        _userServices[msg.sender].push(serviceId);

        services[serviceId].status = ServiceStatus.InProgress;
        emit ServiceStarted(serviceId);
    }

    // 确认服务完成
    function completeService(uint256 serviceId) external nonReentrant {
        require(services[serviceId].status == ServiceStatus.InProgress, "Service is not in progress");
    
        Service storage service = services[serviceId];
        require(pendingPayments[service.requestor] >= service.timeCoins, "Pending payments underflow");
        pendingPayments[service.requestor] -= service.timeCoins;
    
        service.status = ServiceStatus.Completed;
        service.completedAt = block.timestamp;

        // 使用 ERC20 的 transfer 方法
        if (service.requestor != address(0)) {
            _transfer(service.requestor, service.provider, service.timeCoins);
        }

        emit ServiceCompleted(serviceId, service.provider, service.requestor, service.timeCoins);
    }

    // 查询用户服务列表
    function getUserServices(
        address userAddr,
        uint256 offset,
        uint256 limit) external view returns (Service[] memory,uint256 total) {
        uint256[] storage serviceIds = _userServices[userAddr];
        return _getServicesByIds(serviceIds, offset, limit);
    }

    // 根据ID数组返回服务详情
    function _getServicesByIds(
        uint256[] storage serviceIds,
        uint256 offset,
        uint256 limit
    ) private view returns (Service[] memory, uint256 total) {
        // 计算实际要返回的数量
        uint256 actualLimit = limit;
        if (offset + limit > total) {
            if (offset >= total) {
                actualLimit = 0;
            } else {
                actualLimit = total - offset;
            }
        }
        // 创建返回数组
        Service[] memory result = new Service[](actualLimit);
        // 填充服务数据
        for (uint256 i = 0; i < actualLimit; i++) {
            uint256 serviceId = serviceIds[offset + i];
            result[i] = services[serviceId];
        }
        
        return (result, serviceIds.length);
    }

    // 查询用户所有活跃服务（状态为 Matching 或 InProgress）
    function getUserActiveServices(address userAddr) external view returns (Service[] memory) {
        uint256[] storage serviceIds = _userServices[userAddr];
        
        uint256 activeCount = 0;
        
        // 计算活跃服务数量
        for (uint256 i = 0; i < serviceIds.length; i++) {
            uint256 serviceId = serviceIds[i];
            if (services[serviceId].status == ServiceStatus.Matching || services[serviceId].status == ServiceStatus.InProgress) {
                activeCount++;
            }
        }

        // 创建返回数组
        Service[] memory activeServices = new Service[](activeCount);
        uint256 index = 0;

        // 填充活跃服务数据
        for (uint256 i = 0; i < serviceIds.length; i++) {
            uint256 serviceId = serviceIds[i];
            if (services[serviceId].status == ServiceStatus.Matching || services[serviceId].status == ServiceStatus.InProgress) {
                activeServices[index] = services[serviceId];
                index++;
            }
        }
        return activeServices;
    }

    // 自动审核逻辑
    function isAutoApproved(uint256 timeCoins,bytes32 serviceType) private pure returns (bool) {
        uint256 basePrice;
        if(serviceType == keccak256("SHOPPING")){
            basePrice = 100;
        }else if(serviceType == keccak256("MEDICAL")){
            basePrice = 200;
        }else if(serviceType == keccak256("COOKING")){
            basePrice = 150;
        }else{
            basePrice = 120;
        }
        uint256 lowerBound = basePrice * (100 - PRICE_ADJUSTMENT_LIMIT)/100;
        uint256 upperBound = basePrice * (100 + PRICE_ADJUSTMENT_LIMIT)/100;
        return (timeCoins >= lowerBound && timeCoins <= upperBound);
    }

    // 管理员变更用户角色
    function roleChange(address userAddr, bytes32 role) external onlyRole(ADMIN_ROLE) {
        require(users[userAddr].infoHash != 0, "User not registered");
        _grantRole(role, userAddr);
        emit UserRoleChanged(userAddr, role, msg.sender);
    }

    // 自动审核通过
    function _autoApproveService(uint256 serviceId) private {
        services[serviceId].status = ServiceStatus.Matching;
        services[serviceId].approvedAt = block.timestamp;
        emit ServiceApproved(serviceId, address(0));
    }

    // 提交人工审核
    function _submitForManualReview(uint256 serviceId) private {
        services[serviceId].status = ServiceStatus.Pending;
    }

    // 管理员审核通过
    function approveService(uint256 serviceId) external onlyRole(ADMIN_ROLE) {
        require(services[serviceId].status == ServiceStatus.Pending, "Service is not pending review");
        services[serviceId].status = ServiceStatus.Matching;
        services[serviceId].approver = msg.sender;
        services[serviceId].approvedAt = block.timestamp;
        emit ServiceApproved(serviceId, msg.sender);
    }

    // 管理员审核拒绝
    function rejectService(uint256 serviceId) external onlyRole(ADMIN_ROLE) {
        require(services[serviceId].status == ServiceStatus.Pending, "Service is not pending review");
        services[serviceId].status = ServiceStatus.Rejected;
        emit ServiceRejected(serviceId, msg.sender);
    }

    //设置管理员
    function setAdmin(address adminAddr) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _setupRole(ADMIN_ROLE, adminAddr);
        emit RoleGranted(ADMIN_ROLE, adminAddr, msg.sender);
    }

    //取消管理员
    function unsetAdmin(address adminAddr) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(ADMIN_ROLE, adminAddr);
        emit RoleRevoked(ADMIN_ROLE, adminAddr, msg.sender);
    }
}