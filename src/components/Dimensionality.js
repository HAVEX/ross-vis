import p4 from 'p4'
import template from '../html/Dimensionality.html'
import axios from 'axios'

export default {
  name: 'Dimensionality',
  template: template,
  props: ['tsData'],
  data: () => ({
    data: null,
    methods: ['prog_inc_PCA', 'inc_PCA', 'PCA', 'tsne'],
    selectedMethod: 'prog_inc_PCA'
  }),
  methods: {
    init() {
      this.data = this.tsData
    },
    visualize() {
      console.log(document.getElementById('stats-view'))
      axios.get('http://localhost:8888/pca', {
        params: {
          metrics: this.metrics,
          method: this.selectedMethod
        }
      }).then(result => {
        let data = p4.cstore().import({
          data: result.data.data,
          schema: {
            PC0: 'float',
            PC1: 'float'
          }
        })
          .data()

        let container = document.getElementById('stats-view')
        let width = container.clientWidth
        let height = window.innerHeight/3 - 100
        console.log(height)
        container.innerHTML = ''
        p4({
          container: 'stats-view',
          viewport: [width, height],
          padding: { left: 80, right: 30, top: 30, bottom: 30 }
        })
          .data(data)
          .view([{ width, height, offset: [-10, -10] }])
          .visualize({
            x: 'PC0',
            y: 'PC1',
            color: 'steelblue',
            size: 10
          })
      })
    }
  }
}

