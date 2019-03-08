import template from '../html/WebSocket.html'

export default {
  name: 'WebSocket',
  template,
  data: () => ({
    dialog: true,
    socketError: false,
    server: 'localhost:8888',
    modes: ['Post Hoc', 'In Situ'],
    defaultMode: 'Post Hoc',
  }),
  methods: {
    connect () {
      return new Promise((resolve, reject) => {
        let socket = new WebSocket('ws://' + this.server + '/websocket')
        socket.onopen = () => {
          this.dialog = !this.dialog
          this.socketError = false
          socket.send(JSON.stringify({data: 'KpData', method: 'get'}))
        }
  
        socket.onerror = (error) => {
          this.socketError = true
          reject(error)
        }
    
        socket.onmessage = (event) => {
          let dataObj = JSON.parse(event.data)
          if (dataObj.schema.hasOwnProperty('CommData')) {
            dataObj.schema.CommData = 'int'
          }
          dataObj.data.forEach(d => {
            d.RbPrim = d.RbTotal - d.RbSec
          })
          resolve({data: dataObj.data, schema: dataObj.schema})
        }
      })
    }
  }
}
