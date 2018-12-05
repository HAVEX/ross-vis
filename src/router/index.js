import Vue from 'vue'
import Router from 'vue-router'
import Vuetify from 'vuetify'

Vue.use(Router)
Vue.use(Vuetify)

import 'vuetify/dist/vuetify.min.css'
import 'material-design-icons-iconfont/dist/material-design-icons.css'

import Dashboard from '@/components/Dashboard'
import MonitorTS from '@/components/MonitorTS'

export default new Router({
  routes: [
    {
      path: '/',
      name: 'MonitorTS',
      component: MonitorTS
    }
  ]
})
