import Vue from 'vue'
import App from './App.vue'
import VueKonva from 'vue-konva'

Vue.use(VueKonva)

var v = new Vue({
  el: '#app',
  render: h => h(App),
})
