import p4 from 'p4'
import template from '../html/TimeDimCorrPanel.html'

import Dimensionality from './Dimensionality'
import TimeSeries from './TimeSeries'
import ControlPanel from './ControlPanel'
import Causality from './Causality'
import { throws } from 'assert';

export default {
  name: 'TimeDimCorrPanel',
  props: ['plotMetric', 'plotData'],
  template: template,
  components: {
    ControlPanel,
    Dimensionality,
    TimeSeries,
    Causality
  },
  data: () => ({
    data: null,
    ts: null,
    cpd: null,
    pca: null,
    clustering: null,
    causality: null,
    metrics: null,
    stream_count: null,
    initVis: false,
  }),
  methods: {
    init() {
      this.$refs.TimeSeries.init()
      this.$refs.Dimensionality.init()
      //this.$refs.Causality.init()
      //this.$refs.ControlPanel.init()
    },

    tick() {
      let data = this.plotData
      let ts = {} 
      if (data != null || data != undefined){
        this.stream_count = this.stream_count + 1
        ts.data = data['data']
        ts.schema = data['schema']
        let tsCache = p4.cstore({})
        tsCache.import(ts)
        tsCache.index('LastGvt')
        let result = {}
        result.data = data['result']
        result.schema ={
          KpGid: "int",
          PC0: "float",
          PC1: "float",
          cpd: "int",
          from_IR_1: "int",
          from_VD_1: "int",
          from_causality: "int",
          from_metrics: "int",
          macro: "int",
          macro_clusters: "int",
          micro: "int",
          micro_clusters: "int",
          normal: "int",
          normal_clusters: "int",
          to_IR_1: "int",
          to_VD_1: "int",
          to_causality: "int",
          to_metrics: "int",
        }
        this.ts =  tsCache.data()
        this.cpd = result.data[0]['cpd']
        let resultCache = p4.cstore({})
        resultCache.import(result)
        this.result = resultCache.data()
        this.reset()
      }
    },

    reset(){
      console.log(this.initVis)
      if(!this.initVis){
        console.log('initializing vis')
        this.$refs.TimeSeries.initVis(this.ts)
        this.$refs.Dimensionality.initVis(this.result)
        this.initVis = true
      }
      else{
        this.$refs.TimeSeries.clearVis(this.ts)
        this.$refs.Dimensionality.clearVis(this.result)
        this.selectedTimeInterval = null
        this.visualize()
      }
    },

    updateDimensionality() {
      this.$refs.Dimensionality.selectedMetrics = this.plotMetric
      this.$refs.Dimensionality.visualize(this.result)
    },

    updateTimeSeries(callback) {
      this.$refs.TimeSeries.selectedMeasure = this.$parent.selectedMeasure
      this.$refs.TimeSeries.isAggregated = this.$parent.isAggregated
      this.$refs.TimeSeries.selectedMetrics = this.plotMetric
      this.$refs.TimeSeries.selectedTimeDomain = this.$parent.selectedTimeDomain
      this.$refs.TimeSeries.visualize(this.cpd, [this.plotMetric], callback) 
      this.updateDimensionality()
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
    }
  }
}