import request from '@/utils/request'
// const contextPath = import.meta.env.VITE_SYSTEM_CONTEXT
// const contextPath = import.meta.env.VITE_HIWAY_API_URL




export function loginSso() {  
  // TODO: contextpath 적용 필요
  return request({
    url: '/hse/sso/',
    meta: {
      apiVersion: '1.0.0',
      useTokenUpdate: true,
      useResponseAll: true,
      useErrorMessage: false,
    },
    method: 'post',      
  })  
}