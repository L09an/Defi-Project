<template>
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
    <div class="container">

        <router-link class="navbar-brand" :to="{name: 'home'}">Token Swap Home</router-link>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarText" aria-controls="navbarText" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarText">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item">
                <router-link :class="route_name == 'swap_index' ? 'nav-link active' : 'nav-link'" :to="{name: 'swap_index'}">SWAP</router-link>
            </li>
            <li class="nav-item">
                <router-link :class="route_name == 'token_index' ? 'nav-link active' : 'nav-link'" :to="{name: 'token_index'}">Tokens</router-link>
            </li>
            <li class="nav-item">
                <router-link :class="route_name == 'pool_index' ? 'nav-link active' : 'nav-link'" :to="{name: 'pool_index'}">Pool</router-link>
            </li>
        </ul>
        <ul class="navbar-nav">
            <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                More
                </a>
                <ul class="dropdown-menu">
                    <MetaMask />
                    <AlchemyPanel />
                    <li><a class="dropdown-item" href="#">log out</a></li>
                </ul>
            </li>
        </ul>
        </div>
    </div>
    </nav>
</template>

<script>

import { useRoute } from 'vue-router'
import { computed } from 'vue'
import MetaMask from "./MetaMask.vue";
import AlchemyPanel from './AlchemyPanel.vue';
export default {
    components: {
    MetaMask,
    AlchemyPanel,
  },
    setup() {
        const route = useRoute();
        let route_name = computed(() => route.name)
        return {
            route_name
        }
    }
}
</script>

<style scoped>
</style>