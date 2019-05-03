import * as d3 from 'd3'
import "d3-selection-multi";
import adjacencyMatrixLayout from '../libs/d3-adjacency-matrix-layout'
import template from '../html/KpMatrix.html'

export default {
    name: 'KpMatrix',
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
        message: "Current Sample",
        matrix: null,
        matrixScale: 0.85,
        offset: 40,
        colorSet: ["#F8A51F", "#F8394E", "#517FB2"],
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
            this.padding = {top: 20, bottom : 0, left : 0, right: 0}

            console.log(this.matrix)
            this.num_of_matrix = this.matrix.length
            for(let mat = 0; mat < this.matrix.length; mat += 1){
                this.visualize(mat)
            }      
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
            
            let adjacencyMatrix = adjacencyMatrixLayout()
                .size([this.width, this.height])
                .useadj(true)
                .adj(this.matrix[idx])

            let matrixData = adjacencyMatrix()
            
            this.max_weight = 0
            for(let i = 0; i < matrixData.length; i += 1){
                this.max_weight = Math.max(this.max_weight, matrixData[i].weight)
            }

            d3.selectAll('.KpMatrix' + idx).remove()
            this.svg = d3.select('#' + this.id)
                .append('svg')
                .attrs({
                    transform: `translate(${this.offset*idx}, ${0})`,
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
                    'width': (d) => d.width,
                    'height': (d) => d.height,
                    'x': (d) => d.x,
                    'y': (d) => d.y,
                })
                .style('stroke', 'black')
                .style('stroke-width', '1.5px')
                .style('stroke-opacity', .3)
                .style('fill', d => "#7BB6B0")
                .style('fill-opacity', d => d.weight/this.max_weight);

            d3.select('.KpMatrix')
                .call(adjacencyMatrix.xAxis);

            d3.select('.KpMatrix')
                .call(adjacencyMatrix.yAxis);

        },

    }
}

