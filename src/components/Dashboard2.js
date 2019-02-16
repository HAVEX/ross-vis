import tpl from '../html/Dashboard2.html'
//import '../css/app.css'
import p5 from 'p5'
import p4 from 'p4'

import Dimensionality from './Dimensionality'
import TimeSeries from './TimeSeries'

export default {
  name: 'Dashboard2',
  template: tpl,
  components: {
    Dimensionality,
    TimeSeries,
  },
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
      //'VirtualTimeDiff',
      // 'NetworkRecv', 'NetworkSend'
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
    start() {

    },
    init() {
      this.$refs.TimeSeries.init(tsData)
      this.reset()
    }

  },

  loadDashboard1() {

  },

  loadDashboard2() {

  },

  reset() {
    this.selectedMetrics = this.defaultMetrics.slice()
    this.selectedTimeInterval = null
    this.visualize()

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
      }
    }

    this.updateTimeSeries(callback)
    this.updateDimensionality()
  }
}