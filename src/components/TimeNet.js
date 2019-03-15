import WebSocket from './WebSocket'
import Communication from './Communication'
import TimeSeries from './TimeSeries'
import tpl from '../html/TimeNet.html'

export default {
  name: 'TimeNet',
  template: tpl,
  components: {
    WebSocket,
    TimeSeries,
    Communication
  },
  data: () => ({
    appName: 'ROSS-Vis',
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
    selectedMetrics: ['NeventProcessed', 'RbTotal']
  }),
  methods: {
    connect() {
      this.$refs.WebSocket.connect().then(dataObj => {
        // this.timeIndexes = data.uniqueValues
        let timeDomains = this.$refs.TimeSeries.timeDomains
        this.$refs.TimeSeries.init(dataObj)
        this.data = dataObj.data
        this.metrics = Object.keys(dataObj.schema).filter(k => timeDomains.indexOf(k) === -1 && !k.match(/id$/i))
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

    updateTimeSeries (callback) {
      this.$refs.TimeSeries.selectedMetrics = this.selectedMetrics
      this.$refs.TimeSeries.visualize(callback)
      this.selectedMetrics = this.$refs.TimeSeries.selectedMetrics
    },

    updateTimeDomain (timeDomain) {
      this.selectedTimeDomain = timeDomain
      this.updateCommunication()
    },

    visualize() {
      let callback = (selection) => {
        this.selectedTimeInterval = selection
        this.updateCommunication()
      }
      this.updateTimeSeries(callback)
      this.updateCommunication()
    }
  }
}
