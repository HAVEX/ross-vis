import p4 from 'p4'
import template from '../html/Dimensionality.html'
import axios from 'axios'

export default {
  name: 'Dimensionality',
  template: template,
  props: [],
  data: () => ({
    id: null,
    data: null,
    config: null,
    methods: ['prog_inc_PCA', 'inc_PCA', 'PCA', 'tsne'],
    selectedMethod: 'prog_inc_PCA',
    vis: null,
  }),
  mounted() {
    this.id = this._uid + '-overview'
  },
  methods: {
    init() {
      let visContainer = document.getElementById(this.id)
      this.width = visContainer.clientWidth
      this.height = window.innerHeight / 2 - 60

      this.config = {
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
    },

    initVis (ts){
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

    visualize() {
      //this.vis = p4(this.config).data(ts).view(this.views)
      this.vis.visualize({
        x: 'PC0',
        y: 'PC1',
        color: 'cluster',
        size: 10
      })
    }
  }
}

