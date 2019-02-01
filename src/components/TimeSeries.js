import p4 from 'p4'

export default {
  name: 'TimeSeries',
  template: '<v-card height="100%" id="vis-overview"></v-card>',
  data: () => ({
    data: null,
    view: null,
    vis: null,
    height: 0,
    width: 0,
    metrics: null,
    selectedTimeDomain: null,
    isAggregated: true,
    selectedMeasure: null
  }),
  methods: {
    init (data) {
      let visContainer = document.getElementById('vis-overview')
      this.width = visContainer.clientWidth
      this.height = visContainer.clientHeight * 0.9
      let config = {
        container: 'vis-overview',
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

      this.vis = p4(config).data(data).view(this.views)
    },

    visualize (metrics, callback) {
      let viewSetting = {
        gridlines: {y: true},
        padding: {left: 70, right: 60, top: 10, bottom: 40},
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
        console.log("a")
        p4.ajax.get({
            url: 'http://localhost:8888/cpd',
            dataType:'json'
        }).then(result => {
            console.log(result)
        })
    }
  }
}
