import tpl from '../html/Dashboard.html'
import p5 from 'p5'
import p4 from 'p4'
import p3 from 'p3'
import picos from 'picos'

export default {
  name: 'Dashboard',
  template: tpl,
  data: () => ({
    appName: 'ROSS-Vis',
    dialog: true,
    socketError: false,
    data: null,
    server: 'localhost:8888',
    numPE: null,
    numKP: null,
    vis: null,
    transpiler: null,
    modes: ['Post Hoc', 'In Situ'],
    defaultMode: 'Post Hoc',
    timeDomains: ['LastGvt','RealTs','VirtualTime'],
    granularity: ['PE','KP','LP'],
    measures: ['avg', 'sum', 'max', 'min'],
    timeIndexes: null,
    selectedTimeDomain: 'LastGvt',
    selectedTimeInterval: null,
    selectedGran: 'PE',
    selectedMeasure: 'sum',
    isAggregated: true,
    views: [],
    width: 0,
    height: 0,
    left: false,
    metrics: [],
    checkboxs: [],
    defaultMetrics: [
      'NeventProcessed', 
      'RbTotal',
      'VirtualTimeDiff', 
      // 'NetworkRecv', 'NetworkSend'
    ],
    selectedMetrics: [],
    commData: null,
    metricData: null,
    showIntraComm: false
  }),
  props: {
    source: String
  },
  mounted: function() {
    let visContainer = document.getElementById('vis-overview')
    this.width = visContainer.clientWidth
    this.height = visContainer.clientHeight * 0.9
    this.selectedMetrics = this.defaultMetrics.slice()    
  },
  methods: {
    start() {

    },
    init() {
      let config = {
        container: 'vis-overview',
        viewport: [this.width, this.height]
      }

      if(this.numKP && this.numPE) {
        let socket = new WebSocket('ws://' + this.server + '/websocket')
        socket.onopen = () => {
          this.dialog = !this.dialog
          this.socketError = false
          socket.send(JSON.stringify({data: 'KpData', method: 'get'}));

        }

        socket.onerror = (error) => {
          this.socketError = true
          console.log(error)
        }
    
        socket.onmessage = (event) => {
          let data = JSON.parse(event.data)
          this.data = data.data
          this.transpiler = new p5.Transpiler(this.metrics);
          if (data.schema.hasOwnProperty('CommData')) {
            data.schema.CommData = 'int'
          }
          let cache = p4.cstore({})
          this.metrics =  Object.keys(data.schema)
          cache.import(data)
          cache.index('RealTs')
          cache.index('LastGvt')
          let gpuData = cache.data()
          // console.log(gpuData.stats)
          this.timeIndexes = gpuData.uniqueValues
          this.vis = p4(config).data(gpuData).view(this.views)
          this.reset()
        }
      }
      

    },
    reset() {
      this.selectedMetrics = this.defaultMetrics.slice()
      this.views = [{
          id: 'view-right',
          width: this.width / 2,
          height: this.height,
          gridlines: {y: true},
          padding: {left: 70, right: 150, top: 50, bottom: 80},
          offset: [this.width / 2, 0]
      }]
      this.selectedTimeInterval = null
      this.visualize()
      
    },
    visualizeComm() {
      let container = document.getElementById('graph-view')
      container.innerHTML = ''

      let aggregateByTime = p3.pipeline()
      if(this.selectedTimeInterval !== null) {
        let match = {}
        match[this.selectedTimeDomain] = this.selectedTimeInterval
        aggregateByTime.match(match)
      }

      let tsData = aggregateByTime.aggregate({
        $group: this.selectedTimeDomain,
        $collect: {
          items: {$data: '*'}
        }
      }).execute(this.data)


      let tsCommData = tsData.map(sample => {
        return sample.items.sort((a,b) => a.Peid - b.Peid).map(item => item.CommData)
      })

      let accCommData = tsCommData[0]
      // console.log(accCommData)
      if(tsCommData.length > 1) {
        tsCommData.slice(1).forEach(sample => {
          sample.forEach((rows, i) => {
            rows.forEach((value, j) => {
              if(i < accCommData.length) accCommData[i][j] += value;
            })
          })
        })
      }
      accCommData = accCommData.map(rows => {
        let newRows = new Array(3)
        for(var i = 0; i< this.numPE; i++) {
          newRows[i] = rows.slice(i * this.numKP, (i+1) * this.numKP).reduce((a,b) => a+b)
        }
        return newRows
      })
  
      this.commData = accCommData[0].map((a, i) => p3.vector.sum(accCommData.slice(i*16, (i+1)*16)))

      let aggrSpec = this.transpiler.transpile([{
        $aggregate: {
          $group: ['Kpid', 'Peid'],
          $include: this.selectedMetrics,
          $exclude: ['CommData'],
          $calculate: [this.selectedMeasure]
        }
      }])

      let transform = p3.pipeline();

      if(this.selectedTimeInterval !== null) {
        let match = {}
        match[this.selectedTimeDomain] = this.selectedTimeInterval
        transform.match(match)
      }
      
      let result = transform.aggregate(aggrSpec[0].$aggregate)
        .execute(this.data)

      this.metricData = p3.aggregate(result, {$group: 'Peid', $collect: {items: {$data: '*'}}}).map(r => r.items)

      let colorSets = [
        ['white', 'teal'],
        ['white', 'purple'],
        ['white', 'orange'],
        ['white', 'steelblue'],
        ['white', 'red'],
        ['steelblue', 'red'],
        ['green', 'yellow'],
      ]

      let layers = [
        {
          type: 'link',
          data: this.commData,
          ignoreDiagonal: !this.showIntraComm,
          size: 2,
          vmap: {
            color: 'CommData'
          },
          colors: ['steelblue', 'red']
        },
      ]

      this.selectedMetrics.forEach( (metric, mi) => {
        layers.push({
          type: 'rect',
          data: this.metricData,
          vmap: {
            color: this.selectedMeasure + '.' + metric
          },
          colors: colorSets[mi],
          size: 1
        })
      })

      layers.push({
        type: 'text',
        data: this.metricData.map((r,i) => 'PE' + i),
        size: 1
      })
      
      picos({
        config: {
          container: '#graph-view',
          legend: true,
          width: container.clientWidth,
          height: container.clientHeight
        },
        layers: layers
      })
    },
    visualize() {
      let viewSetting = {
        gridlines: {y: true},
        padding: {left: 70, right: 60, top: 10, bottom: 40},
      }
      let metrics = this.selectedMetrics;
      let collection = {}

      // let metrics = [ 'RbPrim', 'RbSec', 'Efficiency'];
      // let metrics = Object.keys(data.schema)
      let views = [];
      metrics.forEach((metric, mi) => {
        collection[metric] = {}
        collection[metric]['$' + this.selectedMeasure] = metric
        let view = Object.assign({}, viewSetting)
        view.id = 'view' + mi
        view.width = this.width
        view.height = this.height / metrics.length
        view.offset = [0, this.height - view.height * (mi+1)]
        views.push(view)
      })

      let firstMetric = {}
      let firstMetricName = Object.keys(collection)[0]
      firstMetric[firstMetricName] = collection[firstMetricName]
      
      let vmap = {
        mark: this.isAggregated ? 'area' : 'spline',
        x: this.selectedTimeDomain,
        color: 'steelblue',
        size: 3,
        brush: {
          condition: {x: true, lazy: true},
          callback: (selection) => {
            let ti = this.timeIndexes[this.selectedTimeDomain]
            let start = Math.floor(selection[this.selectedTimeDomain][0])
            let end = Math.ceil(selection[this.selectedTimeDomain][1])
            if (end - start >= 1) {
              this.selectedTimeInterval = [ti[start], ti[end]]
              this.visualizeComm()
            }
          }
        }
      }

      let aggregation = [this.selectedTimeDomain]

      if(!this.isAggregated) {
        vmap.color = 'Peid'
        aggregation.push('Peid')
      }

      this.vis.view(views).head()
      .aggregate({
        $group: aggregation,
        $collect: collection
      })

      this.vis.visualize(
        metrics.map((metric, mi) => {
          return Object.assign({id: 'view' + mi, y: metric}, vmap)
        })
      )

      this.visualizeComm()
    }
  }
}
