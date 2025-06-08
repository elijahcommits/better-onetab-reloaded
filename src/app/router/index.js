import Vue from 'vue'
import Router from 'vue-router'
const Popup = () => import(/* webpackChunkName: "popup" */ '@/app/page/Popup')
const Main = () => import(/* webpackChunkName: "main" */ '@/app/page/Main')
// const SyncInfo = () => import(/* webpackChunkName: "main" */ '@/app/page/main/SyncInfo')
const Options = () => import(/* webpackChunkName: "main" */ '@/app/page/main/Options')
const About = () => import(/* webpackChunkName: "main" */ '@/app/page/main/About')
const ImportExport = () => import(/* webpackChunkName: "main" */ '@/app/page/main/ImportExport')
const Search = () => import(/* webpackChunkName: "main" */ '@/app/page/main/Search')
const DetailList = () => import(/* webpackChunkName: "main" */ '@/app/page/main/DetailList')

Vue.use(Router)

const isPopup = new URLSearchParams(window.location.search).get('context') === 'popup'

const router = new Router({
  routes: [
    {
      path: '/',
      // When in a popup, go directly to the detailed list view.
      redirect: () => {
        const isPopup = new URLSearchParams(window.location.search).get('context') === 'popup'
        return isPopup ? '/app/list' : '/app'
      }
    },
    {
      path: '/popup',
      component: Popup,
      name: 'popup',
    },
    {
      path: '/app',
      component: Main,
      children: [
        // {
        //   path: 'options/sync',
        //   component: SyncInfo,
        //   name: 'syncInfo',
        // },
        {
          path: 'options',
          component: Options,
          name: 'options',
        },
        {
          path: 'about',
          component: About,
          name: 'about',
        },
        {
          path: 'import-export',
          component: ImportExport,
          name: 'import-export',
        },
        {
          path: 'search',
          component: Search,
          name: 'search',
        },
        {
          path: 'list',
          component: DetailList,
          name: 'detailList',
        },
        {
          path: 'list/pinned',
          component: DetailList,
          name: 'pinnedList',
        },
        {
          path: 'list/tag/:tag',
          component: DetailList,
          name: 'taggedList'
        },
        {
          path: '*',
          redirect: { name: 'detailList' }
        },
      ],
    },
  ]
})

export default router
