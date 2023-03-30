<template>
    <div ref="parent" class="background">
        <canvas ref="canvas"></canvas>
    </div>
</template>

<script>
import { Background } from '@/assets/scripts/BackGround';
import { ref, onMounted } from 'vue';
export default {
    
    setup() {
        let parent = ref(null);
        let canvas = ref(null);
        onMounted(() => {
            new Background(canvas.value.getContext('2d'), parent.value)
        });
        return {
            parent,
            canvas
        }
    }
}
</script>

<style scoped>
div.background {
    width: 100%;
    height: 100%;
    display: flex; 
    justify-content: center; 
    align-items: center; 
}
</style>