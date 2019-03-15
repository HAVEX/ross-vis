import WebSocket from '../components/WebSocket'
import TimeSeries from '../components/TimeSeries'

const tpl = `
<v-app>
  <WebSocket ref="WebSocket" @connect="connect" />
  <v-content class="pa-2">
    <v-container fluid fill-height class="pa-1">
      <TimeSeries ref="TimeSeries"></TimeSeries>
    </v-container>
  </v-content>
</v-app>
`
export default {
  name: 'Timelines',
  template: tpl,
  components: {
    WebSocket,
    TimeSeries
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
        this.$refs.TimeSeries.colorEncoding = 'Peid'
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

    visualize (callback) {
      this.$refs.TimeSeries.selectedMetrics = this.selectedMetrics
      this.$refs.TimeSeries.visualize(callback)
      this.selectedMetrics = this.$refs.TimeSeries.selectedMetrics
    },

    updateTimeDomain (timeDomain) {
      this.selectedTimeDomain = timeDomain
      this.visualize()
    }
  }
}
