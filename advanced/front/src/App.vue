<template>
  <div>
    <div id="app">
      <top-menu id="top_area"></top-menu>
      <div id="center_area">
        <router-view id="content_area" />
        <span id="right_area">
          <right-menu></right-menu>
        </span>
      </div>
      <bottom-info id="bottom_area"></bottom-info>
    </div>
  </div>
</template>

<script>
import RightMenu from '@/components/layout/RightMenu'
import TopMenu from '@/components/layout/TopMenu'
import BottomInfo from '@/components/layout/BottomInfo'

export default {
  name: 'App',
  components: {
    'right-menu': RightMenu,
    'top-menu': TopMenu,
    'bottom-info': BottomInfo
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
  font-family: Cambria, Cochin, Georgia, Times, "Times New Roman", serif;
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
  margin-top: 15pt;
}

#right_area {
  width: auto;
  margin-right: auto;
  margin-left: 80px;
}

#content_area {
  max-width: 1024px;
  min-height: 70vh;
  margin: auto;
  margin-right: 0;
}
</style>
