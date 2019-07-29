import Vue from 'vue'
import Vuex from 'vuex'
import actions from './actions'

Vue.use(Vuex)

// let plugins = pluginsFunc()
export default new Vuex.Store({
    state: {
        color: null
    },
    actions,
})