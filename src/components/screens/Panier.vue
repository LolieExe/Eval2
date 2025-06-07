<script setup>
import { ref, computed, onMounted } from 'vue'
import ProduitsPanier from '../molecules/ProduitsPanier.vue'
import Header from '../organics/Header.vue'
import Bouton from '../atoms/Bouton.vue'


const cartItems = ref([]);
const showPopup = ref(false);
const customerName = ref('');
const address = ref('');
const city = ref('');
const postal = ref('');
const countryId = ref(188);
const checkout = () => {
    showPopup.value = true;
};

const submitCustomer = async () => {
    try {
        const response = await fetch(`api/v1/models/C_BPartner`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer eyJraWQiOiJpZGVtcGllcmUiLCJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJHYXJkZW5BZG1pbiIsIkFEX0NsaWVudF9JRCI6MTEsIkFEX1VzZXJfSUQiOjEwMSwiQURfUm9sZV9JRCI6MTAyLCJBRF9PcmdfSUQiOjAsIkFEX0xhbmd1YWdlIjoiZW5fVVMiLCJBRF9TZXNzaW9uX0lEIjoxMDAwMDc0LCJpc3MiOiJpZGVtcGllcmUub3JnIiwiZXhwIjoxNzgwMzg4NDIxfQ.FQnHBUmo9U_XC4mx8fxoHfgB-RIYzUEYdco1tFIf3vKDykrFUnp5C91YTf0WJ9pq9eh0n0CqQ_CAZtQLO-zpVQ`
            },
            body: JSON.stringify({
                Name: customerName.value,
                IsCustomer: true,
                C_BP_Group_ID: 103,
                AD_Org_ID: 0
            })
        });

        const data = await response.json();

        if (response.ok) {
            const customerId = data.id;

            const locationResponse = await fetch(`api/v1/models/C_Location`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer eyJraWQiOiJpZGVtcGllcmUiLCJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJHYXJkZW5BZG1pbiIsIkFEX0NsaWVudF9JRCI6MTEsIkFEX1VzZXJfSUQiOjEwMSwiQURfUm9sZV9JRCI6MTAyLCJBRF9PcmdfSUQiOjAsIkFEX0xhbmd1YWdlIjoiZW5fVVMiLCJBRF9TZXNzaW9uX0lEIjoxMDAwMDc0LCJpc3MiOiJpZGVtcGllcmUub3JnIiwiZXhwIjoxNzgwMzg4NDIxfQ.FQnHBUmo9U_XC4mx8fxoHfgB-RIYzUEYdco1tFIf3vKDykrFUnp5C91YTf0WJ9pq9eh0n0CqQ_CAZtQLO-zpVQ`
                },
                body: JSON.stringify({
                    Address1: address.value,
                    City: city.value,
                    Postal: postal.value,
                    C_Country_ID: countryId.value,
                    AD_Org_ID: 11
                })
            });

            const locationData = await locationResponse.json();

            if (!locationResponse.ok) {
                console.error(locationData);
                alert('Failed to create location');
                return;
            }

            const locationId = locationData.id;

            const bpLocationResponse = await fetch(`api/v1/models/C_BPartner_Location`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer eyJraWQiOiJpZGVtcGllcmUiLCJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJHYXJkZW5BZG1pbiIsIkFEX0NsaWVudF9JRCI6MTEsIkFEX1VzZXJfSUQiOjEwMSwiQURfUm9sZV9JRCI6MTAyLCJBRF9PcmdfSUQiOjAsIkFEX0xhbmd1YWdlIjoiZW5fVVMiLCJBRF9TZXNzaW9uX0lEIjoxMDAwMDc0LCJpc3MiOiJpZGVtcGllcmUub3JnIiwiZXhwIjoxNzgwMzg4NDIxfQ.FQnHBUmo9U_XC4mx8fxoHfgB-RIYzUEYdco1tFIf3vKDykrFUnp5C91YTf0WJ9pq9eh0n0CqQ_CAZtQLO-zpVQ`
                },
                body: JSON.stringify({
                    C_BPartner_ID: customerId,
                    C_Location_ID: locationId,
                    AD_Org_ID: 11,
                    Name: 'Default Address'
                })
            });

            const bpLocationData = await bpLocationResponse.json();

            if (!bpLocationResponse.ok) {
                console.error(bpLocationData);
                alert('Failed to link location to customer');
                return;
            }

            alert(`Customer created with ID: ${customerId}`);

            // Step 3: Create the order
            const orderResponse = await fetch(`api/v1/models/C_Order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer eyJraWQiOiJpZGVtcGllcmUiLCJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJHYXJkZW5BZG1pbiIsIkFEX0NsaWVudF9JRCI6MTEsIkFEX1VzZXJfSUQiOjEwMSwiQURfUm9sZV9JRCI6MTAyLCJBRF9PcmdfSUQiOjAsIkFEX0xhbmd1YWdlIjoiZW5fVVMiLCJBRF9TZXNzaW9uX0lEIjoxMDAwMDc0LCJpc3MiOiJpZGVtcGllcmUub3JnIiwiZXhwIjoxNzgwMzg4NDIxfQ.FQnHBUmo9U_XC4mx8fxoHfgB-RIYzUEYdco1tFIf3vKDykrFUnp5C91YTf0WJ9pq9eh0n0CqQ_CAZtQLO-zpVQ`
                },
                body: JSON.stringify({
                    C_BPartner_ID: customerId,
                    AD_Org_ID: 11,
                    C_DocTypeTarget_ID: 135,
                    M_Warehouse_ID: 103,
                    M_PriceList_ID: 101,
                    DateOrdered:new Date().toISOString().split('T')[0],
                    Description: 'Order from Web Shop',
                    IsSOTrx: true
                })
            });

            const orderData = await orderResponse.json();

            if (orderResponse.ok) {
                const orderId = orderData.id;
                alert(`Order created with ID: ${orderId}`);
                await addOrderLines(orderId);
            } else {
                console.error(orderData);
                alert('Failed to create order');
            }

            showPopup.value = false;
            customerName.value = '';
        } else {
            console.error(data);
            alert('Failed to create customer');
        }
    } catch (error) {
        console.error(error);
        alert('Error creating customer');
    }
};


const addOrderLines = async (orderId) => {
    for (const item of cartItems.value) {
        try {
            const lineResponse = await fetch(`api/v1/models/C_OrderLine`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer eyJraWQiOiJpZGVtcGllcmUiLCJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJHYXJkZW5BZG1pbiIsIkFEX0NsaWVudF9JRCI6MTEsIkFEX1VzZXJfSUQiOjEwMSwiQURfUm9sZV9JRCI6MTAyLCJBRF9PcmdfSUQiOjAsIkFEX0xhbmd1YWdlIjoiZW5fVVMiLCJBRF9TZXNzaW9uX0lEIjoxMDAwMDc0LCJpc3MiOiJpZGVtcGllcmUub3JnIiwiZXhwIjoxNzgwMzg4NDIxfQ.FQnHBUmo9U_XC4mx8fxoHfgB-RIYzUEYdco1tFIf3vKDykrFUnp5C91YTf0WJ9pq9eh0n0CqQ_CAZtQLO-zpVQ`
                },
                body: JSON.stringify({
                    C_Order_ID: orderId,
                    M_Product_ID: item.id,
                    QtyEntered: item.quantity,
                    QtyOrdered: item.quantity,
                    PriceActual: item.prix,
                    PriceEntered: item.prix,
                    LineNetAmt: item.prix * item.quantity,
                    AD_Org_ID: 11
                })
            });

            const lineData = await lineResponse.json();

            if (!lineResponse.ok) {
                console.error(lineData);
                alert(`Failed to add product ${item.Name} to the order`);
            }
        } catch (error) {
            console.error(error);
            alert(`Error adding product ${item.Name} to the order`);
        }
    }
    
    alert('Order lines added successfully!');
    cartItems.value = [];
    localStorage.setItem('cart', JSON.stringify(cartItems.value));
};


