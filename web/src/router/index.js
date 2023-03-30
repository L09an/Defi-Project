import { createRouter, createWebHistory } from 'vue-router'

import SwapIndexView from '../views/swap/SwapIndexView'
import TokenIndexView from '../views/token/TokenIndexView'
import PoolIndexView from '../views/pool/PoolIndexView'

const routes = [
  {
    path: "/", 
    name: "home",
    redirect: "/swap/", 
  },
  {
    path: "/swap/",
    name: "swap_index",
    component: SwapIndexView,
  },
  {
    path: "/token/",
    name: "token_index",
    component: TokenIndexView,
  },
  {
    path: "/pool/",
    name: "pool_index",
    component: PoolIndexView,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
