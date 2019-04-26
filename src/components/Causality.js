import tpl from '../html/Causality.html'

export default {
  name: 'Causality',
  template: tpl,
  components: {

  },
  data: () => ({
      sortBy: 'causality',
      sortDesc: true,
      striped: true,
      bordered: true,
      hover: true,
      fields: [
        { key: 'metric', sortable: false },
        { key: 'IR', sortable: true },
        { key: 'VD', sortable: true },
      ],
      to_items: [],
      from_items: [],
      causality: ['from', 'to'],
      selectedCausality: 'to',
  }),
  methods: {
    rowClass(item, type) {
      if (!item) return
      if (item.status === 'awesome') return 'table-success'
    }
  },

  mounted: function () {
  },

  methods: {
    init () {

    },
    
    preprocess(data) {
      for(let i = 0; i < data['from'].length; i++){
        if(data['from'][i]['causality'] == "true"){
          data['from'][i]['_rowVariant'] = 'success'
          data['from']['metric'][i] = data['from']['metric'] + "*" 
        }
        else {
          data['from'][i]['_rowVariant'] = 'success'
        }
      }
      for(let i = 0; i < data['to'].length; i++){
        if(data['to'][i]['causality'] == 1){
          data['to'][i]['_rowVariant'] = 'success'
        }
        else{
          data['to'][i]['_rowVariant'] = 'danger'
        }
      }
      return data
    },

    initVis(data) {
      data = this.preprocess(data)
      this.from_items = data['from']
      this.to_items = data['to']
    },

    clear(data) {
      this.preprocess(data)
      this.from_items = data['from']
      this.to_items = data['to']
    },
  }
}
