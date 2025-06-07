<script setup>
import { defineProps } from 'vue';
import { Bar } from 'vue-chartjs';
import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    BarElement,
    CategoryScale,
    LinearScale,
} from 'chart.js';


ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

// Props to pass data and options to the chart
const props = defineProps({
    chartData: {
        type: Object,
        required: true,
    },
    chartOptions: {
        type: Object,
        required: true,
    },
});
</script>

<template>
    <Bar :data="chartData" :options="chartOptions" />
</template>

<style scoped>
/* Add any custom styles for the chart here */
</style>