const totalPrice = computed(() =>
    cartItems.value.reduce((sum, item) => sum + item.prix * item.quantity, 0)
);

const removeFromCart = (id) => {
    cartItems.value = cartItems.value.filter((item) => item.id !== id);
    localStorage.setItem('cart', JSON.stringify(cartItems.value));
};

const incrementQuantity = (id) => {
    const product = cartItems.value.find((item) => item.id === id);
    if (product) {
        product.quantity++;
        localStorage.setItem('cart', JSON.stringify(cartItems.value));
    }
};

const decrementQuantity = (id) => {
    const product = cartItems.value.find((item) => item.id === id);
    if (product && product.quantity > 1) {
        product.quantity--;
        localStorage.setItem('cart', JSON.stringify(cartItems.value));
    }
};

// Load cart items from localStorage when the component is mounted
onMounted(() => {
    const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
    cartItems.value = storedCart;
});
</script>

<template>
    <Header />
    <main class="container">
        <h1>My Cart</h1>
        <div v-if="cartItems.length === 0" class="empty-cart">
            <p>Cart is empty.</p>
        </div>
        <div v-else class="cart-grid">
            <ProduitsPanier
                v-for="item in cartItems"
                :key="item.id"
                :id="item.id"
                :productName="item.Name"
                :price="item.prix"
                :quantity="item.quantity"
                @increment-quantity="incrementQuantity"
                @decrement-quantity="decrementQuantity"
                @remove-product="removeFromCart"
            />
        </div>
        <div v-if="cartItems.length > 0" class="cart-total">
            <h2>Total: {{ totalPrice }} $</h2>
            <Bouton
                :contentButton="'Checkout'"
                @click="checkout"/>
        </div>
        <div v-if="showPopup" class="popup-overlay">
            <div class="popup">
                <h3>Enter Your Name</h3>
                <input v-model="customerName" placeholder="Enter Your Name" />
                <input v-model="address" placeholder="Address" />
                <input v-model="city" placeholder="City" />
                <input v-model="postal" placeholder="Postal Code" />
                <div class="popup-buttons">
                    <button @click="submitCustomer" class="submit">Submit</button>
                    <button @click="showPopup = false" class="cancel">Cancel</button>
                </div>
            </div>
        </div>

    </main>
