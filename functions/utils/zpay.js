/**
 * 支付网关工具函数
 * 网关：https://zpayz.cn/
 */

// 支付网关配置（注意：必须是提交地址 submit.php，而不是站点首页）
const PAYMENT_GATEWAY = 'https://zpayz.cn/submit.php'
const MERCHANT_PID = '2025120114591699'
const MERCHANT_KEY = '9wkw39Fq1x9TZfhk5L8bvsU5Djc1zq2t'

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

  // 2. 按「参数原始顺序」拼接成字符串（key=value&key=value 格式）
  //    这里不再做键名排序，以严格贴合 zpay 返回的“请检查签名字符串”示例
  const signString = Object.entries(filteredParams)
    .map(([k, v]) => `${k}=${v}`)
    .join('&')

  // 3. 在末尾加上商户密钥（注意：是直接拼接 key，而不是再加 & 或 key=）
  const finalString = signString + key

  // 5. 进行MD5加密（使用Web Crypto API）
  return md5(finalString)
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
 * MD5加密函数（纯JavaScript实现）
 * @param {string} str - 要加密的字符串
 * @returns {string} MD5哈希值（32位十六进制字符串）
 */
function md5(str) {
  // MD5算法的完整实现
  function md5cycle(x, k) {
    let a = x[0], b = x[1], c = x[2], d = x[3]

    a = ff(a, b, c, d, k[0], 7, -680876936)
    d = ff(d, a, b, c, k[1], 12, -389564586)
    c = ff(c, d, a, b, k[2], 17, 606105819)
    b = ff(b, c, d, a, k[3], 22, -1044525330)
    a = ff(a, b, c, d, k[4], 7, -176418897)
    d = ff(d, a, b, c, k[5], 12, 1200080426)
    c = ff(c, d, a, b, k[6], 17, -1473231341)
    b = ff(b, c, d, a, k[7], 22, -45705983)
    a = ff(a, b, c, d, k[8], 7, 1770035416)
    d = ff(d, a, b, c, k[9], 12, -1958414417)
    c = ff(c, d, a, b, k[10], 17, -42063)
    b = ff(b, c, d, a, k[11], 22, -1990404162)
    a = ff(a, b, c, d, k[12], 7, 1804603682)
    d = ff(d, a, b, c, k[13], 12, -40341101)
    c = ff(c, d, a, b, k[14], 17, -1502002290)
    b = ff(b, c, d, a, k[15], 22, 1236535329)

    a = gg(a, b, c, d, k[1], 5, -165796510)
    d = gg(d, a, b, c, k[6], 9, -1069501632)
    c = gg(c, d, a, b, k[11], 14, 643717713)
    b = gg(b, c, d, a, k[0], 20, -373897302)
    a = gg(a, b, c, d, k[5], 5, -701558691)
    d = gg(d, a, b, c, k[10], 9, 38016083)
    c = gg(c, d, a, b, k[15], 14, -660478335)
    b = gg(b, c, d, a, k[4], 20, -405537848)
    a = gg(a, b, c, d, k[9], 5, 568446438)
    d = gg(d, a, b, c, k[14], 9, -1019803690)
    c = gg(c, d, a, b, k[3], 14, -187363961)
    b = gg(b, c, d, a, k[8], 20, 1163531501)
    a = gg(a, b, c, d, k[13], 5, -1444681467)
    d = gg(d, a, b, c, k[2], 9, -51403784)
    c = gg(c, d, a, b, k[7], 14, 1735328473)
    b = gg(b, c, d, a, k[12], 20, -1926607734)

    a = hh(a, b, c, d, k[5], 4, -378558)
    d = hh(d, a, b, c, k[8], 11, -2022574463)
    c = hh(c, d, a, b, k[11], 16, 1839030562)
    b = hh(b, c, d, a, k[14], 23, -35309556)
    a = hh(a, b, c, d, k[1], 4, -1530992060)
    d = hh(d, a, b, c, k[4], 11, 1272893353)
    c = hh(c, d, a, b, k[7], 16, -155497632)
    b = hh(b, c, d, a, k[10], 23, -1094730640)
    a = hh(a, b, c, d, k[13], 4, 681279174)
    d = hh(d, a, b, c, k[0], 11, -358537222)
    c = hh(c, d, a, b, k[3], 16, -722521979)
    b = hh(b, c, d, a, k[6], 23, 76029189)
    a = hh(a, b, c, d, k[9], 4, -640364487)
    d = hh(d, a, b, c, k[12], 11, -421815835)
    c = hh(c, d, a, b, k[15], 16, 530742520)
    b = hh(b, c, d, a, k[2], 23, -995338651)

    a = ii(a, b, c, d, k[0], 6, -198630844)
    d = ii(d, a, b, c, k[7], 10, 1126891415)
    c = ii(c, d, a, b, k[14], 15, -1416354905)
    b = ii(b, c, d, a, k[5], 21, -57434055)
    a = ii(a, b, c, d, k[12], 6, 1700485571)
    d = ii(d, a, b, c, k[3], 10, -1894986606)
    c = ii(c, d, a, b, k[10], 15, -1051523)
    b = ii(b, c, d, a, k[1], 21, -2054922799)
    a = ii(a, b, c, d, k[8], 6, 1873313359)
    d = ii(d, a, b, c, k[15], 10, -30611744)
    c = ii(c, d, a, b, k[6], 15, -1560198380)
    b = ii(b, c, d, a, k[13], 21, 1309151649)
    a = ii(a, b, c, d, k[4], 6, -145523070)
    d = ii(d, a, b, c, k[11], 10, -1120210379)
    c = ii(c, d, a, b, k[2], 15, 718787259)
    b = ii(b, c, d, a, k[9], 21, -343485551)

    x[0] = add32(a, x[0])
    x[1] = add32(b, x[1])
    x[2] = add32(c, x[2])
    x[3] = add32(d, x[3])
  }

  function cmn(q, a, b, x, s, t) {
    a = add32(add32(a, q), add32(x, t))
    return add32((a << s) | (a >>> (32 - s)), b)
  }

  function ff(a, b, c, d, x, s, t) {
    return cmn((b & c) | ((~b) & d), a, b, x, s, t)
  }

  function gg(a, b, c, d, x, s, t) {
    return cmn((b & d) | (c & (~d)), a, b, x, s, t)
  }

  function hh(a, b, c, d, x, s, t) {
    return cmn(b ^ c ^ d, a, b, x, s, t)
  }

  function ii(a, b, c, d, x, s, t) {
    return cmn(c ^ (b | (~d)), a, b, x, s, t)
  }

  function add32(a, b) {
    return (a + b) & 0xFFFFFFFF
  }

  function rhex(n) {
    let s = ''
    const hexChr = '0123456789abcdef'
    for (let i = 0; i < 4; i++) {
      s += hexChr.charAt((n >> (i * 8 + 4)) & 0x0F) + hexChr.charAt((n >> (i * 8)) & 0x0F)
    }
    return s
  }

  const utf8 = unescape(encodeURIComponent(str))
  const x = []
  let k

  for (let i = 0; i < utf8.length; i++) {
    x[i >> 2] |= (utf8.charCodeAt(i) << ((i % 4) * 8))
  }

  x[utf8.length >> 2] |= 0x80 << (((utf8.length % 4) * 8) + 4)
  x[(((utf8.length + 64) >>> 9) << 4) + 14] = utf8.length * 8

  const h = [1732584193, -271733879, -1732584194, 271733878]

  for (let i = 0; i < x.length; i += 16) {
    const olda = h[0], oldb = h[1], oldc = h[2], oldd = h[3]
    h[0] = olda
    h[1] = oldb
    h[2] = oldc
    h[3] = oldd

    k = []
    for (let j = 0; j < 16; j++) {
      k[j] = x[i + j]
    }

    md5cycle(h, k)

    h[0] = add32(h[0], olda)
    h[1] = add32(h[1], oldb)
    h[2] = add32(h[2], oldc)
    h[3] = add32(h[3], oldd)
  }

  return rhex(h[0]) + rhex(h[1]) + rhex(h[2]) + rhex(h[3])
}
