import * as d3 from 'd3'
import "d3-selection-multi";
import adjacencyMatrixLayout from './d3-adjacency-matrix-layout'
import template from '../html/LiveKpMatrix.html'

export default {
    name: 'LiveKpMatrix',
    template: template,
    props: [],

    data: () => ({
        id: null,
        data: null,
        view: null,
        vis: null,
        container: null,
        height: 0,
        width: 0,
        message: "Live communication view",
        matrix: null,
        matrixScale: 0.85,
        offset: 0,
        colorSet: ["#5576A5", "#E8CA4F", "#AB769F"],
        clusterIds: []
    }),

    watch: {
    },

    mounted() {
        this.id = 'live-kpmatrix-overview' + this._uid
    },

    methods: {
        init() {
            let visContainer = document.getElementById(this.id)
            this.width = (window.innerHeight / 3 - 20) * this.matrixScale
            this.height = (window.innerHeight / 3 - 20) * this.matrixScale
            this.padding = { top: 20, bottom: 0, left: 0, right: 0 }

            // this.num_of_matrix = this.matrix.length
            // for (let mat = 0; mat < this.matrix.length; mat += 1) {
            //     this.visualize(mat)
            // }
        },

        preprocess() {

        },

        initVis() {

        },

        reset() {
            this.visualize()
        },

        visualize(idx) {
            let Kp = this.matrix[idx].length
            this.boxWidth = this.width / Kp
            this.padding = { left: 50, top: 0, right: 60, bottom: 35 }
            this.nodeWidth = this.width / this.matrix[idx].length + 0.5
            this.nodeHeight = this.height / this.matrix[idx].length + 0.5

            let adjacencyMatrix = adjacencyMatrixLayout()
                .size([this.width - this.nodeWidth/2, this.height - this.nodeHeight/2 ])
                .useadj(true)
                .adj(this.matrix[idx])

            let matrixData = adjacencyMatrix()
            if (!Number.isNaN(matrixData[0].x)) {
                this.max_weight = 0
                for (let i = 0; i < matrixData.length; i += 1) {
                    this.max_weight = Math.max(this.max_weight, matrixData[i].weight)
                }

                d3.selectAll('.KpMatrix' + idx).remove()
                this.svg = d3.select('#' + this.id)
                    .append('svg')
                    .attrs({
                        transform: `translate(${this.offset * idx + this.offset}, ${0})`,
                        width: this.width,
                        height: this.height,
                        class: 'KpMatrix' + idx,
                    })

                this.svg.selectAll('.rect' + idx)
                    .data(matrixData)
                    .enter()
                    .append('rect')
                    .attrs({
                        class: 'rect' + idx,
                        'width': (d) => this.nodeWidth,
                        'height': (d) => this.nodeHeight,
                        'x': (d) => d.x + this.nodeWidth/2,
                        'y': (d) => d.y + this.nodeHeight/2,
                    })
                    // .style('stroke', 'black')
                    // .style('stroke-width', '1.5px')
                    .style('stroke-opacity', .3)
                    .style('fill', d => "#7BB6B0")
                    .style('fill-opacity', d => d.weight / this.max_weight + 0.1)
                    .on('click', (d) => {
                        console.log(d.id)
                    })

                
          
                // Append the kp value indicators:
                this.svg.selectAll('.clusterrectY' + idx)
                    .data(this.clusterIds)
                    .enter()
                    .append('rect')
                    .attrs({
                        class: 'clusterrectY' + idx,
                        'width': (d) => {
                            if(Kp < 16){
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

                this.svg.selectAll('.clusterrectX' + idx)
                    .data(this.clusterIds)
                    .enter()
                    .append('rect')
                    .attrs({
                        class: 'clusterrectX' + idx,
                        'width': (d) => this.nodeWidth,
                        'height': (d) => {
                            if(Kp < 16){
                                return this.nodeHeight / 2
                            }
                            return this.nodeHeight * 3
                        },
                        'x': (d, i) => this.nodeWidth*(i + 0.5),
                        'y': (d, i) => 0,
                    })
                    .style('stroke-opacity', .3)
                    .style('fill', (d, i) => this.colorSet[this.clusterIds[i]])

                d3.select('.KpMatrix')
                    .call(adjacencyMatrix.xAxis);

                d3.select('.KpMatrix')
                    .call(adjacencyMatrix.yAxis);
            }
        },
        
        clear() {
            d3.select('')
        },

    }
}

