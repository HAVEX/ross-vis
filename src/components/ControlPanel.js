import tpl from '../html/ControlPanel.html'
import Vue from 'vue'

export default {
  name: 'ControlPanel',
  template: tpl,
  props: ['tsData'],
  data: () => ({
    metrics: [],
    plot1Metrics: ['RbTotal'],
    plot2Metrics: ['NeventProcessed'],
    measures: ['avg', 'sum', 'max', 'min'],
    selectedMeasure: 'sum',
    timeDomains: ['LastGvt', 'RealTs', 'VirtualTime'],
    selectedTimeDomain: 'LastGvt',
    granularity: ['PE', 'KP', 'LP'],
    selectedGran : 'PE',
    isAggregated: false,
    isSecondPlotNeeded: false,
}), 
  mounted: function () {
  },
  methods: {
    init() {
        this.metrics = this.tsData.keys
    },

    reset() {
    },

    changeSecondPlotNeeded (){
        this.isSecondPlotNeeded = ! this.isSecondPlotNeeded
    },

    updateCommunication() {
        
    },

    updateDimensionality() {
      
    },

    updateTimeSeries(callback) {
      
    },

    visualize() {
        this.$parent.visualize()                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
    }

  } 
}
