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
    isTsDataLoaded: false,
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
          this.$refs.TimeDimCorrPanel1.init()
          this.$refs.TimeDimCorrPanel2.init()
        });
      }
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
  }
}
