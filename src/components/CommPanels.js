import tpl from '../html/CommPanels.html'

import p4 from 'p4'

import Communication from './Communication'

export default {
  name: 'Dashboard',
  template: tpl,
  components: {
    Communication
  },
  data: () => ({
    socketError: false,
    server: 'localhost:8888',
    timeDomains: ['LastGvt','RealTs','VirtualTime'],
    granularity: ['PE','KP','LP'],
    measures: ['avg', 'sum', 'max', 'min'],
    timeIndexes: null,
    timeDomain: 'LastGvt',
    selectedGran: 'PE',
    selectedMeasure: 'sum',
    metrics: [
      'RbSec',
      'RbTotal'
    ],
    timeIntervals: [],
  }),
  mounted() {
    this.init()
  },

  methods: {
    init() {
      let socket = new WebSocket('ws://' + this.server + '/websocket')
      socket.onopen = () => {
        this.dialog = !this.dialog
        this.socketError = false
        let testParams = {
            "timeIntervals": [
                [204471, 238514],
                [242484, 263715],
                [280495, 363079],
                [365019, 366747],
                [380636, 393968]
            ],
            "ringMetrics": ["RbSec"]
        }
        socket.send(JSON.stringify({method: 'set', params: testParams}))

        socket.send(JSON.stringify({method: 'get', data: 'KpData'}))
      }

      socket.onerror = (error) => {
        this.socketError = true
      }
  
      socket.onmessage = (event) => {
        let data = JSON.parse(event.data)
        this.data = data.data
        if (data.schema.hasOwnProperty('CommData')) {
          data.schema.CommData = 'int'
        }
        let params = data.params
        this.timeIntervals = params.timeIntervals
        if(params.timeMetric) this.timeDomain = params.timeMetric
        if(params.ringMetrics) this.metrics = params.ringMetrics
        this.update()
      }

    },
    update() {
      this.$refs.container.visualize({
        data: this.data,
        measure: 'sum',
        timeDomain: this.timeDomain,
        metrics: this.metrics,
        timeIntervals: this.timeIntervals
      })
    }
  }
}
