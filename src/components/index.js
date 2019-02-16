import tpl from '../html/index.html'
import p5 from 'p5'
import p4 from 'p4'

import Dashboard1 from './Dashboard1'
import Dashboard2 from './Dashboard2'

export default {
  name: 'index',
  template: tpl,
  components: {
    Dashboard1,
    Dashboard2
  },
  data: () => ({
    appName: 'ROSS-Vis',
    dialog: true,
    socketError: false,
    server: 'localhost:8888',
    modes: ['Post Hoc', 'In Situ'],
    defaultMode: 'Post Hoc',
    timeDomains: ['LastGvt', 'RealTs', 'VirtualTime'],
    granularity: ['PE', 'KP', 'LP'],
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
      //'RbTotal',
      //'VirtualTimeDiff',
      // 'NetworkRecv', 'NetworkSend'
    ],
    selectedMetrics: [],
    analysis: ['Case_study-1', 'Case_study-2'],
    selectedAnalysis: 'Case_study-1'
  }),

  mounted: function () {
    this.selectedMetrics = this.defaultMetrics.slice()
  },

  methods: {
    init(){
      this.fetchTsData()
    },
    fetchTsData() {
      let socket = new WebSocket('ws://' + this.server + '/websocket')
      socket.onopen = () => {
        this.dialog = !this.dialog
        this.socketError = false
        socket.send(JSON.stringify({ data: 'KpData', method: 'get' }))
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
        this.$refs.Dashboard1.init(tsData)
      }
    },
  }
}
