import template from '../html/CommKpMatrixPanel.html'
import Communication from './Communication'
import AggrKpMatrix from './AggrKpMatrix'
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
        AggrKpMatrix
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
            // this.update()
        },
    },
    mounted() {
        let self = this
        EventHandler.$on('draw_kpmatrix_on_cpd', function (prev_cpd, cpd) {
            if (!self.track_cpds.includes(cpd) && cpd != undefined) {
                console.log("New CPD: ", prev_cpd, cpd)
                self.processForCommunication('interval')
                EventHandler.$emit('fetch_kpmatrix_on_cpd', prev_cpd, cpd)
            }
        })

        EventHandler.$on('fetch_kpmatrix_on_cpd_results', function (prev_cpd, cpd, matrix) {
            if (!self.track_cpds.includes(cpd)) {
                self.data = matrix['comm']['incoming_df']
                self.visualize()
                self.track_cpds.push(cpd)
            }
        })

        EventHandler.$on('draw_kpmatrix_on_click', function (prev_cpd, cpd, Peid) {
            if (!self.track_cpds.includes(cpd) && cpd != undefined) {
                console.log("New CPD: ", prev_cpd, cpd)
                self.processForCommunication('interval')
                EventHandler.$emit('fetch_kpmatrix_on_click', prev_cpd, cpd, Peid)
            }
        })

        EventHandler.$on('fetch_kpmatrix_on_click_results', function (cpd, matrix) {
            if (!self.track_cpds.includes(cpd)) {
                self.data = matrix['comm']['incoming_df']
                self.visualize()
                self.track_cpds.push(cpd)
            }
        })

        this.id = this._uid + '-overview'
        this.init()
    },
    methods: {
        init() {
            this.$refs.AggrKpMatrix.init()
        },

        visualize() {
            if (this.data != null) {
                console.log('Communication Panel [init]', this.data)
                let number_of_ids = this.data.length
                for (let id = 0; id < number_of_ids; id += 1) {
                    for (let i = 0; i < number_of_ids; i += 1) {
                        if (this.kpMatrix[id] == undefined) {
                            this.kpMatrix[id] = []
                        }
                        this.kpMatrix[id][i] = {
                            x: id,
                            j: i,
                            z: this.data[id]['CommData'][i]
                        }
                    }
                }

                this.$refs.AggrKpMatrix.matrix = this.kpMatrix
                this.$refs.AggrKpMatrix.clusterIds = this.clusterIds;
                this.$refs.AggrKpMatrix.visualize()
            }
        },

        clear() {

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
    }
}