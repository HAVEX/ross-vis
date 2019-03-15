import tpl from '../html/CommPanels.html'

import p4 from 'p4'

import Communication from './Communication'

export default {
  name: 'Dashboard',
  template: tpl,
  components: {
    Communication
  },
  data: () => ({
    socketError: false,
    server: 'vidi1.cs.ucdavis.edu:8888',
    timeDomains: ['LastGvt','RealTs','VirtualTime'],
    granularity: ['PE','KP','LP'],
    measures: ['avg', 'sum', 'max', 'min'],
    timeIndexes: null,
    timeDomain: 'LastGvt',
    selectedGran: 'PE',
    selectedMeasure: 'sum',
    metrics: [
      'RbSec',
      'RbPrim'
    ],
    timeIntervals: [
      [204471, 238514],
      [242484, 263715],
      [280495, 363079],
      // [365019, 366747],
    ],
    processIds: [],
    clusterIds: [],
    clusterColors: [
      [227, 119, 194],
      [188, 189, 34],
      [23, 190, 207],
      [127, 127, 127]],
  }),
  mounted () {
    this.init()
  },

  methods: {
    init () {
      let socket = new WebSocket('ws://' + this.server + '/websocket')
      socket.onopen = () => {
        this.dialog = !this.dialog
        this.socketError = false
        socket.send(JSON.stringify({method: 'get', data: 'KpData'}))
      }

      socket.onerror = (error) => {
        this.socketError = true
      }
  
      socket.onmessage = (event) => {
        let data = JSON.parse(event.data)
        data.data.forEach(d => {
          d.RbPrim = d.RbTotal - d.RbSec
        })
        this.data = data.data
        if (data.schema.hasOwnProperty('CommData')) {
          data.schema.CommData = 'int'
        }
        this.$refs.container.allMetrics = Object.keys(data.schema).filter(k => k.slice(-2) !== 'id' && k.slice(-2) !== 'Id')
        let params = data.params || {}

        if(params.timeIntervals) this.timeIntervals = params.timeIntervals
        if(params.timeMetric) this.timeDomain = params.timeMetric
        if(params.ringMetrics) {
          this.metrics = params.ringMetrics
          this.$refs.container.metrics = params.ringMetrics
        }
        if(params.processIds) this.processIds = params.processIds
        if(params.clusterIds) this.clusterIds = params.clusterIds
        if(params.clusterColors) this.clusterColors = params.clusterColors.map(c => 'rgb(' + c.join(',') + ')')
        this.update()
      }

    },
    update () {
      this.$refs.container.visualize({
        data: this.data,
        measure: 'sum',
        timeDomain: this.timeDomain,
        metrics: this.metrics,
        timeIntervals: this.timeIntervals,
        processIds: this.processIds,
        clusterIds: this.clusterIds,
        clusterColors: this.clusterColors
      })
    },

    updateMetrics (metrics) {
      this.metrics = metrics
      this.update()
    }

  }
}
