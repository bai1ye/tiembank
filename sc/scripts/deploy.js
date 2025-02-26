// scripts/deploy.js
const { ethers } = require("hardhat");

async function main() {
  // 部署合约
  const TimeBank = await ethers.getContractFactory("TimeBank");
  console.log("Deploying TimeBank...");
  const timeBank = await TimeBank.deploy();
  
  console.log("TimeBank deployed to:", timeBank.target);

  // 验证合约部署
  console.log("Verifying deployment...");
  
  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // 验证合约初始状态
  const name = await timeBank.name();
  const symbol = await timeBank.symbol();
  const adminRole = await timeBank.ADMIN_ROLE();
  const hasRole = await timeBank.hasRole(adminRole, deployer.address);

  console.log("Contract name:", name);
  console.log("Token symbol:", symbol);
  console.log("Deployer has admin role:", hasRole);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });