<script setup>
const defineProps = defineProps({
    totalSales: {
        type: Number,
        required: true,
    },
    description:{
        type: String,
        required: true,
    }
})
</script>
<template>
    <div class="sales-content">
        <h1>${{ totalSales }}</h1>
        <div class="description">{{ description }}</div>
    </div>
</template>
<style scoped>
    .sales-content {
        background-color: white;
        font-family: 'Satoshi', sans-serif;
        font-size: 1rem;
        font-weight: bold;
        color: #000;
        border: none;
        border-radius: 8px;
        padding: 10px 20px;
        cursor: pointer;
        transition: background-color 0.3s, transform 0.2s;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        margin-bottom: 10px;
    }
    .description {
        font-family: 'Satoshi', sans-serif;
        font-size: 1rem;
        font-weight: bold;
        color: #747474;
        cursor: pointer;
    }
</style>