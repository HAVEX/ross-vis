import template from '../html/CommKpMatrixPanel.html'
import Communication from './Communication'
import KpMatrix from './KpMatrix'
import EventHandler from './EventHandler'

export default {
    name: 'CommKpMatrixPanel',
    template,
    props: [
        'timeDomain',
        'measure',
        'metrics',
        'granularity',
        'commData',
        'clusterMap'
    ],
    components: {
        Communication,
        KpMatrix
    },
    data: () => ({
        id: null,
        kpMatrix: [],
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
        newCommPanel: false,
        isComparisonMode: false,
        kpMatrix_count: 1,
        track_cpds: []
    }),
    computed: {
        thresholdValue: function () {
            return (this.threshold / 100 * this.maxLinkValue).toFixed(0)
        }
    },
    watch: {
        // Function calls tick when data comes in. 		
        commData: function (val) {
            this.update()
        },
    },
    mounted() {
        let self = this
        EventHandler.$on('draw_kpmatrix_on_cpd', function (prev_cpd, cpd) {
            if (!self.track_cpds.includes(cpd)) {
                console.log("New CPD: ", prev_cpd, cpd)
                self.processForCommunication('interval')
                self.processForKpMatrixInterval(prev_cpd, cpd)
                self.track_cpds.push(cpd)
            }
        })

        this.id = this._uid + '-overview'
        this.init()

    },
    methods: {
        init() {
            if (this.commData != null) {
                console.log('Communication Panel [init]', this.granularity)
                this.processForCommunication('current')
                this.processForKpMatrixCurrent()
                this.visualize()
            }
        },

        update() {
            if(this.commData != null){            
                this.clusterIds = []
                console.log('Communication Panel [update]', this.granularity)
                this.processForCommunication('current')
                this.processForKpMatrixCurrent()
                this.visualize()
            }
        },

        clear() {

        },

        visualize() {
            this.$refs.KpMatrix.matrix = this.kpMatrix
            this.$refs.KpMatrix.clusterIds = this.clusterIds
            if (this.granularity == 'KpGid') {
                this.$refs.KpMatrix.init()
            }
            else if (this.granularity == 'Peid') {
                this.$refs.KpMatrix.init()
                // this.$refs.Communication.initVis()
            }
        },

        updateMetrics() {

        },

        // Parsing code for the picos view.
        processForCommunication(mode) {
            if (this.commData != null && Object.keys(this.commData).length !== 1) {
                for (let id in this.clusterMap) {
                    if (this.clusterMap.hasOwnProperty(id)) {
                        this.processIds.push(parseInt(id))
                        this.clusterIds.push(parseInt(this.clusterMap[id]))
                    }
                }
                this.comm_data = this.commData['df']
                let comm_schema = this.commData['schema']
                let comm_time = this.commData['time']

                if (this.prev_comm_time == null) {
                    this.prev_comm_time = 0
                }

                if (mode == 'current') {
                    this.timeIntervals = []
                    this.timeIntervals.push([this.prev_comm_time, comm_time])
                }
                else if (mode == 'interval') {
                    this.timeIntervals.push([this.prev_comm_time, comm_time])
                }
                // this.$refs.Communication.allMetrics = Object.keys(comm_schema).filter(k => k.slice(-2) !== 'id' && k.slice(-2) !== 'Id')
                this.prev_comm_time = comm_time
            }
        },

        processForKpMatrixCurrent() {
            // Parsing code for the KpGrid view.
            let input_data = this.commData['incoming_df']
            this.kpMatrix[0] = []
            input_data.map((data, kp) => {
                let comm_data = data['CommData']
                for (let i = 0; i < comm_data.length; i += 1) {
                    if (this.kpMatrix[0][kp] == undefined) {
                        this.kpMatrix[0][kp] = []
                    }
                    this.kpMatrix[0][kp][i] = {
                        x: kp,
                        j: i,
                        z: comm_data[i]
                    }
                }
            })
        },

        processForKpMatrixInterval(prev_cpd, cpd) {
            let input_data = this.commData['df']

            // Filter by time interval. 
            let filter_data = []
            for (let i = 0; i < input_data.length; i += 1) {
                if (input_data[i]['LastGvt'] > prev_cpd && input_data[i]['LastGvt'] <= cpd) {
                    filter_data.push(input_data[i])
                }
            }

            let number_of_ids = input_data[0]['CommData'].length
            let sum_by_ids = []
            filter_data.map((data, kp) => {
                let comm_data = data['CommData']
                let idx = Math.floor(kp / number_of_ids)
                sum_by_ids[idx] = []
                for (let i = 0; i < comm_data.length; i += 1) {
                    if (sum_by_ids[idx][i] == undefined) {
                        sum_by_ids[idx][i] = 0
                    }
                    sum_by_ids[idx][i] += comm_data[i]
                }
            })
            console.log(sum_by_ids)
            // take average of the data
            let avg_by_ids = []
            for (let id = 0; id < sum_by_ids.length; id += 1) {
                avg_by_ids[id] = []
                for (let i = 0; i < number_of_ids; i += 1) {
                    avg_by_ids[id][i] = sum_by_ids[id][i] / number_of_ids
                }
            }

            this.kpMatrix[this.kpMatrix_count] = []
            for (let id = 0; id < number_of_ids; id += 1) {
                for (let i = 0; i < number_of_ids; i += 1) {
                    if (this.kpMatrix[this.kpMatrix_count][id] == undefined) {
                        this.kpMatrix[this.kpMatrix_count][id] = []
                    }
                    this.kpMatrix[this.kpMatrix_count][id][i] = {
                        x: id,
                        j: i,
                        z: avg_by_ids[id][i]
                    }
                }
            }
            this.kpMatrix_count += 1
        }

    }
}