<template>
    <div class="tokenground">
        <BackGround>This is tokens page~</BackGround>
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
div.tokenground {
    width: 60vw;
    height: 70vh;
    background: rgba(211,211,211,0.8);
    margin-top: 5%;
    margin-left: 20%;
}
</style>