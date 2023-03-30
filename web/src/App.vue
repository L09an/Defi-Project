<template>
  <NavBar></NavBar>
  <router-view></router-view>
</template>

<script>
import "bootstrap/dist/js/bootstrap"; 
import "bootstrap/dist/css/bootstrap.min.css"; 
import NavBar from './components/NavBar.vue';

export default{
  components: {
    NavBar
  }
}
</script>

<style>
  body{
    background-image: url("@/assets/images/background.jpg");
    background-size: cover;
  }
</style>
