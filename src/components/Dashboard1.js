import tpl from '../html/Dashboard1.html'
import '../css/dashboard1.css'
import Vue from 'vue'

import Communication from './Communication'
import Dimensionality from './Dimensionality'
import TimeSeries from './TimeSeries'
import Overview from './Overview'

export default {
  name: 'Dashboard1',
  template: tpl,
  components: {
    Dimensionality,
    TimeSeries,
    Communication,
    Overview
  },
  data: () => ({
    dialog: true,
    height: '200',
    timeDomains: ['LastGvt', 'RealTs', 'VirtualTime'],
    granularity: ['PE', 'KP', 'LP'],
    measures: ['avg', 'sum', 'max', 'min'],
    timeIndexes: null,
    selectedTimeDomain: 'LastGvt',
    selectedTimeInterval: null,
    selectedGran: 'PE',
    selectedMeasure: 'sum',
    isAggregated: true,
    left: false,
    metrics: [],
    checkboxs: [],
    isTsDataLoaded: false,
    defaultMetrics: [
      'NeventProcessed',
      //'RbTotal',
      //'VirtualTimeDiff',
      //'NetworkRecv', 'NetworkSend'
    ],
    selectedMetrics: [],
  }),
  mounted: function () {
    this.selectedMetrics = this.defaultMetrics.slice()
  },
  methods: {
    init(tsData) {
      this.height = this.calculateHeight()
      this.isTsDataLoaded = true
      this.tsData = tsData;
      if (this.isTsDataLoaded) {
        Vue.nextTick(() => {
          console.log(this.$refs)
          console.log(this.tsData)
          this.$refs.TimeSeries.init()
          this.$refs.Dimensionality.init()
          this.reset()
        });  
      }
    },
    calculateHeight (){
     return window.innerHeight/3
    },
    reset() {
      this.selectedMetrics = this.defaultMetrics.slice()
      this.selectedTimeInterval = null
      this.visualize()
    },
    updateCommunication() {
      this.$refs.Communication.selectedTimeDomain = this.selectedTimeDomain
      this.$refs.Communication.selectedTimeInterval = this.selectedTimeInterval
      this.$refs.Communication.selectedMetrics = this.selectedMetrics
      this.$refs.Communication.selectedMeasure = this.selectedMeasure
      this.$refs.Communication.visualize(this.data)
    },

    updateDimensionality() {
      this.$refs.Dimensionality.visualize()
    },

    updateTimeSeries(callback) {
      this.$refs.TimeSeries.selectedMeasure = this.selectedMeasure
      this.$refs.TimeSeries.isAggregated = this.isAggregated
      this.$refs.TimeSeries.selectedTimeDomain = this.selectedTimeDomain
      this.$refs.TimeSeries.visualize(this.selectedMetrics, callback)
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
