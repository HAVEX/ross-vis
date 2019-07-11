import * as d3 from 'd3'
import "d3-selection-multi";
import adjacencyMatrixLayout from './d3-adjacency-matrix-layout'
import template from '../html/LiveKpMatrix.html'
import EventHandler from './EventHandler'

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
        offset: 10,
        colorSet: ["#5576A5", "#E8CA4F", "#AB769F"],
        clusterIds: [],
        scaleKpCount: 16,
        pes:0, 
        max_weight:0,
        min:100,
    }),

    watch: {
    },

    mounted() {
        this.id = 'live-kpmatrix-overview' 

        EventHandler.$on('update_comm_min', (min) => {
            this.min = min
        })

    },

    methods: {
        init() {
            let visContainer = document.getElementById(this.id)
            this.containerWidth = visContainer.clientWidth
            this.containerHeight = this.containerWidth
            this.matrixWidth = this.containerWidth*this.matrixScale
            this.matrixHeight = this.containerHeight*this.matrixScale
        },

        reset() {
            this.visualize()
        },

        visualize(idx) {
            this.pes = this.matrix[idx].length
            this.nodeWidth = (this.matrixWidth / this.pes)
            this.nodeHeight = (this.matrixHeight / this.pes) 

            if (this.pes < this.scaleKpCount){
                this.clusterNodeOffset = this.nodeWidth/2
            }
            else{
                this.clusterNodeOffset = this.nodeHeight*3
            }

            let adjacencyMatrix = adjacencyMatrixLayout()
                .size([this.matrixWidth, this.matrixHeight])
                .useadj(true)
                .adj(this.matrix[idx])

            let matrixData = adjacencyMatrix()
            for (let i = 0; i < matrixData.length; i += 1) {
                this.max_weight = Math.max(this.max_weight, matrixData[i].weight)
                EventHandler.$emit('update_comm_max_weight', this.max_weight)
            }

            if (!Number.isNaN(matrixData[0].x)) {
                this.max_weight = 0
                for (let i = 0; i < matrixData.length; i += 1) {
                    this.max_weight = Math.max(this.max_weight, matrixData[i].weight)
                }

                d3.selectAll('.KpMatrix' + idx).remove()
                this.svg = d3.select('#' + this.id)
                    .append('svg')
                    .attrs({
                        transform: `translate(${0}, ${0})`,
                        width: this.matrixWidth + this.clusterNodeOffset, 
                        height: this.matrixHeight + this.clusterNodeOffset, 
                        class: 'KpMatrix' + idx,
                    })

                this.svg.selectAll('.rect' + idx)
                    .data(matrixData)
                    .enter()
                    .append('rect')
                    .attrs({
                        class: (d, i) => 'rect rect' + idx,
                        'width': (d) => this.nodeWidth,
                        'height': (d) => this.nodeHeight,
                        'x': (d) => d.x + this.clusterNodeOffset,
                        'y': (d) => d.y + this.clusterNodeOffset,
                    })
                    .style('stroke', (d, i) => {
                        if (d.target % this.scaleKpCount == this.scaleKpCount - 1  || d.source % this.scaleKpCount == this.scaleKpCount - 1)
                            return 'black'
                    })
                    .style('stroke-width', (d, i) => {
                        if (d.target % this.scaleKpCount == this.scaleKpCount - 1 || d.source % this.scaleKpCount == this.scaleKpCount - 1)
                            return '0.5px'
                        else
                            return '0.1px'
                    })
                    .style('stroke-opacity', 1)
                    .style('fill', d => "#8e0b0b")
                    .style('fill-opacity', d => { 
                        let opacity = (d.weight * 100) / (this.max_weight * (this.min))
                        return opacity
                    })
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
                        'width': (d) => this.clusterNodeOffset,
                        'height': (d) => this.nodeHeight,
                        'x': (d) => 0,
                        'y': (d, i) =>  this.nodeHeight * (i) + this.clusterNodeOffset,
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
                        'height': (d) => this.clusterNodeOffset,
                        'x': (d, i) => this.nodeWidth * (i) + this.clusterNodeOffset,
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

