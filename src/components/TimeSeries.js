import p4 from 'p4'
import template from '../html/TimeSeries.html'

export default {
  name: 'TimeSeries',
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
    metrics: [],
    timeDomains: ['LastGvt', 'RealTs', 'VirtualTime'],
    timeRange: [0, 10],
    timeValues: null,
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
  mounted() {
    this.id = this._uid + '-overview'
  },
  methods: {
    init() {
      let visContainer = document.getElementById(this.id)
      this.width = visContainer.clientWidth
      this.height = window.innerHeight / 3 - 20
      this.config = {
        container: this.id,
        viewport: [this.width, this.height]
      }
      this.views = [{
        id: 'view-right',
        width: this.width / 2,
        height: this.height,
        gridlines: { y: true },
        enableInteraction: true,
        padding: { left: 70, right: 150, top: 50, bottom: 80 },
        offset: [this.width / 2, 0],
        clusters: null,
        colorEncoding: 'cluster',
      }]
    },

    initVis(ts) {
      this.vis = p4(this.config).data(ts).view(this.views)
      this.timeValues = this.data.uniqueValues;
      this.vis = p4(config).data(this.data)
      this.timeValues = this.data.uniqueValues;
    },

    removeVis(elms) {
      for (let i = 0; i < elms.length; i++) {
        elms[i].remove()
      }
    },

    reset(ts) {
      let container = document.getElementById(this.id)
      this.removeVis(container.querySelectorAll('.p6-viz'))
      this.vis = null
      this.current_views = []
      this.initVis(ts)
      //this.vis.head().updateData(ts)
    },

    forward() {
      this.timeRange[1] += 5;
      this.$emit('update', [this.timeValues[this.selectedTimeDomain][0], this.timeValues[this.selectedTimeDomain][this.timeRange[1]]])
      this.visualize();
    },

    backward() {
      this.timeRange[1] -= 5;
      this.$emit('update', [this.timeValues[this.selectedTimeDomain][0], this.timeValues[this.selectedTimeDomain][this.timeRange[1]]])
      this.visualize();
    },

    visualize (callback) {
      if(typeof(callback) === 'function') {
        this.callback = callback
      }

      let viewSetting = {
        gridlines: { y: true },
        padding: { left: 70, right: 60, top: 10, bottom: 30 },
      }

      let collection = {}
      metrics.forEach((metric, mi) => {
        collection[metric] = {}
        collection[metric]['$' + this.selectedMeasure] = metric
        collection['cluster'] = { $max: 'cluster' }
        let view = Object.assign({}, viewSetting)
        view.id = 'view' + mi
        view.width = this.width
        view.height = this.height / metrics.length
        view.offset = [0, this.height - view.height * (mi + 1)]
        this.current_views.push(view)
      })

      let firstMetric = {}
      let firstMetricName = Object.keys(collection)[0]
      firstMetric[firstMetricName] = collection[firstMetricName]

      let vmap = {
        mark: this.isAggregated ? 'area' : 'line',
        x: this.timeAttribute,
        color: 'colors',
        size: 1,
        gridlines: { y: true },
        opacity: 0.5,
        facets: {
          rows: {
            metrics: metrics,
            colors: this.colorSet
          }
        }
      }

      if (this.enableInteraction) {
        vmap.facets.brush = {
          condition: { x: true, lazy: true },
          callback: (selection) => {
            this.callback(selection[this.selectedTimeDomain])
          }
        }
      }

      if (this.colorEncoding) {
        vmap.color = this.colorEncoding
        vmap.colors = {
          range: this.colorSet,
          interpolate: false
        }

        collection[this.colorEncoding] = { $max: this.colorEncoding }
      }

      let aggregation = [this.timeAttribute]

      if (!this.isAggregated) {
        aggregation.push(this.groupBy)
      }
      vmap.color = 'cluster'
      vmap.colors = {
        range: this.colorset,
        "interpolate": false
      }

      collection['cluster'] = { $max: 'cluster' }
      let t = this.vis.view([]).head()
      .aggregate({
        $group: aggregation,
        $collect: collection
      })

      if(Array.isArray(this.timeRange)) {
        t.match({LastGvt: this.timeRange})
      }

      t.visualize(vmap)
      this.vis.view(this.current_views).head()
        .aggregate({
          $group: aggregation,
          $collect: collection
        })
        .visualize(
          metrics.map((metric, mi) => {
            return Object.assign({ id: 'view' + mi, y: metric }, vmap)
          })
        )


      this.vis.annotate({
        id: this.id,
        mark: 'vline',
        size: 3,
        color: 'red',
        brush: {
          callback: function (s) {
            console.log(s)
          }
        },
        position: { values: this.cpds } // this set the positions of the vlines
      })
    }
  }
}

