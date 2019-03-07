import p4 from 'p4'
import template from '../html/TimeSeries.html'
import axios from 'axios'

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
      this.height = window.innerHeight/2 - 60
      this.config = {
        container: this.id,
        viewport: [this.width, this.height]
      }
      this.views = [{
        id: 'view-right',
        width: this.width / 2,
        height: this.height,
        gridlines: {y: true},
        padding: {left: 70, right: 150, top: 50, bottom: 80},
        offset: [this.width / 2, 0],
        "color": {
          "range": ["steelblue",
          "red",
          "teal",
          "orange",
          "purple"],
          "interpolate": false
        }
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

    visualize (cpd, clusters, metrics, callback) { 
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
        size: 3,
        brush: {
          condition: {x: true, lazy: true},
          callback
        }
      }
      let aggregation = [this.timeAttribute]

      if(!this.isAggregated) {
        vmap.color = {
          field: clusters,
          "interpolate": false
        }
        aggregation.push('id')
      
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
        // colors.map((color, mi) => {
        //   return Object.assign({color:  })
        // })

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
}