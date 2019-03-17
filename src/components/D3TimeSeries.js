import * as d3 from 'd3'
import { selection } from "d3-selection";
import "d3-selection-multi";
import template from '../html/D3TimeSeries.html'
export { selection };

export default {
    name: 'D3TimeSeries',
    template: template,
    props: ['ts', 'clustering', 'cpd'],
    data: () => ({
        id: null,
        data: null,
        view: null,
        vis: null,
        container: null,
        enableInteraction: true,
        height: 0,
        width: 0,
        metrics: null,
        selectedTimeDomain: null,
        showCPD: false,
        selectedMeasure: null,
        methods: ['AFF', 'CUSUM', 'EMMV', 'PCA'],
        selectedMethod: 'AFF',
        current_views: [],
        cpds: [],
        colorSet: ["#F8A51F", "#F8394E", "#517FB2"]
    }),
    mounted() {
        this.id = 'time-overview' + this._uid
    },
    methods: {
        init() {
            let visContainer = document.getElementById(this.id)
            this.width = visContainer.clientWidth
            this.height = window.innerHeight / 3 - 20
            this.padding = { left: 50, top: 0, right: 60, bottom: 30 }
            this.x = d3.scaleLinear().range([0, this.width - this.padding.right]);
            this.y = d3.scaleLinear().range([this.height - this.padding.bottom, 0]);
        },

        initVis(ts) {
            this.xAxis = d3.axisBottom(this.x)
                .tickPadding(10)
                .tickFormat(d3.format('0.1s'))

            this.yAxis = d3.axisLeft(this.y)
                .tickPadding(10)
                .tickFormat(d3.format('0.1s'))


            this.line = d3.line()
                .x((d, i) => this.x(i))
                .y(d => this.y(d));

            this.svg = d3.select('#' + this.id).append('svg')
                .attrs({
                    width: this.width,
                    height: this.height,
                    transform: 'translate(0, 0)'
                })

            this.xAxisSVG = this.svg.append('g')
                .attrs({
                    transform: `translate(${this.padding.left}, ${this.height - this.padding.bottom})`,
                    class: 'x-axis',
                    'stroke-width': '2px'
                })
                .call(this.xAxis);

            this.yAxisSVG = this.svg.append('g')
                .attrs({
                    transform: `translate(${this.padding.left}, ${this.padding.top})`,
                    class: 'y-axis',
                    'stroke-width': '2px'
                })
                .call(this.yAxis);

            this.yDom = [0, 0]
        },

        clearVis(ts) {
            this.visualize(ts)
        },

        visualize(ts) {
            d3.selectAll('.line' + this.id).remove()
            for (let [id, res] of Object.entries(ts)) {
                this.data = this.svg.append('path')
                    .attr('class', 'line' + this.id);

                let time = res['time']
                let data = res['ts']
                let cluster = res['cluster'][0]
                this.x.domain([0, data.length - 1])
                let yDomTemp = d3.extent(data)
                if (yDomTemp[1] > this.yDom[1])
                    this.yDom[1] = yDomTemp[1]
                this.y.domain(this.yDom)

                this.xAxisSVG
                    .call(this.xAxis)

                this.yAxisSVG
                    .call(this.yAxis)

                this.data
                    .datum(data)
                    .attrs({
                        d: this.line,
                        stroke: this.colorSet[cluster],
                        'stroke-width': 1.0,
                        fill: 'transparent',
                        transform: `translate(${this.padding.left}, ${this.padding.top})`,
                    })
            }
        },
    }
}

