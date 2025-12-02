/**
 * zpay 支付网关工具
 * 网关：https://zpayz.cn/submit.php
 */

// 注意：这里直接写死你的 PID 和 KEY，方便 Cloudflare Pages 使用
// 如果你以后在后台重置 KEY，一定要同步修改这里
const PAYMENT_GATEWAY = 'https://zpayz.cn/submit.php'
const MERCHANT_PID = '2025120114591699'
const MERCHANT_KEY = '7H1J0p9RTkZaq66zLHIpoTGlifNI7y1Z'

/**
 * 生成 MD5 签名
 * 规则完全按 zpay 文档：
 * 1. 按参数名 ASCII 从小到大排序（a-z）
 * 2. 过滤 sign / sign_type 和 空值
 * 3. 拼接 a=b&c=d&e=f 这样的字符串（值不要 URL 编码）
 * 4. 在末尾直接拼 KEY：sign = md5( 原串 + KEY )，小写
 */
export function generateSign(params, key = MERCHANT_KEY) {
  const filtered = {}
  for (const [k, v] of Object.entries(params)) {
    if (v === null || v === undefined || v === '' || k === 'sign' || k === 'sign_type') continue
    filtered[k] = v
  }

  const sortedKeys = Object.keys(filtered).sort()
  const signString = sortedKeys.map(k => `${k}=${filtered[k]}`).join('&')
  const finalString = signString + key

  // 打日志方便你在 Cloudflare 后台对比
  try {
    console.log('ZPAY_SIGN_STRING_FOR_CHECK:', signString + '商户KEY')
  } catch {}

  const digest = md5(finalString)

  try {
    console.log('ZPAY_MD5_FOR_CHECK:', digest)
  } catch {}

  return digest
}

/**
 * 验证通知里的签名
 */
export function verifySign(params, key = MERCHANT_KEY) {
  const received = params.sign
  if (!received) return false
  const calc = generateSign(params, key)
  return String(received).toLowerCase() === calc.toLowerCase()
}

/**
 * 生成支付 URL（只在后端调用）
 * 注意：签名时用“未编码参数”，拼 URL 时再 encodeURIComponent
 */
