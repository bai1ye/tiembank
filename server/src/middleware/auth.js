const jwt = require('jsonwebtoken');

class AuthMiddleware {
    /**
     * 生成 JWT token
     * @param {Object} payload 需要加密的数据
     * @returns {string} token
     */
    static generateToken(payload) {
        return jwt.sign({
            id: String(payload.id),
            role: payload.role,
            wallet_address: payload.wallet_address
        }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN
        });
    }

    /**
     * 验证 token 的中间件
     */
    static verifyToken(req, res, next) {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                code: 401,
                message: '未提供认证令牌'
            });
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = {
                id: String(decoded.id),
                role: decoded.role,
                wallet_address: decoded.wallet_address
            };
            next();
        } catch (error) {
            return res.status(401).json({
                code: 401,
                message: '无效的认证令牌'
            });
        }
    }
}

module.exports = AuthMiddleware;