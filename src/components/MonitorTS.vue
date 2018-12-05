<template>
  <v-app id="inspire">
    <v-toolbar
      color="blue-grey"
      dark
      fixed
      app
      clipped-right
    >
      <v-toolbar-side-icon @click.stop="left = !left"></v-toolbar-side-icon>
      <v-toolbar-title>{{ appName }}</v-toolbar-title>
      <v-spacer></v-spacer>
        <v-flex xs2>
          <v-select
            :items="modes"
            label="Mode"
            v-model="defaultMode"
            box
          ></v-select>
        </v-flex>

    </v-toolbar>
    <v-navigation-drawer
      v-model="left"
      temporary
      fixed
    ></v-navigation-drawer>
    <v-content>
      <v-container fluid fill-height class="pa-0">
        <v-layout justify-center align-center>
          <v-flex fill-height class="pa-2">
            <v-toolbar dense>
               <v-flex xs3 class="ma-2">
                <v-select 
                  label="Metric"
                  :items="metrics"
                  multiple
                  v-model="selectedMetrics"
                  :menu-props="{ maxHeight: '400' }"
                  persistent-hint
                  v-on:change="visualize()"
                >
                </v-select>
              </v-flex>
              <v-flex xs2 class="ma-2">
                <v-select 
                  label="TimeMode"
                  :items="timeDomains"
                  v-model="selectedTimeDomain"
                  :menu-props="{ maxHeight: '400' }"
                  persistent-hint
                  v-on:change="visualize()"
                >
                </v-select>
              </v-flex>
              <!-- <v-btn icon>
                <v-icon>search</v-icon>
              </v-btn> -->
              <v-spacer></v-spacer>
              <!-- <v-btn icon>
                <v-icon>apps</v-icon>
              </v-btn> -->
              <v-btn icon>
                <v-icon v-on:click="reset()">refresh</v-icon>
              </v-btn>
            </v-toolbar>
            <v-card height="100%" id="vis-overview">
            </v-card>
          </v-flex>
          <!-- <v-flex xs6 fill-height class="pa-2">
            <v-toolbar dense>
              <v-toolbar-title>Top PEs</v-toolbar-title>

              <v-spacer></v-spacer>

              <v-btn icon>
                <v-icon>search</v-icon>
              </v-btn>

              <v-btn icon>
                <v-icon>check_circle</v-icon>
              </v-btn>
            </v-toolbar>
            <v-card>

            </v-card>
          </v-flex> -->
        </v-layout>
      </v-container>
    </v-content>
    <!-- <v-footer color="blue-grey" class="white--text" app>
      <span> VIDi Labs, University of California, Davis </span>
      <v-spacer></v-spacer>
      <span>&copy; 2018</span>
    </v-footer> -->
  </v-app>
</template>

<script>
  import p4 from 'p4'

  export default {
    data: () => ({
      appName: 'ROSS-Vis',
      vis: null,
      modes: ['Post Hoc', 'In Situ'],
      defaultMode: 'Post Hoc',
      timeDomains: [ 'LastGvt','RealTs','VirtualTime'],
      selectedTimeDomain: 'LastGvt',
      views: [],
      width: 0,
      height: 0,
      left: false,
      metrics: [],
      checkboxs: [],
      defaultMetrics: ['NeventRb', 'RbTotal', 'RbSec', 'NetworkRecv', 'NetworkSend'],
      selectedMetrics: [ ]
    }),
    props: {
      source: String
    },
    mounted: function() {
      let visContainer = document.getElementById('vis-overview')
      let width = visContainer.clientWidth
      let height = visContainer.clientHeight * 0.9
      this.width = width
      this.height = height
      this.selectedMetrics = this.defaultMetrics.slice()
      
      let config = {
        container: 'vis-overview',
        viewport: [width, height]
      }

      let url = "ws://localhost:8888/websocket";
      let socket = new WebSocket(url);
      socket.onopen = function() {
        socket.send(JSON.stringify({data: 'KpData', method: 'get'}));
      }
      let self = this
      socket.onmessage = function(event) {
        let data = JSON.parse(event.data)
        let cache = p4.cstore({})
        self.metrics =  Object.keys(data.schema)
        // self.checkboxs = self.metrics.map(m => self.selectedMetrics.indexOf(m) != -1)
        // console.log(self.checkboxs)
        cache.import(data)
        cache.index('RealTs')
        cache.index('LastGvt')
        self.vis = p4(config).data(cache.data()).view(self.views)
        self.reset()
      }
    },
    methods: {
      reset() {
        this.selectedMetrics = this.defaultMetrics.slice()
        this.views = [{
            id: 'view-right',
            width: this.width / 2,
            height: this.height,
            gridlines: {y: true},
            padding: {left: 70, right: 150, top: 50, bottom: 80},
            offset: [this.width / 2, 0]
        }]
        this.visualize()
      },
      visualize() {
        let viewSetting = {
          gridlines: {y: true},
          padding: {left: 70, right: 30, top: 10, bottom: 40},
        }
        let metrics = this.selectedMetrics;
        let collection = {}

        // let metrics = [ 'RbPrim', 'RbSec', 'Efficiency'];
        // let metrics = Object.keys(data.schema)
        let views = [this.views[0]];
        metrics.forEach((metric, mi) => {
          collection['avg' + metric] = {$avg: metric}
          let view = Object.assign({}, viewSetting)
          view.id = 'view' + mi
          view.width = this.width / 2
          view.height = this.height / metrics.length
          view.offset = [0, this.height - view.height * (mi+1)]
          views.push(view)
        })

        let firstMetric = {}
        let firstMetricName = Object.keys(collection)[0]
        firstMetric[firstMetricName] = collection[firstMetricName]
        this.vis.view(views).head()
        .aggregate({
          $group: [this.selectedTimeDomain, 'Peid'],
          $collect: firstMetric
        })
        .visualize({
          id: 'view-right',
          mark: 'spline',
          x: this.selectedTimeDomain,
          // y: 'RbTotal',
          y: firstMetricName,
          color: 'Peid',
          size: 3
        })

        this.vis.head()
        .aggregate({
          $group: [this.selectedTimeDomain],
          $collect: collection
        })

        metrics.forEach((metric, mi) =>{
          this.vis.visualize({
            id: 'view' + mi,
            mark: 'spline',
            x: this.selectedTimeDomain,
            y:   'avg' + metric,
            color: 'steelblue',
            size: 3,
            // opacity: 'auto'
          })
        })
      }
    }
  }
</script>

<style>
#vis-overview {
  padding-top: 25px;
}
</style>