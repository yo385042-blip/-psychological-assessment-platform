/**
 * 支付网关工具函数
 * 网关：https://zpayz.cn/
 */

// 支付网关配置（注意：必须是提交地址 submit.php，而不是站点首页）
const PAYMENT_GATEWAY = 'https://zpayz.cn/submit.php'
const MERCHANT_PID = '2025120114591699'
const MERCHANT_KEY = '7H1J0p9RTkZaq66zLHIpoTGlifNI7y1Z'

/**
 * 生成MD5签名
 * @param {Object} params - 支付参数对象
 * @param {string} key - 商户密钥
 * @returns {string} MD5签名字符串
 */
export function generateSign(params, key = MERCHANT_KEY) {
  // 1. 过滤空值和sign参数
  const filteredParams = {}
  for (const [k, v] of Object.entries(params)) {
    if (v !== null && v !== undefined && v !== '' && k !== 'sign') {
      filteredParams[k] = v
    }
  }

  // 2. 按参数名 ASCII 从小到大排序后，拼接成字符串（key=value&key=value 格式）
  //    这一点与易支付类网关的 PHP 示例保持一致
  const sortedKeys = Object.keys(filteredParams).sort()
  const signString = sortedKeys
    .map(k => `${k}=${filteredParams[k]}`)
    .join('&')

  // 3. 在末尾直接拼接商户密钥（兼容易支付规范：a=b&c=d&e=f + KEY）
  const finalString = signString + key

  // 调试：在 Cloudflare 日志中打印网关用于提示的签名字符串格式（不包含真实密钥值）
  try {
    // 这里打印的是：参数串 + 商户KEY 占位，方便与网关报错里的字符串一一对比
    console.log('ZPAY_SIGN_STRING_FOR_CHECK:', signString + '商户KEY')
  } catch (e) {
    // ignore
  }

  // 4. 进行 MD5 加密（标准实现，按 UTF-8 编码）
  const digest = md5(finalString)

  // 打印当前计算出来的 MD5（不含密钥），方便和 zpay 后台在线验签工具对比
  try {
    console.log('ZPAY_MD5_FOR_CHECK:', digest)
  } catch (e) {
    // ignore
  }

  return digest
}

/**
 * 验证MD5签名
 * @param {Object} params - 支付参数对象（包含sign）
 * @param {string} key - 商户密钥
 * @returns {boolean} 签名是否正确
 */
export function verifySign(params, key = MERCHANT_KEY) {
  const receivedSign = params.sign
  if (!receivedSign) {
    return false
  }

  const calculatedSign = generateSign(params, key)
  return receivedSign.toLowerCase() === calculatedSign.toLowerCase()
}

/**
 * 生成支付URL
 * @param {Object} paymentData - 支付数据
 * @param {string} paymentData.money - 支付金额
 * @param {string} paymentData.name - 商品名称
 * @param {string} paymentData.out_trade_no - 商户订单号
 * @param {string} paymentData.notify_url - 异步通知地址
 * @param {string} paymentData.return_url - 同步跳转地址
 * @param {string} paymentData.type - 支付方式（alipay/wxpay）
 * @param {string} paymentData.param - 自定义参数
 * @returns {string} 支付URL
 */
export function generatePaymentUrl(paymentData) {
  // 构建支付参数（注意：sign和sign_type不参与签名）
  const params = {
    money: paymentData.money,
    name: paymentData.name,
    notify_url: paymentData.notify_url,
    out_trade_no: paymentData.out_trade_no,
    param: paymentData.param || '',
    pid: MERCHANT_PID,
    return_url: paymentData.return_url,
    type: paymentData.type || 'alipay',
  }

  // 生成签名（只对非空参数进行签名，不包括sign和sign_type）
  const sign = generateSign(params)
  
  // 添加签名和签名类型
  params.sign = sign
  params.sign_type = 'MD5'

  // 构建URL（按字母顺序排序，确保一致性）
  const sortedKeys = Object.keys(params).sort()
  const queryString = sortedKeys
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join('&')

  return `${PAYMENT_GATEWAY}?${queryString}`
}

/**
 * 标准 MD5 实现（UTF-8）
 * 说明：实现参考经典 JavaScript MD5 实现，确保与 PHP md5() 结果一致
 * @param {string} str
 * @returns {string} 32 位小写十六进制 MD5
 */
