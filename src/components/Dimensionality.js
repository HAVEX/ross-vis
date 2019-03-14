import p4 from 'p4'
import template from '../html/Dimensionality.html'
import axios from 'axios'

export default {
  name: 'Dimensionality',
  template,
  data: () => ({
    data: null,
    server: null,
    dimensionalMethods: ['PCA', 'tSNE'],
    dimensionalSelected: 'PCA',
    clusteringMethods: ['DBSCAN', 'KMeans'],
    clusteringSelected: 'DBSCAN',
    metrics: [],
    metricX: null,
    metricY: null,
    granularities: ['PE', 'KP'],
    granularity: 'PE',
    proc: null,
    oncomplete: null,
    colorSet: ['green', 'orange', 'purple', 'steelblue', 'red']
  }),
  methods: {
    init() {
      let container = this.$refs.Vis
      let width = container.parentElement.clientWidth
      let height = container.parentElement.clientHeight
      container.innerHTML = ''
      this.proc = p4({
        container: container,
        viewport: [width, height],
        padding: {left: 80, right: 30, top: 30, bottom: 80}
      })
      .view([{
        width, height, 
        offset: [0, 0],
        color: {
          range: this.colorSet,
          interpolate: false
        }
      }])
      return this.analyze()
    },

    analyze () {
      let baseURL = 'http://localhost:8888/analysis'
      let dr = this.dimensionalSelected.toLowerCase()
      let cl = this.clusteringSelected.toLowerCase()
      let url = [baseURL, this.granularity, dr].join('/')

      return new Promise((resolve, reject) => {
        axios.get(url).then(result => {
          this.metrics = Object.keys(result.data.schema)
          let data = p4.cstore().import({
            data: result.data.data,
            schema: result.data.schema,
          })
          .data()
          this.proc.data(data)
          this.visualize()

          let res = {
            schema: result.data.schema,
            data: result.data.data,
            granularity: this.granularity,
            clustering: this.clusteringMethods.map(d=>d.toLowerCase())
          }
          if(typeof(this.oncomplete) === 'function') {
            this.oncomplete(res)
          }
          resolve(res)          
        }).catch(err => {
          reject(err)
        })
      })
    },

    visualize () {
      this.proc.visualize({
        x: 'PC0',
        y: 'PC1',
        color:  this.clusteringSelected.toLowerCase(),
        opacity: 0.5,
        size: (this.granularity === 'PE' ) ? 20 : 10
      })


    }
  }    
}
    
