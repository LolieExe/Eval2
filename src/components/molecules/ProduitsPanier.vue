<script setup>
import { defineProps, defineEmits } from 'vue';
import Bouton from '../atoms/Bouton.vue';
// Props to receive product details
const props = defineProps({
    id: {
        type: Number,
        required: true,
    },
    productName: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
});

const emit = defineEmits(['increment-quantity', 'decrement-quantity', 'remove-product']);
</script>

<template>
    <div class="produit-panier">
        <div>
            <h2>{{ productName }}</h2>
            <div>Price: {{ price }} $</div>
        </div>
        <div class="quantity-controls">
            <button @click="$emit('decrement-quantity', id)">-</button>
            <span>{{ quantity }}</span>
            <button @click="$emit('increment-quantity', id)">+</button>
        </div>
    </div>
    <Bouton
            :idProduit="id"
            :contentButton="'Remove Product'"
            :color="'#ff4d4d'"
            :hoverColor="'#ff0000'"
            @add-to-cart="$emit('remove-product', id)"
        />
    
</template>

<style scoped>
.produit-panier {
    font-family: 'Satoshi';
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    border: 1px solid #ccc;
    border-radius: 8px;
    background-color: #f9f9f9;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.quantity-controls {
    display: flex;
    align-items: center;
    gap: 10px;
}

.quantity-controls button {
    font-family: 'Satoshi', sans-serif;
    font-size: 1rem;
    font-weight: bold;
    color: #fff;
    background-color: #007bff;
    border: none;
    border-radius: 4px;
    padding: 5px 10px;
    cursor: pointer;
    transition: background-color 0.3s, transform 0.2s;
}

.quantity-controls button:hover {
    background-color: #0056b3;
}

.quantity-controls span {
    font-size: 1rem;
    font-weight: bold;
    color: #333;
    width: 30px;
    text-align: center;
}


</style>