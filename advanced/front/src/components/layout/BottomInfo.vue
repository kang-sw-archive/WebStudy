<style scoped>
#border {
  margin-top: 25pt;
  margin-left: 22%;
  margin-right: 22%;
  border-top: solid 1pt;
}
</style>

<template>
  <div>
    <div id="border" />
    <div id="body">
      <p>
        Copyright 2020-{{now}}, All rights reserved.
        <a
          href="https://github.com/kang-sw/WebStudy/tree/develop"
        >(Github Repository)</a>
      </p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BottomInfo',
  data () {
    return {
      now: new Date(Date.now()).getFullYear()
    }
  }
}
</script>
