import * as d3 from 'd3'
import template from '../html/D3Dimensionality.html'

export default {
  name: 'D3Dimensionality',
  template: template,
  props: [],
  data: () => ({
    id: null,
    data: null,
    config: null,
    vis: null,
    colorBy: null,
    colorSet: ["#F8A51F", "#F8394E", "#517FB2"],
  }),
  mounted() {
    this.id = 'dim-overview' + this._uid
  },
  methods: {
    init() {
        let visContainer = document.getElementById(this.id)
        this.width = visContainer.clientWidth
        this.height = window.innerHeight / 3 - 20
        this.padding = { left: 50, top: 0, right: 50, bottom: 30 }
        this.x = d3.scaleLinear().range([0, this.width]);
        this.y = d3.scaleLinear().range([this.height, 0]);
    },

    initVis(ts) {
        this.prefix = d3.formatPrefix(1.21e9);

        this.xAxis = d3.axisBottom(this.x)
            .tickPadding(10)
            .tickFormat(d3.format('0.1s'))

        this.yAxis = d3.axisLeft(this.y)
            .tickPadding(10)
            .tickFormat(d3.format('0.1s'))

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
        let xMin = 0
        let xMax = 0
        let yMin = 0
        let yMax = 0
        for(let [id, res] of Object.entries(ts)){
            let x = res['PC0'][0]
            let y = res['PC1'][0]

            if(x < xMin){
                xMin = x
            }
            if(x > xMax){
                xMax = x
            }
            if(y < yMin){
                yMin = y
            }
            if(y > yMax){
                yMax = y
            }
        
        }

        console.log(xMin, xMax, yMin, yMax)

        this.x.domain([2.0*xMin, 2.0*xMax ])
        this.y.domain([2.0*yMin, 2.0*yMax ])

        d3.selectAll('.circle' + this.id).remove()
        for (let [id, res] of Object.entries(ts)) {
            this.data = this.svg.append('circle')
                .attrs({
                    'class': 'circle' + this.id,
                })

            let time = res['time']
            let data = res['ts']
            let cluster = res['cluster'][0]

            this.xAxisSVG
                .call(this.xAxis)

            this.yAxisSVG
                .call(this.yAxis)

            let self = this
            this.data
                .datum(res)
                .attrs({
                    stroke: this.colorSet[cluster],
                    r: 3,
                    'stroke-width': 1.0,
                    fill: this.colorSet[cluster],
                    cx: function(d) { console.log(d['PC0'][0]); return self.x(d['PC0'][0]) },
                    cy: function(d) { return self.y(d['PC1'][0]) },
                })
        }
    },
  }
}

