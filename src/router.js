import Vue from 'vue'
import Router from 'vue-router'
import Vuetify from 'vuetify'

Vue.use(Router)
Vue.use(Vuetify)

import 'vuetify/dist/vuetify.min.css'
import 'material-design-icons-iconfont/dist/material-design-icons.css'

import entry from './components/entry'
import TimeSeries from './components/TimeSeries'
import Dimensionality from './components/Dimensionality'


export default new Router({
  routes: [
    {
      path: '/',
      name: 'entry',
      component: entry
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
