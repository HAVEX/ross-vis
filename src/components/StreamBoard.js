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
  data: () => ({
    isTsDataLoaded: false,
    metrics: null,
    timeDomain: ['LastGvt', 'VirtualTime', 'RealTs'],
    selectedTimeDomain: 'LastGvt',
    plotMetric1: 'RbSec',
    plotMetric2: 'NeventProcessed',
    measures: ['avg', 'sum', 'max', 'min'],
    selectedMeasure: 'sum',
    isAggregated: false,
    plotData1: null,
    plotData2: null
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
          console.log(data)
          if (Object.keys(data).length === 0 && data.constructor === Object) {
            this.$refs.TimeDimCorrPanel1.init()
            this.$refs.TimeDimCorrPanel2.init()
            this.reset()
          }
        });
      }
    },

    reset() {
      this.selectedTimeInterval = null
     // this.visualize()
    },

    updateCommunication() {
      this.$refs.Communication.selectedTimeDomain = this.$refs.ControlPanel.selectedTimeDomain
      this.$refs.Communication.selectedTimeInterval = this.$refs.ControlPanel.selectedTimeInterval
      this.$refs.Communication.selectedMetrics = this.$refs.ControlPanel.selectedMetrics
      this.$refs.Communication.selectedMeasure = this.$refs.ControlPanel.selectedMeasure
      this.$refs.Communication.visualize(this.data)
    },

    update(data) {  
      console.log(data)
      this.plotData1 = data[this.plotMetric1]
      this.plotData2 = data[this.plotMetric2]
      this.$refs.TimeDimCorrPanel1.tick()
      this.$refs.TimeDimCorrPanel2.tick()
    },

    visualize() {
      let callback = (selection) => {
        let ti = this.timeIndexes[this.selectedTimeDomain]
        let start = Math.floor(selection[this.selectedTimeDomain][0])
        let end = Math.ceil(selection[this.selectedTimeDomain][1])
        if (end - start >= 1) {
          this.selectedTimeInterval = [ti[start], ti[end]]
        }
      }

      this.updateTimeSeries(callback)
      this.updateDimensionality()
    }
  }
}
