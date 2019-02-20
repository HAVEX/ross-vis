import p4 from 'p4'
import template from '../html/Dimensionality.html'
import axios from 'axios'

export default {
  name: 'Dimensionality',
  template: template,
  props: ['tsData'],
  data: () => ({
    id: null,
    data: null,
    methods: ['prog_inc_PCA', 'inc_PCA', 'PCA', 'tsne'],
    selectedMethod: 'prog_inc_PCA'
  }),
  mounted() {
    this.id = this._uid + '-overview'
  },
  methods: {
    init() {
      this.data = this.tsData
    },
    visualize() {
      axios.get('http://localhost:8888/pca', {
        params: {
          metrics: this.selectedMetrics,
          method: this.selectedMethod
        }
      }).then(result => {
        let data = p4.cstore().import({
          data: result.data.data,
          schema: {
            PC0: 'float',
            PC1: 'float'
          }
        }).data()

        let visContainer = document.getElementById(this.id)
        this.width = visContainer.clientWidth
        this.height = window.innerHeight / 3 - 60

        let config = {
          container: this.id,
          viewport: [this.width, this.height]
        }
        this.views = [{
          width: this.width,
          height: this.height,
          gridlines: { y: true },
          padding: { left: 80, top: 10, right: 30, bottom: 30 },
          offset: [0, 0]
        }]
        this.vis = p4(config).data(data).view(this.views)

        this.vis.visualize({
          x: 'PC0',
          y: 'PC1',
          color: 'steelblue',
          size: 7
        })
      })
    }
  }
}