export function generatePaymentUrl(paymentData) {
  const baseParams = {
    money: paymentData.money,
    name: paymentData.name,
    notify_url: paymentData.notify_url,
    out_trade_no: paymentData.out_trade_no,
    param: paymentData.param || '',
    pid: MERCHANT_PID,
    return_url: paymentData.return_url,
    type: paymentData.type || 'alipay',
  }

  const sign = generateSign(baseParams)

  const fullParams = {
    ...baseParams,
    sign,
    sign_type: 'MD5',
  }

  const qs = Object.keys(fullParams)
    .sort()
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(fullParams[k])}`)
    .join('&')

  return `${PAYMENT_GATEWAY}?${qs}`
}

/**
 * 纯 JS MD5（UTF-8），保证与 PHP md5() 一致
 * 实现来源于经典实现，略长，但稳定可靠
 */
function md5(str) {
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
    const lResult = (lX & 0x3fffffff) + (lY & 0x3fffffff)
    if (lX4 & lY4) {
      return (lResult ^ 0x80000000 ^ lX8 ^ lY8) >>> 0
    }
    if (lX4 | lY4) {
      if (lResult & 0x40000000) {
        return (lResult ^ 0xc0000000 ^ lX8 ^ lY8) >>> 0
      } else {
        return (lResult ^ 0x40000000 ^ lX8 ^ lY8) >>> 0
      }
    }
    return (lResult ^ lX8 ^ lY8) >>> 0
  }

  function F(x, y, z) { return (x & y) | (~x & z) }
  function G(x, y, z) { return (x & z) | (y & ~z) }
  function H(x, y, z) { return x ^ y ^ z }
  function I(x, y, z) { return y ^ (x | ~z) }

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

  function convertToWordArray(str2) {
    const msgLen = str2.length
    const numberOfWordsTemp1 = msgLen + 8
    const numberOfWordsTemp2 = ((numberOfWordsTemp1 - (numberOfWordsTemp1 % 64)) / 64) | 0
    const numberOfWords = (numberOfWordsTemp2 + 1) * 16
    const wordArray = new Array(numberOfWords).fill(0)
    let byteCount = 0
    while (byteCount < msgLen) {
      const wordCount = (byteCount / 4) | 0
      const bytePosition = (byteCount % 4) * 8
      wordArray[wordCount] = (wordArray[wordCount] | (str2.charCodeAt(byteCount) << bytePosition)) >>> 0
      byteCount++
    }
    const wordCount = (byteCount / 4) | 0
    const bytePosition = (byteCount % 4) * 8
    wordArray[wordCount] = (wordArray[wordCount] | (0x80 << bytePosition)) >>> 0
    wordArray[numberOfWords - 2] = (msgLen << 3) >>> 0
    wordArray[numberOfWords - 1] = (msgLen >>> 29) >>> 0
    return wordArray
  }

  function wordToHex(lValue) {
    let wordToHexValue = ''
    for (let lCount = 0; lCount <= 3; lCount++) {
      const lByte = (lValue >>> (lCount * 8)) & 255
      const wordToHexValueTemp = '0' + lByte.toString(16)
      wordToHexValue += wordToHexValueTemp.substring(wordToHexValueTemp.length - 2, wordToHexValueTemp.length)
    }
    return wordToHexValue
  }

  const x = convertToWordArray(utf8Encode(str))

  let a = 0x67452301
  let b = 0xefcdab89
  let c = 0x98badcfe
  let d = 0x10325476

  for (let k = 0; k < x.length; k += 16) {
    const AA = a
    const BB = b
    const CC = c
    const DD = d

    a = FF(a, b, c, d, x[k + 0], 7, 0xd76aa478)
    d = FF(d, a, b, c, x[k + 1], 12, 0xe8c7b756)
    c = FF(c, d, a, b, x[k + 2], 17, 0x242070db)
    b = FF(b, c, d, a, x[k + 3], 22, 0xc1bdceee)
    a = FF(a, b, c, d, x[k + 4], 7, 0xf57c0faf)
    d = FF(d, a, b, c, x[k + 5], 12, 0x4787c62a)
    c = FF(c, d, a, b, x[k + 6], 17, 0xa8304613)
    b = FF(b, c, d, a, x[k + 7], 22, 0xfd469501)
    a = FF(a, b, c, d, x[k + 8], 7, 0x698098d8)
    d = FF(d, a, b, c, x[k + 9], 12, 0x8b44f7af)
    c = FF(c, d, a, b, x[k + 10], 17, 0xffff5bb1)
    b = FF(b, c, d, a, x[k + 11], 22, 0x895cd7be)
    a = FF(a, b, c, d, x[k + 12], 7, 0x6b901122)
    d = FF(d, a, b, c, x[k + 13], 12, 0xfd987193)
    c = FF(c, d, a, b, x[k + 14], 17, 0xa679438e)
    b = FF(b, c, d, a, x[k + 15], 22, 0x49b40821)

    a = GG(a, b, c, d, x[k + 1], 5, 0xf61e2562)
    d = GG(d, a, b, c, x[k + 6], 9, 0xc040b340)
    c = GG(c, d, a, b, x[k + 11], 14, 0x265e5a51)
    b = GG(b, c, d, a, x[k + 0], 20, 0xe9b6c7aa)
    a = GG(a, b, c, d, x[k + 5], 5, 0xd62f105d)
    d = GG(d, a, b, c, x[k + 10], 9, 0x02441453)
    c = GG(c, d, a, b, x[k + 15], 14, 0xd8a1e681)
    b = GG(b, c, d, a, x[k + 4], 20, 0xe7d3fbc8)
    a = GG(a, b, c, d, x[k + 9], 5, 0x21e1cde6)
    d = GG(d, a, b, c, x[k + 14], 9, 0xc33707d6)
    c = GG(c, d, a, b, x[k + 3], 14, 0xf4d50d87)
    b = GG(b, c, d, a, x[k + 8], 20, 0x455a14ed)
    a = GG(a, b, c, d, x[k + 13], 5, 0xa9e3e905)
    d = GG(d, a, b, c, x[k + 2], 9, 0xfcefa3f8)
    c = GG(c, d, a, b, x[k + 7], 14, 0x676f02d9)
    b = GG(b, c, d, a, x[k + 12], 20, 0x8d2a4c8a)

    a = HH(a, b, c, d, x[k + 5], 4, 0xfffa3942)
    d = HH(d, a, b, c, x[k + 8], 11, 0x8771f681)
    c = HH(c, d, a, b, x[k + 11], 16, 0x6d9d6122)
    b = HH(b, c, d, a, x[k + 14], 23, 0xfde5380c)
    a = HH(a, b, c, d, x[k + 1], 4, 0xa4beea44)
    d = HH(d, a, b, c, x[k + 4], 11, 0x4bdecfa9)
    c = HH(c, d, a, b, x[k + 7], 16, 0xf6bb4b60)
    b = HH(b, c, d, a, x[k + 10], 23, 0xbebfbc70)
    a = HH(a, b, c, d, x[k + 13], 4, 0x289b7ec6)
    d = HH(d, a, b, c, x[k + 0], 11, 0xeaa127fa)
    c = HH(c, d, a, b, x[k + 3], 16, 0xd4ef3085)
    b = HH(b, c, d, a, x[k + 6], 23, 0x04881d05)
    a = HH(a, b, c, d, x[k + 9], 4, 0xd9d4d039)
    d = HH(d, a, b, c, x[k + 12], 11, 0xe6db99e5)
    c = HH(c, d, a, b, x[k + 15], 16, 0x1fa27cf8)
    b = HH(b, c, d, a, x[k + 2], 23, 0xc4ac5665)

    a = II(a, b, c, d, x[k + 0], 6, 0xf4292244)
    d = II(d, a, b, c, x[k + 7], 10, 0x432aff97)
    c = II(c, d, a, b, x[k + 14], 15, 0xab9423a7)
    b = II(b, c, d, a, x[k + 5], 21, 0xfc93a039)
    a = II(a, b, c, d, x[k + 12], 6, 0x655b59c3)
    d = II(d, a, b, c, x[k + 3], 10, 0x8f0ccc92)
    c = II(c, d, a, b, x[k + 10], 15, 0xffeff47d)
    b = II(b, c, d, a, x[k + 1], 21, 0x85845dd1)
    a = II(a, b, c, d, x[k + 8], 6, 0x6fa87e4f)
    d = II(d, a, b, c, x[k + 15], 10, 0xfe2ce6e0)
    c = II(c, d, a, b, x[k + 6], 15, 0xa3014314)
    b = II(b, c, d, a, x[k + 13], 21, 0x4e0811a1)

    a = addUnsigned(a, AA)
    b = addUnsigned(b, BB)
    c = addUnsigned(c, CC)
    d = addUnsigned(d, DD)
  }

  const result = wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)
  return result.toLowerCase()
}

