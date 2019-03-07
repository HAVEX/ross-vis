import Vue from 'vue'
import Router from 'vue-router'
import Vuetify from 'vuetify'

Vue.use(Router)
Vue.use(Vuetify)

import 'vuetify/dist/vuetify.min.css'
import 'material-design-icons-iconfont/dist/material-design-icons.css'

import TimeNet from './components/TimeNet'
import DimNet from './components/DimNet'
import DimTime from './components/DimTime'
import CommPanels from './components/CommPanels'
import HomePage from './components/HomePage'

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'HomePage',
      component: HomePage
    },
    {
      path: '/dimtime',
      name: 'DimTime',
      component: DimTime
    },
    {
      path: '/timenet',
      name: 'TimeNet',
      component: TimeNet
    },
    {
      path: '/dimnet',
      name: 'DimNet',
      component: DimNet
    },
    {
      path: '/communications',
      name: 'Communications',
      component: CommPanels
    }  
  ]
})
