import p4 from 'p4'
import template from '../html/TimeDimCorrPanel.html'

import Dimensionality from './Dimensionality'
import TimeSeries from './TimeSeries'
import ControlPanel from './ControlPanel'
import Causality from './Causality'

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
    metrics: null
  }),
  methods: {
    init() {
      this.$refs.TimeSeries.init()
      this.$refs.Dimensionality.init()
      this.$refs.Causality.init()
      this.$refs.ControlPanel.init()
    },

    tick() {
      this.data = this.plotData
      this.ts = this.data['ts']
      console.log(this.ts)
      let tsCache = p4.cstore({})
      tsCache.import(this.ts)
      console.log(tsCache)
      this.cpd = this.data['cpd']
      this.pca = this.data['pca']
      this.clustering = this.data['clustering']
      this.causality = this.data['causality']
      this.reset()
    },

    reset(){
      this.selectedTimeInterval = null
      this.visualize()
    },

    updateDimensionality() {
      this.$refs.Dimensionality.selectedMetrics = this.plotMetric
      this.$refs.Dimensionality.visualize()
    },

    updateTimeSeries(callback) {
      this.$refs.TimeSeries.selectedMeasure = this.$parent.selectedMeasure
      this.$refs.TimeSeries.isAggregated = this.$parent.isAggregated
      this.$refs.TimeSeries.selectedMetrics = this.plotMetric
      this.$refs.TimeSeries.selectedTimeDomain = this.$parent.selectedTimeDomain
      this.$refs.TimeSeries.visualize(this.$refs.TimeSeries.selectedMetrics, callback) 
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