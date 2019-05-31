import * as d3 from 'd3'
// import { selection } from "d3-selection";
import "d3-selection-multi";
import template from '../html/D3TimeSeries.html'
import EventHandler from './EventHandler'

// References: http://bl.ocks.org/ludwigschubert/0236fa8594c4b02711b2606a8f95f605

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
        showCPD: false,
        selectedMeasure: null,
        methods: ['AFF', 'CUSUM', 'EMMV', 'PCA'],
        selectedMethod: 'AFF',
        current_views: [],
        selectedIds: [],
        cpds: [],
        cluster: {},
        yMin: 0,
        yMax: 0,
        isLabelled: false,
        colorSet: ["#5576A5", "#E8CA4F", "#AB769F"],
        brushes: [],
        cpds: [],
        prev_cpd: 0,
        message: "Time-series view",
        showMessage: false,
    }),
    watch: {
        selectedIds: function (val) {
            if (val.length == 1) {
                d3.selectAll('path')
                    .attrs({
                        opacity: 1,
                        'stroke-width': 1,
                    })
                for (let i = 0; i < val.length; i += 1) {
                    d3.selectAll('[id="line' + val[i] + '"]')
                        .attrs({
                            opacity: 1,
                            'stroke-width': 1
                        })
                }
            }

            d3.selectAll('.line')
                .attrs({
                    opacity: 0.5,
                    'stroke-width': 0.5,
                    stroke: 'rgba(0, 0, 0, 0.3)'
                })
            for (let i = 0; i < val.length; i += 1) {
                d3.selectAll('[id="line' + val[i] + '"]')
                    .attrs({
                        opacity: 1,
                        'stroke-width': 1.5,
                        stroke: this.colorSet[this.cluster[val[i]]],
                    })
            }
        },
    },
    mounted() {
        this.id = 'time-overview' + this._uid
    },
    methods: {
        init() {
            let visContainer = document.getElementById(this.id)
            this.width = visContainer.clientWidth
            this.height = (window.innerHeight / 3 - 20)

            this.padding = { left: 50, top: 0, right: 20, bottom: 30 }
            this.x = d3.scaleLinear().range([0, this.width - this.padding.right - this.padding.left]);
            this.y = d3.scaleLinear().range([this.height - this.padding.bottom, 0]);

            if (this.showMessage == true) {
                this.showLabels()
            }
        },

        showLabels() {
            let width = 100;
            let height = 20;
            var svg = d3.select("#labels").append('svg')
                .attrs({
                    "width": width,
                    "height": height
                })
                .append("g");

            var circles = svg.selectAll("circle")
                .data(this.colorSet)
                .enter().append("circle")
                .style("stroke", "gray")
                .style("fill", "white")
                .attr("r", function (d, i) {
                    return 10
                })
                .attr("cx", function (d, i) {
                    return i * 20
                })
                .attr("cy", function (d, i) {
                    return 10
                });

            var text = svg.selectAll("text")
                .data(this.colorSet)
                .enter()
                .append("text");

            var textLabels = text
                .attr("x", function (d) { return d.x; })
                .attr("y", function (d) { return d.y; })
                .text(function (d, i) { return "Cluster-" + i })
                .attr("font-family", "sans-serif")
                .attr("font-size", "10px")
                .attr("fill", "red");

        },

        axis() {
            this.xAxis = d3.axisBottom(this.x)
                .tickPadding(10)

            this.yAxis = d3.axisLeft(this.y)
                .tickPadding(10)
                .tickFormat(d3.format('0.1s'))

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

        clearLabel() {
            d3.select('#' + this.id).selectAll(".axis-labels").remove()
        },

        label() {
            this.isLabelled = true
            this.svg.append("text")
                .attrs({
                    "class": "axis-labels",
                    transform: `translate(${(this.width / 2)}, ${this.height + this.padding.top})`
                })
                .style("text-anchor", "middle")
                .text(this.selectedTimeDomain);

            this.svg.append("text")
                .attrs({
                    "class": "axis-labels",
                    transform: `translate(${3}, ${this.height / 2}) rotate(${90})`,
                })
                .style("text-anchor", "middle")
                .text(this.$parent.plotMetric)
        },

        initLine() {
            this.line = d3.line()
                .x((d, i) => this.x(this.actualTime[i]))
                .y((d) => this.y(d));
        },

        initBrushes() {
            this.brushSvg = this.svg.append('g')
                .attrs({
                    'class': 'brushes'
                })

            this.newBrush()
            this.drawBrushes();
        },

        initVis() {
            this.initLine()
            this.svg = d3.select('#' + this.id).append('svg')
                .attrs({
                    width: this.width,
                    height: this.height,
                    transform: 'translate(0, 0)'
                })

            this.initBrushes()
            this.axis()
        },

        reset(ts, cpd) {
            this.visualize(ts, cpd)
        },

        preprocess(data) {
            let ret = []
            for (let [id, res] of Object.entries(data)) {
                if (ret[id] == undefined) {
                    ret[id] = []
                }
                ret[id].push(res['time'])
                ret[id].push(res['ts'])
                ret[id].push(res['cluster'][0])
                ret[id].push(id)

                let max = Math.max.apply(null, res['time'])
                if (max > this.yMax) {
                    this.yMax = max
                }

                let min = Math.min.apply(null, res['time'])
                if (min < this.yMin) {
                    this.yMin = yMin
                }
            }
            return ret
        },

        newBrush() {
            let id = this.brushes.length
            let brush = d3.brushX()
                .extent([[this.padding.left, this.padding.top], [this.width - this.padding.right, this.height - this.padding.bottom]])
                .on('end', this.brushEnd)
            this.brushes.push({ id, brush })
        },

        drawBrushes() {

            let brushSelection = this.brushSvg
                .selectAll('.brush')
                .data(this.brushes)

            let brush = d3.brushX()
                .extent([[this.padding.left, this.padding.top], [this.width - this.padding.right, this.height - this.padding.bottom]])
                .on('end', this.brushEnd)


            brushSelection.enter()
                .insert("g", ".brush")
                .attr("class", "brush")
                .attr("id", (brush) => "brush-" + brush.id)
                // .each( (brushObj) => { brushObj.brush(d3.select('#brush' + brushObj.id)) })
                .call(brush)

            brushSelection.each((brushObj) => {
                d3.select('#brush' + brushObj.id)
                    .attr('class', 'brush')
                    .selectAll('.overlay')
                    .style('pointer-events', () => {
                        let brush = brushObj.brush
                        if (brushObj.id == brushes.length - 1 && brush !== undefined) {
                            return 'all'
                        }
                        else {
                            return 'none'
                        }
                    })
            })

            // brushSelection.exit()
            // .remove()
        },

        drawCPDs() {
            d3.selectAll('.cpdline' + this.id).remove()

            let xPoints = [];
            for (let i = 0; i < this.cpds.length; i += 1) {
                xPoints.push(this.actualTime[this.cpds[i]])
            }

            this.svg.selectAll('cpdline')
                .data(xPoints)
                .enter()
                .append('line')
                .attrs({
                    'class': 'cpdline cpdline' + this.id,
                    'x1': (d) => { return this.x(d) },
                    'y1': 0,
                    'x2': (d) => { return this.x(d) },
                    'y2': this.height - this.padding.bottom,
                })
                .style('stroke', '#DA535B')
                .style('stroke-width', '3.5px')
                .style('z-index', 100)
        },

        // clusterLabel() {
        //     d3.select('#timeseries-chip')
        //         .append('svg')
        //         .enter().
        // }

        // enablePanning() {
        //     // Zoom/Pan behavior
        //     let pan = d3.behavior.zoom()
        //         .x(x_scale)
        //         .scale(scale)
        //         .size([this.width, this.height])
        //         .scaleExtent([scale, scale])
        //         .on('zoom', function (e) {
        //             var current_domain = x_scale.domain(),
        //                 current_max = current_domain[1].getTime();

        //             // If we go past the max (i.e. now), reset translate to the max
        //             if (!isNaN(max_translate_x) && current_max > now)
        //                 pan.translate([max_translate_x, 0]);

        //             // Update the data once user hits the point where current data ends
        //             if (pan.translate()[0] > min_translate_x) {
        //                 updateData();
        //                 addNewPoints();

        //                 // Just to illustrate what's happening
        //                 console.debug('Updated data: ', chart_data);
        //                 console.debug('Updated selection: ', circles);
        //             }

        //             // Redraw any components defined by the x axis
        //             x_axis.call(x_axis_generator);
        //             circles.attr('cx', function (d) {
        //                 return x_scale(new Date(d.registered));
        //             });
        //         });

        //     // Apply the behavior 
        //     this.svg.call(pan);

        //     // Now that we've scaled in, find the farthest point that
        //     // we'll allow users to pan forward in time (to the right)
        //     max_translate_x = width - x_scale(new Date(now));
        //     this.svg.call(pan.translate([max_translate_x, 0]).event);
        // },

        visualize(ts, cpd) {
            if (!this.isLabelled) {
                this.label()
                // this.clusterLabel()
            }

            if (cpd == 1) {
                let current_cpd_idx = this.$parent.stream_count
                let current_cpd = this.actualTime[current_cpd_idx]
                EventHandler.$emit('draw_kpmatrix_on_cpd', this.prev_cpd, current_cpd)
                this.prev_cpd = current_cpd
                this.cpds.push(this.$parent.stream_count)
            }

            this.drawCPDs()

            d3.selectAll('.line' + this.id).remove()
            for (let [id, res] of Object.entries(ts)) {
                this.data = this.svg.append('path')
                    .attr('class', 'line line' + this.id)

                let time = res['time']
                this.actualTime = res[this.plotMetric]
                let data = res['ts']
                let cluster = res['cluster'][0]
                this.cluster[id] = res['cluster'][0]

                this.x.domain([this.actualTime[0], this.actualTime[this.actualTime.length - 1]])
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
                        'id': 'line' + id,
                        d: this.line,
                        stroke: this.colorSet[cluster],
                        'stroke-width': 1.0,
                        fill: 'transparent',
                        transform: `translate(${this.padding.left}, ${this.padding.top})`,
                    })
                    .style('z-index', 0)
            }
        },

        brushEnd() {
            if (!d3.event.sourceEvent) return; // Only transition after input.
            if (!d3.event.selection) return; // Ignore empty selections.

            // check if the latest brush has a selection.
            let lastBrushID = this.brushes[this.brushes.length - 1].id
            let lastBrush = document.getElementById('brush-' + lastBrushID)
            let selection = d3.brushSelection(lastBrush)

            // if(selection && selection[0] !== selection[1]){
            this.newBrush()
            // }

            this.drawBrushes()

            // There is some bug here, it does not return the correct this.x.invert
            let d0 = d3.event.selection.map(this.x.invert)
            let correction = 4824.0

            d0[0] = d0[0] - correction
            d0[1] = d0[1] - correction * 1.5
            this.$parent.addBrushTime.push(d0)

            // // If empty when rounded, use floor & ceil instead.
            // if (d1[0] >= d1[1]) {
            //     d1[0] = d3.timeDay.floor(d0[0]);
            //     d1[1] = d3.timeDay.offset(d1[0]);
            // }

            //d3.select(this).transition().call(d3.event.target.move, d1.map(this.x));
        },
    }
}

