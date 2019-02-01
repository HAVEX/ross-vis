import tpl from '../html/Dashboard.html'
//import '../css/app.css'
import p5 from 'p5'
import p4 from 'p4'

import Communication from './Communication'
import Dimensionality from './Dimensionality'
import TimeSeries from './TimeSeries'

export default {
  name: 'Dashboard',
  template: tpl,
  components: {
    Dimensionality,
    TimeSeries,
    Communication
  },
  data: () => ({
    appName: 'ROSS-Vis',
    dialog: true,
    socketError: false,
    server: 'localhost:8888',
    modes: ['Post Hoc', 'In Situ'],
    defaultMode: 'Post Hoc',
    timeDomains: ['LastGvt','RealTs','VirtualTime'],
    granularity: ['PE','KP','LP'],
    measures: ['avg', 'sum', 'max', 'min'],
    timeIndexes: null,
    selectedTimeDomain: 'LastGvt',
    selectedTimeInterval: null,
    selectedGran: 'PE',
    selectedMeasure: 'sum',
    isAggregated: true,
    left: false,
    metrics: [],
    checkboxs: [],
    defaultMetrics: [
      'NeventProcessed', 
      'RbTotal',
        'VirtualTimeDiff',
        'ChangePointDetection',
      // 'NetworkRecv', 'NetworkSend'
    ],
    selectedMetrics: [],
    analyses: ['Communication', 'Dimensionality'],
    selectedAnalysis: 'Dimensionality'
  }),
  props: {
    source: String
  },
  mounted: function() {
    this.selectedMetrics = this.defaultMetrics.slice()

  },
  methods: {
    start() {

    },
    init() {
      let socket = new WebSocket('ws://' + this.server + '/websocket')
      socket.onopen = () => {
        this.dialog = !this.dialog
        this.socketError = false
        socket.send(JSON.stringify({data: 'KpData', method: 'get'}))
      }

      socket.onerror = (error) => {
        this.socketError = true
      }
  
      socket.onmessage = (event) => {
        let data = JSON.parse(event.data)
        this.data = data.data
        if (data.schema.hasOwnProperty('CommData')) {
          data.schema.CommData = 'int'
        }
        let cache = p4.cstore({})
        this.metrics = Object.keys(data.schema)
        cache.import(data)
        cache.index('RealTs')
        cache.index('LastGvt')
        let tsData = cache.data()
        this.timeIndexes = tsData.uniqueValues
        this.$refs.TimeSeries.init(tsData)
        this.reset()
      }

    },
    reset() {
      this.selectedMetrics = this.defaultMetrics.slice()
      this.selectedTimeInterval = null
      this.visualize()
      
    },
    updateCommunication() {
      this.$refs.Communication.selectedTimeDomain = this.selectedTimeDomain
      this.$refs.Communication.selectedTimeInterval = this.selectedTimeInterval
      this.$refs.Communication.selectedMetrics = this.selectedMetrics
      this.$refs.Communication.selectedMeasure = this.selectedMeasure
      this.$refs.Communication.visualize(this.data)
    },

    updateDimensionality () {
      this.$refs.Dimensionality.visualize()
    },

    updateTimeSeries (callback) {
      this.$refs.TimeSeries.selectedMeasure = this.selectedMeasure
      this.$refs.TimeSeries.isAggregated = this.isAggregated
      this.$refs.TimeSeries.selectedTimeDomain = this.selectedTimeDomain
      this.$refs.TimeSeries.visualize(this.selectedMetrics, callback)
    },

    visualize() {
      let callback = (selection) => {
        let ti = this.timeIndexes[this.selectedTimeDomain]
        let start = Math.floor(selection[this.selectedTimeDomain][0])
        let end = Math.ceil(selection[this.selectedTimeDomain][1])
        if (end - start >= 1) {
          this.selectedTimeInterval = [ti[start], ti[end]]
          this.updateCommunication()
        }
      }

      this.updateTimeSeries(callback)
      this.updateCommunication()
      this.updateDimensionality()
    }
  }
}
