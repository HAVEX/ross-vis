import * as d3 from 'd3'
import "d3-selection-multi";
import adjacencyMatrixLayout from './d3-adjacency-matrix-layout'
import template from '../html/AggrKpMatrix.html'

export default {
    name: 'AggrKpMatrix',
    template: template,
    components: {
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
        weights: [],
        max_weight: 0,
        scaleKpCount: 16,
        pes: 0
    }),

    watch: {
    },

    mounted() {
        this.id = 'kpmatrix-overview' + this._uid
    },

    methods: {
        init() {
        },



        reset() {
            this.visualize()
        },

        clearLine() {
            d3.selectAll('.intersectLine').remove()
        },

        drawLine(x, y) {
            let xPoints = [];
            for (let i = 0; i < this.cpds.length; i += 1) {
                xPoints.push()
            }

            this.svg.selectAll('intersectLine')
                .data(xPoints)
                .enter()
                .append('line')
                .attrs({
                    'class': 'intersectLine',
                    'x1': (d) => { return this.nodeWidth * 1 },
                    'y1': 0,
                    'x2': (d) => { return this.x(d) },
                    'y2': this.height - this.padding.bottom,
                })
                .style('stroke', '#DA535B')
                .style('stroke-width', '3.5px')
                .style('z-index', 100)
        },

        visualize(prev_cpd, cpd) {
            let panel1Height = document.getElementById('panel1').clientHeight
            let panel2Height = document.getElementById('panel2').clientHeight
            this.containerHeight = window.innerHeight - panel1Height - panel2Height;
            this.containerWidth = this.containerHeight

            console.log(panel1Height, panel2Height, this.containerHeight, this.containerWidth)
            console.log(this.containerHeight, this.containerWidth)
            this.matrixWidth = this.containerWidth * this.matrixScale
            this.matrixHeight = this.containerHeight * this.matrixScale

            // this.svg = d3.select('#' + this.id)
            //     .append('svg')
            //     .attrs({
            //         transform: `translate(${this.offset * this.idx}, ${0})`,
            //         width: this.matrixWidth + this.clusterNodeOffset,
            //         height: this.matrixHeight + this.clusterNodeOffset,
            //         class: 'overlay',
            //     })

            this.pes = this.matrix.length
            this.nodeWidth = this.matrixWidth / this.pes
            this.nodeHeight = this.matrixHeight / this.pes

            if (this.pes < this.scaleKpCount) {
                this.clusterNodeOffset = this.nodeWidth / 2
            }
            else {
                this.clusterNodeOffset = this.nodeHeight * 3
            }

            let adjacencyMatrix = adjacencyMatrixLayout()
                .size([this.matrixWidth, this.matrixHeight])
                .useadj(true)
                .adj(this.matrix)
            // .prev_cpd(prev_cpd)
            // .cpd(cpd)

            this.matrixData = adjacencyMatrix()

            this.$parent.updateMarks(this.matrixData)

            d3.selectAll('.KpMatrixI' + this.idx).remove()
            this.svg = d3.select('#' + this.id)
                .append('svg')
                .attrs({
                    transform: `translate(${this.offset * this.idx + this.offset}, ${0})`,
                    width: this.matrixWidth + this.clusterNodeOffset,
                    height: this.matrixHeight + this.clusterNodeOffset,
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
                    'x': (d) => d.x + this.clusterNodeOffset,
                    'y': (d) => d.y + this.clusterNodeOffset,
                })
                .style('stroke', (d, i) => {
                    if (d.target % this.scaleKpCount == this.scaleKpCount - 1 || d.source % this.scaleKpCount == this.scaleKpCount - 1)
                        return 'black'
                })
                .style('stroke-width', (d, i) => {
                    if (d.target % this.scaleKpCount == this.scaleKpCount - 1 || d.source % this.scaleKpCount == this.scaleKpCount - 1)
                        return '0.5px'
                    else
                        return '0.1px'
                })
                .style('stroke-opacity', 1)
                .style('fill', (d, i) => {
                    return "#8e0b0b";
                })
                .style('fill-opacity', d => {
                    return (d.weight * 100) / (this.$parent.max_weight * (this.$parent.max - this.$parent.min))
                })
                .on('click', (d) => {
                    console.log(d.id)
                })
                .on('dblclick', (d) => {
                    console.log(d)
                })

            // this.svg.selectAll(".cell")
            //     .data(cross(traits, traits))
            //     .enter().append("g")
            //     .attr("class", "cell")
            //     .attr("transform", function(d) { return "translate(" + (n - d.i - 1) * size + "," + d.j * size + ")"; })
            //     .each(plot);

            // Append the kp value indicators:
            this.svg.selectAll('.clusterrectIY' + this.idx)
                .data(this.clusterIds)
                .enter()
                .append('rect')
                .attrs({
                    class: 'clusterrectIY' + this.idx,
                    'width': (d) => this.clusterNodeOffset,
                    'height': (d) => this.nodeHeight,
                    'x': (d) => 0,
                    'y': (d, i) => this.nodeHeight * (i) + this.clusterNodeOffset,
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
                    'height': (d) => this.clusterNodeOffset,
                    'x': (d, i) => this.nodeWidth * (i) + this.clusterNodeOffset,
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
    }
}

