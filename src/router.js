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


export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'index',
      component: index
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
