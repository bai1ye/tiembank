const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TimeBank Boundary Tests", function () {
  let timeBank;
  let owner;      // 合约部署者(默认管理员)
  let volunteer;  // 志愿者
  let elder;      // 老人
  let admin;      // 另一个管理员
  
  beforeEach(async function () {
    [owner, volunteer, elder, admin] = await ethers.getSigners();
    const TimeBank = await ethers.getContractFactory("TimeBank");
    timeBank = await TimeBank.deploy();
  });

  describe("Registration Boundary Tests", function () {
    it("Should not allow duplicate registration", async function () {
      const userInfo = ethers.keccak256(ethers.toUtf8Bytes("user_info"));
      await timeBank.connect(volunteer).registerUser(userInfo, true, 25);
      
      // 尝试重复注册
      await expect(
        timeBank.connect(volunteer).registerUser(userInfo, true, 25)
      ).to.be.revertedWith("User already registered");
    });

    it("Should handle age boundary conditions correctly", async function () {
      const userInfo = ethers.keccak256(ethers.toUtf8Bytes("user_info"));
      
      // 测试男性年龄边界（63岁）
      // 62岁应该是志愿者
      await timeBank.connect(volunteer).registerUser(userInfo, true, 62);
      const volunteerRole = ethers.keccak256(ethers.toUtf8Bytes("VOLUNTEER_ROLE"));
      expect(await timeBank.hasRole(volunteerRole, volunteer.address)).to.be.true;
      
      // 63岁应该是老人
      const elderInfo = ethers.keccak256(ethers.toUtf8Bytes("elder_info"));
      await timeBank.connect(elder).registerUser(elderInfo, true, 63);
      const eldersRole = ethers.keccak256(ethers.toUtf8Bytes("ELDERS_ROLE"));
      expect(await timeBank.hasRole(eldersRole, elder.address)).to.be.true;
    });
  });

  describe("Service Creation Boundary Tests", function () {
    beforeEach(async function () {
      // 注册用户并分配角色
      const volunteerInfo = ethers.keccak256(ethers.toUtf8Bytes("volunteer_info"));
      const elderInfo = ethers.keccak256(ethers.toUtf8Bytes("elder_info"));
      await timeBank.connect(volunteer).registerUser(volunteerInfo, true, 25);
      await timeBank.connect(elder).registerUser(elderInfo, false, 70);
    });

    it("Should prevent service creation with insufficient balance", async function () {
      const serviceInfo = ethers.keccak256(ethers.toUtf8Bytes("service_info"));
      const shoppingType = ethers.keccak256(ethers.toUtf8Bytes("SHOPPING"));
      const elderBalance = await timeBank.balanceOf(elder.address);
      
      // 尝试创建超过余额的服务需求
      const hugeAmount = elderBalance + 1000n;
      await expect(
        timeBank.connect(elder).createService(serviceInfo, hugeAmount, shoppingType)
      ).to.be.revertedWith("Insufficient balance for new service");
    });

    it("Should handle multiple pending payments correctly", async function () {
        const serviceInfo = ethers.keccak256(ethers.toUtf8Bytes("service_info"));
        const shoppingType = ethers.keccak256(ethers.toUtf8Bytes("SHOPPING"));
        const elderBalance = await timeBank.balanceOf(elder.address);
        
        // 创建多个服务需求，每个使用实际余额的40%
        // 注意：用户输入的金额会被合约乘以 Unit_TIME_COIN
        const serviceAmount = elderBalance* 40n / 100n / (10n ** 18n);
        
        // 创建两个服务需求（合计使用80%的余额）
        await timeBank.connect(elder).createService(serviceInfo, serviceAmount, shoppingType);
        await timeBank.connect(elder).createService(serviceInfo, serviceAmount, shoppingType);
        
        // 第三个服务需求应该失败，因为总pending金额会超过余额
        await expect(
          timeBank.connect(elder).createService(serviceInfo, serviceAmount, shoppingType)
        ).to.be.revertedWith("Insufficient balance for new service");
      });
  });

  describe("Service Completion Boundary Tests", function () {
    beforeEach(async function () {
      // 注册用户并设置初始状态
      const volunteerInfo = ethers.keccak256(ethers.toUtf8Bytes("volunteer_info"));
      const elderInfo = ethers.keccak256(ethers.toUtf8Bytes("elder_info"));
      await timeBank.connect(volunteer).registerUser(volunteerInfo, true, 25);
      await timeBank.connect(elder).registerUser(elderInfo, false, 70);
    });

    it("Should prevent double completion of service", async function () {
      // 创建并匹配服务
      const serviceInfo = ethers.keccak256(ethers.toUtf8Bytes("service_info"));
      const shoppingType = ethers.keccak256(ethers.toUtf8Bytes("SHOPPING"));
      
      await timeBank.connect(volunteer).createService(serviceInfo, 100, shoppingType);
      await timeBank.connect(elder).matchService(0);
      
      // 完成服务
      await timeBank.connect(elder).completeService(0);
      
      // 尝试再次完成同一个服务
      await expect(
        timeBank.connect(elder).completeService(0)
      ).to.be.revertedWith("Service is not in progress");
    });

    it("Should handle multiple pending payments correctly", async function () {
        const serviceInfo = ethers.keccak256(ethers.toUtf8Bytes("service_info"));
        const shoppingType = ethers.keccak256(ethers.toUtf8Bytes("SHOPPING"));
        const elderBalance = await timeBank.balanceOf(elder.address);
        
        // 创建多个服务需求，每个使用实际余额的40%
        // 注意：用户输入的金额会被合约乘以 Unit_TIME_COIN
        const serviceAmount = elderBalance * 40n / 100n / (10n ** 18n);
        
        // 创建两个服务需求（合计使用80%的余额）
        await timeBank.connect(elder).createService(serviceInfo, serviceAmount, shoppingType);
        await timeBank.connect(elder).createService(serviceInfo, serviceAmount, shoppingType);
        
        // 第三个服务需求应该失败，因为总pending金额会超过余额
        await expect(
          timeBank.connect(elder).createService(serviceInfo, serviceAmount, shoppingType)
        ).to.be.revertedWith("Insufficient balance for new service");
    });
  });

  describe("Admin Role Management Boundary Tests", function () {
    it("Should prevent non-default-admin from setting new admin", async function () {
      // 尝试让普通管理员设置新管理员
      const adminRole = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
      await timeBank.connect(owner).setAdmin(admin.address);
      
      await expect(
        timeBank.connect(admin).setAdmin(volunteer.address)
      ).to.be.reverted;
    });

    it("Should handle role changes for non-existent users", async function () {
      // 设置admin权限
      await timeBank.connect(owner).setAdmin(admin.address);
      
      // 尝试为未注册用户更改角色
      const eldersRole = ethers.keccak256(ethers.toUtf8Bytes("ELDERS_ROLE"));
      await expect(
        timeBank.connect(admin).roleChange(volunteer.address, eldersRole)
      ).to.be.revertedWith("User not registered");
    });
  });
});