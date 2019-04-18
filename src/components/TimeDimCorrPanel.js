import p4 from 'p4'
import template from '../html/TimeDimCorrPanel.html'

import Dimensionality from './Dimensionality'
import TimeSeries from './TimeSeries'
import D3TimeSeries from './D3TimeSeries'
import D3Dimensionality from './D3Dimensionality'

import ControlPanel from './ControlPanel'
import Causality from './Causality'
import EventHandler from './EventHandler.js'

export default {
	name: 'TimeDimCorrPanel',
	props: [
		'plotMetric',
		'granularity',
		'timeDomain',
		'plotData',
		'measure',
		'clusterMap'
	],
	template: template,
	components: {
		ControlPanel,
		Dimensionality,
		D3Dimensionality,
		TimeSeries,
		D3TimeSeries,
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
		timeAttribute: 'time',
		timeCluster: {},
		PCACluster: {},
		selectedIds: [],
		useD3: true,
		addBrushTime: [],
	}),
	watch: {
		selectedIds: function (val) {
			if (this.useD3) {
				this.$refs.D3TimeSeries.selectedIds = val
			}
			else {
				this.$refs.TimeSeries.selectedIds = val
			}
		},
		addBrushTime: function (val) {
			this.$parent.newCommPanel = true
			this.$parent.timeIntervals.push([val[0][0], val[0][1]])
		},
		plotData: function (val) {
			// Tick when the data comes. 
			this.tick()
		},
	},
	mounted() {
		let self = this
		EventHandler.$on('change_label', function () {
			console.log("Change in update label")
			// Update labels
			self.$refs.D3TimeSeries.clearLabel()
			self.$refs.D3TimeSeries.label()
		})
	},
	methods: {
		init() {
			console.log('Init ', this.plotMetric, this.timeDomain, this.granularity)
			if (this.useD3) {
				this.$refs.D3TimeSeries.init()
				this.$refs.D3Dimensionality.init()
			}
			else {
				this.$refs.TimeSeries.init()
				this.$refs.Dimensionality.init()
			}
			this.$refs.Causality.init()
			//this.$refs.ControlPanel.init()
		},

		processPCAData(data) {
			let ret = {}
			ret.data = []
			let colnames = ['KpGid', 'PC0', 'PC1', 'cluster']
			ret.schema = {
				'KpGid': 'int',
				'PC0': 'float',
				'PC1': 'float',
				'cluster': 'int',
			}
			for (let i = 0; i < data.length; i += 1) {
				for (let j = 0; j < colnames.length; j += 1) {
					if (j == 0) {
						ret.data[i] = {}
					}
					if (colnames[j] == 'cluster') {
						ret.data[i]['cluster'] = this.clusterMap[data[i]['KpGid']]
						this.PCACluster[data[i]['KpGid']] = this.clusterMap[data[i]['KpGid']]
					}
					else {
						ret.data[i][colnames[j]] = data[i][colnames[j]]
					}
				}
			}
			return ret
		},

		// Because most results are being dumped to [0] th element of array.
		processClusterData(data, clusterType) {
			let ret = {}
			ret.data = []
			if (clusterType == 'normal') {
				ret.schema = {
					ts: 'float',
					'cluster': 'int',
					'time': 'float',
					'id': 'int'
				}
			}
			else {
				ret.schema = {
					ts: 'float',
					'cluster': 'int',
					'time': 'float'
				}
			}

			let zero_index_data = data[0]
			for (let i = 0; i < zero_index_data[clusterType].length; i += 1) {
				let _data = zero_index_data[clusterType][i]
				let id = zero_index_data['ids'][i]
				let _cluster = this.clusterMap[id]

				this.timeCluster[id] = _cluster
				for (let time = 0; time < _data.length; time += 1) {
					let current_time = zero_index_data[clusterType + '_times'][time]
					if (clusterType == 'normal') {
						ret.data.push({
							'ts': _data[time],
							'cluster': _cluster,
							'time': current_time,
							'id': id
						})
					}
					else {
						ret.data.push({
							'ts': _data[time],
							'cluster': _cluster,
							'time': current_time
						})
					}
				}
			}
			return ret
		},

		processCausalityData(data) {
			let ret = {}
			data = data[0]
			ret.from = []
			for (let i = 0; i < data['from_metrics'].length; i += 1) {
				ret.from.push({
					'IR': parseFloat(data['from_IR_1'][i]).toFixed(2),
					'VD': parseFloat(data['from_VD_1'][i]).toFixed(2),
					'causality': data['from_causality'][i],
					'metric': data['from_metrics'][i],
				})
			}

			ret.to = []
			for (let i = 0; i < data['from_metrics'].length; i += 1) {
				ret.to.push({
					'IR': parseFloat(data['to_IR_1'][i]).toFixed(2),
					'VD': parseFloat(data['from_VD_1'][i]).toFixed(2),
					'causality': data['from_causality'][i],
					'metric': data['from_metrics'][i],
				})
			}
			return ret
		},

		create_cstore(data, index) {
			let cstore = p4.cstore({})
			cstore.import(data)
			if (index) {
				cstore.index(index)
			}
			return cstore.data()
		},

		// Convert the cstore to format { 'id': [Array] }
		processD3TimeSeries(cstore, mapBy) {
			let ret = {}

			let cstore_id = {}
			for (let i = 0; i < cstore.keys.length; i += 1) {
				let key = cstore.keys[i]
				cstore_id[key] = i
			}

			let keyUp = mapBy
			for (let i = 0; i < cstore.size; i += 1) {
				// index of keyUp in cstore
				let keyUp_index = cstore_id[keyUp]
				let keyUp_data = cstore[keyUp_index][i]
				if (ret[keyUp_data] == undefined) {
					ret[keyUp_data] = {}
				}
				for (let key in cstore_id) {
					if (cstore_id.hasOwnProperty(key) && key != keyUp) {
						if (ret[keyUp_data][key] == undefined) {
							ret[keyUp_data][key] = []
						}
						let _index = cstore_id[key]
						let _data = cstore[_index][i]
						ret[keyUp_data][key].push(_data)
					}
				}
				ret[keyUp_data][this.plotMetric] = cstore.uniqueValues.time
			}
			return ret
		},

		tick() {
			console.log('Ticking ', this.plotMetric)
			this.ts = null
			this.pca_result = null
			this.macro_result = null
			this.micro_result = null
			this.causality_result = null

			let data = this.plotData
			if (data != null || data != undefined) {
				if (Object.keys(data).length !== 1) {
					this.stream_count = this.stream_count + 1
					let result = this.plotData['result']
					// Check if the results have come. 
					if (Object.keys(result[0]).length == 1) {
						console.log("There are no results yet. So doing nothing")
					}
					else {
						let normal_result = this.processClusterData(result, 'normal')
						let pca_result = this.processPCAData(result)
						let macro_result = this.processClusterData(result, 'macro')
						// let micro_result = this.processClusterData(result, 'micro')
						this.causality_result = this.processCausalityData(data['result'])

						this.cpd = result[0]['cpd']

						this.normal_result = this.create_cstore(normal_result, this.timeAttribute)
						this.pca_result = this.create_cstore(pca_result)
						this.macro_result = this.create_cstore(macro_result, this.timeAttribute)
						// this.micro_result = this.create_cstore(micro_result, this.timeAttribute)

						if (this.useD3) {
							this.normal_result = this.processD3TimeSeries(this.normal_result, 'id')
							this.pca_result = this.processD3TimeSeries(this.pca_result, 'KpGid')
							// this.micro_result = this.processD3TimeSeries(this.micro_result, 'id')
							// this.macro_result = this.processD3TimeSeries(this.macro_result, 'id')
						}

						this.reset()
						this.checkClustering()
					}
				}
				else {
					console.log("The data is null or undefined")
				}
			}
			else {
				console.log('data is null or undefined')
			}
		},

		checkClustering() {
			for (let KpGid in this.timeCluster) {
				if (this.timeCluster.hasOwnProperty(KpGid)) {
					if (this.timeCluster[KpGid] == this.PCACluster[KpGid]
					) {
						//console.log("Matches")
					}
					else {
						console.log("Bug")
					}
				}
			}
		},

		clear() {
			if (this.useD3) {
				this.$refs.D3TimeSeries.reset(this.normal_result, this.cpd)
				this.$refs.D3Dimensionality.reset(this.pca_result)
			}
			else {
				this.$refs.TimeSeries.reset(this.normal_result)
				this.$refs.Dimensionality.reset(this.pca_result)
			}
			this.$refs.Causality.clear(this.causality_result)
		},

		reset() {
			this.$refs.D3TimeSeries.selectedMeasure = this.$parent.measure
			this.$refs.D3TimeSeries.isAggregated = this.$parent.isAggregated
			this.$refs.D3TimeSeries.selectedMetrics = this.plotMetric
			this.$refs.D3TimeSeries.plotMetric = this.plotMetric
			this.$refs.D3TimeSeries.selectedTimeDomain = this.timeDomain
			this.$refs.D3TimeSeries.clusters = 'cluster'
			this.$refs.D3TimeSeries.groupBy = 'id'
			this.$refs.D3TimeSeries.timeAttribute = 'time'
			this.$refs.D3TimeSeries.count = this.stream_count

			if (!this.initVis) {
				if (this.useD3) {
					this.$refs.D3TimeSeries.initVis(this.normal_result, this.cpd)
					this.$refs.D3Dimensionality.initVis(this.pca_result)
				}
				else {
					this.$refs.TimeSeries.initVis(this.normal_result)
					this.$refs.Dimensionality.initVis(this.pca_result)
				}
				this.$refs.Causality.initVis(this.causality_result)
				this.initVis = true
			}
			else {
				if (this.useD3) {
					this.$refs.D3TimeSeries.reset(this.normal_result, this.cpd)
					this.$refs.D3Dimensionality.reset(this.pca_result)
				}
				else {
					this.$refs.TimeSeries.reset(this.normal_result)
					this.$refs.Dimensionality.reset(this.pca_result)
				}
				this.$refs.Causality.clear(this.causality_result)
				this.selectedTimeInterval = null
				this.visualize()
			}
		},

		updateDimensionality() {
			if (this.useD3) {
				this.$refs.D3Dimensionality.selectedMetrics = this.plotMetric
				this.$refs.D3Dimensionality.colorSet = this.colorSet
				this.$refs.D3Dimensionality.colorBy = 'cluster'
				this.$refs.D3Dimensionality.visualize()
			}
			else {
				this.$refs.Dimensionality.selectedMetrics = this.plotMetric
				this.$refs.Dimensionality.colorSet = this.colorSet
				this.$refs.Dimensionality.colorBy = 'cluster'
				this.$refs.Dimensionality.visualize()
			}
		},


		updateTimeSeries(callback) {
			this.$refs.TimeSeries.selectedMeasure = this.$parent.measure
			this.$refs.TimeSeries.isAggregated = this.$parent.isAggregated
			this.$refs.TimeSeries.selectedMetrics = this.plotMetric
			this.$refs.TimeSeries.selectedTimeDomain = this.timeDomain
			this.$refs.TimeSeries.clusters = 'cluster'
			this.$refs.TimeSeries.groupBy = 'id'
			this.$refs.TimeSeries.timeAttribute = 'time'
			this.$refs.TimeSeries.visualize([this.plotMetric], callback, this.cpd, this.cluster_mapping)
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

			if (!this.useD3) {
				this.updateTimeSeries(callback)
				this.updateDimensionality()
			}

		}
	}
}