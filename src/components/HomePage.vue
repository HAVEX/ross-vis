<template>
  <div id="RossVisHome">
    <p><router-link to="/timenet">TimeSeries + Communication Analysis</router-link></p>
    <p><router-link to="/dimtime">Dimensionality + TimeSeries Analysis</router-link></p>
    <p><router-link to="/dimnet">Dimensionality + Communication Analysis</router-link></p>
  </div>
</template>

<script>
export default {
  name: 'HomePage'
}
</script>

<style>
#RossVisHome {
  margin: 5em;
}
</style>