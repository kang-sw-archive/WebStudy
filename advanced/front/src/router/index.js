import Home from '@/components/pages/Home'
import InfoPage from '@/components/pages/InfoPage'
import ForumTest from '@/components/test/ForumTest'
import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home
    },
    {
      path: '/info',
      name: 'Info',
      component: InfoPage
    },
    {
      path: '/forum',
      name: 'Info',
      component: ForumTest
    }
  ]
})
