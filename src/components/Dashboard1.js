import tpl from '../html/Dashboard1.html'
import '../css/dashboard1.css'
import Vue from 'vue'

import TimeDimCorrPanel from './TimeDimCorrPanel'
import Communication from './Communication'
import Overview from './Overview'

export default {
  name: 'Dashboard1',
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
    plotMetric1: ['RbTotal'],
    plotMetric2: ['NeventProcessed'],
    granularity: ['PE', 'KP', 'LP'],
    selectedGran: 'PE',
    measures: ['avg', 'sum', 'max', 'min'],
    selectedMeasure: 'sum',
    isAggregated: false,
  }),

  methods: {
    init(tsData) {
      this.isTsDataLoaded = true
      this.tsData = tsData;
      if (this.isTsDataLoaded) {
        Vue.nextTick(() => {
          this.$refs.TimeDimCorrPanel1.init()
          this.$refs.TimeDimCorrPanel2.init()
          this.reset()
        });  
      }
    },

    reset() {
      //this.selectedMetrics = this.defaultMetrics.slice()
      this.selectedTimeInterval = null
      //this.visualize()
    },

    updateCommunication() {
      this.$refs.Communication.selectedTimeDomain = this.$refs.ControlPanel.selectedTimeDomain
      this.$refs.Communication.selectedTimeInterval = this.$refs.ControlPanel.selectedTimeInterval
      this.$refs.Communication.selectedMetrics = this.$refs.ControlPanel.selectedMetrics
      this.$refs.Communication.selectedMeasure = this.$refs.ControlPanel.selectedMeasure
      this.$refs.Communication.visualize(this.data)
    },

  }
}
