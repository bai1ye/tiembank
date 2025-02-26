const { expect } = require("chai");
const { ethers } = require("hardhat");

//ethers.js为v6版本

describe("TimeBank Core Functionality Tests", function () {
  let timeBank;
  let owner;      // 合约部署者(默认管理员)
  let volunteer;  // 志愿者
  let elder;      // 老人
  let admin;      // 另一个管理员
  
  beforeEach(async function () {
    // 获取测试账户
    [owner, volunteer, elder, admin] = await ethers.getSigners();
    
    // 部署合约
    const TimeBank = await ethers.getContractFactory("TimeBank");
    timeBank = await TimeBank.deploy();
    
    // 验证部署者拥有管理员角色
    const adminRole = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
    expect(await timeBank.hasRole(adminRole, owner.address)).to.be.true;
  });
  
  
  // 测试完整的用户注册和角色分配流程
  describe("User Registration and Role Management", function () {
    it("Should register users with correct roles based on age and gender", async function () {
      // 注册一个25岁男性(应该是志愿者)
      const volunteerInfo = ethers.keccak256(ethers.toUtf8Bytes("volunteer_info"));
      await timeBank.connect(volunteer).registerUser(volunteerInfo, true, 25);
      
      // 注册一个70岁女性(应该是老人)
      const elderInfo = ethers.keccak256(ethers.toUtf8Bytes("elder_info"));
      await timeBank.connect(elder).registerUser(elderInfo, false, 70);
      
      // 验证角色分配
      const volunteerRole = ethers.keccak256(ethers.toUtf8Bytes("VOLUNTEER_ROLE"));
      const eldersRole = ethers.keccak256(ethers.toUtf8Bytes("ELDERS_ROLE"));
      
      expect(await timeBank.hasRole(volunteerRole, volunteer.address)).to.be.true;
      expect(await timeBank.hasRole(eldersRole, elder.address)).to.be.true;
    });

    it("Should allow admin to change user role", async function () {
      // 先注册用户
      const userInfo = ethers.keccak256(ethers.toUtf8Bytes("user_info"));
      await timeBank.connect(volunteer).registerUser(userInfo, true, 25);
      
      // 管理员将志愿者角色改为老人角色
      const eldersRole = ethers.keccak256(ethers.toUtf8Bytes("ELDERS_ROLE"));
      
      // 需要先设置admin为管理员
      await timeBank.connect(owner).setAdmin(admin.address);
      
      // 然后再执行角色变更
      await timeBank.connect(admin).roleChange(volunteer.address, eldersRole);
      
      // 验证角色已更改
      expect(await timeBank.hasRole(eldersRole, volunteer.address)).to.be.true;
    });
  });

  // 测试完整的服务生命周期
  describe("Service Lifecycle", function () {
    // 在测试服务前先注册用户
    beforeEach(async function () {
      const volunteerInfo = ethers.keccak256(ethers.toUtf8Bytes("volunteer_info"));
      const elderInfo = ethers.keccak256(ethers.toUtf8Bytes("elder_info"));
      
      await timeBank.connect(volunteer).registerUser(
          volunteerInfo,
          true,
          25
      );
      await timeBank.connect(elder).registerUser(
          elderInfo,
          false,
          70
      );
      
      // 确保admin有管理员权限
      const adminRole = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
      await timeBank.connect(owner).setAdmin(admin.address);
    });

    it("Should handle full service lifecycle with auto-approval", async function () {
      //记录志愿者和老人的余额
      const volunteerBalanceBefore = await timeBank.balanceOf(volunteer.address);
      const elderBalanceBefore = await timeBank.balanceOf(elder.address);
      
      // 1. 志愿者创建服务(使用基准价格)
      const serviceInfo = ethers.keccak256(ethers.toUtf8Bytes("service_info"));
      const shoppingType = ethers.keccak256(ethers.toUtf8Bytes("SHOPPING"));

      await timeBank.connect(volunteer).createService(
        serviceInfo,
        100,  // 购物服务基准价格
        shoppingType
      );
      
      // 2. 验证服务已创建并自动通过审核
      const service = await timeBank.services(0);
      expect(service.status).to.equal(2); // ServiceStatus.Matching
      
      // 3. 老人响应服务
      await timeBank.connect(elder).matchService(0);
      
      // 4. 验证服务状态已更新
      const matchedService = await timeBank.services(0);
      expect(matchedService.status).to.equal(3); // ServiceStatus.InProgress
    
      // 5. 确认服务完成
      await timeBank.connect(elder).completeService(0);
      
      // 6. 验证时间币转账和服务状态
      const completedService = await timeBank.services(0);
      expect(completedService.status).to.equal(4); // ServiceStatus.Completed

      const volunteerBalanceAfter = await timeBank.balanceOf(volunteer.address);
      const elderBalanceAfter =  await timeBank.balanceOf(elder.address);
      const serviceTimeCoins = ethers.toBigInt(completedService.timeCoins);
      expect(volunteerBalanceAfter).to.equal(volunteerBalanceBefore+serviceTimeCoins,
        "Volunteer balance should increase by service time coins");
      expect(elderBalanceAfter).to.equal(elderBalanceBefore-serviceTimeCoins,
        "Elder balance should decrease by service time coins");
    });

    it("Should handle service lifecycle with manual approval", async function () {
      // 1. 志愿者创建服务(使用超出建议范围的价格,需要人工审核)
      const serviceInfo = ethers.keccak256(ethers.toUtf8Bytes("service_info"));
      const shoppingType = ethers.keccak256(ethers.toUtf8Bytes("SHOPPING"));
      
      await timeBank.connect(volunteer).createService(
        serviceInfo,
        200,  // 高于购物服务基准价格的120%
        shoppingType
      );
      
      // 2. 验证服务进入待审核状态
      const pendingService = await timeBank.services(0);
      expect(pendingService.status).to.equal(0); // ServiceStatus.Pending
      
      // 3. 管理员审核通过服务
      await timeBank.connect(admin).approveService(0);
      
      // 4. 验证审核后的状态
      const approvedService = await timeBank.services(0);
      expect(approvedService.status).to.equal(2); // ServiceStatus.Matching
      expect(approvedService.approver).to.equal(admin.address);
    });
  });
});
