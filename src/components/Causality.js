import tpl from '../html/Causality.html'
import Vue from 'vue'
import axios from 'axios'

export default {
  name: 'Causality',
  template: tpl,
  components: {

  },
  data: () => ({
      sortBy: 'causality',
      sortDesc: true,
      fields: [
        { key: 'IR_1', sortable: true },
        { key: 'VD_1', sortable: true },
        { key: 'causality', sortable: true },
        { key: 'metric', sortable: false }
      ],
      to_items: [],
      from_items: [],
  }),

  mounted: function () {
  },

  methods: {
    init(data) {
      this.from_items = data['from']
      this.to_items = data['to']
    },

    clear(data) {
      this.from_items = data['from']
      this.to_items = data['to']
    },
  }
}
