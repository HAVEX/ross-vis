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
		appName: 'Streaming ROSS Visual Analytic Framework',
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
		selectedGranID: null,
		plotMetricAlias1: 'Sec. Rb.',
		plotMetric1: 'RbSec',
		plotMetricAlias2: 'Prim. Rb.',
		plotMetric2: 'RbPrim',
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
		calcMetrics:['NetworkRecv', 'NetworkSend', 'NeventProcessed', 'RbSec', 'RbPrim'],
		calcMetricsAlias: ['Net. Recv.', 'Net. Send.', 'Num. Events.', 'Sec. Rb.', 'Prim. Rb.'],
		// causalityMetrics: ['NetworkRecv', 'NetworkSend', 'NeventProcessed', 'RbSec', 'RbTime', 'RbTotal'],
		causalityMetrics: ['NetworkRecv', 'NetworkSend', 'NeventProcessed', 'RbSec', 'NeventRb', 'RbTotal', 'RbPrim'],
		clusterMetrics: ['NetworkRecv', 'NetworkSend', 'NeventProcessed', 'RbSec', 'RbPrim'],
		selectedClusterMetricAlias: 'Sec. Rb.',
		selectedClusterMetric: 'RbSec',
		numberOfClusters: 3,
		selectedNumberOfClusters: 3,
		commThreshold: 0,
		thresholdValue: 0,
		showIntraComm: false,
		causality: ['from', 'to'],
		selectedCausality: 'from',
		drawBrush: true,
		dialog: true,
		config: ['8-16-100', '8-16-500', '8-16-1000'],
		selectedConfig: '8-16-100',
		topology: ['DragonFly', 'Slim-Fly', 'Fat-Tree'],
		selectedTopology: 'DragonFly',
		nameRevMapper: {
			"Net. Recv.": "NetworkRecv",
			"Net. Send.": "NetworkSend",
			"Num. Events": "NeventProcessed",
			"Prim. Rb.": "RbPrim",
			"Sec. Rb.": "RbSec",
		},
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

		EventHandler.$on('fetch_kpmatrix_on_interval_request', function (prev_cpd, cpd) {
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


		EventHandler.$on('fetch_kpmatrix_on_live_request', function (current_time) {
			console.log('Fetching comm data for live', current_time)
			let obj = {
				metric: this.calcMetrics,
				socket_request: 'comm-data-live',
				granularity: this.granularity,
				current_time: current_time
			}
			self.socket.send(JSON.stringify(obj))
			console.log("Request: ", obj)
		})
		

		EventHandler.$on('fetch_kpmatrix_on_base_request', function (base_time) {
			console.log('Fetching comm data for base', base_time)
			let obj = {
				metric: this.calcMetrics,
				socket_request: 'comm-data-base',
				granularity: this.granularity,
				base_time: base_time
			}
			self.socket.send(JSON.stringify(obj))
			console.log("Request: ", obj)
		})

		EventHandler.$on('fetch_kpmatrix_on_cpd_request', function (cpd) {
			console.log('Fetching comm data for diff', cpd)
			let obj = {
				metric: this.calcMetrics,
				socket_request: 'comm-data-cpd',
				granularity: this.granularity,
				cpd: cpd,
			}
			self.socket.send(JSON.stringify(obj))
			console.log("Request: ", obj)
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
	},

	methods: {
		init() {
			//set initial variables.
			this.dialog = false
			this.plotMetric1 = this.nameRevMapper[this.plotMetricAlias1]
			this.plotMetric2 = this.nameRevMapper[this.plotMetricAlias2]
			this.$store.plotMetric1 = this.plotMetric1
			this.$store.plotMetric2 = this.plotMetric2
			this.selectedClusterMetric = this.nameRevMapper[this.selectedClusterMetricAlias]
			this.socket = new WebSocket('ws://' + this.server + '/websocket')
			this.method = this.selectedMode == 'Post Hoc' ? 'get' : 'stream'
			this.selectedGranID = this.correctGranID()
			this.$store.selectedClusterMetric = this.selectedClusterMetric
			this.fetchTsData()
			this.$store.play = 1
			this.$store.result = {}
			this.$store.selectedDragTime = 0
			this.$store.selectedDragTimeRound = Math.floor(this.$store.selectedDragTime)
			this.$store.cpdMatrix = []
			this.$store.colorset = ['#59A14E', '#AF7AA1', '#F18F2C']
			this.$store.cpdLineColor = '#00D8E2'
			this.$store.dragLineColor = '#17BECF'
			
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
			EventHandler.$emit('init', this.$store.selectedDragTime)
			EventHandler.$emit('clear_dragger', this.$store.selectedDragTime)

			this.fetchTsData()
		},

		updatePause() {
			EventHandler.$emit('init_dragger', this.$store.selectedDragTime)
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
				this.plotMetric1 = this.nameRevMapper[this.plotMetricAlias1]
				this.$store.plotMetric1 = this.plotMetric1
				console.log("Change in metric detected : [", this.plotMetric1, "]")
				this.clear()
				this.$refs.StreamBoard.updatePlotMetric1()
				EventHandler.$emit('change_label')
			})
		},

		updatePlotMetric2() {
			Vue.nextTick(() => {
				this.plotMetric2 = this.nameRevMapper[this.plotMetricAlias2]
				this.$store.plotMetric2 = this.plotMetric2
				console.log("Change in metric detected : [", this.plotMetric2, "]")
				this.clear()
				this.$refs.StreamBoard.updatePlotMetric2()
				EventHandler.$emit('change_label')
			})
		},

		updateNumberOfClusters(){

		},

		updateClusterMetric() {
			Vue.nextTick(() => {
				console.log("Change in metric detected : [", this.selectedClusterMetric, "]")
				this.clear()
				this.$refs.StreamBoard.updateLabels = true;
				this.$refs.StreamBoard.updateClusterMetric()
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

			// // Toggle off the request mode explicitly if it is on.
			// if(this.request == 1){
			// 	this.request = 0
			// 	this.$store.play = 1
			// 	this.play = 1
			// }
			
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
				console.log("Incoming data: ", this.count, data)


				// Get updates data.
				if('views' in data){
					this.streamData = null
					if('aggr_comm' in data){
						console.log("Aggr comm data", data['aggr_comm'])
						EventHandler.$emit('fetch_kpmatrix_on_interval', this.prev_cpd, this.cpd, data['aggr_comm'])
					}
	
					if('base_comm' in data){
						console.log("Base comm data", data['base_comm'])
						EventHandler.$emit('fetch_kpmatrix_on_base', data['base_comm'])
					}
	
					if('cpd_comm' in data){
						console.log("Diff comm data", data['cpd_comm'])
						EventHandler.$emit('fetch_kpmatrix_on_cpd', data['cpd_comm'])
					}	

					if('current_comm' in data){
						console.log("Current comm data", data['current_comm'])
						EventHandler.$emit('fetch_kpmatrix_on_current', data['current_comm'])	
					}
				}

				// Get streaming high dimensional data. 
				else{
					this.streamData = data
					this.commData = data.comm
					if (this.count == 1) {
						this.$refs.StreamBoard.init()
					}
					else if (this.count > 2) {
						this.$refs.StreamBoard.update()
					}

					if (this.count == 4){
						this.$store.selectedDragTime = data.RbSec['result'][0]['normal_times'][2]
						this.$store.selectedDragTimeRound = Math.floor(this.$store.selectedDragTime)
						console.log('Base time:', this.$store.selectedDragTime)
						EventHandler.$emit('init_base_communication')
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
				}
			}
		},
	}
}
