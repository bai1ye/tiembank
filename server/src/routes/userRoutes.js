const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');

// 公开路由
router.get('/check-wallet', UserController.checkWallet);          // 检查钱包地址
router.post('/validate', UserController.validateRegistration);    // 验证注册信息
router.post('/register', UserController.register);                // 完成注册
router.post('/login', UserController.login);                      // 用户登录

module.exports = router;