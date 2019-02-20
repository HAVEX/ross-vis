import tpl from '../html/Dashboard1.html'
import '../css/dashboard1.css'
import Vue from 'vue'

import Communication from './Communication'
import Dimensionality from './Dimensionality'
import TimeSeries from './TimeSeries'
import Overview from './Overview'
import ControlPanel from './ControlPanel'

export default {
  name: 'Dashboard1',
  template: tpl,
  components: {
    ControlPanel,
    Dimensionality,
    TimeSeries,
    Communication,
    Overview
  },

  data: () => ({
    dialog: true,
    height: '200',
    timeIndexes: null,
    left: false,
    checkboxs: [],
    isTsDataLoaded: false,
    isSecondPlotNeeded: true,
  }),

  mounted: function () {
    //this.selectedMetrics = this.defaultMetrics.slice()
  },

  methods: {
    init(tsData) {
      //this.height = this.calculateHeight()
      this.isTsDataLoaded = true
      this.tsData = tsData;
      if (this.isTsDataLoaded) {
        Vue.nextTick(() => {
          this.$refs.TimeSeries.init()
          this.$refs.Dimensionality.init()
          this.$refs.ControlPanel.init();
          this.reset()
        });  
      }
    },

   /*  calculateHeight (){
     return window.innerHeight/3
    },
 */
    reset() {
      //this.selectedMetrics = this.defaultMetrics.slice()
      this.selectedTimeInterval = null
      this.visualize()
    },

    updateCommunication() {
      this.$refs.Communication.selectedTimeDomain = this.$refs.ControlPanel.selectedTimeDomain
      this.$refs.Communication.selectedTimeInterval = this.$refs.ControlPanel.selectedTimeInterval
      this.$refs.Communication.selectedMetrics = this.$refs.ControlPanel.selectedMetrics
      this.$refs.Communication.selectedMeasure = this.$refs.ControlPanel.selectedMeasure
      this.$refs.Communication.visualize(this.data)
    },

    updateDimensionality() {
      this.$refs.Dimensionality.visualize()
    },

    updateTimeSeries(callback) {
      this.$refs.TimeSeries.selectedMeasure = this.$refs.ControlPanel.selectedMeasure
      this.$refs.TimeSeries.isAggregated = this.$refs.ControlPanel.isAggregated
      this.$refs.TimeSeries.selectedMetrics = this.$refs.ControlPanel.plot1Metrics
      this.$refs.TimeSeries.selectedTimeDomain = this.$refs.ControlPanel.selectedTimeDomain
      this.$refs.TimeSeries.visualize(this.$refs.TimeSeries.selectedMetrics, callback)
      
    },

    visualize() {
      let callback = (selection) => {
        let ti = this.timeIndexes[this.selectedTimeDomain]
        let start = Math.floor(selection[this.selectedTimeDomain][0])
        let end = Math.ceil(selection[this.selectedTimeDomain][1])
        if (end - start >= 1) {
          this.selectedTimeInterval = [ti[start], ti[end]]
          //this.updateCommunication()
        }
      }

      this.updateTimeSeries(callback)
      //this.updateCommunication()
      this.updateDimensionality()
    }
  }
}
