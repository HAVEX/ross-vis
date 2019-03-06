import p4 from 'p4'
import template from '../html/TimeDimCorrPanel.html'

import Dimensionality from './Dimensionality'
import TimeSeries from './TimeSeries'
import ControlPanel from './ControlPanel'
import Causality from './Causality'
import { throws } from 'assert';

export default {
  name: 'TimeDimCorrPanel',
  props: ['plotMetric', 'granularity', 'timeDomain', 'plotData', 'measure'],
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
    timeAttribute: 'time'
  }),
  methods: {
    init() {
      console.log('Init ', this.plotMetric, this.timeDomain, this.granularity)
      this.$refs.TimeSeries.init()
      this.$refs.Dimensionality.init()
      this.$refs.Causality.init()
      //this.$refs.ControlPanel.init()
    },

    processPCAData (data, cluster_mapping){
      let ret = {}
      ret.data = []
      let colnames = ['KpGid', 'PC0', 'PC1','cluster']
      ret.schema = {
        'KpGid': 'int', 
        'PC0': 'float',
        'PC1': 'float',
        'cluster': 'int', 
      }
      for(let i = 0; i < data.length; i += 1){
        for(let j = 0; j < colnames.length; j += 1){
          if(j == 0){
            ret.data[i] = {}
          }
          if(colnames[j] == 'cluster'){
            ret.data[i]['cluster'] = cluster_mapping[data[i]['KpGid']]
          }
          else{
            ret.data[i][colnames[j]] = data[i][colnames[j]]
          }
        }
      }
      return ret
    },

    // Because most results are being dumped to [0] th element of array.
    processClusterData (data, clusterType) {
      let ret = {}
      ret.data = []
      let cluster_mapping = {}
      if (clusterType == 'normal'){
        ret.schema = {
          ts : 'float',
        'cluster': 'int',
        'time': 'float',
        'id': 'int'
        }
      }
      else{
        ret.schema = {
          ts : 'float',
          'cluster': 'int',
          'time': 'float'
        }
      }

      let zero_index_data = data[0]
      for(let i = 0; i < zero_index_data[clusterType].length; i += 1){
        let _data = zero_index_data[clusterType][i]
        let _cluster = zero_index_data[clusterType + '_clusters'][i]
        for(let time = 0; time < _data.length; time += 1){
          let current_time = zero_index_data[clusterType + '_times'][time]
          if(clusterType == 'normal'){
            let id = zero_index_data['ids'][i]
            cluster_mapping[id] = _cluster
            ret.data.push({
              ts : _data[time],
              'cluster': _cluster,
              'time': current_time,
              'id': id
            })  
          }
          else{
            ret.data.push({
              ts : _data[time],
              'cluster': _cluster,
              'time': current_time
            })
          }
        }
      }
      if(clusterType == 'normal'){
        return [ret, cluster_mapping]
      }
      else{
        return ret
      }
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

    create_cstore(data, index) {
      let cstore = p4.cstore({})
      cstore.import(data)
      if(index){
        cstore.index(index)
      }
      return cstore.data()
    },

    tick() {
      console.log('Ticking ', this.plotMetric)
      this.ts = null
      this.pca_result = null
      this.macro_result = null
      this.micro_result = null
      this.causality_result = null

      let data = this.plotData
      let ts = {} 
      if (data != null || data != undefined){
        if (Object.keys(data).length === 1){
          console.log("The data is null or undefined")
        }
        else{
          this.stream_count = this.stream_count + 1
          let result = data['result']

          // Check if the results have come. 
          if(Object.keys(result[0]).length == 1){
            console.log("There are no results yet. So doing nothing")
          }
          else{
            let temp = this.processClusterData(result, 'normal')
            let normal_result = temp[0]
            let cluster_mapping = temp[1]
            this.normal_result = this.create_cstore(normal_result, this.timeAttribute)
    
            let pca_result = this.processPCAData(result, cluster_mapping)
            this.pca_result = this.create_cstore(pca_result)
    
            this.cpd = result[0]['cpd']
    
            let macro_result = this.processClusterData(result, 'macro')
            this.macro_result = this.create_cstore(macro_result, this.timeAttribute)
    
            let micro_result = this.processClusterData(result, 'micro')
            this.micro_result = this.create_cstore(micro_result, this.timeAttribute)
    
            this.causality_result = this.processCausalityData(data['result'])
            this.reset()
          }
         
        }
      }
    },

    clear() {
      this.$refs.TimeSeries.clearVis(this.normal_result)
      this.$refs.Dimensionality.clearVis(this.pca_result)
      this.$refs.Causality.clear(this.causality_result)
    },

    reset(){
      if(!this.initVis){
        console.log('initializing vis', this.plotMetric)
        this.$refs.TimeSeries.initVis(this.normal_result)
        this.$refs.Dimensionality.initVis(this.pca_result)
        this.$refs.Causality.initVis(this.causality_result)
        this.initVis = true
      }
      else{
        this.$refs.TimeSeries.clearVis(this.normal_result)
        this.$refs.Dimensionality.clearVis(this.pca_result)
        this.$refs.Causality.clear(this.causality_result)
        this.selectedTimeInterval = null
        this.visualize()
      }
    },

    updateDimensionality() {
      this.$refs.Dimensionality.selectedMetrics = this.plotMetric
      this.$refs.Dimensionality.visualize()
    },


    updateTimeSeries(callback) {
      this.$refs.TimeSeries.selectedMeasure = this.$parent.measure
      this.$refs.TimeSeries.isAggregated = this.$parent.isAggregated
      this.$refs.TimeSeries.selectedMetrics = this.plotMetric
      this.$refs.TimeSeries.selectedTimeDomain = this.timeDomain
      this.$refs.TimeSeries.timeAttribute = 'time'
      this.$refs.TimeSeries.visualize(this.cpd, [this.plotMetric], callback) 
      this.updateDimensionality()
    },

    visualize() {
      let callback = (selection) => {
        let ti = this.timeIndexes[this.timeDomain]
        let start = Math.floor(selection[this.timeDomain][0])
        let end = Math.ceil(selection[this.timeDomain][1])
        if (end - start >= 1) {
          this.selectedTimeInterval = [ti[start], ti[end]]
        }
      }

      this.updateTimeSeries(callback)
    }
  }
}