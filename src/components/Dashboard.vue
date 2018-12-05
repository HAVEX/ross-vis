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
              <v-menu :close-on-content-click=false :nudge-width="100">
                <v-toolbar-title slot="activator">
                  <span>Metrics</span>
                  <v-icon>arrow_drop_down</v-icon>
                </v-toolbar-title>

                <v-list>
                  <v-list-tile
                    v-for="item in items"
                    :key="item"
                    @click="selectMetrics(item)"
                  >
                    <v-checkbox :label="item"></v-checkbox>
                  </v-list-tile>
                </v-list>
              </v-menu>

              <!-- <v-btn icon>
                <v-icon>search</v-icon>
              </v-btn> -->
              <v-spacer></v-spacer>
              <!-- <v-btn icon>
                <v-icon>apps</v-icon>
              </v-btn> -->
              <v-btn icon>
                <v-icon>refresh</v-icon>
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
  import overview from '@/vis/overview';
  export default {
    data: () => ({
      appName: 'ROSS-Vis',
      left: false,
      items: [
        'All', 'Family', 'Friends', 'Coworkers'
      ]
    }),
    props: {
      source: String
    },
    mounted: () => {
      let visContainer = document.getElementById('vis-overview')
      let width = visContainer.clientWidth
      let height = visContainer.clientHeight * 0.9

      var url = "ws://localhost:8888/websocket";
      var socket = new WebSocket(url);
      socket.onopen = function() {
        socket.send(JSON.stringify({data: 'KpData', method: 'get'}));
      }

      socket.onmessage = function(event) {
        let data = JSON.parse(event.data)
        console.log(data)
      }


      // overview({container: 'vis-overview', width, height});
    },
    methods: {
      selectMetrics(key) {
        console.log('select', key)
      }
    }
  }
</script>

<style>
#vis-overview {
  padding-top: 25px;
}
</style>