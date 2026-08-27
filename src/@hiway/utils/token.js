import { themeConfig } from '@themeConfig'

const TokenKey = 'Token'

export function getToken() {
  const token = window.sessionStorage.getItem(TokenKey)
  if (!token && themeConfig.app.onlyMockup) {
    return 'admin'
  }
  return token
}

export function setToken(token) {
  return window.sessionStorage.setItem(TokenKey, token)
}

export function removeToken() {
  return window.sessionStorage.removeItem(TokenKey)
}

export function getIsBeforeRemoveToken() {
  return window.sessionStorage.getItem('isbeforeRemoveToken')
}

export function setIsBeforeRemoveToken(value) {
  return window.sessionStorage.setItem('isbeforeRemoveToken', value)
}

export function removeIsBeforeRemoveToken() {
  return window.sessionStorage.removeItem('isbeforeRemoveToken')
}