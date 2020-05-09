<template>
  <div id="app">
    <top-menu id="top_area"></top-menu>
    <div id="center_area">
      <router-view id="content_area" />
      <span id="right_area">
        <right-menu></right-menu>
      </span>
    </div>
    <div id="bottom_area"></div>
  </div>
</template>

<script>
import RightMenu from '@/components/RightMenu'
import TopMenu from '@/components/TopMenu'

export default {
  name: 'App',
  components: {
    'right-menu': RightMenu,
    'top-menu': TopMenu
  }
}
</script>

<style>
html,
body {
  height: 100%;
  margin: 0;
  background-color: lightgrey;
}

#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  position: absolute;
  width: 100%;
  height: 100%;
}

#center_area {
  display: flex;
  margin-top: 20px;
}

#right_area {
  width: 200px;
  border: 1pt dashed;
  margin-right: auto;
  margin-left: 80px;
}

#content_area {
  max-width: 800px;
  margin: auto;
  margin-right: 0;
}

#bottom_area {
  margin-top: 40px;
  border: 1px dashed gray;
}
</style>
