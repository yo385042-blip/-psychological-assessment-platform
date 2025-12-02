/**
 * Cloudflare KV 简易数据库封装
 * 这里只实现 API 路由实际用到的几个集合：
 * - users
 * - links
 * - questionnaires
 * - notifications
 *
 * 数据结构做了尽量简单、稳定的设计：每个集合一个 KV key，值是 JSON 数组。
 * 这样即使之前的实现被误删，现在也可以重新正常工作（老数据如果格式不同，可能无法自动读取）。
 */

function safeParse(json, fallback) {
  if (!json) return fallback
  try {
    const v = JSON.parse(json)
    return v ?? fallback
  } catch {
    return fallback
  }
}

function genId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export class UserDB {
  constructor(kv) {
    this.kv = kv
    this.key = 'users'
  }

  async _getAll() {
    const raw = await this.kv.get(this.key, 'text')
    return safeParse(raw, [])
  }

  async _saveAll(list) {
    await this.kv.put(this.key, JSON.stringify(list))
  }

  async getAllUsers() {
    return await this._getAll()
  }

  async getUserById(id) {
    const users = await this._getAll()
    return users.find(u => u.id === id) || null
  }

  async getUserByUsername(username) {
    const users = await this._getAll()
    return users.find(u => u.username === username) || null
  }

  async getUserByEmail(email) {
    const users = await this._getAll()
    return users.find(u => u.email === email) || null
  }

  async createUser(data) {
    const users = await this._getAll()
    const now = new Date().toISOString()
    const user = {
      id: genId('user'),
      createdAt: now,
      updatedAt: now,
      ...data,
    }
    users.push(user)
    await this._saveAll(users)
    return user
  }

  async updateUser(id, patch) {
    const users = await this._getAll()
    const idx = users.findIndex(u => u.id === id)
    if (idx === -1) return null
    const now = new Date().toISOString()
    const updated = { ...users[idx], ...patch, updatedAt: now }
    users[idx] = updated
    await this._saveAll(users)
    return updated
  }

  async deleteUser(id) {
    const users = await this._getAll()
    const next = users.filter(u => u.id !== id)
    await this._saveAll(next)
  }
}

export class LinkDB {
  constructor(kv) {
    this.kv = kv
    this.key = 'links'
  }

  async _getAll() {
    const raw = await this.kv.get(this.key, 'text')
    return safeParse(raw, [])
  }

  async _saveAll(list) {
    await this.kv.put(this.key, JSON.stringify(list))
  }

  async getAllLinks(userId) {
    const links = await this._getAll()
    return links.filter(l => l.createdBy === userId)
  }

  async getLinkById(id) {
    const links = await this._getAll()
    return links.find(l => l.id === id) || null
  }

  async createLink(data) {
    const links = await this._getAll()
    const now = new Date().toISOString()
    const link = {
      id: genId('link'),
      createdAt: now,
      usedAt: null,
      ...data,
    }
    links.push(link)
    await this._saveAll(links)
    return link
  }

  async updateLink(id, patch) {
    const links = await this._getAll()
    const idx = links.findIndex(l => l.id === id)
    if (idx === -1) return null
    const updated = { ...links[idx], ...patch }
    links[idx] = updated
    await this._saveAll(links)
    return updated
  }

  async deleteLink(id) {
    const links = await this._getAll()
    const next = links.filter(l => l.id !== id)
    await this._saveAll(next)
  }
}

export class QuestionnaireDB {
  constructor(kv) {
    this.kv = kv
    this.key = 'questionnaires'
  }

  async _getAll() {
    const raw = await this.kv.get(this.key, 'text')
    return safeParse(raw, [])
  }

  async _saveAll(list) {
    await this.kv.put(this.key, JSON.stringify(list))
  }

  async getAllQuestionnaires() {
    return await this._getAll()
  }

  async getQuestionnaire(type) {
    const list = await this._getAll()
    return list.find(q => q.type === type) || null
  }

  async createOrUpdateQuestionnaire(data) {
    const list = await this._getAll()
    const now = new Date().toISOString()
    const idx = list.findIndex(q => q.type === data.type)
    if (idx === -1) {
      const q = {
        createdAt: now,
        updatedAt: now,
        isPublished: false,
        ...data,
      }
      list.push(q)
      await this._saveAll(list)
      return q
    } else {
      const updated = {
        ...list[idx],
        ...data,
        updatedAt: now,
      }
      list[idx] = updated
      await this._saveAll(list)
      return updated
    }
  }

  async deleteQuestionnaire(type) {
    const list = await this._getAll()
    const next = list.filter(q => q.type !== type)
    await this._saveAll(next)
  }
}

export class NotificationDB {
  constructor(kv) {
    this.kv = kv
    this.key = 'notifications'
  }

  async _getAll() {
    const raw = await this.kv.get(this.key, 'text')
    return safeParse(raw, [])
  }

  async _saveAll(list) {
    await this.kv.put(this.key, JSON.stringify(list))
  }

  async getUserNotifications(userId) {
    const list = await this._getAll()
    return list.filter(n => n.userId === userId)
  }

  async getNotificationById(id) {
    const list = await this._getAll()
    return list.find(n => n.id === id) || null
  }

  async createNotification(data) {
    const list = await this._getAll()
    const now = new Date().toISOString()
    const n = {
      id: genId('notification'),
      createdAt: now,
      updatedAt: now,
      read: false,
      ...data,
    }
    list.push(n)
    await this._saveAll(list)
    return n
  }

  async updateNotification(id, patch) {
    const list = await this._getAll()
    const idx = list.findIndex(n => n.id === id)
    if (idx === -1) return null
    const updated = {
      ...list[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    }
    list[idx] = updated
    await this._saveAll(list)
    return updated
  }

  async deleteNotification(id) {
    const list = await this._getAll()
    const next = list.filter(n => n.id !== id)
    await this._saveAll(next)
  }
}

