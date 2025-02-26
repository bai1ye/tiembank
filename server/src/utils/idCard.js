const crypto = require('crypto');

class IdCardUtil {
    /**
     * 验证身份证号格式并返回相关信息
     * @param idCard 身份证号 (格式：yyyyMMdd[mw])
     * @returns {{valid: boolean, gender: number, birth_date: string, id_card_hash: string}|{valid: boolean}}
     */
    static validate(idCard) {
        // 格式正则：8位数字+一个字母(m或w)
        const pattern = /^(19|20)\d{6}[mw]$/;

        if (!pattern.test(idCard)) {
            return { valid: false };
        }

        // 提取信息
        const birthStr = idCard.substring(0, 8);
        const gender = idCard.charAt(8) === 'm' ? 1 : 0; // m-男(1)，w-女(0)

        // 验证日期合法性
        if (!this.isValidDate(birthStr)) {
            return { valid: false };
        }

        const hash = this.hash(idCard);

        return {
            valid: true,
            gender,
            birth_date: birthStr, // 直接返回日期字符串，而不是Date对象
            id_card_hash: hash
        };
    }

    /**
     * 验证日期是否合法
     * @param dateStr 日期字符串 YYYYMMDD
     * @returns {boolean}
     */
    static isValidDate(dateStr) {
        const year = parseInt(dateStr.substring(0, 4));
        const month = parseInt(dateStr.substring(4, 6));
        const day = parseInt(dateStr.substring(6, 8));
        const date = new Date(year, month - 1, day);
        return date.getFullYear() === year &&
          date.getMonth() === month - 1 &&
          date.getDate() === day;
    }

    /**
     * 计算年龄
     * @param birthDate 生日字符串 YYYYMMDD
     * @returns {number} 年龄
     */
    static calculateAge(birthDate) {
        // 将字符串转换为Date对象进行计算
        const year = parseInt(birthDate.substring(0, 4));
        const month = parseInt(birthDate.substring(4, 6)) - 1;
        const day = parseInt(birthDate.substring(6, 8));
        const birthDateObj = new Date(year, month, day);

        const today = new Date();
        let age = today.getFullYear() - birthDateObj.getFullYear();
        const monthDiff = today.getMonth() - birthDateObj.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
            age--;
        }

        return age;
    }

    /**
     * 生成身份证号的哈希值
     * @param idCard 身份证号
     * @returns {string} 哈希值
     */
    static hash(idCard) {
        return crypto.createHash('sha256')
          .update(idCard.toLowerCase())
          .digest('hex');
    }
}

module.exports = IdCardUtil;