import tpl from '../html/StreamBoard.html'
import '../css/dashboard1.css'
import Vue from 'vue'

import TimeDimCorrPanel from './TimeDimCorrPanel'
import CommKpMatrixPanel from './CommKpMatrixPanel'
import Overview from './Overview'

export default {
	name: 'StreamBoard',
	template: tpl,
	components: {
		TimeDimCorrPanel,
		CommKpMatrixPanel,
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
		isTsDataLoaded: false,
		plotData1: null,
		plotData2: null,
		clusterMap: {},
		metrics: [],
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
					this.$refs.CommKpMatrixPanel.init()
				})
			}
		},

		clear() {
			this.$refs.TimeDimCorrPanel1.clear()
			this.$refs.TimeDimCorrPanel2.clear()
			this.$refs.CommKpMatrixPanel.clear()
		},

		update() {
			let stream_obj = this.streamData
			if (stream_obj != null && Object.keys(stream_obj).length !== 1) {
				this.plotData1 = stream_obj[this.plotMetric1]
				this.plotData2 = stream_obj[this.plotMetric2]
				this.metrics = [this.plotMetric1, this.plotMetric2]
				// Create this.processIds, this.clusterIds for Communication panel
				this.clusterMap = this.calculateClusterMap(stream_obj, this.clusterMetric)
			}
			// this.$refs.CommKpMatrixPanel.update()
		},

		updateMetrics(metrics) {
			this.metrics = metrics
			this.update()
		},

		// Because most results are being dumped to [0] th element of array.
		calculateClusterMap(data, clusterMetric) {
			let ret = {}
			let clusterType = 'normal'
			let zero_index_data = data[clusterMetric]['result'][0]
			for (let i = 0; i < zero_index_data[clusterType].length; i += 1) {
				let _data = zero_index_data[clusterType][i]
				let _cluster = zero_index_data[clusterType + '_clusters'][i]
				for (let time = 0; time < _data.length; time += 1) {
					let current_time = zero_index_data[clusterType + '_times'][time]
					let id = zero_index_data['ids'][i]
					ret[id] = _cluster
				}
			}
			return ret
		},

		
	}
}
