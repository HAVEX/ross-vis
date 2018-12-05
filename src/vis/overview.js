import p4 from 'p4';
import p3 from 'p3';

let metrics = ['NeventRb', 'RbTotal', 'RbSec', 'NetworkRecv', 'NetworkSend' ]

export default function({container, width, height}) {
  let config = {
    container: container,
    viewport: [width, height]
  }
  
  let viewSetting = {
    gridlines: {y: true},
    padding: {left: 70, right: 30, top: 10, bottom: 40},
  }

  let views = [{
    id: 'view-right',
    width: width/2,
    height: height,
    gridlines: {y: true},
    padding: {left: 70, right: 150, top: 50, bottom: 80},
    offset: [width/2, 0]
  }]

  var url = "ws://localhost:8888/websocket";
  var socket = new WebSocket(url);
  socket.onopen = function() {
    socket.send(JSON.stringify({data: 'KpData', method: 'get'}));
  }

  socket.onmessage = function(event) {
    let data = JSON.parse(event.data)

    let collection = {}
    
    // let metrics = [ 'RbPrim', 'RbSec', 'Efficiency'];
    // let metrics = Object.keys(data.schema)
    metrics.forEach(function(metric, mi){
      collection['avg' + metric] = {$avg: metric}
      let view = Object.assign({}, viewSetting)
      view.id = 'view' + mi
      view.width = width / 2
      view.height = height / metrics.length
      view.offset = [0, height - view.height * (mi+1)]
      views.push(view)
    })

    // let cr = p3.pipeline(data.data)
    // .aggregate({
    //   $group: ['LastGvt'],
    //   $collect: collection
    // }).execute()

    let app = p4(config).view(views);
    let pipeline = app.input({
      type: 'json',
      source: data,
      // indexes: ['RealTs']
      uniqueKeys: ['RealTs'],
    })
    // .repeat({
    //  variable: Object.keys(data.schema)
    // })
    // .match({
    //   RealTs: [10, 15]
    // })
    .aggregate({
      $group: ['RealTs'],
      $collect: collection
    })

    metrics.forEach(function(metric, mi){
      pipeline.visualize({
      id: 'view' + mi,
      mark: 'spline',
      x: 'RealTs',
      y:   'avg' + metric,
      color: 'steelblue',
      size: 3,
      // opacity: 'auto'
      })
    })
    
    pipeline.head()
    .aggregate({
      $group: ['RealTs', 'Peid'],
      $collect: {
        avgRollBack: {$avg: 'RbTotal'}
      }
    })
    .visualize({
      id: 'view-right',
      mark: 'spline',
      x: 'RealTs',
    //   y: 'RbTotal',
      y: 'avgRollBack',
      color: 'Peid',
      size: 3
    })

    pipeline.execute()
    .then(function(result){
        console.log(result)
    })
  }
}


