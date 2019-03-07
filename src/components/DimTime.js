import WebSocket from './WebSocket'
import TimeSeries from './TimeSeries'
import Dimensionality from './Dimensionality'
import tpl from '../html/DimTime.html'

export default {
  name: 'DimTime',
  template: tpl,
  components: {
    WebSocket,
    Dimensionality,
    TimeSeries
  },
  data: () => ({
    appName: 'ROSS-Vis',
    timeDomains: ['LastGvt','RealTs','VirtualTime'],
    granularity: ['PE','KP','LP'],
    measures: ['avg', 'sum', 'max', 'min'],
    timeIndexes: null,
    selectedTimeDomain: 'LastGvt',
    selectedTimeInterval: null,
    granularity: 'PE',
    selectedMeasure: 'sum',
    isAggregated: true,
    left: false,
    metrics: [],
    selectedMetrics: []
  }),
  methods: {
    connect() {
      this.$refs.WebSocket.connect().then(dataObj => {
        this.$refs.Dimensionality.server = this.$refs.WebSocket.server
        this.data = dataObj.data
        this.metrics = Object.keys(dataObj.schema).filter(k => this.timeDomains.indexOf(k) === -1 && !k.match(/id$/i))
        
        this.$refs.Dimensionality.oncomplete = (result) => {
          this.$refs.TimeSeries.granularity = result.granularity
          this.$refs.TimeSeries.clusters = result.clustering
          this.$refs.TimeSeries.colorEncoding = result.clustering[0]
          this.$refs.TimeSeries.enableInteraction = false
          if(this.$refs.TimeSeries.vis !== null) {
            this.$refs.TimeSeries.destroy()
          }
          this.$refs.TimeSeries.init(this.joinData(dataObj, result))
          this.$refs.TimeSeries.visualize()
        }
        this.$refs.Dimensionality.init()
      })
    },

    joinData (dataObj, result) {
      let sid = result.granularity === 'PE' ? 'Peid' : 'KpGid'
      let clusters = {}
      result.clustering.forEach(clm => {
        clusters[clm] = result.data.sort((a,b) => a[sid] - b[sid]).map(d => d[clm])
        dataObj.schema[clm] = 'int'
      })

      dataObj.data.forEach(d => {
        result.clustering.forEach(clm => {
          d[clm] = clusters[clm][d[sid]]
        })
      })

      return dataObj
    },

    reset() {
      this.selectMetrics = ['NeventProcessed', 'RbTotal']
      this.selectedTimeInterval = null
      this.visualize()      
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
