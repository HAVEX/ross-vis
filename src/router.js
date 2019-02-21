import Vue from 'vue'
import Router from 'vue-router'
import Vuetify from 'vuetify'

Vue.use(Router)
Vue.use(Vuetify)

import 'vuetify/dist/vuetify.min.css'
import 'material-design-icons-iconfont/dist/material-design-icons.css'

import Dashboard from './components/Dashboard'
import TimeSeries from './components/TimeSeries'
import Dimensionality from './components/Dimensionality'
import CommPanels from './components/CommPanels'

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Dashboard',
      component: Dashboard
    },
    {
      path: '/cpd',
      name: 'TimeSeries',
      component: TimeSeries
    },
    {
      path: '/pca',
      name: 'Dimensionality',
      component: Dimensionality
    },
    {
      path: '/communications',
      name: 'Communications',
      component: CommPanels
    }  
  ]
})
