import tpl from '../html/Causality.html'

export default {
	name: 'Causality',
	template: tpl,
	components: {

	},
	data: () => ({
		sortBy: 'causality',
		sortDesc: true,
		striped: true,
		bordered: true,
		hover: true,
		responsive: true,
		fields: [
			{ key: 'metric', sortable: false },
			{ key: 'IR', sortable: true },
			{ key: 'VD', sortable: true },
			{}
		],
		to_items: [],
		message: '',
		from_items: [],
		causality: ['from', 'to'],
		selectedCausality: 'from',
		nameMapper: {
			"NetworkRecv": "Net. Recv.",
			"NetworkSend": "Net. Send.",
			"NeventProcessed": "Num. Events",
			"NeventRb": "Prim. Rb.",
			"RbSec": "Sec. Rb.",
			"RbTime": "Rb. Time",
		},
		topParameters: 5,
		fromCountMap: {},
		toCountMap: {},
	}),
	methods: {
		rowClass(item, type) {
			if (!item) return
			if (item.status === 'awesome') return 'table-warning'
		}
	},

	mounted: function () {
		this.message = 'Causality view (' + this.selectedCausality.charAt(0).toUpperCase() + this.selectedCausality.slice(1) + ')'
	},

	methods: {
		init() {
		},

		preprocess(data) {
			for (let i = 0; i < data['from'].length; i++) {
				let metric = data['from'][i]['metric']

				// Write the count as 0 when it is undefined
				let count = this.fromCountMap[metric]
				if (count == undefined) {
					count = 0
				}

				// if(metric == this.$store.selectedClusterMetric){
				// 	continue
				// }
				// else{
				if (data['from'][i]['causality'] == 1 && metric != this.$store.selectedClusterMetric && metric != 'NeventProcessed') {
					data['from'][i]['_rowVariant'] = 'warning'

					// Count the number of times a metric has p-value > 0.05
					if (this.fromCountMap[metric] == undefined) {
						this.fromCountMap[metric] = 0
					}
					this.fromCountMap[metric] += 1


					if (metric in this.nameMapper)
						// data['from'][i]['metric'] = this.nameMapper[metric] + '(' + count + ')'
						data['from'][i]['metric'] = this.nameMapper[metric]
				}
				else {
					data['from'][i]['_rowVariant'] = 'dangere'
					if (metric in this.nameMapper)
						// data['from'][i]['metric'] = this.nameMapper[metric] + '(' + count + ')'
						data['from'][i]['metric'] = this.nameMapper[metric]
				}
				// }


			}

			for (let i = 0; i < data['to'].length; i++) {
				let metric = data['to'][i]['metric']

				// Write the count as 0 when it is undefined
				let count = this.toCountMap[metric]
				if (count == undefined) {
					count = 0
				}


				// if(metric == this.$store.selectedClusterMetric){
				// 	continue
				// }
				// else{
				if (data['to'][i]['causality'] == 1 && metric != this.$store.selectedClusterMetric) {
					data['to'][i]['_rowVariant'] = 'warning'

					// Count the number of times a metric has p-value > 0.05
					if (this.toCountMap[metric] == undefined) {
						this.toCountMap[metric] = 0
					}
					this.toCountMap[metric] += 1

					if (metric in this.nameMapper)
						// data['to'][i]['metric'] = this.nameMapper[metric] + '(' + count + ')'
						data['to'][i]['metric'] = this.nameMapper[metric]
				}
				else {
					data['to'][i]['_rowVariant'] = 'dangere'
					if (metric in this.nameMapper)
						// data['to'][i]['metric'] = this.nameMapper[metric] + '(' + count + ')'
						data['to'][i]['metric'] = this.nameMapper[metric]
				}
				// }


			}
			return data
		},

		initVis(data) {
			let dashboardHeight = document.getElementById('dashboard').clientHeight
			let toolbarHeight = document.getElementById('toolbar').clientHeight
			let chipContainerHeight = document.getElementById('chip-container').clientHeight

			this.height = (dashboardHeight - toolbarHeight - chipContainerHeight) / 3

			document.getElementById('correlation-table').style.height = this.height
			data = this.preprocess(data)
			console.log(data['from'])
			this.from_items = data['from'].slice(0, this.topParameters)
			this.to_items = data['to'].slice(0, this.topParameters)
		},

		clear(data) {
			this.preprocess(data)
			this.from_items = data['from'].slice(0, this.topParameters)
			this.to_items = data['to'].slice(0, this.topParameters)
		},

		updateCausality() {
			this.clear()
		}
	}
}
