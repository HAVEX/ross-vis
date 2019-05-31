import * as d3 from 'd3'
import "d3-selection-multi";
import adjacencyMatrixLayout from './d3-adjacency-matrix-layout'
import template from '../html/AggrKpMatrix.html'

import VueSlider from 'vue-slider-component'
import 'vue-slider-component/theme/antd.css'

export default {
    name: 'AggrKpMatrix',
    template: template,
    components: {
        VueSlider
    },
    props: [],

    data: () => ({
        id: null,
        height: 0,
        width: 0,
        message: "Aggregated Communication view",
        matrix: null,
        matrixScale: 0.85,
        offset: 30,
        colorSet: ["#5576A5", "#E8CA4F", "#AB769F"],
        clusterIds: [],
        idx: 0,
        value: [0, 100],
        mark_points: [0],
        weights: [],
        max_weight: 0,
        max:100,
        min:0,
    }),

    watch: {
    },

    mounted() {
        this.id = 'kpmatrix-overview' + this._uid
    },

    methods: {
        init() {
            let visContainer = document.getElementById(this.id)
            this.width = (window.innerHeight / 3 - 20) * this.matrixScale
            this.height = (window.innerHeight / 3 - 20) * this.matrixScale
            this.padding = { top: 20, bottom: 0, left: 0, right: 0 }
        },

        change(type, msg){
            this.min = type[0]
            this.max = type[1]

            d3.selectAll('.rect')
                .style('fill-opacity', d => {
                    return (d.weight * 100) / (this.max_weight*(this.max - this.min))
                })
        },

        updateMarks(){
            let weights = []
            let mark_points = []

            for (let i = 0; i < this.matrixData.length; i += 1) {
                this.max_weight = Math.max(this.max_weight, this.matrixData[i].weight)
            }

            if(!this.weights.includes(this.max_weight)){
                this.weights.push(this.max_weight)
            }

            weights = JSON.parse(JSON.stringify(this.weights))

            for(let i = 0; i < weights.length; i += 1){
                let mark = (weights[i]/this.max_weight)*100
                mark_points.push(mark.toFixed(3))
            }
            this.mark_points = mark_points
        },

        reset() {
            this.visualize()
        },

        visualize(prev_cpd, cpd) {
            let uniqueKpCount = 16
            let Kp = this.matrix.length
            this.nodeWidth = this.width / Kp
            this.nodeHeight = this.height / Kp
            this.padding = { left: 50, top: 0, right: 60, bottom: 35 }
            this.nodeWidth = this.width / this.matrix.length + 0.5
            this.nodeHeight = this.height / this.matrix.length + 0.5

            let adjacencyMatrix = adjacencyMatrixLayout()
                .size([this.width - this.nodeWidth / 2, this.height - this.nodeHeight / 2])
                .useadj(true)
                .adj(this.matrix)
            // .prev_cpd(prev_cpd)
            // .cpd(cpd)

            this.matrixData = adjacencyMatrix()

            this.updateMarks()

            d3.selectAll('.KpMatrixI' + this.idx).remove()
            this.svg = d3.select('#' + this.id)
                .append('svg')
                .attrs({
                    transform: `translate(${this.offset * this.idx + this.offset}, ${0})`,
                    width: this.width,
                    height: this.height,
                    class: 'KpMatrixI' + this.idx,
                })

                this.svg.selectAll('.rect' + this.idx)
                    .data(this.matrixData)
                    .enter()
                    .append('rect')
                    .attrs({
                        class: 'rect rect' + this.idx,
                        'width': (d) => this.nodeWidth,
                        'height': (d) => this.nodeHeight,
                        'x': (d) => d.x + this.nodeWidth / 2,
                        'y': (d) => d.y + this.nodeHeight / 2,
                    })
                    .style('stroke', (d, i) => {
                        if (d.target % uniqueKpCount == 0 || d.source % uniqueKpCount == 0)
                            return 'black'
                    })
                    .style('stroke-width', (d, i) => {
                        if (d.target % uniqueKpCount == 0 || d.source % uniqueKpCount == 0)
                            return '0.1px'
                    })
                    .style('stroke-opacity', 1)
                    .style('fill', d => "#8e0b0b")
                    .style('fill-opacity', d => {
                        return (d.weight * 100) / (this.max_weight*(this.max - this.min))
                    })
                    .on('click', (d) => {
                        console.log(d.id)
                    })

                // Append the kp value indicators:
                this.svg.selectAll('.clusterrectIY' + this.idx)
                    .data(this.clusterIds)
                    .enter()
                    .append('rect')
                    .attrs({
                        class: 'clusterrectIY' + this.idx,
                        'width': (d) => {
                            if (Kp < 16) {
                                return this.nodeWidth / 2
                            }
                            return this.nodeWidth * 3
                        },
                        'height': (d) => this.nodeHeight,
                        'x': (d) => 0,
                        'y': (d, i) => this.nodeHeight * (i + 0.5),
                    })
                    .style('stroke-opacity', .3)
                    .style('fill', (d, i) => this.colorSet[this.clusterIds[i]])

                this.svg.selectAll('.clusterrectIX' + this.idx)
                    .data(this.clusterIds)
                    .enter()
                    .append('rect')
                    .attrs({
                        class: 'clusterrectIX' + this.idx,
                        'width': (d) => this.nodeWidth,
                        'height': (d) => {
                            if (Kp < 16) {
                                return this.nodeHeight / 2
                            }
                            return this.nodeHeight * 3
                        },
                        'x': (d, i) => this.nodeWidth * (i + 0.5),
                        'y': (d, i) => 0,
                    })
                    .style('stroke-opacity', .3)
                    .style('fill', (d, i) => this.colorSet[this.clusterIds[i]])

                d3.select('.KpMatrixI')
                    .call(adjacencyMatrix.xAxis);

                d3.select('.KpMatrixI')
                    .call(adjacencyMatrix.yAxis);

            this.idx += 1
        },

        clear() {
        },

    }
}

