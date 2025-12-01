import crypto from 'crypto'

// 构造 MD5 签名用的明文字符串
export function buildSignPayload(params) {
  const entries = Object.entries(params)
    .filter(([key, value]) => key !== 'sign' && key !== 'sign_type' && value !== undefined && value !== null && value !== '')
    .sort(([a], [b]) => (a > b ? 1 : a < b ? -1 : 0))

  return entries.map(([k, v]) => `${k}=${v}`).join('&')
}

export function md5Sign(params, key) {
  const payload = buildSignPayload(params)
  const raw = `${payload}${key}`
  return crypto.createHash('md5').update(raw, 'utf8').digest('hex')
}

export function verifyMd5Sign(params, key) {
  const { sign, sign_type, ...rest } = params
  if (!sign) return false
  const expected = md5Sign(rest, key)
  return String(sign).toLowerCase() === expected.toLowerCase()
}