function md5(str) {
  // UTF-8 编码
  function utf8Encode(string) {
    return unescape(encodeURIComponent(string))
  }

  function rotateLeft(lValue, iShiftBits) {
    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits))
  }

  function addUnsigned(lX, lY) {
    const lX4 = lX & 0x40000000
    const lY4 = lY & 0x40000000
    const lX8 = lX & 0x80000000
    const lY8 = lY & 0x80000000
    const lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF)
    if (lX4 & lY4) {
      return (lResult ^ 0x80000000 ^ lX8 ^ lY8)
    }
    if (lX4 | lY4) {
      if (lResult & 0x40000000) {
        return (lResult ^ 0xC0000000 ^ lX8 ^ lY8)
      } else {
        return (lResult ^ 0x40000000 ^ lX8 ^ lY8)
      }
    }
    return (lResult ^ lX8 ^ lY8)
  }

  function F(x, y, z) { return (x & y) | ((~x) & z) }
  function G(x, y, z) { return (x & z) | (y & (~z)) }
  function H(x, y, z) { return x ^ y ^ z }
  function I(x, y, z) { return y ^ (x | (~z)) }

  function FF(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac))
    return addUnsigned(rotateLeft(a, s), b)
  }

  function GG(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac))
    return addUnsigned(rotateLeft(a, s), b)
  }

  function HH(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac))
    return addUnsigned(rotateLeft(a, s), b)
  }

  function II(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac))
    return addUnsigned(rotateLeft(a, s), b)
  }

  function convertToWordArray(str) {
    const lWordArray = []
    let lMessageLength = str.length
    let lNumberOfWordsTempOne = lMessageLength + 8
    let lNumberOfWordsTempTwo = (lNumberOfWordsTempOne - (lNumberOfWordsTempOne % 64)) / 64
    const lNumberOfWords = (lNumberOfWordsTempTwo + 1) * 16
    let lBytePosition = 0
    let lByteCount = 0
    while (lByteCount < lMessageLength) {
      const lWordCount = (lByteCount - (lByteCount % 4)) / 4
      lBytePosition = (lByteCount % 4) * 8
      lWordArray[lWordCount] = (lWordArray[lWordCount] | (str.charCodeAt(lByteCount) << lBytePosition)) >>> 0
      lByteCount++
    }
    const lWordCount = (lByteCount - (lByteCount % 4)) / 4
    lBytePosition = (lByteCount % 4) * 8
    lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition)
    lWordArray[lNumberOfWords - 2] = (lMessageLength << 3) >>> 0
    lWordArray[lNumberOfWords - 1] = (lMessageLength >>> 29) >>> 0
    return lWordArray
  }

  function wordToHex(lValue) {
    let wordToHexValue = ''
    for (let lCount = 0; lCount <= 3; lCount++) {
      const lByte = (lValue >>> (lCount * 8)) & 255
      const wordToHexValueTemp = '0' + lByte.toString(16)
      wordToHexValue += wordToHexValueTemp.substr(wordToHexValueTemp.length - 2, 2)
    }
    return wordToHexValue
  }

  // 主流程
  const x = convertToWordArray(utf8Encode(str))

  let a = 0x67452301
  let b = 0xEFCDAB89
  let c = 0x98BADCFE
  let d = 0x10325476

  for (let k = 0; k < x.length; k += 16) {
    const AA = a
    const BB = b
    const CC = c
    const DD = d

    a = FF(a, b, c, d, x[k + 0], 7, 0xD76AA478)
    d = FF(d, a, b, c, x[k + 1], 12, 0xE8C7B756)
    c = FF(c, d, a, b, x[k + 2], 17, 0x242070DB)
    b = FF(b, c, d, a, x[k + 3], 22, 0xC1BDCEEE)
    a = FF(a, b, c, d, x[k + 4], 7, 0xF57C0FAF)
    d = FF(d, a, b, c, x[k + 5], 12, 0x4787C62A)
    c = FF(c, d, a, b, x[k + 6], 17, 0xA8304613)
    b = FF(b, c, d, a, x[k + 7], 22, 0xFD469501)
    a = FF(a, b, c, d, x[k + 8], 7, 0x698098D8)
    d = FF(d, a, b, c, x[k + 9], 12, 0x8B44F7AF)
    c = FF(c, d, a, b, x[k + 10], 17, 0xFFFF5BB1)
    b = FF(b, c, d, a, x[k + 11], 22, 0x895CD7BE)
    a = FF(a, b, c, d, x[k + 12], 7, 0x6B901122)
    d = FF(d, a, b, c, x[k + 13], 12, 0xFD987193)
    c = FF(c, d, a, b, x[k + 14], 17, 0xA679438E)
    b = FF(b, c, d, a, x[k + 15], 22, 0x49B40821)

    a = GG(a, b, c, d, x[k + 1], 5, 0xF61E2562)
    d = GG(d, a, b, c, x[k + 6], 9, 0xC040B340)
    c = GG(c, d, a, b, x[k + 11], 14, 0x265E5A51)
    b = GG(b, c, d, a, x[k + 0], 20, 0xE9B6C7AA)
    a = GG(a, b, c, d, x[k + 5], 5, 0xD62F105D)
    d = GG(d, a, b, c, x[k + 10], 9, 0x2441453)
    c = GG(c, d, a, b, x[k + 15], 14, 0xD8A1E681)
    b = GG(b, c, d, a, x[k + 4], 20, 0xE7D3FBC8)
    a = GG(a, b, c, d, x[k + 9], 5, 0x21E1CDE6)
    d = GG(d, a, b, c, x[k + 14], 9, 0xC33707D6)
    c = GG(c, d, a, b, x[k + 3], 14, 0xF4D50D87)
    b = GG(b, c, d, a, x[k + 8], 20, 0x455A14ED)
    a = GG(a, b, c, d, x[k + 13], 5, 0xA9E3E905)
    d = GG(d, a, b, c, x[k + 2], 9, 0xFCEFA3F8)
    c = GG(c, d, a, b, x[k + 7], 14, 0x676F02D9)
    b = GG(b, c, d, a, x[k + 12], 20, 0x8D2A4C8A)

    a = HH(a, b, c, d, x[k + 5], 4, 0xFFFA3942)
    d = HH(d, a, b, c, x[k + 8], 11, 0x8771F681)
    c = HH(c, d, a, b, x[k + 11], 16, 0x6D9D6122)
    b = HH(b, c, d, a, x[k + 14], 23, 0xFDE5380C)
    a = HH(a, b, c, d, x[k + 1], 4, 0xA4BEEA44)
    d = HH(d, a, b, c, x[k + 4], 11, 0x4BDECFA9)
    c = HH(c, d, a, b, x[k + 7], 16, 0xF6BB4B60)
    b = HH(b, c, d, a, x[k + 10], 23, 0xBEBFBC70)
    a = HH(a, b, c, d, x[k + 13], 4, 0x289B7EC6)
    d = HH(d, a, b, c, x[k + 0], 11, 0xEAA127FA)
    c = HH(c, d, a, b, x[k + 3], 16, 0xD4EF3085)
    b = HH(b, c, d, a, x[k + 6], 23, 0x04881D05)
    a = HH(a, b, c, d, x[k + 9], 4, 0xD9D4D039)
    d = HH(d, a, b, c, x[k + 12], 11, 0xE6DB99E5)
    c = HH(c, d, a, b, x[k + 15], 16, 0x1FA27CF8)
    b = HH(b, c, d, a, x[k + 2], 23, 0xC4AC5665)

    a = II(a, b, c, d, x[k + 0], 6, 0xF4292244)
    d = II(d, a, b, c, x[k + 7], 10, 0x432AFF97)
    c = II(c, d, a, b, x[k + 14], 15, 0xAB9423A7)
    b = II(b, c, d, a, x[k + 5], 21, 0xFC93A039)
    a = II(a, b, c, d, x[k + 12], 6, 0x655B59C3)
    d = II(d, a, b, c, x[k + 3], 10, 0x8F0CCC92)
    c = II(c, d, a, b, x[k + 10], 15, 0xFFEFF47D)
    b = II(b, c, d, a, x[k + 1], 21, 0x85845DD1)
    a = II(a, b, c, d, x[k + 8], 6, 0x6FA87E4F)
    d = II(d, a, b, c, x[k + 15], 10, 0xFE2CE6E0)
    c = II(c, d, a, b, x[k + 6], 15, 0xA3014314)
    b = II(b, c, d, a, x[k + 13], 21, 0x4E0811A1)

    a = addUnsigned(a, AA)
    b = addUnsigned(b, BB)
    c = addUnsigned(c, CC)
    d = addUnsigned(d, DD)
  }

  const result = wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)
  return result.toLowerCase()
}
