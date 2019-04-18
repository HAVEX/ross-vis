import tpl from '../html/StreamBoard.html'
import '../css/dashboard1.css'
import Vue from 'vue'

import TimeDimCorrPanel from './TimeDimCorrPanel'
import Communication from './Communication'
import Overview from './Overview'

export default {
  name: 'StreamBoard',
  template: tpl,
  components: {
    TimeDimCorrPanel,
    Communication,
    Overview
  },
  props: [
    'plotMetric1',
    'plotMetric2',
    'granularity',
    'timeDomain',
    'measure',
    'commData',
    'clusterMetric',
    'streamData'
  ],
  data: () => ({
    server: 'localhost:8888',
    isTsDataLoaded: false,
    plotData1: null,
    plotData2: null,
    timeIndexes: null,
    timeIntervals: [],
    processIds: [],
    clusterIds: [],
    clusterColors: [
      [227, 119, 194],
      [188, 189, 34],
      [23, 190, 207],
      [127, 127, 127]
    ],
    prev_comm_time: null,
    clusterMap: {},
    newCommPanel: false,
  }),

  watch: {
    plotData2: function () {
      return this.plotData1
    },
    plotData1: function () {
      return this.plotData2
    },
    timeIntervals: function () {
      if (this.newCommPanel) {
        this.updateCommunication()
        this.newCommPanel = false
      }
    },
  },

  methods: {
    init() {
      this.isTsDataLoaded = true
      if (this.isTsDataLoaded) {
        Vue.nextTick(() => {
          this.$refs.TimeDimCorrPanel1.init()
          this.$refs.TimeDimCorrPanel2.init()
        });
      }
    },

    clear() {
      this.$refs.TimeDimCorrPanel1.clear()
      this.$refs.TimeDimCorrPanel2.clear()
    },

    update() {
        this.processStreamData()
        this.processCommData()
    },

    updateCommunication() {
      if (this.clusterIds.length != 0 && this.processIds.length != 0) {
        this.$refs.Communication.visualize({
          data: this.comm_data,
          measure: this.measure,
          timeDomain: this.timeDomain,
          metrics: this.metrics,
          timeIntervals: this.timeIntervals,
          processIds: this.processIds,
          clusterIds: this.clusterIds,
          clusterColors: this.clusterColors
        })
      }
    },

    updateMetrics(metrics) {
      this.metrics = metrics
      this.update()
    },

    // Because most results are being dumped to [0] th element of array.
    getClusterMapping(data, clusterMetric) {
      let cluster_mapping = {}
      let clusterType = 'normal'
      let zero_index_data = data[clusterMetric]['result'][0]
      for (let i = 0; i < zero_index_data[clusterType].length; i += 1) {
        let _data = zero_index_data[clusterType][i]
        let _cluster = zero_index_data[clusterType + '_clusters'][i]
        for (let time = 0; time < _data.length; time += 1) {
          let current_time = zero_index_data[clusterType + '_times'][time]
          let id = zero_index_data['ids'][i]
          cluster_mapping[id] = _cluster
        }
      }
      return cluster_mapping
    },

    processStreamData() {
      let stream_obj = this.streamData
      if (stream_obj != null && Object.keys(stream_obj).length !== 1) {
        console.log(this.plotMetric1)
        this.plotData1 = stream_obj[this.plotMetric1]
        this.plotData2 = stream_obj[this.plotMetric2]
        console.log('processing', this.plotData1)

        // Create this.processIds, this.clusterIds for Communication panel
        this.clusterMap = this.getClusterMapping(stream_obj, this.clusterMetric)
        for (let id in this.clusterMap) {
          if (this.clusterMap.hasOwnProperty(id)) {
            this.processIds.push(parseInt(id))
            this.clusterIds.push(parseInt(this.clusterMap[id]))
          }
        }
      }
    },

    processCommData() {
      let comm_obj = this.commData
      if (comm_obj != null && Object.keys(comm_obj).length !== 1) {
        this.comm_data = comm_obj['data']
        let comm_schema = comm_obj['schema']
        let comm_time = comm_obj['time']
        if (this.prev_comm_time == null) {
          this.prev_comm_time = 0
        }
        this.comm_data.forEach(d => {
          d.RbPrim = d.RbTotal - d.RbSec
        })
        if (comm_schema.hasOwnProperty('CommData')) {
          comm_schema.CommData = 'int'
        }
        let data = {}
        this.timeIntervals = []
        this.timeIntervals.push([this.prev_comm_time, comm_time])
        this.$refs.Communication.allMetrics = Object.keys(comm_schema).filter(k => k.slice(-2) !== 'id' && k.slice(-2) !== 'Id')
        let params = data.params || {}
        this.metrics = [this.plotMetric1, this.plotMetric2]
        if (params.timeIntervals) this.timeIntervals = params.timeIntervals
        if (params.timeMetric) this.timeDomain = params.timeMetric
        if (params.ringMetrics) {
          this.metrics = params.ringMetrics
          this.$refs.Communication.metrics = params.ringMetrics
        }
        if (params.processIds) this.processIds = params.processIds
        if (params.clusterIds) this.clusterIds = params.clusterIds
        if (params.clusterColors) this.clusterColors = params.clusterColors.map(c => 'rgb(' + c.join(',') + ')')
        this.updateCommunication()
        this.prev_comm_time = comm_time
      }
    }
  }
}
