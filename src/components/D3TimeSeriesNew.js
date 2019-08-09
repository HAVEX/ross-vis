import * as d3 from 'd3'
import "d3-selection-multi"
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
        showMessage: true,
        timepointMoveThreshold: 15,
        actualTime: [],
        clusterMap: {},
        cluster: [],
        showCircleLabels: true,
        padding: {
            top: 20,
            bottom: 20,
            left: 100,
            right: 30,
            topNav: 10,
            bottomNav: 20
        },
        navPadding: {
            top: 0,
            bottom: 10,
            left: 100,
            right: 30,
        },
        dimension: {
            chartTitle: 20,
            xAxis: 20,
            yAxis: 20,
            xTitle: 20,
            yTitle: 20,
            navChart: 70
        },
        currentMovingAvg: 0,
        movingAvgTs: {},
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
            let dashboardHeight = document.getElementById('dashboard').clientHeight
            let toolbarHeight = document.getElementById('toolbar').clientHeight
            let chipContainerHeight = document.getElementById('chip-container').clientHeight

            this.width = visContainer.clientWidth
            this.height = (dashboardHeight - toolbarHeight - chipContainerHeight) / 3

            this.$store.drawBrush = true

            if (this.$store.drawBrush) {
                this.navHeight = this.height * 0.20
                this.navWidth = this.width
                this.mainHeight = this.height - this.navHeight
                this.mainWidth = this.width
                this.navX = d3.scaleLinear().range([0, this.navWidth - this.navPadding.right])
                this.navY = d3.scaleLinear().range([0, this.navHeight])
            }
            else {
                this.navHeight = 0
                this.navWidth = 0
                this.mainHeight = this.height
                this.mainWidth = this.width
            }

            this.padding = { left: 40, top: 0, right: 20, bottom: 30 }
            this.x = d3.scaleLinear().range([0, this.mainWidth - this.padding.right - this.padding.left * 1.5]);
            this.y = d3.scaleLinear().range([this.mainHeight - this.padding.bottom - this.padding.top, 0]);

        },

        initVis() {
            this.initLine()
            this.initZoom()
            this.svg = d3.select('#' + this.id).append('svg')
                .attrs({
                    width: this.width,
                    height: this.height,
                    transform: `translate(${0}, ${this.padding.top})`,
                    "pointer-events": "all",
                    "border": "1px solid lightgray"
                })
            // .call(this.zoom)

            if (this.$store.drawBrush) {
                this.initNavView()
            }

            this.initMainView()
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

        visualize(ts, cpd) {
            if (!this.isLabelled) {
                this.label()
                this.axis()
                if (this.$store.drawBrush) {
                    // this.navAxis()
                }
            }

            if (cpd == 1) {
                let current_cpd_idx = this.$parent.stream_count
                let current_cpd = this.actualTime[current_cpd_idx]
                EventHandler.$emit('draw_kpmatrix_on_cpd', this.prev_cpd, current_cpd)
                this.prev_cpd = current_cpd
                this.cpds.push(this.$parent.stream_count)
            }

            this.drawCPDs()
            this.drawDragLine()

            this.clearMainView()
            this.drawMainView(ts)

            this.clearNavView()
            this.drawNavView(cpd)

            this.drawClusterLabels()
        },

        // Visualize cluster labels.
        drawClusterLabels() {
            let n_clusters = 3
            let width = document.getElementById(this.id).clientWidth - document.getElementById('timeseries-chip').clientWidth;
            let x_offset = 10
            let y_offset = 10
            let radius = 10
            let padding = 10
            let height = 2 * radius + padding
            let gap = width / n_clusters
            d3.select('.clusterLabelSVG').remove()
            let svg = d3.select("#labels")
                .append('svg')
                .attrs({
                    transform: `translate(${x_offset}, ${y_offset})`,
                    "width": width,
                    "height": height,
                    "class": "clusterLabelSVG"
                })
                .append("g");

            let circles = svg.selectAll("circle")
                .data(this.colorSet)
                .enter().append("circle")
                .style("stroke", "gray")
                .style("fill", (d, i) => {
                    return this.colorSet[i]
                })
                .attrs({
                    "r": (d, i) => { return radius },
                    "cx": (d, i) => { return i * gap + radius },
                    "cy": (d, i) => { return radius },
                })

            let text = svg.selectAll("text")
                .data(this.colorSet)
                .enter()
                .append("text")
                .text((d, i) => { return "Cluster-" + i + ' (' + this.clusterMap[i] + ')' })
                .attrs({
                    "x": (d, i) => { return i * gap + 2 * radius + padding },
                    "y": (d, i) => { return radius + padding; },
                    "font-family": "sans-serif",
                    "font-size": 2 * radius + "px",
                    "fill": "black"
                })

        },

        initLine() {
            this.line = d3.line()
                .x((d, i) => this.x(this.actualTime[i]))
                .y((d) => this.y(d));

            this.navLine = d3.line()
                .x((d, i) => this.navX(this.actualTime[i]))
                .y((d, i) => {
                    return this.navHeight - this.navY(d)
                })

            // this.area = d3.area()
            //     .curve(d3.curveStepAfter)
            //     .y0(this.y(0))
            //     .y1(function (d) { return this.y(d.value); }); 
        },

        // Axis for timeline view
        axis() {
            const xFormat = d3.format('0.1f')
            this.xAxis = d3.axisBottom(this.x)
                .tickPadding(10)
                .tickFormat((d, i) => {
                    let temp = d;
                    if (i % 2 == 0) {
                        let value = temp / 1000
                        return `${xFormat(value)}k`
                    }
                    return '';
                })

            const yFormat = d3.format('0.1s')
            this.yAxis = d3.axisLeft(this.y)
                .tickPadding(10)
                .tickFormat((d, i) => {
                    let temp = d;
                    if (i % 2 == 0) {
                        let value = temp
                        return `${yFormat(value)}`
                    }
                    return '';
                })

            this.xAxisSVG = this.mainSvg.append('g')
                .attrs({
                    transform: `translate(${0}, ${this.mainHeight - 1.0 * this.padding.bottom})`,
                    class: 'x-axis',
                    'stroke-width': '1.5px'
                })
                .call(this.xAxis);

            this.yAxisSVG = this.mainSvg.append('g')
                .attrs({
                    transform: `translate(${0}, ${0})`,
                    class: 'y-axis',
                    'stroke-width': '1.5px'
                })
                .call(this.yAxis);

            // this.areaPath = this.mainSvg.append('path')
            //     .attrs({
            //         "clip-path": "url(#clip)",
            //     })

            this.yDom = [0, 0]
            this.yNavDom = [0, 0]
        },

        // Axis for navigation timeline view.
        navAxis() {
            const xFormat = d3.format('0.1f')
            this.xNavAxis = d3.axisBottom(this.x)
                .tickPadding(10)
                .tickFormat((d, i) => {
                    let temp = d;
                    if (i % 2 == 0) {
                        let value = temp / 1000
                        return `${xFormat(value)}k`
                    }
                    return '';
                })

            this.xNavAxisSVG = this.navSvg.append('g')
                .attrs({
                    transform: `translate(${0}, ${0})`,
                    class: 'x-axis',
                    'stroke-width': '1.5px'
                })
                .call(this.xNavAxis);

            this.yNavAxis = d3.axisBottom(this.y)
                .tickPadding(10)
                .tickFormat((d, i) => {
                    let temp = d;
                    if (i % 2 == 0) {
                        let value = temp / 1000
                        return `${xFormat(value)}k`
                    }
                    return '';
                })

            this.yNavAxisSVG = this.navSvg.append('g')
                .attrs({
                    transform: `translate(${0}, ${0})`,
                    class: 'y-axis',
                    'stroke-width': '1.5px'
                })
                .call(this.yNavAxis);
        },

        // Clear Axis labels
        clearLabel() {
            d3.select('#' + this.id).selectAll(".axis-labels").remove()
        },

        // draw axis label
        label() {
            this.isLabelled = true
            this.svg.append("text")
                .attrs({
                    "class": "axis-labels",
                    transform: `translate(${(this.width / 2)}, ${this.height - this.padding.top})`
                })
                .style("text-anchor", "middle")
                .text(this.selectedTimeDomain);

            this.svg.append("text")
                .attrs({
                    "class": "axis-labels",
                    transform: `translate(${0}, ${this.height / 2}) rotate(${90})`,
                })
                .style("text-anchor", "middle")
                .text(this.$parent.plotMetric)
        },

        // Draw change point detection lines. 
        drawCPDs() {
            d3.selectAll('.cpdline' + this.id).remove()
            d3.selectAll('.cpdnavline' + this.$parent.plotMetric).remove()

            let xPoints = [];
            for (let i = 0; i < this.cpds.length; i += 1) {
                xPoints.push(this.actualTime[this.cpds[i]])
            }

            this.mainSvg.selectAll('cpdline')
                .data(xPoints)
                .enter()
                .append('line')
                .attrs({
                    'class': 'cpdline cpdline' + this.id,
                    'x1': (d) => { return this.x(d) },
                    'y1': 0,
                    'x2': (d) => { return this.x(d) },
                    'y2': this.mainHeight - this.padding.bottom,
                })
                .style('stroke', '#DA535B')
                .style('stroke-width', '3.5px')
                .style('z-index', 100)


            this.navSvg.selectAll('cpdnavline')
                .data(xPoints)
                .enter()
                .append('line')
                .attrs({
                    'class': 'cpdnavline cpdnavline' + this.$parent.plotMetric,
                    'x1': (d) => { return this.navX(d) },
                    'y1': 0,
                    'x2': (d) => { return this.navX(d) },
                    'y2': this.navHeight - this.navPadding.bottom,
                })
                .style('stroke', '#DA535B')
                .style('stroke-width', '3.5px')
                .style('z-index', 100)
        },

        // Draw a drag line to travel in the past.
        // Use case is to be able to see what clustering was there previously.
        drawDragLine() {
            d3.selectAll('.dragline' + this.id).remove()

            let xPoints = [0];

            this.svg.selectAll('dragline')
                .data(xPoints)
                .enter()
                .append('line')
                .attrs({
                    'class': 'dragline dragline' + this.id,
                    'x1': (d) => { return this.x(d) },
                    'y1': 0,
                    'x2': (d) => { return this.x(d) },
                    'y2': this.height - this.padding.bottom,
                })
                .style('stroke', '#FFF')
                .style('stroke-width', '3.5px')
                .style('z-index', 100)
        },

        initMainView() {
            this.mainSvg = this.svg.append('g')
                .attrs({
                    height: this.mainHeight,
                    width: this.mainWidth,
                    id: 'mainSVG',
                    transform: `translate(${this.padding.left}, ${this.padding.top})`
                })

            this.mainPathG = this.mainSvg.append('g')
                .attrs({
                    transform: `translate(${this.padding.left}, ${this.padding.top})`
                })

            this.mainSvg.append('defs')
                .append("clipPath")
                .attr("id", "clip")
                .append("rect")
                .attrs({
                    "x": 0,
                    "y": 0,
                    "width": this.width - this.padding.left - this.padding.right,
                    "height": this.height - this.padding.top - this.padding.bottom
                })

        },

        // Clear Timeline view.
        clearMainView() {
            d3.selectAll('.line' + this.id).remove()
        },

        // Draw Main timeline view.
        drawMainView(data) {
            // Reset the clusterMap every time we visualize. 
            this.clusterMap = {}
            // Assign the number of processors. 
            this.numberOfProcs = Object.entries(data).length

            for (let [id, res] of Object.entries(data)) {
                this.startTime = 0

                // let time = res['time']
                // ts is the main data. (Data of the plot metric chosen.)
                let ts = res['ts']
                // Add zero to the data array.  
                ts.unshift(0)


                // Add zero to the time array. 
                let actualTime = res[this.plotMetric]
                if (id == 0) {
                    actualTime.unshift(0)
                }
                // Actualtime corresponds to the x-axis data but store on the global props.
                this.actualTime = actualTime

                // Assign a cluster Map.
                let cluster = res['cluster'][0]
                if (this.clusterMap[cluster] == undefined) {
                    this.clusterMap[cluster] = 0
                }
                this.clusterMap[cluster] += 1
                this.cluster[id] = res['cluster'][0]

                // Set the X domain for Line and navLine
                if (this.actualTime.length > this.timepointMoveThreshold) {
                    this.x.domain([this.actualTime[this.actualTime.length - this.timepointMoveThreshold], this.actualTime[this.actualTime.length - 1]])
                }
                else {
                    this.x.domain([this.startTime, this.actualTime[this.actualTime.length - 1]])
                }

                // Set the Y domain for line. 
                let yDomTemp = d3.extent(ts)
                if (yDomTemp[1] > this.yDom[1])
                    this.yDom[1] = yDomTemp[1]
                this.y.domain(this.yDom)

                // Draw Axis
                this.xAxisSVG
                    .call(this.xAxis)
                this.yAxisSVG
                    .call(this.yAxis)

                // Draw line to main TimeLine. 
                this.path = this.mainSvg
                    .append('path')
                    .attr('class', 'line line' + this.id)

                // console.log("Current Data: ", ts)
                this.path
                    .datum(ts)
                    .attrs({
                        'id': 'line' + id,
                        d: this.line,
                        stroke: this.colorSet[cluster],
                        'stroke-width': (d) => {
                            if (this.numberOfProcs < 16) return 2.0
                            else return 1.0
                        },
                        fill: 'transparent',
                    })
                    .style('z-index', 0)

                // Calculate the avg out of the data (ts).
                if (this.movingAvgTs[this.plotMetric] == undefined) {
                    this.movingAvgTs[this.plotMetric] = [0]
                }
                this.currentMovingAvg += ts[this.movingAvgTs[this.plotMetric].length - 1] / this.numberOfProcs
                if (id == 0) {
                    this.currentMovingAvg = 0
                }
                if (id == this.numberOfProcs - 1) {
                    console.log(this.currentMovingAvg)
                    this.movingAvgTs[this.plotMetric].push(this.currentMovingAvg)
                }
            }
        },

        // Clear Navigation timeline view.
        clearNavView() {
            d3.selectAll('.avgLine' + this.$parent.plotMetric).remove()
        },

        // Init navigation timeline view.
        initNavView() {
            this.navSvg = this.svg.append('g')
                .attrs({
                    height: this.navHeight,
                    width: this.navWidth - this.padding.right,
                    id: 'navSVG',
                    transform: `translate(${this.padding.left}, ${this.padding.top + this.mainHeight})`
                })

            // add nav background
            this.navSvg.append("rect")
                .attrs({
                    "x": 0,
                    "y": 0,
                    "width": this.navWidth - this.padding.right - this.padding.left,
                    "height": this.navHeight,
                })
                .style("fill", "#F5F5F5")
                .style("shape-rendering", "crispEdges")

            // add group to data items
            this.navG = this.navSvg.append("g")
                .attr("class", "nav");

            this.initBrushes()
        },

        drawNavView() {
            this.navPath = this.navSvg.append('path')
                .attr('class', 'avgLine')

            this.navX.domain([this.startTime, this.actualTime[this.actualTime.length - 1] * 1.5])

            let yNavDomTemp = d3.extent(this.movingAvgTs[this.plotMetric])
            if (yNavDomTemp[1] > this.yNavDom[1])
                this.yNavDom[1] = yNavDomTemp[1]
            this.navY.domain(this.yNavDom)


            let data  = this.movingAvgTs[this.plotMetric].slice(1)
            this.navPath
                .datum(this.movingAvgTs[this.plotMetric])
                .attrs({
                    d: this.navLine,
                    class: 'avgLine' + this.$parent.plotMetric,
                    stroke: "#000",
                    'stroke-width': (d) => {
                        if (this.numberOfProcs < 16) return 2.0
                        else return 1.0
                    },
                    fill: 'transparent',
                })
                .style('z-index', 0)
        },

        // Brush interactions. 
        initBrushes() {
            this.brushSvg = this.navSvg.append('g')
                .attrs({
                    'class': 'brushes'
                })

            this.createBrush()
            this.drawBrush();
        },

        createBrush() {
            let id = this.brushes.length
            this.viewport = d3.brushX(this.navX)
                .extent([[0, 0], [this.navWidth - this.navPadding.right, this.navHeight]])
                .on('brush', this.brushing)
                // .on('end', this.brushEnd)
            this.brushes.push({ 
                'id': id,
                'brush': this.viewport 
            })
        },

        drawBrush() {
            let brushSelection = this.navSvg
                .selectAll('.brush')
                .data(this.brushes)

            brushSelection.enter()
                .insert("g", ".brush")
                .attr("class", "brush")
                .attr("id", (brush) => "brush-" + brush.id)
                // .each( (brushObj) => { brushObj.brush(d3.select('#brush' + brushObj.id)) })
                .call(this.viewport)

            brushSelection.each((brushObj) => {
                d3.selectAll('.brush')
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

        brushing(){
            let selection = d3.event.selection
            if(selection == null){
                this.x.domain(this.navX.domain())
            }
            else{
                let sx = selection.map(this.navX.invert)
                let intervalViewport = sx[1] - sx[0]
                let offsetViewport = sx[1] - this.startTime

                if(intervalViewport == 0){
                    intervalViewport = 10000
                    offsetViewport = 0
                }

                this.x.domain(sx)
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
            // this.createBrush()
            // }

            // this.drawBrush()

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

        // Zoom interaction. Not being used though.
        zoomed() {
            let xz = d3.event.transform.rescaleX(this.x);
            this.xAxisSVG.call(this.xAxis.scale(xz));
            // this.areaPath.attr("d", this.area.x(function (d) {
            //     console.log(d)
            //     return xz();
            // }));
        },

        initZoom() {
            this.zoom = d3.zoom()
                .scaleExtent([1 / 4, 8])
                .translateExtent([[0, -Infinity], [this.width, Infinity]])
                .on("zoom", this.zoomed);
        },

    }
}