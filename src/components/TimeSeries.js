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
    height: 0,
    width: 0,
    metrics: null,
    selectedTimeDomain: null,
    showCPD: false,
    selectedMeasure: null,
    colorBy: null,
    methods: ['AFF', 'CUSUM', 'EMMV', 'PCA'],
    selectedMethod :'AFF',
    colors: ['teal', 'purple', 'orange', 'steelblue'],
    current_views: [],
    cpds: []
  }),
  mounted () {
    this.id = this._uid +'-overview'
  },
  methods: {
    init () {
      let visContainer = document.getElementById(this.id)
      this.width = visContainer.clientWidth 
      this.height = window.innerHeight/3
      this.config = {
        container: this.id,
        viewport: [this.width, this.height]
      }
      this.views = [{
        id: 'view-right',
        width: this.width / 2,
        height: this.height,
        gridlines: {y: true},
        enableInteraction: true,
        padding: {left: 70, right: 150, top: 50, bottom: 80},
        offset: [this.width / 2, 0],
        color: ['green', 'red', 'teal', 'orange'],
        clusters: null,
        colorEncoding: 'cluster', 
        colorSet: ['green', 'orange', 'purple', 'steelblue', 'red']
      }]
    },
    
    initVis (ts){
      this.data = ts
      this.vis = p4(this.config).data(ts).view(this.views)
    },

    removeVis(elms) {
      for(let i=0; i < elms.length; i++){
        elms[i].remove()
      }
    },

    clearVis (ts){
      let container = document.getElementById(this.id)
      this.removeVis(container.querySelectorAll('.p6-viz'))
      this.vis = null
      this.current_views = []
      this.initVis(ts)
    },

    visualize (metrics, callback, cpd, clusters) { 
      this.metrics = metrics
      if(cpd == 1){
        this.cpds.push(this.$parent.stream_count - 1)
      }
      let viewSetting = {
        gridlines: {y: true},
        padding: {left: 70, right: 60, top: 10, bottom: 30},
      }

      let collection = {}
      metrics.forEach((metric, mi) => {
        collection[metric] = {}
        collection[metric]['$' + this.selectedMeasure] = metric
        collection['cluster'] = {$max: 'cluster'}
        let view = Object.assign({}, viewSetting)
        view.id = 'view' + mi
        view.width = this.width
        view.height = this.height / metrics.length
        view.offset = [0, this.height - view.height * (mi+1)]
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
        gridlines: { y: true},
        opacity: 0.5,
        facets: {
          rows: {
            metrics: metrics,
            colors: this.colors
          }
        }
      }

      if (this.enableInteraction) {
        vmap.facets.brush = {
          condition: {x: true, lazy: true},
          callback: (selection) => {
            this.callback(selection[this.selectedTimeDomain])
          }
        }
      }

        vmap.color = {
          field: this.colorEncoding,
          range: this.colorSet,
          "interpolate": false
        }
    
      let aggregation = [this.timeAttribute]

      if(!this.isAggregated) {
        aggregation.push(this.groupBy)
      }
      vmap.color = {
        field: this.colorEncoding,
        range: this.colorset,
        "interpolate": false
      }
        

      // let matchSpec = {}
      // matchSpec[this.selectedTimeDomain] = 
      // domain = this.selectedTimeDomain

      // .match({
      //   lastGvt: [1000, 2000]       
      // })

      this.vis.view(this.current_views).head()
      .aggregate({
        $group: aggregation,
        $collect: collection
      })

      this.vis.visualize(
        metrics.map((metric, mi) => {
          return Object.assign({id: 'view' + mi, y: metric}, vmap)
        })
      )   

      this.vis.annotate({
        id: this.id,
        mark: 'vline',
        size: 3,
        color: 'red',
        brush: {
          callback: function(s) {
            console.log(s)
          }
        },
        position: {values: this.cpds} // this set the positions of the vlines
      })
    }
  }
}

