import p4 from 'p4'
import template from '../html/Dimensionality.html'
import axios from 'axios'

export default {
  name: 'Dimensionality',
  template,
  data: () => ({
    data: null,
    methods: ['prog_inc_PCA', 'inc_PCA', 'PCA', 'tsne'],
    selectedMethod: 'inc_PCA'
  }),
  methods: {
    visualize () {      
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
        let width = container.parentElement.clientWidth
        let height = container.parentElement.clientHeight
        container.innerHTML = ''
        p4({
          container: 'stats-view',
          viewport: [width, height],
          padding: {left: 80, right: 30, top: 30, bottom: 80}
        })
          .data(data)
          .view([{width, height, offset: [0, 0]}])
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
    
