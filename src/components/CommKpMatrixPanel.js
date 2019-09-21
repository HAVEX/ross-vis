import template from '../html/CommKpMatrixPanel.html'
import Communication from './Communication'
import AggrKpMatrix from './AggrKpMatrix'
import ColorMapAggrMatrix from './colormapAggrMatrix'
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
        AggrKpMatrix,
        ColorMapAggrMatrix
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
        value: 100,
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
                EventHandler.$emit('fetch_kpmatrix_on_cpd', prev_cpd, cpd)
            }
        })

        EventHandler.$on('fetch_kpmatrix_on_cpd_results', function (prev_cpd, cpd, matrix) {
            if (!self.track_cpds.includes(cpd)) {
                self.data = matrix['aggr_comm']['incoming_df']
                self.track_cpds.push(cpd)
                self.visualize()
            }
            self.$store.play = 1
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
                self.track_cpds.push(cpd)
                self.visualize()
            }
        })

        EventHandler.$on('update_comm_max_weight', (max_weight) => {
            this.max_weight = max_weight
        })

        this.id = + 'Communication-overview'
        this.init()
    },
    methods: {
        init() {
            this.$refs.AggrKpMatrix.init()
            this.$refs.ColorMapAggrMatrix.init('AggrMatrix')
            this.showSliderText()
        },

        showSliderText() {
            let width = 50;
            let x_offset = 10
            let y_offset = 10
            let radius = 5
            let padding = 10
            let height = 20
            d3.select('.sliderTextSVG').remove()
            let svg = d3.select("#sliderText")
                .append('svg')
                .attrs({
                    transform: `translate(${x_offset}, ${y_offset})`,
                    "width": width,
                    "height": height,
                    "class": "sliderTextSVG"
                })
                
            let min = [0, 2000]
            let text = svg.selectAll("text")
                .enter()
                .append("text")
                .text(this.minComm)
                .attrs({
                    // "x": (d, i) => { return i * gap + 2 * radius + padding },
                    // "y": (d, i) => { return radius + padding; },
                    "font-family": "sans-serif",
                    "font-size": 2 * radius + "px",
                    "fill": "black"
                })

            // let text = svg.selectAll("text")
            //     .enter()
            //     .append("text")
            //     .text(this.minComm)
            //     .attrs({
            //         // "x": (d, i) => { return i * gap + 2 * radius + padding },
            //         // "y": (d, i) => { return radius + padding; },
            //         "font-family": "sans-serif",
            //         "font-size": 2 * radius + "px",
            //         "fill": "black"
            //     })
        },

        change(type, msg){
            this.min = type

            d3.selectAll('.rect')
                .style('fill-opacity', d => {
                    return (d.weight * 100) / (this.max_weight*(this.min))
                })
            
            EventHandler.$emit('update_comm_min', this.min)
        },

        updateMarks(matrixData){
            let weights = []
            let mark_points = []

            for (let i = 0; i < matrixData.length; i += 1) {
                this.max_weight = Math.max(this.max_weight, matrixData[i].weight)
            }

            if(!this.weights.includes(this.max_weight)){
                this.weights.push(this.max_weight) 
            }

            weights = JSON.parse(JSON.stringify(this.weights))

            for(let i = 0; i < weights.length; i += 1){
                let mark = (weights[i]/this.max_weight)*100
                mark_points.push(mark.toFixed(1))
            }
            this.mark_points = mark_points
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
                            z: this.data[id]['CommData'][i],
                            id: this.processIds[i],
                            cluster: this.clusterIds[i],
                            clusters: this.clusterIds,
                            changePoint: this.track_cpds[i],
                            changeIdx: this.track_cpds.length - 1
                        }
                        this.minComm = Math.min(this.minComm, this.data[id]['CommData'][i])
                        this.maxComm = Math.max(this.maxComm, this.data[id]['CommData'][i])
                    }
                    console.log(this.data[id]['CommData'])
                }
                console.log(this.minComm, this.maxComm)
                this.$refs.ColorMapAggrMatrix.clear()
                this.$refs.ColorMapAggrMatrix.render(this.minComm, this.maxComm)
                this.$refs.AggrKpMatrix.matrix = this.kpMatrix
                this.$refs.AggrKpMatrix.clusterIds = this.clusterIds;
                this.$refs.AggrKpMatrix.visualize()
            }
        },

        clear() {
			this.$refs.ColorMapAggrMatrix.clear()
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