import p4 from 'p4'
import template from '../html/TimeSeries.html'

export default {
  name: 'TimeSeries',
  template: template,
  data: () => ({
    data: null,
    view: null,
    vis: null,
    container: null,
    enableInteraction: true,
    height: 0,
    width: 0,
    metrics: [],
    timeDomains: ['LastGvt', 'RealTs', 'VirtualTime'],
    granularities: ['System', 'PE', 'KP'],
    measures: ['avg', 'sum', 'max', 'min'],
    selectedTimeDomain: 'LastGvt',
    granularity: 'System',
    selectedMeasure: 'sum',
    selectedMetrics: ['NeventProcessed', 'RbTotal'],
    callback: null,
    colors: ['teal', 'purple', 'orange', 'steelblue'],
    visMarks: {
      System: 'area',
      PE: 'line',
      KP: 'line'
    },
    clusters: null,
    colorEncoding: null,
    colorSet: ['green', 'orange', 'purple', 'steelblue', 'red']
  }),
  watch: {
    clusters: function(cls) {
      this.colorEncoding = cls[0]
    }
  },
  mounted () {
    this.container = document.getElementById('RossVisTimeSeries')
  },
  methods: {
    init (dataObj) {
      let cache = p4.cstore({})
      cache.import(dataObj)
      cache.index('RealTs')
      cache.index('LastGvt')
      this.data = cache.data()
      this.width = this.container.clientWidth
      this.height = this.container.clientHeight * 0.9
      let config = {
        container: this.container,
        viewport: [this.width, this.height],
        padding: {left: 100, right: 20, top: 20, bottom: 50},
      }
      this.vis = p4(config).data(this.data)
    },

    destroy () {
      this.vis = null
      this.container.innerHTML = ''
    },

    visualize (callback) {
      if(typeof(callback) === 'function') {
        this.callback = callback
      }
      let aggregation = []
      let collection = {}

      let metrics = this.selectedMetrics
      metrics.forEach((metric, mi) => {
        collection[metric] = {}
        collection[metric]['$' + this.selectedMeasure] = metric
      })

      let firstMetric = {}
      let firstMetricName = Object.keys(collection)[0]
      firstMetric[firstMetricName] = collection[firstMetricName]

      let vmap = {
        mark: this.visMarks[this.granularity],
        x: this.selectedTimeDomain,
        color: 'colors',
        y: 'metrics',
        size: 1,
        gridlines: {y: true},
        opacity: (this.granularity === 'KP') ? 0.5 : 1,
        facets: {
          rows: {
            metrics: metrics,
            colors: this.colors
          },
          // sortBy: {var: 'metrics'}
        },
      }

      if(this.granularity === 'PE') {
        vmap.by = 'Peid'
        aggregation = [this.selectedTimeDomain, 'Peid']
      } else if (this.granularity === 'KP') {
        aggregation = [this.selectedTimeDomain, 'KpGid']
      } else {
        aggregation = [this.selectedTimeDomain]
      }

      if (this.enableInteraction) {
        vmap.facets.brush = {
          condition: {x: true, lazy: true},
          callback: (selection) => {
            this.callback(selection[this.selectedTimeDomain])
          }
        }
      }

      if(Array.isArray(this.clusters)) {
        this.clusters.forEach(cluster => {
          collection[cluster] = {$max: cluster}
        })
      }

      if(this.colorEncoding) {
        vmap.color = this.colorEncoding
        vmap.colors = {
          range: this.colorSet,
          interpolate: false
        }

        collection[this.colorEncoding] = {$max: this.colorEncoding}
      }

      let t = this.vis.view([]).head()
      .aggregate({
        $group: aggregation,
        $collect: collection
      })
      .visualize(vmap)

      this.selectedMetrics = vmap.facets.rows.metrics
    }
  }
}
