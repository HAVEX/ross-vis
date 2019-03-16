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
        { key: 'Causality', sortable: true },
      ],
      to_items: [],
      from_items: [],
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
    init(data) {
    
    },

    initVis(data) {
      console.log(data)
      this.from_items = data['from']
      this.to_items = data['to']
    },

    clear(data) {
      console.log(data)
      this.from_items = data['from']
      this.to_items = data['to']
    },
  }
}
