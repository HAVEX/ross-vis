import tpl from '../html/entry.html'
import StreamBoard from './StreamBoard'
import HocBoard from './HocBoard'
import Vue from 'vue'

export default {
  name: 'entry',
  template: tpl,
  components: {
    StreamBoard,
    HocBoard
  },
  data: () => ({
    socket: null,
    streamData: null,
    commData: null,
    hocData: null,
    appName: 'ROSS-Vis',
    dialog: true,
    socketError: false,
    server: 'localhost:8899',
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
    play: 1,
    calcMetrics: ['NetworkRecv', 'NetworkSend', 'NeventRb', 'NeventProcessed', 'RbSec'],
    clusterMetrics: ['RbSec', 'NeventProcessed'],
    selectedClusterMetric: 'RbSec',
    commThreshold: 0,
    thresholdValue: 0,
    showIntraComm: false,
   }),

  watch: {
    plotMetric2: function() {
      return this.plotMetric1
    },
    plotMetric1: function() {
      return this.plotMetric2
    }
  },

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
      this.update = 1
      this.fetchTsData()
    },

    updatePause() {
      this.play = 0
    },

    updatePrevStep() {
      this.play = 1
      this.update = -1
      console.log("Removing ", this.count)
      this.fetchTsData()
      
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
      this.updateView()
    },

    updatePlotMetric2() {
      console.log("Change in metric detected : [", this.plotMetric2, "]")
      this.clear()
      Vue.nextTick(() => {
        this.$refs.StreamBoard.update()
      })     
    },

    updateClusterMetric() {

    },

    updateLink() {

    },

    updateAnalysis() {
      this.clear()
    },

    updateMode() {
      if(this.selectedMode == 'Post Hoc'){
        console.log("Changing to Post Hoc mode")
        this.method = 'stream'
        this.play = 0
      }
      else{
        console.log("Changing to In situ mode")
        this.method = 'get-count'
      }
      console.log(this.selectedMode)
      console.log("Stopping the streamBoard at ", this.count)
      this.fetchAllData(this.count)
    },

    clear() {
      this.$refs.StreamBoard.clear()
    },

    getJSONrequest(count){
      if(!count){
        count = this.count
      }
      let obj = {
        data: this.selectedGranularity + 'Data',
        granularity: this.selectedGranID,
        metric: this.calcMetrics,
        timeDomain: this.selectedTimeDomain,
        method: this.method,
        stream_count: this.count,
        play: this.play,
        update: this.update,
      }
      console.log("Request", obj)
      return JSON.stringify(obj)
    },

    fetchAllData(count) {
      console.log("Fetching all data till", count)
      let json = this.getJSONrequest(count)
      this.socket.send(json)

      this.socket.onmessage = (event) => {
        let data = JSON.parse(event.data)
        this.metrics = Object.keys(data.schema)
        if (data.schema.hasOwnProperty('CommData')) {
          data.schema.CommData = 'int'
        }
        let cache = p4.cstore({})
        cache.import(data)
        cache.index('LastGvt')
        this.hocData = cache.data()
        this.timeIndexes = this.hocData.uniqueValues
        this.$refs.HocBoard.init()
      }
    },

    fetchTsData() {
     if(this.count == 0){
      this.socket.onopen = () => {
        this.socketError = false
        console.log('Requesting ', this.count, ' stream.')
        this.socket.send(this.getJSONrequest())
      }
     } 

     else{
      this.socket.send(this.getJSONrequest())
     }

      this.socket.onerror = (error) => {
        this.socketError = true
      }

      this.socket.onmessage = (event) => {
        let data = JSON.parse(event.data)
        let d = data
        this.metrics = Object.keys(d['RbSec'].schema)
        this.commData = d.comm
        console.log("Incoming data: ", this.count, d)
        this.streamData = data
        if (this.count == 1) {
          this.$refs.StreamBoard.init()
        }
        else if(this.count > 2) {
          this.$refs.StreamBoard.update()
        }
        if(this.update == -1){
          this.update = 1
          this.count -= 1
          this.play = 0
        }
        else{
          this.count += 1
        }
        
        if(this.play == 1){
          this.fetchTsData()
        }
      }
    },
  }
}
