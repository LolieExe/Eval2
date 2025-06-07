// router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import ListeProduits from '@/components/screens/ListeProduits.vue'
import Panier from '@/components/screens/Panier.vue'
import TotalSales from '@/components/screens/TotalSales.vue'
import Login from '@/components/screens/Login.vue'
import Balance from '@/components/screens/Balance.vue'
import GrandLivre from '@/components/screens/GrandLivre.vue'
import GrandLivreCompte from '@/components/screens/GrandLivreCompte.vue'
import Import from '@/components/screens/Import.vue'
import ChiffreAffaires from '@/components/screens/ChiffreAffaires.vue'
const routes = [
  { path: '/', component: ListeProduits },
  {path:'/panier',component:Panier},
  {path:'/totalSales',component:TotalSales},
  {path: '/login',component:Login},
  {path: '/balance', component: Balance},
  {path: '/grandLivre', component: GrandLivreCompte},
  { path: '/grandLivre/:accountId', component: GrandLivre },
  {path: '/import', component: Import },
  {path: '/chiffreAffaires', component: ChiffreAffaires}
  

  
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
