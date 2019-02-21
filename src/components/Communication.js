import p3 from 'p3'
import picos from 'picos'
import template from '../html/Communication.html'

export default {
  name: 'Communication',
  template,
  data: () => ({
    data: null,
    timeDomain: null,
    metrics: [],
    showIntraComm: false,
    numKP: 0,
    numPE: 0,
    threshold: 0,
    maxLinkValue: 1
  }),
  computed: {
    thresholdValue: function() {
      return (this.threshold / 100 * this.maxLinkValue).toFixed(0)
    }
  },
  methods: {
    visualize({
      data,
      timeDomain,
      metrics,
      timeIntervals,
      measure
    }) {
      if(data !== undefined && Array.isArray(data)) {
        this.data = data
        this.numPE = Math.max(...data.map(d => d.Peid)) + 1
        this.numKP = Math.max(...data.map(d => d.Kpid)) + 1
      }
      console.log(this.numPE, this.numKP, timeIntervals)
      let container = this.$refs.container
      container.innerHTML = ''
      let rings
      let colorDomains = new Array(metrics.length + 1)
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
        // console.log(accCommData)
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
  
        if(timeInterval !== null) {
          let match = {}
          match[timeDomain] = timeInterval
          transform.match(match)
        }
        
        let result = transform.aggregate(aggrSpec.$aggregate)
          .execute(this.data)
  
        let metricData = p3.aggregate(result, {$group: 'Peid', $collect: {items: {$data: '*'}}}).map(r => r.items)
  
        let colorSets = [
          ['white', 'teal'],
          ['white', 'purple'],
          ['white', 'orange'],
          ['white', 'steelblue'],
          ['white', 'red'],
          ['steelblue', 'red'],
          ['green', 'yellow'],
        ]
  
        let layers = [
          {
            type: 'link',
            data: commData,
            threshold: 10000,
            ignoreDiagonal: !this.showIntraComm,
            size: 2,
            vmap: {
              color: 'CommData'
            },
            colors: ['steelblue', 'red'],
            colorDomain: colorDomains[0]
          },
        ]
  
        metrics.forEach( (metric, mi) => {
          layers.push({
            type: 'rect',
            data: metricData,
            vmap: {
              color: measure + '.' + metric
            },
            colors: colorSets[mi],
            size: 1,
            colorDomain: colorDomains[mi+1]
          })
        })
  
        layers.push({
          type: 'text',
          data: metricData.map((r,i) => 'PE' + i),
          size: 1
        })
        
        let div = document.createElement('div')
        let radius = container.clientWidth / timeIntervals.length
        rings = picos({
          config: {
            container: div,
            legend: (tii === timeIntervals.length - 1),
            width: radius,
            height: radius
          },
          layers: layers
        })
  
        container.appendChild(div)
        rings.forEach( (ring, rii) => {
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
      rings.forEach((ring, rii) => {
        if(typeof(ring.updateColor) === 'function') {
          ring.updateColor(colorDomains[rii])
        }
      })
    }
  }
}
