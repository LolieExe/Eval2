<script setup>
import { onMounted, ref, computed } from 'vue';
import axios from 'axios';
import Produit from '../molecules/Produit.vue';
import Header from '../organics/Header.vue';

const produits = ref([]);
const labelBouton = ref('Ajouter');
const isLoading = ref(true);
const selectedFilter = ref('highest-price');

const addToCart = ({ id, quantity }) => {
    const product = produits.value.find((p) => p.id === id);
    if (product) {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const existingProduct = cart.find((item) => item.id === id);

        if (existingProduct) {
            existingProduct.quantity += quantity;
        } else {
            cart.push({ ...product, quantity });
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        alert(`${product.Name} a été ajouté au panier avec une quantité de ${quantity} !`);
    }
};

const fetchStockForProduct = async (productId) => {
    try {
        const response = await axios.get(
            `/api/v1/models/M_Storage?$filter=M_Product_ID eq ${productId}`,
            {
                headers: {
                    'Authorization': `Bearer eyJraWQiOiJpZGVtcGllcmUiLCJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJHYXJkZW5BZG1pbiIsIkFEX0NsaWVudF9JRCI6MTEsIkFEX1VzZXJfSUQiOjEwMSwiQURfUm9sZV9JRCI6MTAyLCJBRF9PcmdfSUQiOjAsIkFEX0xhbmd1YWdlIjoiZW5fVVMiLCJBRF9TZXNzaW9uX0lEIjoxMDAwMDc0LCJpc3MiOiJpZGVtcGllcmUub3JnIiwiZXhwIjoxNzgwMzg4NDIxfQ.FQnHBUmo9U_XC4mx8fxoHfgB-RIYzUEYdco1tFIf3vKDykrFUnp5C91YTf0WJ9pq9eh0n0CqQ_CAZtQLO-zpVQ`,
                    'Content-Type': 'application/json',
                },
            }
        );
        const totalStock = response.data.records?.reduce((sum, item) => {
            return sum + (item.QtyOnHand || 0);
        }, 0) || 0;

        return totalStock;
    } catch (error) {
        console.error(`Erreur lors de la récupération du stock pour le produit ${productId} :`, error);
        return 0;
    }
};

const fetchPriceProduct = async (productId) => {
    try {
        const response = await axios.get(
            `/api/v1/models/M_ProductPrice?$filter=M_Product_ID eq ${productId} and M_PriceList_Version_ID eq 104`,
            {
                headers: {
                    'Authorization': `Bearer eyJraWQiOiJpZGVtcGllcmUiLCJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJHYXJkZW5BZG1pbiIsIkFEX0NsaWVudF9JRCI6MTEsIkFEX1VzZXJfSUQiOjEwMSwiQURfUm9sZV9JRCI6MTAyLCJBRF9PcmdfSUQiOjAsIkFEX0xhbmd1YWdlIjoiZW5fVVMiLCJBRF9TZXNzaW9uX0lEIjoxMDAwMDc0LCJpc3MiOiJpZGVtcGllcmUub3JnIiwiZXhwIjoxNzgwMzg4NDIxfQ.FQnHBUmo9U_XC4mx8fxoHfgB-RIYzUEYdco1tFIf3vKDykrFUnp5C91YTf0WJ9pq9eh0n0CqQ_CAZtQLO-zpVQ`,
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data.records[0]?.PriceStd || 0;
    } catch (error) {
        console.error(`Erreur lors de la récupération du prix pour le produit ${productId} :`, error);
        return 0;
    }
};

const fetchProducts = async () => {
    try {
        const response = await axios.get(`/api/v1/models/M_Product`, {
            headers: {
                'Authorization': `Bearer eyJraWQiOiJpZGVtcGllcmUiLCJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJHYXJkZW5BZG1pbiIsIkFEX0NsaWVudF9JRCI6MTEsIkFEX1VzZXJfSUQiOjEwMSwiQURfUm9sZV9JRCI6MTAyLCJBRF9PcmdfSUQiOjAsIkFEX0xhbmd1YWdlIjoiZW5fVVMiLCJBRF9TZXNzaW9uX0lEIjoxMDAwMDc0LCJpc3MiOiJpZGVtcGllcmUub3JnIiwiZXhwIjoxNzgwMzg4NDIxfQ.FQnHBUmo9U_XC4mx8fxoHfgB-RIYzUEYdco1tFIf3vKDykrFUnp5C91YTf0WJ9pq9eh0n0CqQ_CAZtQLO-zpVQ`,
                'Content-Type': 'application/json',
            },
        });

        const productList = response.data.records;

        for (const product of productList) {
            const price = await fetchPriceProduct(product.id);
            product.prix = price;
            const stock = await fetchStockForProduct(product.id);
            product.stock = stock;
        }

        produits.value = productList;
    } catch (error) {
        console.error('Erreur lors de la récupération des produits :', error);
    } finally {
        isLoading.value = false;
    }
};

const produitsFiltres = computed(() => {
    const produitsCopy = [...produits.value];
    switch (selectedFilter.value) {
        case 'highest-price':
            return produitsCopy.sort((a, b) => b.prix - a.prix);
        case 'lowest-price':
            return produitsCopy.sort((a, b) => a.prix - b.prix);
        case 'name':
            return produitsCopy.sort((a, b) => a.Name.localeCompare(b.Name));
        default:
            return produitsCopy;
    }
});

onMounted(() => {
    fetchProducts();
});
</script>

<template>
  <Header />
  <main>
    <h1>All products</h1>

    <div class="filter">
      <label for="filter">Trier par :</label>
      <select id="filter" v-model="selectedFilter">
        <option value="highest-price">Prix décroissant</option>
        <option value="lowest-price">Prix croissant</option>
        <option value="name">Nom (A–Z)</option>
      </select>
    </div>

    <div v-if="isLoading" class="loading">Loading...</div>
    <div v-else class="container">
      <div v-for="produit in produitsFiltres" :key="produit.id">
        <Produit
          :textQuantite="'Quantity in stock:'"
          :id="produit.id"
          :productName="produit.Name"
          :stock="produit.stock"
          :price="produit.prix"
          @add-to-cart="addToCart"
        />
      </div>
    </div>
  </main>
</template>

<style scoped>
h1 {
  font-family: 'Satoshi';
  text-align: center;
  margin-bottom: 20px;
}

.filter {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

select {
  padding: 5px 10px;
  font-size: 1rem;
  font-family: 'Satoshi';
}

.loading {
  font-family: 'Satoshi';
  font-size: 1.5rem;
  color: #007bff;
  text-align: center;
  margin-top: 50px;
}

.container {
  gap: 20px;
  padding: 20px;
}

@media (max-width: 600px) {
  h1 {
    font-size: 1.5rem;
  }

  .container {
    grid-template-columns: 1fr;
    gap: 15px;
  }
}
.filter{
    font-family: 'Satoshi';
}
#filter
{
    border-radius: 10px;
}
</style>
