import tpl from '../html/HocBoard.html'

import Dimensionality from './Dimensionality'
import TimeSeries from './TimeSeries'
import Communication from './Communication'

export default {
  name: 'HocBoard',
  template: tpl,
  components: {
    Dimensionality,
    TimeSeries,
    Communication
  },
  props: ['plotMetric1', 'plotMetric2'],
  data: () => ({
    appName: 'ROSS-Vis',
    dialog: true,
    socketError: false, 
    server: 'localhost:8888',
    modes: ['Post Hoc', 'In Situ'],
    defaultMode: 'Post Hoc',
    timeDomains: ['LastGvt'],
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
    defaultMetrics: [
      'NeventProcessed',
    ],
    selectedMetrics: [],

  }),
  props: {
    tsData: String
  },
  mounted: function () {
    this.selectedMetrics = this.defaultMetrics.slice()

  },
  methods: {
    init(tsData) {
      this.$refs.TimeSeries.init()
      this.$refs.Dimensionality.init()
      this.$refs.TimeSeries.initVis(tsData)
      this.$refs.Dimensionality.initVis(tsData)
      this.reset()
    },

    reset() {
      //this.selectedMetrics = [this.plotMetric1, this.plotMetric2]
      this.selectedMetrics = ['RbSec', 'NeventProcessed']
      console.log(this.selectedMetrics)
      this.selectedTimeInterval = null
      this.visualize()

    },

    updateDimensionality() {
      this.$refs.Dimensionality.colorBy = 'steelblue'
      this.$refs.Dimensionality.visualize()
    },

    updateTimeSeries(callback) {
      this.$refs.TimeSeries.selectedMeasure = this.selectedMeasure
      this.$refs.TimeSeries.isAggregated = this.isAggregated
      this.$refs.TimeSeries.selectedTimeDomain = this.selectedTimeDomain
      this.$refs.TimeSeries.colorBy = 'KpGid'
      //this.$refs.TimeSeries.visualize(this.selectedMetrics, callback)
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
  },
}