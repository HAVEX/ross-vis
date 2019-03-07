import p4 from 'p4'
import WebSocket from './WebSocket'
import Communication from './Communication'
import Dimensionality from './Dimensionality'
import tpl from '../html/DimNet.html'

export default {
  name: 'DimNet',
  template: tpl,
  components: {
    WebSocket,
    Dimensionality,
    Communication
  },
  data: () => ({
    appName: 'ROSS-Vis',
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
    selectedMetrics: []
  }),
  methods: {
    connect() {
      this.$refs.Dimensionality.init()
      this.$refs.WebSocket.connect().then(dataObj => {
        this.$refs.Dimensionality.server = this.$refs.WebSocket.server
        this.data = dataObj.data
        this.metrics = Object.keys(dataObj.schema).filter(k => this.timeDomains.indexOf(k) === -1 && !k.match(/id$/i))
        this.reset()
      })
    },

    reset() {
      this.selectMetrics = ['NeventProcessed', 'RbTotal']
      this.selectedTimeInterval = null
      this.visualize()      
    },

    updateCommunication() {
      this.$refs.Communication.visualize({
        data: this.data,
        measure: this.selectedMeasure,
        timeDomain: this.selectedTimeDomain,
        metrics: this.selectedMetrics,
        timeIntervals: [this.selectedTimeInterval]
      })
    },

    visualize() {
      // let callback = (selection) => {
      //   let ti = this.timeIndexes[this.selectedTimeDomain]
      //   let start = Math.floor(selection[this.selectedTimeDomain][0])
      //   let end = Math.ceil(selection[this.selectedTimeDomain][1])
      //   if (end - start > 1) {
      //     this.selectedTimeInterval = [ti[start], ti[end]]
      //     this.updateCommunication()
      //   }
      // }
      // this.updateTimeSeries(callback)
      // this.updateCommunication()
    }
  }
}
