import tpl from '../html/entry.html'
import StreamBoard from './StreamBoard'
import HocBoard from './HocBoard'
import EventHandler from './EventHandler'

import Vue from 'vue'

export default {
	name: 'entry',
	template: tpl,
	components: {
		StreamBoard,
		HocBoard
	},
	data: () => ({
		socket: null,
		streamData: null,
		commData: null,
		hocData: null,
		appName: 'Streaming ROSS Visual Analytics',
		socketError: false,
		server: 'localhost:8899',
		modes: ['Post Hoc', 'In Situ'],
		selectedMode: 'In Situ',
		timeDomains: ['LastGvt', 'RealTs', 'VirtualTs'],
		selectedTimeDomain: 'LastGvt',
		granularity: ['Pe', 'Kp', 'Lp'],
		selectedGranularity: 'Kp',
		GranID: ['Peid', 'KpGid', 'Lpid'],
		selectedGranID: null,
		plotMetric1: 'RbSec',
		plotMetric2: 'NetworkSend',
		similarity: ['euclidean'],
		selectedSimilarity: 'euclidean',
		clustering: ['evostream', 'dbstream'],
		selectedClustering: 'evostream',
		dimred: ['prog_inc_PCA', 'inc_PCA', 'PCA', 'tsne'],
		selectedDimred: 'prog_inc_PCA',
		cpd: ['aff', 'pca'],
		selectedcpd: 'pca',
		measures: ['avg', 'sum', 'max', 'min'],
		selectedMeasure: 'sum',
		timeIndexes: null,
		isAggregated: true,
		left: false,
		metrics: [],
		checkboxs: [],
		count: 0,
		analysis: ['Case_study-1', 'Case_study-2'],
		selectedAnalysis: 'Case_study-1',
		play: 1,
		update: 1,
		request: 0,
		calcMetrics: ['NetworkRecv', 'NetworkSend', 'NeventProcessed', 'RbSec', 'RbTime', 'NeventRb', 'RbTotal'],
		// calcMetrics: ['RbSec'],
		causalityMetrics: ['NetworkRecv', 'NetworkSend', 'NeventProcessed', 'NeventRb', 'RbSec', 'RbTime', 'RbTotal'],
		clusterMetrics: ['NetworkRecv', 'NetworkSend', 'NeventProcessed', 'RbSec', 'RbTotal', 'RbPrim'],
		selectedClusterMetric: 'RbSec',
		numberOfClusters: 3,
		selectedNumberOfClusters: 3,
		commThreshold: 0,
		thresholdValue: 0,
		showIntraComm: false,
		causality: ['from', 'to'],
		selectedCausality: 'to',
		drawBrush: true,
	}),

	watch: {
		plotMetric2: function () {
			return this.plotMetric1
		},
		plotMetric1: function () {
			return this.plotMetric2
		},
	},

	mounted: function () {
		let self = this

		EventHandler.$on('fetch_kpmatrix_on_cpd', function (prev_cpd, cpd) {
			let interval = []
			interval.push(prev_cpd)
			interval.push(cpd)
			console.log('Fetching comm data for interval', interval)
			let obj = {
				metric: this.calcMetrics,
				socket_request: 'comm-data-interval',
				granularity: this.granularity,
				interval: interval
			}
			self.prev_cpd = prev_cpd
			self.cpd = cpd
			self.socket.send(JSON.stringify(obj))
			console.log("Request: ", obj)
			// self.$store.play = 0
			// self.socket.onmessage = (event) => {
			// 	let data = JSON.parse(event.data)
			// 	EventHandler.$emit('fetch_kpmatrix_on_cpd_results', prev_cpd, cpd, data)
			// 	self.request = 1
			// 	self.fetchTsData()
			// 	self.request = 0
			// 	self.$store.play = 1
			// }
		})

		EventHandler.$on('fetch_kpmatrix_on_click', function (prev_cpd, cpd) {
			let interval = []
			interval.push(prev_cpd)
			interval.push(cpd)
			console.log('Fetching comm data for click', interval)
			let obj = {
				metric: this.calcMetrics,
				method: 'comm-data-interval-mode2',
				granularity: this.granularity,
				interval: interval
			}
			self.request = 0
			self.socket.send(JSON.stringify(obj))
			self.socket.onmessage = (event) => {
				let data = JSON.parse(event.data)
				EventHandler.$emit('fetch_kpmatrix_on_click_results', cpd, data)
				self.request = 1
				self.fetchTsData()
				self.request = 0
			}
		})

		this.init()
	},

	methods: {
		init() {
			//set initial variables.
			this.socket = new WebSocket('ws://' + this.server + '/websocket')
			this.method = this.selectedMode == 'Post Hoc' ? 'get' : 'stream'
			this.selectedGranID = this.correctGranID()
			this.$store.selectedClusterMetric = this.selectedClusterMetric
			this.fetchTsData()
			this.$store.play = 1
		},

		// Take incorrect id and add correct post-id
		correctGranID() {
			let ret = ''
			if (this.selectedGranularity == 'Kp') {
				ret = this.selectedGranularity + 'Gid'
			}
			else {
				ret = this.selectedGranularity + 'id'
			}
			return ret
		},

		updatePlay() {
			this.$store.play = 1
			this.play = 1
			this.update = 1
			this.request = 0
			this.fetchTsData()
		},

		updatePause() {
			this.$store.play = 0
			this.play = 0
		},

		updatePrevStep() {
			this.$store.play = 1
			this.play = 1
			this.update = -1
			this.request = 0
			console.log("Removing ", this.count)
			this.fetchTsData()
		},

		updateGranularity() {
			Vue.nextTick(() => {
				this.clear()
				console.log("Change in granularity detected : [", this.selectedGranularity, "]")
				this.selectedGranID = this.correctGranID()
				this.count = 0
				// TODO: Need to do offline-computation and get the corresponding time series. 
				this.fetchTsData()
			})
		},

		updateTimeDomain() {
			Vue.nextTick(() => {
				this.clear()
				console.log("Change in domain detected : [", this.selectedTimeDomain, "]")
				this.count = 0
				// TODO: Need to do offline-computation and get the corresponding time series. 
				this.fetchTsData()
			})
		},

		updatePlotMetric1() {
			Vue.nextTick(() => {
				console.log("Change in metric detected : [", this.plotMetric1, "]")
				this.clear()
				EventHandler.$emit('change_label')
				this.$refs.StreamBoard.update()
			})
		},

		updatePlotMetric2() {
			Vue.nextTick(() => {
				console.log("Change in metric detected : [", this.plotMetric2, "]")
				this.clear()
				EventHandler.$emit('change_label')
				this.$refs.StreamBoard.update()
			})
		},

		updateNumberOfClusters(){

		},

		updateClusterMetric() {
			Vue.nextTick(() => {
				console.log("Change in metric detected : [", this.selectedClusterMetric, "]")
				this.clear()
				this.$refs.StreamBoard.updateLabels = true;
				this.$refs.StreamBoard.update()
			})
		},

		updateAnalysis() {
			this.clear()
		},

		updateMode() {
			if (this.selectedMode == 'Post Hoc') {
				console.log("Changing to Post Hoc mode")
				this.method = 'stream'
				this.$store.play = 0
				this.play = 0
			}
			else {
				console.log("Changing to In situ mode")
				this.method = 'get-count'
			}
			console.log(this.selectedMode)
			console.log("Stopping the streamBoard at ", this.count)
			this.fetchAllData(this.count)
		},

		clear() {
			this.$refs.StreamBoard.clear()
		},

		createJSONrequest(count) {
			if (!count) {
				count = this.count
			}

			// Toggle off the request mode explicitly if it is on.
			if(this.request == 1){
				this.request = 0
				this.$store.play = 1
				this.play = 1
			}
			
			let obj = {
				data: this.selectedGranularity + 'Data',
				granularity: this.selectedGranID,
				clusterMetric: this.selectedClusterMetric,
				calcMetrics: this.calcMetrics,
				causalityMetrics: this.causalityMetrics,
				timeDomain: this.selectedTimeDomain,
				method: this.method,
				streamCount: this.count,
				play: this.$store.play,
				update: this.update,
				request: this.request,
			}
			console.log("Request", obj)
			return JSON.stringify(obj)
		},

		fetchAllData(count) {
			console.log("Fetching all data till", count)
			let json = this.createJSONrequest(count)
			this.socket.send(json)

			this.socket.onmessage = (event) => {
				let data = JSON.parse(event.data)
				this.metrics = Object.keys(data.schema)
				this.metrics = Object.keys(data.schema)
				if (data.schema.hasOwnProperty('CommData')) {
					data.schema.CommData = 'int'
				}
				let cache = p4.cstore({})
				cache.import(data)
				cache.index('LastGvt')
				this.hocData = cache.data()
				this.timeIndexes = this.hocData.uniqueValues
				this.$refs.HocBoard.init()
			}
		},

		fetchTsData() {
			if (this.count == 0) {
				this.socket.onopen = () => {
					this.socketError = false
					console.log('Requesting ', this.count, ' stream.')
					this.socket.send(this.createJSONrequest())
				}
			}

			else {
				this.socket.send(this.createJSONrequest())
			}

			this.socket.onerror = (error) => {
				this.socketError = true
			}

			this.socket.onmessage = (event) => {
				let data = JSON.parse(event.data)
				let d = data
				this.metrics = Object.keys(d['RbSec'].schema)
				this.commData = d.comm
				console.log("Incoming data: ", this.count, d)
				this.streamData = data
				if (this.count == 1) {
					this.$refs.StreamBoard.init()
				}
				else if (this.count > 2) {
					this.$refs.StreamBoard.update()
				}
				if (this.update == -1) {
					this.update = 1
					this.count -= 1
					this.$store.play = 0
					this.play = 0
				}
				else {
					this.count += 1
				}

				if (this.$store.play == 1) {
					this.fetchTsData()
				}
				if('aggr_comm' in this.streamData){
					EventHandler.$emit('fetch_kpmatrix_on_cpd_results', this.prev_cpd, this.cpd, data)
				}
			}
		},
	}
}
