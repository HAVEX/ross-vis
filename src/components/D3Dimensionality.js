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
        zoomed: false,
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

            this.brush = d3.brush()
                .on("end", this.brushended)

            // set the transition
            this.t = this.svg
                .transition()
                .duration(750);

        },

        clearVis(ts) {
            this.visualize(ts)
        },

        visualize(ts) {
            this.svg.append('g')
                .attr('class', 'brush')
                .call(this.brush)
            
            this.xMin = 0
            this.xMax = 0
            this.yMin = 0
            this.yMax = 0
            for (let [id, res] of Object.entries(ts)) {
                let x = res['PC0'][0]
                let y = res['PC1'][0]

                if (x < this.xMin) {
                    this.xMin = x
                }
                if (x > this.xMax) {
                    this.xMax = x
                }
                if (y < this.yMin) {
                    this.yMin = y
                }
                if (y > this.yMax) {
                    this.yMax = y
                }

            }

            this.x.domain([2.0 * this.xMin, 2.0 * this.xMax])
            this.y.domain([2.0 * this.yMin, 2.0 * this.yMax])

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
                        cx: function (d) { return self.x(d['PC0'][0]) },
                        cy: function (d) { return self.y(d['PC1'][0]) },
                    })
            }
        },

        brushended() {
            let idleDelay = 350;
            let s = d3.event.selection;
            if (!s) {
                if (!this.idleTimeout) 
                    return this.idleTimeout = setTimeout(this.idled, idleDelay);
                this.x.domain([2.0 * xMin, 2.0 * xMax]);
                this.y.domain([2.0 * yMin, 2.0 * yMax]);
            } 
            else {
                this.xAxis = d3.axisBottom(this.x)
                .tickPadding(10)

            this.yAxis = d3.axisLeft(this.y)
                .tickPadding(10)

                // set the scale domains based on selection
                this.x.domain([s[0][0], s[1][0]].map(this.x.invert, this.x));
                this.y.domain([s[1][1], s[0][1]].map(this.y.invert, this.y));
                
                // https://github.com/d3/d3-brush/issues/10
                if (!d3.event.sourceEvent) return;
                
                // to set the brush movement to null. But doesnt do the required trick.
                // Reason: maybe webpack
                // https://github.com/d3/d3-brush/issues/10
                d3.select(".brush").call(this.brush.move, null);
            }
            this.zoom();
        },

        idled() {
            this.idleTimeout = null;
        },

        zoom() {
            // for unzoom button; Needs fix
            this.zoomed = true
            
            // adjust the scales
            this.svg.select(".x-axis").transition(this.t).call(this.xAxis);
            this.svg.select(".y-axis").transition(this.t).call(this.yAxis);
            
            // Put circles back in view
            let self = this
            this.svg.selectAll(".circle" + this.id).transition(this.t)
                .attr("cx", function (d) { return self.x(d['PC0'][0]); })
                .attr("cy", function (d) { return self.y(d['PC1'][0]); });
            
            // Clear brush selection box
            this.svg.selectAll(".selection")
                .attrs({
                    x:0,
                    y:0,
                    width: 0,
                    height:0
                })
        },

        unzoom() {
            // Untoggle the unzoom button.
            this.zoomed = false

            // reset the scale domains
            this.x.domain([2.0 * this.xMin, 2.0 * this.xMax])
            this.y.domain([2.0 * this.yMin, 2.0 * this.yMax])
            
            // adjust the scale
            this.svg.select(".x-axis").transition(this.t).call(this.xAxis);
            this.svg.select(".y-axis").transition(this.t).call(this.yAxis);
            
            // Put circles back
            let self = this
            this.svg.selectAll(".circle" + this.id).transition(this.t)
                .attr("cx", function (d) { return self.x(d['PC0'][0]); })
                .attr("cy", function (d) { return self.y(d['PC1'][0]); });
        }

    },
}


