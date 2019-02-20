import tpl from '../html/ControlPanel.html'
import Vue from 'vue'

export default {
  name: 'ControlPanel',
  template: tpl,
  props: ['tsData'],
  data: () => ({
    metrics: [],
    plotMetric: ['RbTotal'],
    similarity: ['euclidean'],
    selectedSimilarity: 'euclidean',
    clustering: ['evostream', 'dbstream'],
    selectedClustering: 'evostream',   
    dimred : ['prog_inc_PCA', 'inc_PCA', 'PCA', 'tsne'],
    selectedDimred: 'prog_inc_PCA',
    cpd: ['aff', 'pca'],
    selectedcpd: 'pca',
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
