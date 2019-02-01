import p4 from 'p4'
import template from '../html/Dimensionality.html'

export default {
  name: 'Dimensionality',
  template,
  data: () => ({
    data: null,
    methods: ['PCA'],
    selectedMethod: 'PCA'
  }),
  methods: {
    visualize () {
      p4.ajax.get({
        url: 'http://localhost:8888/pca',
        dataType: 'json'
      }).then(result => {
        let data = p4.cstore().import({
          data: result.data,
          schema: {
            PC0: 'float',
            PC1: 'float'
          }
        })
        .data()
  
        let container = document.getElementById('stats-view')
        let width = container.parentElement.clientWidth
        let height = container.parentElement.clientHeight * 0.9
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