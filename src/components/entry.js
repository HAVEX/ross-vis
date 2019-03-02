import tpl from '../html/entry.html'
import p5 from 'p5'
import p4 from 'p4'

import StreamBoard from './StreamBoard'
import HocBoard from './HocBoard'

export default {
  name: 'entry',
  template: tpl,
  components: {
    StreamBoard,
    HocBoard
  },
  data: () => ({
    results: [],
    stream: [],
    appName: 'ROSS-Vis',
    dialog: true,
    socketError: false,
    server: 'localhost:8888',
    modes: ['Post Hoc', 'In Situ'],
    selectedMode: 'In Situ',
    timeDomains: ['LastGvt', 'RealTs', 'VirtualTime'],
    selectedTimeDomain: 'LastGvt',
    granularity: ['PE', 'KP', 'LP'],
    GranID: ['Peid', 'Kpid', 'Lpid'],
    selectedGranID: 'KpGid',
    selectedGran: 'Kp',
    timeIndexes: null,
    isAggregated: true,
    left: false,
    metrics: [],
    checkboxs: [],
    count: 0,
    analysis: ['Case_study-1', 'Case_study-2'],
    selectedAnalysis: 'Case_study-1'
  }),

  mounted: function () {
    //this.selectedMetrics = this.defaultMetrics.slice()
  },

  methods: {
    init() {
      this.fetchTsData()
    },

    initView() {
      if (this.selectedMode == 'Post Hoc') {
        this.$refs.HocBoard.init(this.tsData)
      }
      else {
        this.$refs.StreamBoard.init(this.data)
      }
    },

    updateView() {
      console.log('[Update view]')
      this.$refs.StreamBoard.update(this.data)
    },

    updateGran() {
      this.clear()
      this.fetchTsData()
    },

    updateTimeDomain() {
      this.$refs.visualize()
    },

    updateAnalysis() {
      this.clear()
    },

    updateMode() {

    },

    clear() {
      this.$refs.StreamBoard.clear()
    },

    receiveData() {

    },

    fetchTsData() {
      let method = this.selectedMode == 'Post Hoc' ? 'get' : 'stream'
      let socket = new WebSocket('ws://' + this.server + '/websocket')
      socket.onopen = () => {
        this.dialog = !this.dialog
        this.socketError = false
        socket.send(JSON.stringify({
          data: this.selectedGran + 'Data',
          granularity: this.selectedGranID,
          metric: ['RbSec', 'NeventProcessed'],
          timeDomain: this.selectedTimeDomain,
          method: method
        }))
        this.initView()
      }

      socket.onerror = (error) => {
        this.socketError = true
      }

      socket.onmessage = (event) => {
        this.count += 1
        let data = JSON.parse(event.data)
        let d = data
        console.log("Incoming data stream", d)
        this.data = data
        /* if (data.schema.hasOwnProperty('CommData')) {
          data.schema.CommData = 'int'
        } */
        //this.metrics = Object.keys(data.schema) 
          /* let cache = p4.cstore({})
          cache.import(data)
          cache.index('RealTs')
          cache.index('LastGvt')
          let tsData = cache.data()
          this.timeIndexes = tsData.uniqueValues
          this.tsData = tsData */
        if (this.count <= 100) {
          this.updateView()
        }
        else {
          socket.close()
        }
      }
    },
  }
}
