<script setup>
import { ref } from 'vue';
import Bouton from '../atoms/Bouton.vue'; // Import the Bouton component

const quantity = ref(1);

const increment = () => {
    quantity.value++;
};

const decrement = () => {
    if (quantity.value > 1) {
        quantity.value--;
    }
};

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
    stock: {
        type: Number,
        required: true,
    },
    textQuantite: {
        type: String,
        default: 'Ajouter au panier',
    },
});

const emit = defineEmits(['add-to-cart']); // Declare the event
</script>

<template>
    <div class="produit">
        <div>
            <div class="produit-name">{{ productName }}</div>
            <div class="produit-price">{{ price }} $</div>
            <div class="produit-stock">{{ textQuantite }} {{ stock }}</div>
        </div>
        <div class="quantity-controls">
            <button class="quantity-btn" @click="decrement">-</button>
            <span class="quantity">{{ quantity }}</span>
            <button class="quantity-btn" @click="increment">+</button>
        </div>   
    </div>
    <Bouton
            :idProduit="id"
            :contentButton="'Add Product'"
            :color="'#00ff15'"
            :hoverColor="'#00b342'"
            @add-to-cart="() => emit('add-to-cart', { id, quantity: quantity })"
        />
</template>

<style scoped>
.produit {
    font-family: 'Satoshi';
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    margin: 10px;
    border: 1px solid #ccc;
    border-radius: 8px;
    background-color: #f9f9f9;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.produit-name {
    font-size: 1.2rem;
    font-weight: bold;
    color: #333;
    margin-bottom: 8px;
}

.produit-price {
    font-size: 1rem;
    color: #555;
    margin-bottom: 8px;
}

.produit-stock {
    font-size: 0.9rem;
    color: #777;
}

.quantity-controls {
    display: flex;
    align-items: center;
    margin-top: 10px;
}

.quantity-btn {
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
    margin: 0 5px;
}

.quantity-btn:hover {
    background-color: #0056b3;
    transform: translateY(-2px);
}

.quantity {
    font-size: 1rem;
    font-weight: bold;
    color: #333;
    width: 30px;
    text-align: center;
}
</style>