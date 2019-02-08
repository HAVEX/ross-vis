import p3 from 'p3'
import picos from 'picos'
import template from '../html/Communication.html'

export default {
  name: 'Communication',
  template,
  data: () => ({
    data: null,
    selectedTimeDomain: null,
    selectedMetrics: [],
    selectedTimeInterval: null,
    showIntraComm: false,
    numPE: 0,
    numKP: 0
  }),
  methods: {
    visualize(data) {
      if (Array.isArray(data)) {
        this.data = data
        this.numPE = Math.max(...data.map(d => d.Peid)) + 1
        this.numKP = Math.max(...data.map(d => d.Kpid)) + 1
      }

      let container = document.getElementById('graph-view')
      container.innerHTML = ''
    
      let aggregateByTime = p3.pipeline()
      if(this.selectedTimeInterval !== null) {
        let match = {}
        match[this.selectedTimeDomain] = this.selectedTimeInterval
        aggregateByTime.match(match)
      }

      let tsData = aggregateByTime.aggregate({
        $group: this.selectedTimeDomain,
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
      for (let metric of this.selectedMetrics) {
          collection[this.selectedMeasure + '.' + metric] = {}
          collection[this.selectedMeasure + '.' + metric]['$'+this.selectedMeasure] = metric
      }

      let aggrSpec = {
        $aggregate: {
          $group: ['Kpid', 'Peid'],
          $reduce: collection
        }
      }

      let transform = p3.pipeline()

      if(this.selectedTimeInterval !== null) {
        let match = {}
        match[this.selectedTimeDomain] = this.selectedTimeInterval
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
          ignoreDiagonal: !this.showIntraComm,
          size: 2,
          vmap: {
            color: 'CommData'
          },
          colors: ['steelblue', 'red']
        },
      ]

      this.selectedMetrics.forEach( (metric, mi) => {
        layers.push({
          type: 'rect',
          data: metricData,
          vmap: {
            color: this.selectedMeasure + '.' + metric
          },
          colors: colorSets[mi],
          size: 1
        })
      })

      layers.push({
        type: 'text',
        data: metricData.map((r,i) => 'PE' + i),
        size: 1
      })
      
      picos({
        config: {
          container: '#graph-view',
          legend: true,
          width: container.clientWidth,
          height: container.clientHeight*0.50
        },
        layers: layers
      })
    }
  }
}
