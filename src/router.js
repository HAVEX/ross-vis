import Vue from 'vue'
import Router from 'vue-router'
import Vuetify from 'vuetify'

Vue.use(Router)
Vue.use(Vuetify)

import 'vuetify/dist/vuetify.min.css'
import 'material-design-icons-iconfont/dist/material-design-icons.css'

import entry from './components/entry'

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'entry',
      component: entry
    }
  ]
})
