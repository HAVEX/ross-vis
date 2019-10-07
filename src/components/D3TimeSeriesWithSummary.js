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
        brushes: [],
        cpds: [],
        prev_cpd: 0,
        message: "Performance Behavior view",
        showMessage: true,
        timepointMoveThreshold: 75,
        actualTime: [],
        clusterMap: {},
        cluster: [],
        showCircleLabels: true,
        padding: {
            top: 30,
            bottom: 20,
            left: 100,
            right: 20,
            topNav: 10,
            bottomNav: 20
        },
        navPadding: {
            top: 0,
            bottom: 10,
            left: 100,
            right: 20,
        },
        dimension: {
            chartTitle: 20,
            xAxis: 20,
            yAxis: 20,
            xTitle: 20,
            yTitle: 20,
            navChart: 70
        },
        nameMapper: {
            "NetworkRecv": "Net. Recv.",
            "NetworkSend": "Net. Send.",
            "NeventProcessed": "Num. Events",
            "RbSec": "Sec. Rb.",
            "RbPrim": "Prim. Rb.",
            "LastGvt": "Last GVT",
            "RealTs": "Real Time",
            "VirtualTs": "Virtual Time"
        },
        currentMovingAvg: 0,
        movingAvgTs: {},
        navDrag: false,
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
                        stroke: this.$store.colorset[this.cluster[val[i]]],
                    })
            }
        },
    },
    mounted() {
        this.id = 'time-overview' + this._uid

        let self = this
        EventHandler.$on('init_dragger', function () {
            // if(self.$parent.plotMetric == 'RbSec'){
            if(self.$store.selectedClusterMetric == self.$parent.plotMetric){
                self.initNavDrag()
            }
        })

        EventHandler.$on('clear_dragger', function () {
            self.clearNavDrag()
        })
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
            this.y = d3.scaleLinear().range([this.mainHeight - this.padding.bottom - this.padding.top, this.padding.top + this.padding.bottom]);

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

            // if(cpd == 1 && this.$parent.plotMetric == 'RbSec'){
            if (cpd == 1 && this.$store.selectedClusterMetric == this.$parent.plotMetric) {
                let current_cpd_idx = this.$parent.stream_count - 1
                let current_cpd = this.actualTime[this.actualTime.length - 1]
                // Toggle this for 
                // console.log('=================================================')
                // console.log("Getting the communication matrix: ", this.prev_cpd, current_cpd )
                // EventHandler.$emit('draw_kpmatrix_on_cpd', this.prev_cpd, current_cpd)
                EventHandler.$emit('fetch_kpmatrix_on_cpd_request', current_cpd)
                this.$store.currentCPD = current_cpd
                this.$store.currentCPDRound = Math.floor(current_cpd)
                console.log("Change point in store is:", this.$store.currentCPD)
                this.prev_cpd = current_cpd
                this.cpds.push(current_cpd_idx)
            }

            this.drawCPDs()
            this.drawCPDLabels()

            this.clearMainView()
            this.drawMainView(ts)

            this.clearNavView()
            this.drawNavView(cpd)

            this.drawClusterLabels()
            
            this.clearCPDLabels()
            // this.drawCPDLabels()
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
                .data(this.$store.colorset)
                .enter().append("circle")
                .style("stroke", "gray")
                .style("fill", (d, i) => {
                    return this.$store.colorset[i]
                })
                .attrs({
                    "r": (d, i) => { return radius },
                    "cx": (d, i) => { return i * gap + radius },
                    "cy": (d, i) => { return radius },
                })

            let text = svg.selectAll("text")
                .data(this.$store.colorset)
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
                .x((d, i) => {
                    // let windowActualTime = this.windowActualTime.splice(this.windowActualTime.length -1 , 1)
                    // console.log(windowActualTime)
                    return this.x(this.windowActualTime[i])
                })
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
                    // if (i % 2 == 0) {
                    let value = Math.round(temp)
                    // return `${xFormat(value)}k`
                    // }
                    // return '';
                    return value
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
                .text((d, i) => {
                    if (this.selectedTimeDomain in this.nameMapper) {
                        return this.nameMapper[this.selectedTimeDomain]
                    }
                    else {
                        return this.selectedTimeDomain
                    }
                })
            this.svg.append("text")
                .attrs({
                    "class": "axis-labels",
                    transform: `translate(${0}, ${this.height / 2}) rotate(${90})`,
                })
                .style("text-anchor", "middle")
                .text((d, i) => {
                    if(this.$parent.panelId == '2'){
                        if (this.$store.plotMetric2 in this.nameMapper) {
                            return this.nameMapper[this.$store.plotMetric2]
                        }
                        else {
                            return this.$store.plotMetric2
                        }
                    }
                    if(this.$parent.panelId == '1'){
                        if (this.$store.plotMetric1 in this.nameMapper) {
                            return this.nameMapper[this.$store.plotMetric1]
                        }
                        else {
                            return this.$store.plotMetric1
                        }
                    }                    
                })
        },

        // Draw change point detection lines. 
        drawCPDs() {
            d3.selectAll('.cpdline' + this.id).remove()
            d3.selectAll('.cpdnavline' + this.$parent.plotMetric).remove()

            let cpdPoints = [];
            let cpdNavPoints = []
            for (let i = 0; i < this.cpds.length; i += 1) {
                cpdNavPoints.push(this.actualTime[this.cpds[i]])
                let cpdTime = this.actualTime[this.cpds[i]]
                
                // Move threshold can make the index negative. 
                let moveThreshold = 0
                if(this.actualTime.length < this.timepointMoveThreshold){
                    moveThreshold = this.actualTime.length
                }
                else{
                    moveThreshold = this.timepointMoveThreshold
                }
 
                // Windowing lets the cpds behind vanish off. 
                let windowStartTime = this.actualTime[this.actualTime.length - moveThreshold]
                let windowEndTime = this.actualTime[this.actualTime.length - 1]

                // Push the cpd into cpdPoints only if it is inside the window. 
                if (cpdTime >= windowStartTime && cpdTime < windowEndTime) {
                    cpdPoints.push(this.actualTime[this.cpds[i]])
                }
            }

            // There is undefined element in the array
            cpdNavPoints = cpdNavPoints.filter(function (el) {
                return el != undefined;
            });

            // console.log("Change points in Main View", cpdPoints)
            // console.log("Change points in Nav view", cpdNavPoints)

            this.mainSvg.selectAll('cpdline')
                .data(cpdPoints)
                .enter()
                .append('line')
                .attrs({
                    'class': 'cpdline cpdline' + this.id,
                    'x1': (d) => { return this.x(d) },
                    'y1': 0,
                    'x2': (d) => { return this.x(d) },
                    'y2': this.mainHeight - this.padding.bottom,
                })
                .style('stroke', this.$store.cpdLineColor)
                .style('stroke-width', '3.5px')
                .style('border-style', 'dashed')
                .style('border', '1px solid #f7f7f7')
                .style('z-index', 100)


            this.navSvg.selectAll('cpdnavline')
                .data(cpdNavPoints)
                .enter()
                .append('line')
                .attrs({
                    'class': 'cpdnavline cpdnavline' + this.$parent.plotMetric,
                    'x1': (d) => { return this.navX(d) },
                    'y1': 0,
                    'x2': (d) => { return this.navX(d) },
                    'y2': this.navHeight - this.navPadding.bottom,
                })
                .style('stroke', this.$store.cpdLineColor)
                .style('stroke-width', '3.5px')
                .style('z-index', 100)
        },

        clearCPDLabels() {
            this.navSvg.selectAll('.cpdnavlabel').remove()
            this.navSvg.selectAll('.cpdNavLabelText').remove()
        },

        drawCPDLabels() {
            let cpdLabelPoints = []
            for (let i = 0; i < this.cpds.length; i += 1) {
                if (i == 0) {
                    cpdLabelPoints.push([0, this.cpds[i]])
                }
                else {
                    cpdLabelPoints.push([this.cpds[i - 1], this.cpds[i]])
                }
            }

            this.navLabelContainer = this.navSvg.selectAll('cpdnavlabel')
                .data(cpdLabelPoints)
                .enter()
                .append('g')

            this.navLabelContainer
                .append('circle')
                .attrs({
                    'class': 'cpdnavlabel',
                    'id': 'cpdNavLabel-' + this.comm_count,
                    'r': 10,
                    'stroke': 'black',
                    'fill': 'white',
                    'cx': (d, i) => {
                        // let midPoint = (this.actualTime[d[0]] + this.actualTime[d[1]]) / 2
                        // return this.navX(midPoint)
                        let endPoint = this.actualTime[d[1]]
                        return this.navX(endPoint)
                    },
                    'cy': 10
                })

            this.navLabelContainer.append("text")
                .attrs({
                    "x": (d, i) => {
                        // let midPoint = (this.actualTime[d[0]] + this.actualTime[d[1]]) / 2
                        // return this.navX(midPoint)
                        let endPoint = this.actualTime[d[1]]
                        return this.navX(endPoint)
                    },
                    "dx": (d) => -5,
                    "y": 15,
                    "class": 'cpdNavLabelText'
                })
                .text((d, i) => i + 1)
            this.comm_count += 1
        },

        initMainView() {
            this.mainSvg = this.svg.append('g')
                .attrs({
                    height: this.mainHeight,
                    width: this.mainWidth,
                    id: 'mainSVG',
                    transform: `translate(${this.padding.left * 1.5}, ${this.padding.top})`
                })

            this.mainPathG = this.mainSvg.append('g')
                .attrs({
                    transform: `translate(${this.padding.left * 1.5}, ${this.padding.top})`
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
            console.log("Clearing all lines")
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
                let windowTs = []
                if (this.actualTime.length > this.timepointMoveThreshold) {
                    windowTs = ts.slice(this.actualTime.length - this.timepointMoveThreshold, this.actualTime.length)
                    this.windowActualTime = this.actualTime.slice(this.actualTime.length - this.timepointMoveThreshold, this.actualTime.length)
                    this.x.domain([this.actualTime[this.actualTime.length - this.timepointMoveThreshold], this.actualTime[this.actualTime.length - 1]])
                }
                else {
                    windowTs = ts
                    this.windowActualTime = this.actualTime
                    this.x.domain([this.startTime, this.actualTime[this.actualTime.length - 1]])
                }

                // Set the Y domain for line. 
                let yDomTemp = d3.extent(windowTs)
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

                // console.log("Current Data: ", windowTs)
                this.path
                    .datum(windowTs)
                    .attrs({
                        'id': 'line' + id,
                        d: this.line,
                        stroke: this.$store.colorset[cluster],
                        'stroke-width': (d) => {
                            if (this.numberOfProcs < 16) return 2.0
                            else return 1.0
                        },
                        fill: 'transparent',
                    })
                    .style('z-index', 0)

                // Calculate the avg out of the data (ts).
                if (this.movingAvgTs[this.plotMetric] == undefined) {
                    if (id == 0) {
                        this.currentMovingAvg = []
                        // this.currentMovingAvg[id] = 0
                    }
                    for (let i = 0; i < ts.length; i += 1) {
                        if (this.currentMovingAvg[i] == undefined) {
                            this.currentMovingAvg[i] = 0
                        }
                        this.currentMovingAvg[i] += ts[i] / this.numberOfProcs
                    }
                }
                else {
                    if (id == 0) {
                        this.currentMovingAvg = 0
                    }
                    this.currentMovingAvg += ts[this.movingAvgTs[this.plotMetric].length - 1] / this.numberOfProcs
                }

            }
            // Push the average values into the array. 
            if (this.movingAvgTs[this.plotMetric] == undefined) {
                this.movingAvgTs[this.plotMetric] = []
                for (let i = 0; i < this.currentMovingAvg.length; i += 1) {
                    this.movingAvgTs[this.plotMetric].push(this.currentMovingAvg[i])
                }
            }
            else {
                console.log("Time series [Moving average] = ", this.currentMovingAvg)
                this.movingAvgTs[this.plotMetric].push(this.currentMovingAvg)
            }
        },

        // Clear Navigation timeline view.
        clearNavView() {
            d3.selectAll('#avgLine' + this.$parent.panelId).remove()
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
                .style('z-index', 1)

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

            // this.initBrushes()
        },

        drawNavView() {
            this.navPath = this.navSvg.append('path')
                .attrs({
                    'class': 'avgLine',
                    'id': 'avgLine' + this.$parent.panelId
                })

            this.navX.domain([this.startTime, this.actualTime[this.actualTime.length - 1] * 1.5])

            let yNavDomTemp = d3.extent(this.movingAvgTs[this.plotMetric])
            if (yNavDomTemp[1] > this.yNavDom[1])
                this.yNavDom[1] = yNavDomTemp[1]
            this.navY.domain(this.yNavDom)


            let data = this.movingAvgTs[this.plotMetric]
            this.navPath
                .datum(data)
                .attrs({
                    d: this.navLine,
                    class: 'avgLine avgLine' + this.$parent.plotMetric,
                    stroke: "#000",
                    'stroke-width': (d) => {
                        return 1.5
                    },
                    fill: 'transparent',
                })
                .style('z-index', 0)
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

       
        clearNavDrag(){
            d3.select('#dragSVG').remove();
        },

        initNavDrag() {
            this.barWidth = 0
            this.dragBarWidth = 5

            this.drag = d3.drag()
                .on('drag', this.dragMove)

            this.dragLeft = d3.drag()
                .on("drag", this.ldragresize)
                .on('end', this.dragrequest)

            this.dragSVG = this.navSvg.append('g')
                .data([{
                    size: this.navWidth - this.padding.left - this.padding.right,
                    // size: this.navX(this.actualTime[this.actualTime.length - 1]),
                    x: this.navX(this.$store.selectedDragTime),
                    y: 0,
                }])
                .attr('id', 'dragSVG')
                .style('z-index', 0)

            this.dragRect = this.dragSVG
                .call(this.drag)

            this.dragRectLeft = this.dragSVG.append('rect')
                .attrs({
                    "id": "dragLeft",
                    "x": (d) => d.x - this.dragBarWidth / 2,
                    "y": (d) => d.y + this.dragBarWidth / 2,
                    "height": this.navHeight - this.dragBarWidth,
                    "width": this.dragBarWidth,
                    "fill": "brown",
                    "fill-opacity": 0.5,
                    "cursor": "ew-resize",
                    "cursor": "move"
                })
                .call(this.dragLeft)
        },

        dragMove(d) {
            this.dragRect
                .attr("x", d.x = Math.max(0, Math.min(this.navWidth - this.barWidth, d3.event.x)))

                this.dragRectLeft
                .attr({
                    "x": (d) => d.x - (this.dragBarWidth) / 2
                })
        },

        ldragresize(d) {
            let oldX = d.x
            d.x = Math.max(0, Math.min(d.size + this.barWidth - this.dragBarWidth / 2, d3.event.x))

            for(let i = 0; i < this.actualTime.length - 1; i ++){
                let currentX = this.navX(this.actualTime[i])
                let nextX = this.navX(this.actualTime[i+1])
                if( currentX <= d3.event.x && nextX > d3.event.x){
                    d.x = nextX
                    this.$store.selectedDragTime = this.actualTime[i]
                    this.$store.selectedDragTimeRound = Math.floor(this.actualTime[i])
                }
            }

            this.dragRectLeft
                .attr('x', (d) => d.x - this.dragBarWidth / 2)

            this.dragRect
                .attrs({
                    'x': (d) => d.x,
                    'width': this.barWidth
                })
        },

        dragrequest(d){
            this.$store.baseMatrix = this.$store.result[this.$store.selectedDragTimeRound]['communication']
            for (let idx = 0; idx < this.$store.DiffMatrixID; idx += 1) {
                d3.selectAll('.aggrRect' + idx)
                    .style('fill', (d, i) => {
                        let val = (d.weightAggr - this.$store.baseMatrix[i].weightAggr)
                        let val_normalized = ((val) / (1292) + 1)/2
                        return d3.interpolateRdBu(val_normalized)
                    })
            }

            EventHandler.$emit('fetch_kpmatrix_on_base_request', this.$store.selectedDragTime)
        }
    }
}