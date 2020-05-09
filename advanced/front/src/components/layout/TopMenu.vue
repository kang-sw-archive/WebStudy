<style scoped>
#area {
  display: flex;
  border: double 5pt;
  margin: 5pt;
  background-color: lightyellow;
  height: auto;
  padding: 10pt;
  width: 1280px;
  margin: auto;
  background: rgb(32, 235, 156);
  background: linear-gradient(
    132deg,
    rgba(32, 235, 156, 1) 0%,
    rgba(157, 231, 255, 1) 53%,
    rgba(70, 108, 231, 1) 88%,
    rgba(2, 20, 235, 1) 100%
  );
}

#imgarea {
  padding: 4pt;
  width: 100px;
  height: 100px;
  background-color: gray;
  border: black solid;
}

#logoimg {
  height: 100%;
}

#menus {
  display: flex;
  font-family: "Lucida Sans", "Lucida Sans Regular", "Lucida Grande",
    "Lucida Sans Unicode", Geneva, Verdana, sans-serif;
  font-size: 200%;
  margin: auto;
  flex: auto;
}

.entry {
  margin: auto;
  text-decoration: none;
  color: black;
  font-style: italic;
  font-weight: bolder;
}
</style>

<template>
  <div>
    <div id="area">
      <span id="menus">
        <a class="entry" href="/">Home</a>
        <a class="entry" href="/">Forums</a>
        <a href="/" id="imgarea">
          <img id="logoimg" class="entry" src="@/assets/logo.gif" />
        </a>
        <a class="entry" href="/">Playground</a>
        <a class="entry" href="/">Info</a>
      </span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TopMenu'
}
</script>
