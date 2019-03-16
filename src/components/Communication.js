import p3 from 'p3'
import picos from 'picos'
import template from '../html/Communication.html'

export default {
  name: 'Communication',
  template,
  data: () => ({
    id: null,
    drawer: false,
    data: null,
    timeDomain: null,
    allMetrics: [],
    metrics: [],
    showIntraComm: false,
    numKP: 0,
    numPE: 0,
    threshold: 0,
    rings: [],
    maxLinkValue: 1,
    isComparisonMode: false,
    granularity: 'KpGid',
    colors: ['red', 'blue', 'yellow', 'green', 'purple']

  }),
  computed: {
    thresholdValue: function() {
      return (this.threshold / 100 * this.maxLinkValue).toFixed(0)
    }
  },
  mounted () {
    this.id = this._uid +'-overview'
  },
  methods: {
    updateLink () {
      this.rings.forEach(ring => {
        ring.updateLink(this.thresholdValue )
      })
    },

    updateMetrics () {
      this.$emit('updateMetrics', this.metrics)
    },

    visualize({
      data,
      timeDomain,
      metrics,
      timeIntervals,
      measure,
      processIds = [],
      clusterIds = [],
      clusterColors = this.colors
    }) {
      if(data !== undefined && Array.isArray(data)) {
        this.data = data
        if (processIds.length > 0) {
          this.data = data.filter(d => processIds.indexOf(d.KpGid))
        }
        this.numPE = Math.max(...this.data.map(d => d.Peid)) + 1
        this.numKP = Math.max(...this.data.map(d => d.Kpid)) + 1
      }
      this.rings = new Array(timeIntervals.length)
      let colorDomains = new Array(metrics.length + 1)
      let container = this.$refs.container
      this.width = container.clientWidth 
      this.height = window.innerHeight/3 - 20
      this.config = {
        container: this.id,
        viewport: [this.width, this.height]
      }
      container.innerHTML = ''
      if (timeIntervals.length > 1) {
        this.isComparisonMode = true
      }

      timeIntervals.forEach((timeInterval, tii) => {
        let aggregateByTime = p3.pipeline()
        if(timeInterval !== null) {
          let match = {}
          match[timeDomain] = timeInterval
          aggregateByTime.match(match)
        }
        
        let tsData = aggregateByTime.aggregate({
          $group: timeDomain,
          $collect: {
            items: {$data: '*'}
          }
        }).execute(this.data)
        
        let tsCommData = tsData.map(sample => {
          return sample.items.sort((a,b) => a.Peid - b.Peid).map(item => item.CommData)
        })
        let accCommData = tsCommData[0]
  
        if(tsCommData.length > 1) {
          tsCommData.slice(1).forEach(sample => {
            sample.forEach((rows, i) => {
              rows.forEach((value, j) => {
                if(i < accCommData.length) accCommData[i][j] += value;
              })
            })
          })
        }
        accCommData = accCommData.map(rows => {
          let newRows = new Array(this.numPE)
          for(var i = 0; i< this.numPE; i++) {
            newRows[i] = rows.slice(i * this.numKP, (i+1) * this.numKP).reduce((a,b) => a+b)
          }
          return newRows
        })
    
        let commData = accCommData[0].map((a, i) => p3.vector.sum(accCommData.slice(i*this.numKP, (i+1)*this.numKP)))
        
        let collection = {}
        for (let metric of metrics) {
          collection[measure + '.' + metric] = {}
          collection[measure + '.' + metric]['$'+measure] = metric
        }

        let aggrSpec = {
          $aggregate: {
            $group: ['Kpid', 'Peid'],
            $reduce: collection
          }
        }
  
        let transform = p3.pipeline()
        let match = {}
        if (timeInterval !== null) {
          match[timeDomain] = timeInterval
        }

        if (Object.keys(match).length) {
          transform.match(match)
        }

        let result = transform.aggregate(aggrSpec.$aggregate)
          .execute(this.data)

        let metricData = p3.aggregate(result, {
          $group: 'Peid',
          $collect: {items: {$data: '*'}}
        })
        .sort((a, b) => a.items[0].Peid - b.items[0].Peid)
        .map(r => r.items)

        let colorSets = [
          ['#EEE', 'teal'],
          ['#EEE', 'purple'],
          ['#EEE', 'orange'],
          ['#EEE', 'steelblue'],
          ['#EEE', 'red'],
          ['steelblue', 'red'],
          ['green', 'yellow'],
        ]
  
        let layers = [
          {
            type: 'link',
            data: commData,
            threshold: 0,
            ignoreDiagonal: !this.showIntraComm,
            size: 2,
            vmap: { color: 'CommData' },
            colors: ['steelblue', 'red'],
            colorDomain: colorDomains[0]
          },
        ]

        let layerSpec = {
          type: 'rect',
          size: 1,
        }

        if(clusterIds.length && processIds.length) {
          metricData.forEach( (items) => {
            items.forEach((item)=> {
              let gid = item.Peid * this.numKP + item.Kpid
              let pid = processIds.indexOf(gid)
              item.clusterId = clusterIds[pid]
            })
          })

          layerSpec.colors = (d) => {
            return clusterColors[d]
          }
          layerSpec.vmap = {color: 'clusterId'}
        }

        metrics.forEach( (metric, mi) => {
          let layer = Object.assign({}, layerSpec)
          layer.data = metricData
          layer.colorDomain = colorDomains[mi+1]

          if(clusterIds.length && processIds.length) {
            layer.vmap.size = measure + '.' + metric
          } else {
            layer.vmap = { color: measure + '.' + metric }
            layer.colors = colorSets[mi]
          }
          layers.push(layer)
        })
  
        layers.push({
          type: 'text',
          data: metricData.map((r,i) => 'PE' + i),
          size: 1
        })
        
        let div = document.createElement('div')
        let radius = container.clientWidth / timeIntervals.length
        this.rings[tii] = picos({
          config: {
            container: div,
            legend: (tii === timeIntervals.length - 1),
            width: this.height,
            height: this.height
          },
          layers: layers
        })
  
        container.appendChild(div)
        this.rings[tii].forEach( (ring, rii) => {
          if (Array.isArray(colorDomains[rii])) {
            colorDomains[rii][0] = Math.min(colorDomains[rii][0], ring.colorDomain[0])
            colorDomains[rii][1] = Math.max(colorDomains[rii][1], ring.colorDomain[1])
          } else {
            if(Array.isArray(ring.colorDomain)) {
              colorDomains[rii] = ring.colorDomain
            }
          }
        })
      })
     this.maxLinkValue = colorDomains[0][1]
      if(timeIntervals.length > 1) {
        this.rings.forEach(ringLayers=> {
          ringLayers.forEach((ringLayer,rii) => {
            if(typeof(ringLayer.updateColor) === 'function') {
              ringLayer.updateColor(colorDomains[rii])
            }
          })
        })
      }
    }
  }
}