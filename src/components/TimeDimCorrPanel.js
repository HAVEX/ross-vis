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
  }),
  methods: {
    init() {
      this.$refs.TimeSeries.init()
      //this.$refs.Dimensionality.init()
      //this.$refs.Causality.init()
      //this.$refs.ControlPanel.init()
      this.stream_count = 0
      console.log(this.stream_count)
    },

    tick() {
      let data = this.plotData
      let ts = {}
      console.log(this.stream_count)
      if (data != null || data != undefined){
        this.stream_count = this.stream_count + 1
        console.log(data)
        ts.data = data['data']
        ts.schema = data['schema']
        let tsCache = p4.cstore({})
        tsCache.import(ts)
        this.result = data['result']
        console.log(data['result'])
        this.ts =  tsCache.data()
        this.cpd = this.result['cpd']
        this.pc0 = this.result['PC0']
        this.pc1 = this.result['PC1']      
        this.reset()
      }

    },

    reset(){
      if(this.stream_count == 1){
        console.log('initializing vis')
        this.$refs.TimeSeries.initVis(this.ts)
      }
      else{
        this.$refs.TimeSeries.clearVis()
        this.selectedTimeInterval = null
        this.visualize()
      }
    },

    updateDimensionality() {
      this.$refs.Dimensionality.selectedMetrics = this.plotMetric
     // this.$refs.Dimensionality.visualize()
    },

    updateTimeSeries(callback) {
      this.$refs.TimeSeries.selectedMeasure = this.$parent.selectedMeasure
      this.$refs.TimeSeries.isAggregated = this.$parent.isAggregated
      this.$refs.TimeSeries.selectedMetrics = this.plotMetric
      this.$refs.TimeSeries.selectedTimeDomain = this.$parent.selectedTimeDomain
      this.$refs.TimeSeries.visualize(this.ts, [this.plotMetric], callback) 
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