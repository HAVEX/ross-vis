import tpl from '../html/StreamBoard.html'
import '../css/dashboard1.css'
import Vue from 'vue'

import TimeDimCorrPanel from './TimeDimCorrPanel'
import Communication from './Communication'
import Overview from './Overview'

export default {
  name: 'StreamBoard',
  template: tpl,
  components: {
    TimeDimCorrPanel,
    Communication,
    Overview
  },
  props: ['plotMetric1', 'plotMetric2', 'granularity', 'timeDomain', 'measure'],
  data: () => ({
    server: 'localhost:8888',
    isTsDataLoaded: false,
    plotData1: null,
    plotData2: null,
    timeIndexes: null, 
    timeIntervals:  [
      [204471, 238514],
      [242484, 263715],
      [280495, 363079],
      // [365019, 366747],
      // [380636, 393968]  
    ],
    processIds: [208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95],
    clusterIds: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    clusterColors: [
      [227, 119, 194],
      [188, 189, 34],
      [23, 190, 207],
      [127, 127, 127]
    ],
    clusterColors: [
      [227, 119, 194],
      [188, 189, 34],
      [23, 190, 207],
      [127, 127, 127]],
  }),

  watch: {
    plotData2: function() {
      return this.plotData1
    },
    plotData1: function() {
      return this.plotData2
    }
  },

  methods: {
    init(data) {
      this.isTsDataLoaded = true
      if (this.isTsDataLoaded) {
        Vue.nextTick(() => {
          this.$refs.TimeDimCorrPanel1.init()
          this.$refs.TimeDimCorrPanel2.init()
        });
      }
      //this.getCommData()
    },

    clear() {
      this.$refs.TimeDimCorrPanel1.clear()
      this.$refs.TimeDimCorrPanel2.clear()
    },

    update(data) {  
      this.plotData1 = data[this.plotMetric1]
      this.plotData2 = data[this.plotMetric2]
      this.$refs.TimeDimCorrPanel1.tick()
      this.$refs.TimeDimCorrPanel2.tick()
    },

    updateCommunication() {
      this.$refs.Communication.visualize({
        data: this.data,
        measure: this.measure,
        timeDomain: this.timeDomain,
        metrics: this.metrics,
        timeIntervals: this.timeIntervals,
        processIds: this.processIds,
        clusterIds: this.clusterIds,
        clusterColors: this.clusterColors
      })
    },

    updateMetrics (metrics) {
      this.metrics = metrics
      this.update()
    },

    getCommData() {
      let socket = new WebSocket('ws://' + this.server + '/websocket')
      socket.onopen = () => {
        this.dialog = !this.dialog
        this.socketError = false
        socket.send(JSON.stringify({ method: 'get', data: 'KpData' }))
      }

      socket.onerror = (error) => {
        this.socketError = true
      }

      socket.onmessage = (event) => {
        let data = JSON.parse(event.data)
        data.data.forEach(d => {
          d.RbPrim = d.RbTotal - d.RbSec
        })
        this.data = data.data
        if (data.schema.hasOwnProperty('CommData')) {
          data.schema.CommData = 'int'
        }
        this.$refs.Communication.allMetrics = Object.keys(data.schema).filter(k => k.slice(-2) !== 'id' && k.slice(-2) !== 'Id')
        let params = data.params || {}
        console.log(this.$refs.Communication.allMetrics)
        this.metrics = [this.plotMetric1, this.plotMetric2]
        if (params.timeIntervals) this.timeIntervals = params.timeIntervals
        if (params.timeMetric) this.timeDomain = params.timeMetric
        if (params.ringMetrics) {
          this.metrics = params.ringMetrics
          this.$refs.Communication.metrics = params.ringMetrics
        }
        if (params.processIds) this.processIds = params.processIds
        if (params.clusterIds) this.clusterIds = params.clusterIds
        if (params.clusterColors) this.clusterColors = params.clusterColors.map(c => 'rgb(' + c.join(',') + ')')
        this.updateCommunication()
      }
    }
  }
}
