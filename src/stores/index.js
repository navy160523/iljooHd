import { createStore } from 'vuex'

export default createStore({
  state: {
    homeCurrentPage: 0
  },
  getters: {
    time2(state) {
      return state.homeCurrentPage
    }
  },
  mutations: {
    setCurretPage(state, value) {
      state.homeCurrentPage = value
    }
  }
})
