import template from '../html/CommKpMatrixPanel.html'
import Communication from './Communication'
import AggrKpMatrix from './AggrKpMatrix'
import BaseKpMatrix from './BaseKpMatrix'
import DiffKpMatrix from './DiffKpMatrix'
import AggrMatrixColormap from './AggrMatrixColormap'
import EventHandler from './EventHandler'
import * as d3 from 'd3'

import VueSlider from 'vue-slider-component'
import 'vue-slider-component/theme/antd.css'

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
        VueSlider,
        // AggrKpMatrix,
        DiffKpMatrix,
        BaseKpMatrix,
        AggrMatrixColormap
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
        message: "Aggregated Communication view",
        track_cpds: [],
        value: 1,
        min: 100,
        mark_points: [0],
        weights: [],
        max_weight: 0,
        maxComm: 0,
        minComm: 0

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
                EventHandler.$emit('fetch_kpmatrix_on_interval_request', prev_cpd, cpd)
            }
        })

        EventHandler.$on('fetch_kpmatrix_on_interval', function (prev_cpd, cpd, data) {
            if (!self.track_cpds.includes(cpd)) {
                self.data = data['data']
                self.kpData = data['aggr_kp_comm']
                self.peData = data['aggr_pe_comm']
                self.kpCount = data['kp_count']
                self.peCount = data['pe_count']
                self.maxComm = data['max_comm']
                self.minComm = data['min_comm']
                self.track_cpds.push(cpd)
                self.visualize()
            }
            self.$store.play = 1
        })

        EventHandler.$on('fetch_kpmatrix_on_base', function (data) {
            self.data = data['data']
            self.kpData = data['kp_comm']
            self.peData = data['pe_comm']
            self.kpCount = data['kp_count']
            self.peCount = data['pe_count']
            self.maxComm = data['max_comm']
            self.minComm = data['min_comm']
            self.visualize_base()
            self.$store.play = 1
        })

        EventHandler.$on('fetch_kpmatrix_on_cpd', function (data) {
            self.data = data['data']
            self.kpData = data['kp_comm']
            self.peData = data['pe_comm']
            self.kpCount = data['kp_count']
            self.peCount = data['pe_count']
            self.maxComm = data['max_comm']
            self.minComm = data['min_comm']
            self.visualize_cpd()
        })
        
        EventHandler.$on('update_comm_max_weight', (max_weight) => {
            this.max_weight = max_weight
        })

        this.id = + 'Communication-overview'
        this.init()
    },
    methods: {
        init() {
            // this.$refs.AggrKpMatrix.init()
            this.$refs.DiffKpMatrix.init()
            this.$refs.BaseKpMatrix.init()
            this.$refs.AggrMatrixColormap.init()

            // this.showSliderText()
        },

        change(type, msg) {
            this.min = type

            d3.selectAll('.aggrRect')
                .style('fill', (d, i) => {
                    let val = d.weight * 100 / this.max_weight * (100 - this.min)
                    return d3.interpolateReds(val)
                })
        },

        visualize() {
            if (this.kpData != null && this.peData != null) {
                console.log('Communication Panel [init]', this.data)
                let number_of_ids = this.kpData.length
                for (let id = 0; id < number_of_ids; id += 1) {
                    for (let i = 0; i < number_of_ids; i += 1) {
                        if (this.kpMatrix[id] == undefined) {
                            this.kpMatrix[id] = []
                        }
                        let pe_z = this.peData[Math.floor(id / this.kpCount)][Math.floor(i / this.kpCount)]
                        this.kpMatrix[id][i] = {
                            z: this.kpData[id][i],
                            pe_z: pe_z,
                            id: this.processIds[i],
                            kpid: this.data[id]['Kpid'],
                            kpgid: this.data[id]['KpGid'],
                            peid: this.data[id]['Peid'],
                            cluster: this.clusterIds[i],
                            clusters: this.clusterIds,
                            changePoint: this.track_cpds[i],
                            changeIdx: this.track_cpds.length - 1,
                            max_comm: this.maxComm,
                            min_comm: this.minComm
                        }
                    }
                }
                this.clear()
                this.$refs.AggrMatrixColormap.render(this.minComm, this.maxComm)
                this.$refs.AggrKpMatrix.matrix = this.kpMatrix
                this.$refs.AggrKpMatrix.clusterIds = this.clusterIds;
                this.$refs.AggrKpMatrix.visualize()
                this.$refs.AggrKpMatrix.update(this.maxComm)

            }
        },

        visualize_base() {
            if (this.kpData != null && this.peData != null) {
                console.log(this.$store)
                let number_of_ids = this.kpData.length
                for (let id = 0; id < number_of_ids; id += 1) {
                    for (let i = 0; i < number_of_ids; i += 1) {
                        if (this.kpMatrix[id] == undefined) {
                            this.kpMatrix[id] = []
                        }
                        let pe_x_index = Math.floor(id/this.kpCount)
                        let pe_y_index = Math.floor(i/this.kpCount)
                        // console.log(pe_x_index, pe_y_index)
                        let pe_z = this.peData[pe_x_index][pe_y_index]
                        
                        let kpCommData = this.data[id]['CommData']
                        // let index = id * this.kp_count + i
                        let index = i
                        this.kpMatrix[id][i] = {
                            z: kpCommData[i],
                            pe_z: pe_z,
                            id: this.$store.result[this.$store.selectedDragTimeRound].processIds[i],
                            kpid: this.data[index]['Kpid'],
                            kpgid: this.data[index]['KpGid'],
                            peid: this.data[index]['Peid'],
                            cluster: this.$store.result[this.$store.selectedDragTimeRound].clusterIds[i],
                            clusters: this.$store.result[this.$store.selectedDragTimeRound].clusterIds,
                            maxComm: this.maxComm,
                            minComm: this.minComm
                        }
                    }
                }
                this.clear()
                // this.$refs.AggrMatrixColormap.render(this.minComm, this.maxComm)
                this.$refs.BaseKpMatrix.matrix = this.kpMatrix
                this.$refs.BaseKpMatrix.clusterIds = this.clusterIds;
                this.$refs.BaseKpMatrix.visualize()
                // this.$refs.BaseKpMatrix.update(this.maxComm)
            }
        },

        visualize_cpd() {
            if (this.kpData != null && this.peData != null) {
                console.log(this.$store.currentCPDRound, this.$store.result)
                if(this.$store.currentCPDRound in this.$store.result){
                    this.$store.currentCPDRound = this.$store.currentCPDRound
                }
                else{
                    this.$store.currentCPDRound = this.$store.currentCPDRound + 0.01
                }
                console.log(this.$store.currentCPDRound)
                let number_of_ids = this.kpData.length
                for (let id = 0; id < number_of_ids; id += 1) {
                    for (let i = 0; i < number_of_ids; i += 1) {
                        if (this.kpMatrix[id] == undefined) {
                            this.kpMatrix[id] = []
                        }
                        let pe_x_index = Math.floor(id/this.kpCount)
                        let pe_y_index = Math.floor(i/this.kpCount)
                        // console.log(pe_x_index, pe_y_index)
                        let pe_z = this.peData[pe_x_index][pe_y_index]
                        
                        let kpCommData = this.data[id]['CommData']
                        // let index = id * this.kp_count + i
                        let index = i
                        this.kpMatrix[id][i] = {
                            z: kpCommData[i],
                            pe_z: pe_z,
                            id: this.$store.result[this.$store.currentCPDRound].processIds[i],
                            kpid: this.data[index]['Kpid'],
                            kpgid: this.data[index]['KpGid'],
                            peid: this.data[index]['Peid'],
                            cluster: this.$store.result[this.$store.currentCPDRound].clusterIds[i],
                            clusters: this.$store.result[this.$store.currentCPDRound].clusterIds,
                            maxComm: this.maxComm,
                            minComm: this.minComm
                        }
                    }
                }
                this.clear()
                console.log(this.$refs)
                this.$refs.DiffKpMatrix.matrix = this.kpMatrix
                this.$refs.DiffKpMatrix.visualize()
                this.$refs.AggrMatrixColormap.render(this.$refs.DiffKpMatrix.minPE, this.$refs.DiffKpMatrix.maxPE)
                // this.$refs.BaseKpMatrix.update(this.maxComm)
            }
            // this.$store.play = 1
        },


        clear() {
            this.$refs.AggrMatrixColormap.clear()
        },

        updateMetrics() {

        },

        // Parsing code for the picos view.
        processForCommunication(mode) {
            this.clusterIds = []
            this.processIds = []
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