</template>
<style scoped>
.container {
    height: 100vh;
    background-color: #f4f4f4;
    padding: 20px;
    box-sizing: border-box;
}

h1 {
    font-family: 'Satoshi', sans-serif;
    font-size: 2rem;
    color: #333;
    margin-bottom: 20px;
    text-align: center;
}


.empty-cart {
    font-family: 'Satoshi', sans-serif;
    font-size: 1.2rem;
    color: #777;
    text-align: center;
    margin-top: 50px;
}


.cart-grid {
    gap: 20px;
    width: 100%;
    box-sizing: border-box;
}


.cart-total {
    margin-top: 20px;
    font-family: 'Satoshi', sans-serif;
    font-size: 1.5rem;
    color: #333;
    text-align: center;
}

@media (max-width: 600px) {
    h1 {
        font-size: 1.5rem;
    }

    .cart-grid {
        grid-template-columns: 1fr;
        gap: 15px;
    }

    .cart-total {
        font-size: 1.2rem;
    }
}
.popup-overlay {
    font-family: 'Satoshi', sans-serif;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.popup {
    background: white;
    padding: 20px;
    border-radius: 8px;
    text-align: center;
    width: 300px;
}

.popup input {
    width: 95%;
    padding: 8px;
    margin-top: 10px;
    font-size: 1rem;
    border-radius: 5px;
    border-style: solid;
    border-color: #777;
    font-family: 'Satoshi', sans-serif;
}

.popup-buttons {
    margin-top: 15px;
    display: flex;
    justify-content: space-between;
}

.submit {
    font-family: 'Satoshi', sans-serif;
    padding: 8px 12px;
    cursor: pointer;
    background-color: #00ff15;
    border-radius: 5px;
    color: white;
    font-weight: bold;
    border: none;
}
.cancel{
    font-family: 'Satoshi', sans-serif;
    padding: 8px 12px;
    cursor: pointer;
    background-color: #c1c1c1;
    border-radius: 5px;
    color: rgb(56, 56, 56);
    font-weight: bold;
    border: none;
}
</style>