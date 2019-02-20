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
    selectedMode: 'Post Hoc',
    timeDomains: ['LastGvt', 'RealTs', 'VirtualTime'],
    selectedTimeDomain: 'LastGvt',
    timeIndexes: null,
    granularity: ['PE', 'KP', 'LP'],
    selectedGran: 'PE',
    measures: ['avg', 'sum', 'max', 'min'],
    selectedMeasure: 'sum',
    isAggregated: true,
    left: false,
    metrics: [],
    checkboxs: [],
    analysis: ['Case_study-1', 'Case_study-2'],
    selectedAnalysis: 'Case_study-1'
  }),

  mounted: function () {
    //this.selectedMetrics = this.defaultMetrics.slice()
  },

  methods: {
    init(){
      this.fetchTsData(this.selectedGran)
    },

    updateGran(){
      this.clear()
      this.fetchTsData(this.selectedGran)
    },

    updateTimeDomain(){
      this.$refs.Dashboard1.visualize()
    },

    updateAnalysis(){
      this.clear()
    },

    updateMode(){

    },

    clear() {
      this.$refs.Dashboard1.clear()
    },

    fetchTsData() {
      let socket = new WebSocket('ws://' + this.server + '/websocket')
      socket.onopen = () => {
        this.dialog = !this.dialog
        this.socketError = false
        socket.send(JSON.stringify({ 
          data: this.selectedGran + 'Data', method: 'get' 
        }))
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
        console.log(tsData)
        this.$refs.Dashboard1.init(tsData)
      }
    },
  }
}
