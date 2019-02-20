import p4 from 'p4'
import template from '../html/TimeDimCorrPanel.html'

import Dimensionality from './Dimensionality'
import TimeSeries from './TimeSeries'
import ControlPanel from './ControlPanel'
import Correlation from './Correlation'

export default {
  name: 'TimeDimCorrPanel',
  props: ['plotMetric', 'tsData'],
  template: template,
  components: {
    ControlPanel,
    Dimensionality,
    TimeSeries,
    Correlation
  },
  data: () => ({
    data: null,
  }),
  methods: {
    init() {
      this.$refs.TimeSeries.init(this.plotMetric)
      this.$refs.Dimensionality.init(this.plotMetric)
      this.$refs.Correlation.init(this.plotMetric)
      this.$refs.ControlPanel.init()
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