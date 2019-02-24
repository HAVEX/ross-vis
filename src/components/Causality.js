import tpl from '../html/Causality.html'
import Vue from 'vue'
import axios from 'axios'

export default {
  name: 'Causality',
  template: tpl,
  components: {

  },
  data: () => ({

  }),

  mounted: function () {
  },

  methods: {
    init(tsData) {
      this.reset()
    },

    reset() {
      this.visualize()
    },

    visualize() {
      /* axios.get('http://localhost:8888/causality', {
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
      }) */
    }
  }
}
