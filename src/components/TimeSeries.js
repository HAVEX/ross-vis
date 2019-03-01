import p4 from 'p4'
import template from '../html/TimeSeries.html'
import axios from 'axios'

export default {
  name: 'TimeSeries',
  template: template,
  props: ['ts', 'clustering'],
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
    selectedMethod :'AFF'
  }),
  mounted () {
    this.id = this._uid +'-overview'
  },
  methods: {
    init () {
      let visContainer = document.getElementById(this.id)
      this.width = visContainer.clientWidth
      this.height = window.innerHeight/2
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
        offset: [this.width / 2, 0]
      }]
     
    },
    
    set (){
      console.log(this.ts)
    },

    visualize (ts, metrics, callback) {
      console.log(ts)
      this.vis = p4(this.config).data(ts).view(this.views)
      this.metrics = metrics
      let viewSetting = {
        gridlines: {y: true},
        padding: {left: 70, right: 60, top: 10, bottom: 30},
      }

      let collection = {}
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
          callback
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
    },

    visualizeCPD () {
      axios.get('http://localhost:8888/cpd', {
        params: {
          'timeDomain': this.selectedTimeDomain,
          'yDomain': this.metrics[0]
        }
      }).then(result => {
        this.vis.annotate({
          id: this.id,
          mark: 'vline',
          size: 3,
          color: 'red',
          position: {values: result.data.data} // this set the positions of the vlines
        })
      })

    }
  }
}
