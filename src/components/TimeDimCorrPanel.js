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
      this.$refs.Causality.init()
      //this.$refs.ControlPanel.init()
    },

    getColumns (data, colnames, schema){
      let ret = {}
      ret.data = []
      ret.schema = {}
      for(let i = 0; i < data.length; i += 1){
        for(let j = 0; j < colnames.length; j += 1){
          if(j == 0){
            ret.data[i] = {}
          }
          if(i == 0){
            ret.schema[colnames[j]] = schema[j]
          }
          ret.data[i][colnames[j]] = data[i][colnames[j]]
        }
      }
      return ret
    },

    // Because most results are being dumped to [0] th element of array.
    processClusterData (data, clusterType) {
      let ret = {}
      ret.data = []
      ret.schema = {
        ts : 'float',
        'cluster': 'int',
        'LastGvt': 'float'
      }
      let zero_index_data = data[0]
      for(let i = 0; i < zero_index_data[clusterType].length; i += 1){
        let _data = zero_index_data[clusterType][i]
        let _cluster = zero_index_data[clusterType + '_clusters'][i]
        for(let time = 0; time < _data.length; time += 1){
          let current_time = zero_index_data[clusterType + '_times'][time]
          ret.data.push({
            ts : _data[time],
            'cluster': _cluster,
            'LastGvt': current_time
          })
        }
      }
      return ret
    },

    processCausalityData (data) {
      let ret = {}
      data = data[0]
      ret.from = []
      for(let i = 0; i < data['from_metrics'].length; i += 1){
        ret.from.push({
          'IR_1': parseFloat(data['from_IR_1'][i]).toFixed(2),
          'VD_1': parseFloat(data['from_VD_1'][i]).toFixed(2), 
          'causality': data['from_causality'][i],
          'metric': data['from_metrics'][i],
        })
      }

      ret.to = []
      for(let i = 0; i < data['from_metrics'].length; i += 1){
        ret.to.push({
          'IR_1': parseFloat(data['to_IR_1'][i]).toFixed(2),
          'VD_1': parseFloat(data['from_VD_1'][i]).toFixed(2), 
          'causality': data['from_causality'][i],
          'metric': data['from_metrics'][i],
        })
      } 
      return ret     
    },

    tick() {
      this.ts = null
      this.pca_result = null
      this.macro_result = null
      this.micro_result = null
      this.causality_result = null

      let data = this.plotData
      let ts = {} 
      if (data != null || data != undefined){
        this.stream_count = this.stream_count + 1
        ts.data = data['data']
        ts.schema = data['schema']
        let tsCache = p4.cstore({})
        tsCache.import(ts)
        tsCache.index('LastGvt')
        this.ts =  tsCache.data()

        let result = data['result']
        // pca_result
        let pca_result = this.getColumns(data['result'], ['KpGid', 'PC0', 'PC1'], ['int', 'float', 'float'])
        let pca_cstore = p4.cstore({})
        pca_cstore.import(pca_result)
        this.pca_result = pca_cstore.data()

        this.cpd = result[0]['cpd']

        let macro_result = this.processClusterData(data['result'], 'macro')
        // console.log(macro_result.data)
        let macro_cstore = p4.cstore({})
        macro_cstore.import(macro_result)
        macro_cstore.index('LastGvt')
        this.macro_result = macro_cstore.data()

        let micro_result = this.processClusterData(data['result'], 'micro')
        //console.log(micro_result.data)
        let micro_cstore = p4.cstore({})
        micro_cstore.import(micro_result)
        micro_cstore.index('LastGvt')
        this.micro_result = micro_cstore.data()

        this.causality_result = this.processCausalityData(data['result'])
        // let schema_res = {
        //   from_IR_1: "int",
        //   from_VD_1: "int",
        //   from_causality: "int",
        //   from_metrics: "int",
        //   macro: "int",
        //   macro_clusters: "int",
        //   micro: "int",
        //   micro_clusters: "int",
        //   normal: "int",
        //   normal_clusters: "int",
        //   to_IR_1: "int",
        //   to_VD_1: "int",
        //   to_causality: "int",
        //   to_metrics: "int",
        // }

        
        this.reset()
      }
    },

    reset(){
      if(!this.initVis){
        console.log('initializing vis')
        console.log(this.micro_result)
        this.$refs.TimeSeries.initVis(this.micro_result)
        this.$refs.Dimensionality.initVis(this.pca_result)
       // this.$refs.Causality.init(this.causality_result)
        this.initVis = true
      }
      else{
        this.$refs.TimeSeries.clearVis(this.micro_result)
        this.$refs.Dimensionality.clearVis(this.pca_result)
       // this.$refs.Causality.clear(this.causality_result)
        this.selectedTimeInterval = null
        this.visualize()
      }
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