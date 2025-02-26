const UserModel = require('../models/userModel');
const IdCardUtil = require('../utils/idCard');
const AuthMiddleware = require('../middleware/auth');

class UserController {
    /**
     * 检查钱包地址
     * 前端连接钱包后调用此接口检查该地址是否已注册
     */
    static async checkWallet(req, res) {
        try {
            const { walletAddress } = req.query;

            if (!walletAddress) {
                return res.status(400).json({
                    code: 400,
                    message: '钱包地址不能为空'
                });
            }

            const user = await UserModel.findByWalletAddress(walletAddress);

            res.json({
                code: 200,
                data: {
                    exists: !!user,
                    user: user ? {
                        id: user.id,
                        name: user.name,
                        role: user.role
                    } : null
                }
            });

        } catch (error) {
            console.error('检查钱包地址错误:', error);
            res.status(500).json({
                code: 500,
                message: '服务器内部错误'
            });
        }
    }

    /**
     * 验证注册信息
     * 前端填写用户信息后的预验证
     */
    static async validateRegistration(req, res) {
        try {
            const { name, idCard, walletAddress } = req.body;
            console.log('验证请求数据:', { name, idCard, walletAddress });

            // 验证基本输入
            if (!name || !idCard || !walletAddress) {
                console.log('基本输入验证失败:', { name, idCard, walletAddress });
                return res.status(400).json({
                    code: 400,
                    message: '姓名、身份证号和钱包地址不能为空'
                });
            }

            // 验证身份证格式
            const idCardInfo = IdCardUtil.validate(idCard);
            console.log('身份证验证结果:', idCardInfo);

            if (!idCardInfo.valid) {
                console.log('身份证格式验证失败:', idCard);
                return res.status(400).json({
                    code: 400,
                    message: '无效的身份证号格式'
                });
            }

            // 检查用户是否已存在
            const existingUser = await UserModel.findByIdCardHash(idCardInfo.id_card_hash);
            console.log('用户查询结果:', existingUser);

            if (existingUser) {
                console.log('用户已存在:', existingUser);
                return res.status(409).json({
                    code: 409,
                    message: '该用户已注册'
                });
            }

            // 检查钱包地址是否已被使用
            const existingWallet = await UserModel.findByWalletAddress(walletAddress);
            console.log('钱包地址查询结果:', existingWallet);

            if (existingWallet) {
                console.log('钱包地址已被使用:', walletAddress);
                return res.status(409).json({
                    code: 409,
                    message: '该钱包地址已被其他用户绑定'
                });
            }

            // 计算角色
            const age = IdCardUtil.calculateAge(idCardInfo.birth_date);
            const role = (idCardInfo.gender === 1 && age < 63) ||
            (idCardInfo.gender === 0 && age < 58)
              ? 'volunteer'
              : 'elder';

            console.log('角色计算结果:', {
                age,
                gender: idCardInfo.gender,
                role
            });

            const response = {
                code: 200,
                data: {
                    valid: true,
                    role,
                    gender: idCardInfo.gender,
                    birth_date: idCardInfo.birth_date,
                    id_card_hash: idCardInfo.id_card_hash
                }
            };

            console.log('返回数据:', response);
            res.json(response);

        } catch (error) {
            console.error('验证注册信息错误:', error);
            console.error('错误堆栈:', error.stack);
            res.status(500).json({
                code: 500,
                message: '服务器内部错误'
            });
        }
    }
    /**
     * 完成注册
     * 前端完成链上注册后调用此接口完成系统注册
     */
    static async register(req, res) {
        try {
            const { name, idCard, walletAddress, txHash } = req.body;

            // 验证输入
            if (!name || !idCard || !walletAddress || !txHash) {
                return res.status(400).json({
                    code: 400,
                    message: '注册信息不完整'
                });
            }

            // 再次验证信息(防止前端跳过验证步骤)
            const idCardInfo = IdCardUtil.validate(idCard);
            if (!idCardInfo.valid) {
                return res.status(400).json({
                    code: 400,
                    message: '无效的身份证号格式'
                });
            }

            // 再次检查用户和钱包地址
            const [existingUser, existingWallet] = await Promise.all([
                UserModel.findByIdCardHash(idCardInfo.id_card_hash),
                UserModel.findByWalletAddress(walletAddress)
            ]);

            if (existingUser) {
                return res.status(409).json({
                    code: 409,
                    message: '该用户已注册'
                });
            }

            if (existingWallet) {
                return res.status(409).json({
                    code: 409,
                    message: '该钱包地址已被其他用户绑定'
                });
            }

            // 计算角色
            const age = IdCardUtil.calculateAge(idCardInfo.birth_date);
            const role = (idCardInfo.gender === 1 && age < 63) ||
            (idCardInfo.gender === 0 && age < 58)
                ? 'volunteer'
                : 'elder';

            // 创建用户
            const user = await UserModel.create({
                name,
                id_card_hash: idCardInfo.id_card_hash,
                role,
                gender: idCardInfo.gender,
                birth_date: idCardInfo.birth_date,
                wallet_address: walletAddress,
                tx_hash: txHash
            });

            // 生成 token
            const token = AuthMiddleware.generateToken({
                id: user.id,
                role: user.role,
                wallet_address: user.wallet_address
            });

            res.status(201).json({
                code: 201,
                message: '注册成功',
                data: {
                    id: user.id,
                    name: user.name,
                    role: user.role,
                    wallet_address: user.wallet_address,
                    token
                }
            });

        } catch (error) {
            console.error('注册错误:', error);
            res.status(500).json({
                code: 500,
                message: '服务器内部错误'
            });
        }
    }

    /**
     * 用户登录
     */
    static async login(req, res) {
        try {
            const { walletAddress } = req.body;

            // 验证输入
            if (!walletAddress) {
                return res.status(400).json({
                    code: 400,
                    message: '钱包地址不能为空'
                });
            }


            // 查找用户
            const user = await UserModel.findByWalletAddress(walletAddress);
            if (!user) {
                return res.status(404).json({
                    code: 404,
                    message: '用户不存在'
                });
            }

            // 生成 token
            const token = AuthMiddleware.generateToken({
                id: user.id,
                role: user.role,
                wallet_address: user.wallet_address
            });

            res.json({
                code: 200,
                message: '登录成功',
                data: {
                    id: user.id,
                    name: user.name,
                    role: user.role,
                    wallet_address: user.wallet_address,
                    token,
                }
            });

        } catch (error) {
            console.error('登录错误:', error);
            res.status(500).json({
                code: 500,
                message: '服务器内部错误'
            });
        }
    }
}

module.exports = UserController;