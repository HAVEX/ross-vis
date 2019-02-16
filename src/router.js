import Vue from 'vue'
import Router from 'vue-router'
import Vuetify from 'vuetify'

Vue.use(Router)
Vue.use(Vuetify)

import 'vuetify/dist/vuetify.min.css'
import 'material-design-icons-iconfont/dist/material-design-icons.css'

import index from './components/index'
import TimeSeries from './components/TimeSeries'
import Dimensionality from './components/Dimensionality'
import Overview from './components/Overview'
import Dashboard1 from './components/Dashboard1'
import Dashboard2 from './components/Dashboard2'

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'index',
      component: index
    },
    {
      path: '/Dashboard1',
      name: 'Dashboard1',
      component: Dashboard1
    },
    {
      path: '/Dashboard2',
      name: 'Dashboard2',
      component: Dashboard2
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
    }      
  ]
})
