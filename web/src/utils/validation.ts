/**
 * 验证以太坊地址格式
 * @param address 钱包地址
 */
export const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * 验证身份证号格式
 * @param idCard 身份证号 (格式：yyyyMMdd[mw])
 */
export const isValidIdCard = (idCard: string): boolean => {
  // 格式：8位数字+一个字母(m或w)
  const pattern = /^(19|20)\d{6}[mw]$/i
  return pattern.test(idCard)
}

/**
 * 验证姓名格式
 * @param name 姓名
 */
export const isValidName = (name: string): boolean => {
  // 2-20个汉字
  const pattern = /^[\u4e00-\u9fa5]{2,20}$/
  return pattern.test(name)
}

/**
 * 表单验证错误信息
 */
export const ValidationMessages = {
  INVALID_NAME: '姓名必须是2-20个汉字',
  INVALID_ID_CARD: '身份证号格式错误',
  INVALID_ADDRESS: '无效的钱包地址',
  REQUIRED_FIELD: '此字段不能为空'
}
