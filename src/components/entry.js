import tpl from '../html/entry.html'

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
    timeDomains: ['LastGvt', 'RealTs', 'VirtualTs'],
    selectedTimeDomain: 'LastGvt',
    granularity: ['Pe', 'Kp', 'Lp'],
    selectedGranularity: 'Kp',
    GranID: ['Peid', 'KpGid', 'Lpid'],
    plotMetric1: 'RbSec',
    plotMetric2: 'NeventProcessed',
    similarity: ['euclidean'],
    selectedSimilarity: 'euclidean',
    clustering: ['evostream', 'dbstream'],
    selectedClustering: 'evostream',
    dimred: ['prog_inc_PCA', 'inc_PCA', 'PCA', 'tsne'],
    selectedDimred: 'prog_inc_PCA',
    cpd: ['aff', 'pca'],
    selectedcpd: 'pca',
    measures: ['avg', 'sum', 'max', 'min'],
    selectedMeasure: 'sum',
    timeIndexes: null,
    isAggregated: true,
    left: false,
    metrics: [],
    checkboxs: [],
    count: 0,
    analysis: ['Case_study-1', 'Case_study-2'],
    selectedAnalysis: 'Case_study-1',
    calcMetrics: ['NetworkRecv', 'NetworkSend', 'NeventRb', 'NeventProcessed', 'RbSec', 'VirtualTimeDiff'],
    socket: null,
    play: 1,
  }),

  mounted: function () {
    //this.selectedMetrics = this.defaultMetrics.slice()
  },

  methods: {
    init() {
      //set initial variables.
      this.dialog = !this.dialog
      this.socket = new WebSocket('ws://' + this.server + '/websocket')
      this.method = this.selectedMode == 'Post Hoc' ? 'get' : 'stream'
      this.selectedGranID = this.selectedGranularity + 'id'
      if (this.selectedGranularity == 'Kp') {
        this.selectedGranID = 'KpGid'
      }
      this.fetchTsData()
    },

    updatePlay() {
      this.play = 1
      this.fetchTsData()
    },

    updatePause() {
      this.play = 0
    },

    updateStop() {
     this.play = -1
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
      console.log("Change in granularity detected : [", this.selectedGranularity, "]")
      this.selectedGranID = this.selectedGranularity + 'id'
      if (this.selectedGranularity == 'Kp') {
        this.selectedGranID = 'KpGid'
      }
      this.count = 0
      this.fetchTsData()
    },

    updateTimeDomain() {
      this.clear()
      console.log("Change in domain detected : [", this.selectedTimeDomain, "]")
      this.count = 0
      this.fetchTsData()
    },

    updatePlotMetric1() {
      this.clear()
      console.log("Change in metric detected : [", this.plotMetric1, "]")
      this.count = 0
      this.fetchTsData()
    },

    updatePlotMetric2() {
      this.clear()
      console.log("Change in metric detected : [", this.plotMetric1, "]")
      this.count = 0
      this.fetchTsData()
    },

    updateAnalysis() {
      this.clear()
    },

    updateMode() {

    },

    clear() {
      this.$refs.StreamBoard.clear()
    },

    fetchTsData() {
     if(this.count == 0){
      this.socket.onopen = () => {
        this.socketError = false
        console.log('Requesting ', this.count, ' stream.')
        this.socket.send(JSON.stringify({
          data: this.selectedGranularity + 'Data',
          granularity: this.selectedGranID,
          metric: this.calcMetrics,
          timeDomain: this.selectedTimeDomain,
          method: this.method,
          stream_count: this.count,
          play: this.play
        }))
      }
     } 

     else{
      this.socket.send(JSON.stringify({
        data: this.selectedGranularity + 'Data',
        granularity: this.selectedGranID,
        metric: this.calcMetrics,
        timeDomain: this.selectedTimeDomain,
        method: this.method,
        stream_count: this.count,
        play: this.play
      }))
     }

      this.socket.onerror = (error) => {
        this.socketError = true
      }

      this.socket.onmessage = (event) => {
        let data = JSON.parse(event.data)
        let d = data
        this.metrics = Object.keys(d['RbSec'].schema)
        console.log("Incoming data: ", this.count, d)
        this.data = data
        if (this.count == 1) {
          this.initView()
        }
        if (this.count <= 100) {
          this.updateView()
        }
        else {
          socket.close()
        }
        this.count += 1

        if(this.play == 1){
          this.fetchTsData()
        }
      }

    },
  }
}
