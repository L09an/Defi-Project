<template>
    <div class="poolground">
        <BackGround>This is pool page~</BackGround>
    </div>
</template>

<script>
import BackGround from './BackGround.vue'
export default {
    components: {
        BackGround
    }
}
</script>

<style scoped>
div.poolground {
    width: 60vw;
    height: 70vh;
    background: rgba(211,211,211,0.8);
    margin-top: 5%;
    margin-left: 20%;
}
</style>