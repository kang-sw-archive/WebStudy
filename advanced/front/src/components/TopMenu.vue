<template>
  <div id="top_menu_area">
    <a href="/">
      <img id="top_menu_logoimg" src="@/assets/logo.gif" />
    </a>
    <span id="top_menu_menus">Menus</span>
  </div>
</template>

<script>
export default {
  name: 'TopMenu'
}
</script>

<style>
#top_menu_area {
  border: dashed;
  display: flex;
  height: 110pt;
}

#top_menu_logoimg {
  max-width: 100%;
  max-height: 100%;
}

#top_menu_menus {
  margin: auto;
  padding: 25pt;
}
</style>
