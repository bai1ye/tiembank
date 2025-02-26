const pool = require('../config/database');

class UserModel {
    /**
     * 创建新用户
     * @param {Object} user 用户信息
     * @returns {Promise<Object>} 创建的用户信息
     */
    static async create(user) {
        const connection = await pool.getConnection();
        try {
            const [result] = await connection.execute(
                `INSERT INTO users (name, id_card_hash, wallet_address, role, gender, birth_date, tx_hash) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [user.name, user.id_card_hash, user.wallet_address, user.role, user.gender, user.birth_date, user.tx_hash]
            );

            return {
                id: result.insertId,
                ...user
            };
        } finally {
            connection.release();
        }
    }

    /**
     * 通过身份证哈希查找用户
     * @param {string} idCardHash 身份证哈希值
     * @returns {Promise<Object|null>} 用户信息
     */
    static async findByIdCardHash(idCardHash) {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE id_card_hash = ?',
            [idCardHash]
        );
        return rows[0] || null;
    }

    /**
     * 通过钱包地址查找用户
     * @param {string} walletAddress 钱包地址
     * @returns {Promise<Object|null>} 用户信息
     */
    static async findByWalletAddress(walletAddress) {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE wallet_address = ?',
            [walletAddress]
        );
        return rows[0] || null;
    }

    /**
     * 更新用户钱包地址和交易哈希
     * @param {number} userId 用户ID
     * @param {string} walletAddress 钱包地址
     * @param {string} txHash 交易哈希
     * @returns {Promise<boolean>} 更新是否成功
     */
    static async updateWalletAddressAndTxHash(userId, walletAddress, txHash) {
        if (typeof userId !== 'number' || isNaN(userId)) {
            throw new Error('Invalid userId type');
        }

        const [result] = await pool.execute(
            'UPDATE users SET wallet_address = ?, tx_hash = ? WHERE id = ?',
            [walletAddress, txHash, userId]
        );
        return result.affectedRows > 0;
    }
}

module.exports = UserModel;