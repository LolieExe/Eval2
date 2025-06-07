<script setup>
import { onMounted, ref } from 'vue';
import axios from 'axios';
import { computed } from 'vue';
import SaleContent from '../atoms/SaleContent.vue';
import BarChart from '../atoms/BarChart.vue';
import Header from '../organics/Header.vue';

const totalSalesValue = ref(0);
const salesByProduct = ref([]);

const chartOptions = {
    responsive: true,
    plugins: {
        legend: {
            position: 'top',
        },
        title: {
            display: true,
            text: 'Highest sales by product',
        },
    },
};
const fetchTotalSales = async () => {
    try {
        const response = await axios.get(`api/v1/models/C_Invoice?$filter=DocStatus eq \'CO\' and IsSOTrx eq true`,
            {
                headers:{
                    'Authorization': `Bearer eyJraWQiOiJpZGVtcGllcmUiLCJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJHYXJkZW5BZG1pbiIsIkFEX0NsaWVudF9JRCI6MTEsIkFEX1VzZXJfSUQiOjEwMSwiQURfUm9sZV9JRCI6MTAyLCJBRF9PcmdfSUQiOjAsIkFEX0xhbmd1YWdlIjoiZW5fVVMiLCJBRF9TZXNzaW9uX0lEIjoxMDAwMDc0LCJpc3MiOiJpZGVtcGllcmUub3JnIiwiZXhwIjoxNzgwMzg4NDIxfQ.FQnHBUmo9U_XC4mx8fxoHfgB-RIYzUEYdco1tFIf3vKDykrFUnp5C91YTf0WJ9pq9eh0n0CqQ_CAZtQLO-zpVQ`,
                    'Content-Type': 'application/json',
                }
            }
        );
        const data = response.data;

        if (data && data.records) {
            totalSalesValue.value = data.records.reduce((sum, record) => sum + (record.GrandTotal || 0), 0);
        }
    } catch (error) {
        console.error('Failed to fetch total sales:', error);
    }
};
const fetchSalesByProduct = async () => {
    try {
        const orderRes = await axios.get(`api/v1/models/C_Order?$filter=DocStatus eq 'CO' and IsSOTrx eq true`, 
            {
                headers: {
                    'Authorization': `Bearer eyJraWQiOiJpZGVtcGllcmUiLCJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJHYXJkZW5BZG1pbiIsIkFEX0NsaWVudF9JRCI6MTEsIkFEX1VzZXJfSUQiOjEwMSwiQURfUm9sZV9JRCI6MTAyLCJBRF9PcmdfSUQiOjAsIkFEX0xhbmd1YWdlIjoiZW5fVVMiLCJBRF9TZXNzaW9uX0lEIjoxMDAwMDc0LCJpc3MiOiJpZGVtcGllcmUub3JnIiwiZXhwIjoxNzgwMzg4NDIxfQ.FQnHBUmo9U_XC4mx8fxoHfgB-RIYzUEYdco1tFIf3vKDykrFUnp5C91YTf0WJ9pq9eh0n0CqQ_CAZtQLO-zpVQ`,
                    'Content-Type': 'application/json',
                },
            }
        );
        const orders = orderRes.data.records || [];
        const orderIds = orders.map(order => order.id);

        if (orderIds.length === 0) return;

        // Step 2: Get all order lines from these orders (paginate if needed)
        const filter = orderIds.map(id => `C_Order_ID eq ${id}`).join(' or ');
        const lineRes = await axios.get(`api/v1/models/C_OrderLine?$filter=${filter}&$expand=M_Product_ID`, {
            headers: {
                    'Authorization': `Bearer eyJraWQiOiJpZGVtcGllcmUiLCJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJHYXJkZW5BZG1pbiIsIkFEX0NsaWVudF9JRCI6MTEsIkFEX1VzZXJfSUQiOjEwMSwiQURfUm9sZV9JRCI6MTAyLCJBRF9PcmdfSUQiOjAsIkFEX0xhbmd1YWdlIjoiZW5fVVMiLCJBRF9TZXNzaW9uX0lEIjoxMDAwMDc0LCJpc3MiOiJpZGVtcGllcmUub3JnIiwiZXhwIjoxNzgwMzg4NDIxfQ.FQnHBUmo9U_XC4mx8fxoHfgB-RIYzUEYdco1tFIf3vKDykrFUnp5C91YTf0WJ9pq9eh0n0CqQ_CAZtQLO-zpVQ`,
                    'Content-Type': 'application/json',
                },
        });

        const lines = lineRes.data.records || [];
        const productSales = {};
        console.log('Lines data:', lines);

        lines.forEach(line => {
            const productId = line.M_Product_ID?.id;
            const productName = line.M_Product_ID?.Name || 'Unknown Product';
            const lineTotal = (line.QtyOrdered || 0) * (line.PriceActual || 0);

            if (!productSales[productId]) {
                productSales[productId] = { name: productName, total: 0 };
            }

            productSales[productId].total += lineTotal;
        });

        // Convert to array
        salesByProduct.value = Object.values(productSales);
    } catch (error) {
        console.error('Failed to fetch sales by product:', error);
    }
};
const top3Products = computed(() => {
    return [...salesByProduct.value]
        .sort((a, b) => b.total - a.total)
        .slice(0, 3);
});

