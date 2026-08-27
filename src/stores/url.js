import { defineStore } from 'pinia'

const url = import.meta.env.VITE_SYSTEM_CONTEXT

export const useUrlStore = defineStore('url', {
  state: () => ({
    contextPath: url,
  }),
})
