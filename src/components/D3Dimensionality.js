import * as d3 from 'd3'
import { lasso } from './lasso';
import template from '../html/D3Dimensionality.html'

export default {
    name: 'D3Dimensionality',
    template: template,
    props: [],
    data: () => ({
        id: null,
        ts: null,
        config: null,
        vis: null,
        colorBy: null,
        zoomed: false,
        xMin: 0,
        xMax: 0,
        yMin: 0,
        yMax: 0,
        message: 'Behavior Similarity view',
        showMessage: false,
    }),
    mounted() {
        this.id = 'dim-overview' + this._uid
    },
    methods: {
        init() {
            let visContainer = document.getElementById(this.id)
            let dashboardHeight = document.getElementById('dashboard').clientHeight
            let toolbarHeight = document.getElementById('toolbar').clientHeight
            let chipContainerHeight = document.getElementById('chip-container').clientHeight

            this.width = visContainer.clientWidth
            this.height = (dashboardHeight - toolbarHeight - chipContainerHeight) / 3
            this.padding = { left: 50, top: 0, right: 50, bottom: 30 }
            this.x = d3.scaleLinear().range([0, this.width]);
            this.y = d3.scaleLinear().range([this.height, 0]);
            // this.d3zoom = d3.zoom()
            //     .on("zoom", this.zoom())
        },

        axis() {
            this.xAxis = d3.axisBottom(this.x)
                .tickPadding(10)
                .tickFormat(d3.format('0.1s'))

            this.yAxis = d3.axisLeft(this.y)
                .tickPadding(10)
                .tickFormat(d3.format('0.1s'))

            this.yDom = [0, 0]

            // this.xAxisSVG = this.svg.append('g')
            //     .attrs({
            //         transform: `translate(${this.padding.left}, ${this.height - this.padding.bottom})`,
            //         class: 'x-axis',
            //         'stroke-width': '2px'
            //     })
            //     .call(this.xAxis);

            // this.yAxisSVG = this.svg.append('g')
            //     .attrs({
            //         transform: `translate(${this.padding.left}, ${this.padding.top})`,
            //         class: 'y-axis',
            //         'stroke-width': '2px'
            //     })
            //     .call(this.yAxis);

        },

        label() {

        },

        initVis(ts) {
            this.svg = d3.select('#' + this.id).append('svg')
                .attrs({
                    width: this.width,
                    height: this.height,
                    transform: 'translate(0, 0)'
                })
                .style('stroke-width', 1)
                .style('stroke', '#aaaaaa')

            // set the transition
            this.t = this.svg
                .transition()
                .duration(750);
        },

        reset(ts) {
            this.visualize(ts)
        },

        preprocess(data) {
            let ret = []
            for (let [id, res] of Object.entries(data)) {
                ret[id] = []
                ret[id].push(res['PC0'][0])
                ret[id].push(res['PC1'][0])
                ret[id].push(res['cluster'][0])
                ret[id].push(id)

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
            return ret
        },

        visualize(ts) {
            this.ts = ts
            this.data = this.preprocess(ts)
            this.x.domain([2.0 * this.xMin, 2.0 * this.xMax])
            this.y.domain([2.0 * this.yMin, 2.0 * this.yMax])

            // this.xAxisSVG
            //     .call(this.xAxis)

            // this.yAxisSVG
            //     .call(this.yAxis)

            d3.selectAll('.circle' + this.id).remove()
            d3.selectAll('.lasso' + this.id).remove()
            let self = this
            this.circles = this.svg.selectAll('circle')
                .data(this.data)
                .enter()
                .append('circle')
                .attrs({
                    class: (d) => { return 'dot' + ' circle' + this.id },
                    id: (d) => { return 'dot' + d[3] },
                    stroke: (d) => { return this.$store.colorset[d[2]] },
                    r: (d) => {
                        if (Object.entries(ts).length < 16) return 6.0
                        else return 4.5
                    },
                    'stroke-width': 1.0,
                    fill: (d) => { return this.$store.colorset[d[2]] },
                    id: (d) => { return 'dot' + d[3] },
                    cx: (d, i) => { return self.x(d[0]) },
                    cy: (d) => { return self.y(d[1]) },
                })
            // .call(this.d3zoom)

            this.lasso = lasso()
                .className('lasso' + this.id)
                .closePathSelect(true)
                .closePathDistance(100)
                .items(this.circles)
                .targetArea(this.svg)
                .on("start", this.lassoStart)
                .on("draw", this.lassoDraw)
                .on("end", this.lassoEnd);

            this.svg.call(this.lasso)
        },

        // ====================================
        // Interaction functions
        // ====================================
        lassoStart() {
            d3.selectAll('.dot')
                .attrs({
                    opacity: 1,
                })

            this.lasso.items()
                .attr("r", (d) => {
                    if (Object.entries(this.ts).length < 16) return 6.0
                    else return 4.5
                }) // reset size
                .classed("not_possible", true)
                .classed("selected", false);
        },

        lassoDraw() {
            // Style the possible dots
            this.lasso.possibleItems()
                .classed("not_possible", false)
                .classed("possible", true);

            // Style the not possible dot
            this.lasso.notPossibleItems()
                .classed("not_possible", true)
                .classed("possible", false);
        },

        lassoEnd() {
            d3.selectAll('.dot')
                .attrs({
                    opacity: 0.3,
                })

            d3.selectAll('.liveMatrix')
                .attrs({
                    opacity: 0.5
                })

            d3.selectAll('.live-rect')
                .style('fill-opacity', d => {
                    return (d.weightAggr) / (this.$store.liveMax)
                })

            this.selectedIds = []
            // Reset the color of all dots
            this.lasso.items()
                .classed("not_possible", false)
                .classed("possible", false)

            // Style the selected dots
            this.lasso.selectedItems()
                .classed("selected", true)
                .attr("r", (d) => {
                    if (Object.entries(this.ts).length < 16) return 6.0
                    else return 6.0
                })
                .attr("id", (d) => { this.selectedIds.push(d[3]) })
                .attr("opacity", 1)

            // Reset the style of the not selected dots
            this.lasso.notSelectedItems()
                .attr("r", 4.5)
                .attr("opacity", 0.5);
            
            this.$parent.selectedIds = this.selectedIds
            this.$store.selectedIds = this.selectedIds
            console.log(this.selectedIds)
            for (let i = 0; i < this.selectedIds.length - 1; i += 1) {
                d3.selectAll('#dot' + this.selectedIds[i])
                    .classed('selected', true)
                    .attrs({
                        opacity: 1,
                        r: 6.0
                    })

                d3.selectAll('#clusterrect-' + this.selectedIds[i])
                    .attrs({
                        opacity: 1
                    })
                let peid = Math.floor(this.selectedIds[i]/16)
                // d3.selectAll('#live-rect-pe-' + peid)
                //     .style('fill-opacity', d => {
                //         return Math.pow(d.weight/this.$store.liveMax, 0.33)
                //     })
                //     // .style('fill', 'red')

                d3.selectAll('.live-rect-kp-' + this.selectedIds[i])
                    .attr('fill', (d, i)  => {
                        if(d.peid == peid){
                            return d3.interpolateGreys(Math.pow(d.weight/this.$store.liveMax, 0.33))
                        }
                        else
                            return d3.interpolateGreys(0)
                    })
            }

        },

        zoom() {
            // for unzoom button; Needs fix
            this.zoomed = true

            // // adjust the scales
            // this.svg.select(".x-axis").transition(this.t).call(this.xAxis)
            // this.svg.select(".y-axis").transition(this.t).call(this.yAxis)

            // Put circles back in view
            let self = this
            this.svg.selectAll(".circle" + this.id).transition(this.t)
                .attr("cx", function (d) { return self.x(d['PC0'][0]) })
                .attr("cy", function (d) { return self.y(d['PC1'][0]) })

            // Clear brush selection box
            this.svg.selectAll(".selection")
                .attrs({
                    x: 0,
                    y: 0,
                    width: 0,
                    height: 0
                })
        },

        unzoom() {
            // Untoggle the unzoom button.
            this.zoomed = false

            // reset the scale domains
            this.x.domain([2.0 * this.xMin, 2.0 * this.xMax])
            this.y.domain([2.0 * this.yMin, 2.0 * this.yMax])

            // // adjust the scale
            // this.svg.select(".x-axis").transition(this.t).call(this.xAxis)
            // this.svg.select(".y-axis").transition(this.t).call(this.yAxis)

            // Put circles back
            let self = this
            this.svg.selectAll(".circle" + this.id).transition(this.t)
                .attr("cx", function (d) { return self.x(d['PC0'][0]) })
                .attr("cy", function (d) { return self.y(d['PC1'][0]) })
        },

        //==================================
        // Not used
        //==================================
        findIdsInRegion(xMin, xMax, yMin, yMax) {
            let ret = []
            console.log(xMin, xMax, yMin, yMax)
            xMin = this.x(xMin)
            xMax = this.x(xMax)
            yMin = this.y(yMin)
            yMax = this.y(yMax)
            for (let [idx, res] of Object.entries(this.ts)) {
                let xVal = res['PC0'][0]
                let yVal = res['PC1'][0]
                if (xVal >= xMin && xVal <= xMax && yVal >= yMin && yVal <= yMax) {
                    ret.push(idx)
                }
            }
            return ret
        },

        brushended() {
            let idleDelay = 350
            let s = d3.event.selection
            if (!s) {
                if (!this.idleTimeout)
                    return this.idleTimeout = setTimeout(this.idled, idleDelay)
                this.x.domain([2.0 * xMin, 2.0 * xMax])
                this.y.domain([2.0 * yMin, 2.0 * yMax])
            }
            else {
                let d0 = s.map(this.x.invert)
                let d1 = s.map(this.y.invert)

                this.selectedIds = this.findIdsInRegion(d0[0], d0[1], d1[0], d1[1])

                // set the scale domains based on selection
                this.x.domain([s[0][0], s[1][0]].map(this.x.invert, this.x))
                this.y.domain([s[1][1], s[0][1]].map(this.y.invert, this.y))


                // console.log(d3.brushSelection(this.brushSvg.node()))

                // https://github.com/d3/d3-brush/issues/10
                if (!d3.event.sourceEvent) return

                // to set the brush movement to null. But doesnt do the required trick.
                // Reason: maybe webpack
                // https://github.com/d3/d3-brush/issues/10
                d3.select(".brush").call(this.brush.move, null)
            }
            this.zoom()
            this.select()
        },

        idled() {
            this.idleTimeout = null;
        },


    },
}


