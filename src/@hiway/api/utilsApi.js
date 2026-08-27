import request from "@/utils/request"
import { isUseAPI } from "@hiway/utils/check"

export function getClientIp(data) {
  if (isUseAPI()) {
    return request({
      url: '/hse/utils/getClientIp',
      headers: { "Content-Type": 'application/json;charset=utf8' },
      method: 'post',
      data,
    })
  }

  return new Promise((resolve) => {
    resolve({ body: '127.0.0.1' })
  })
}