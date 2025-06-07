<script setup>
const defineProps = defineProps({
    idProduit: {
        type: Number,
        required: true,
    },
    contentButton: {
        type: String,
        required: true,
    },
    color: {
        type: String,
        default: '#00ff15',
    },
    hoverColor: {
        type: String,
        default: '#00b342',
    },
});

const emit = defineEmits(['add-to-cart']); // Emit event for adding to cart
</script>

<template>
    <button
        class="bouton"
        :style="{ backgroundColor: color }"
        @click="$emit('add-to-cart', idProduit)"
    >
        <slot>{{ contentButton }}</slot>
    </button>
</template>

<style scoped>
.bouton {
    font-family: 'Satoshi', sans-serif;
    font-size: 1rem;
    font-weight: bold;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 10px 20px;
    cursor: pointer;
    transition: background-color 0.3s, transform 0.2s;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    margin: 10px;
}

.bouton:hover {
    background-color: var(--hoverColor);
    transform: translateY(-2px);
}
</style>