const chartData = computed(() => ({
    labels: top3Products.value.map(p => p.name),
    datasets: [
        {
            label: 'Highest sale',
            data: top3Products.value.map(p => p.total),
            backgroundColor: ['#007bff', '#00ff15', '#ffc107'],
        },
    ],
}));
onMounted(() => {
    fetchTotalSales();
    fetchSalesByProduct();
});
</script>

<template>
    <Header />
    <main>
        <div class="total-sales">
        <div>
            <h1>Sales Distribution</h1>
        </div>
        <div class="sale-content">
            <SaleContent :totalSales="totalSalesValue" :description="'total sales'" />
        </div>
    </div>
    <div class="most-sold-products">
        <div>
            <h1>Highest sales by product</h1>
            <div>
                <BarChart :chartData="chartData" :chartOptions="chartOptions" />
            </div>
        </div>
    </div>
    <div class="total-sales-by-product">
        <div>
            <h1>Total sales by product</h1>
        </div>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Total Sales</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(product, index) in salesByProduct" :key="index">
                        <td>{{ product.name }}</td>
                        <td>${{ product.total.toFixed(2) }}</td>
                    </tr>
                </tbody>

            </table>
        </div>
    </div>
    </main>
    
</template>

<style scoped>
main{
    margin-top: 10px;
}
.total-sales {
    width: 100%;
    background-color: #007bff;
    font-family: 'Satoshi', sans-serif;
    font-size: 1rem;
    font-weight: bold;
    color: #ffffff;
    border: none;
    border-radius: 8px;
    padding: 10px 20px;
    cursor: pointer;
    transition: background-color 0.3s, transform 0.2s;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
    box-sizing: border-box;
}

.sale-content {
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    flex-wrap: wrap;
}

.most-sold-products {
    margin-top: 20px;
    font-family: 'Satoshi', sans-serif;
}

.total-sales-by-product {
    margin-top: 20px;
    font-family: 'Satoshi', sans-serif;

}

.table-container {
    overflow-x: auto;
    width: 100%;
    font-family: 'Satoshi', sans-serif;
}

table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
}

th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
    word-wrap: break-word;
}

th {
    background-color: #f4f4f4;
    font-weight: bold;
}

/* Responsive styles */
@media (max-width: 768px) {
    .sale-content {
        flex-direction: column;
        align-items: stretch;
    }

    .total-sales {
        font-size: 0.9rem;
        padding: 10px;
    }

    table {
        font-size: 0.9rem;
    }
}

@media (max-width: 480px) {
    .total-sales {
        font-size: 0.8rem;
        padding: 8px;
    }

    table {
        font-size: 0.8rem;
    }

    th, td {
        padding: 6px;
    }
}
</style>