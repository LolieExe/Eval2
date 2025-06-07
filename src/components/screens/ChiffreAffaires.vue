<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';
import Header from '../organics/Header.vue';
import axios from 'axios';
import { Chart } from 'chart.js';
import {
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  LineController,
  Tooltip,
  Legend,
  Filler,
  Title
} from 'chart.js';

Chart.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  LineController,
  Tooltip,
  Legend,
  Filler,
  Title
);


const tableData = ref([]);
const rawData = ref([]);
const loading = ref(false);
const selectedYear = ref(new Date().getFullYear());
const availableYears = Array.from({ length: 41 }, (_, i) => 2000 + i);
const chartData = ref(null);
const canvasRef = ref(null);

const loadData = async () => {
  loading.value = true;
  const token = localStorage.getItem('idempiere_session');
  if (!token) {
    console.error('No session token found. Please log in.');
    loading.value = false;
    return;
  }

  const year = selectedYear.value;
  const startDate = new Date(`${year}-01-01`);
  const endDate = new Date(`${year}-12-31T23:59:59`);
  let allFactLines = [];
  let pageCount = 1;
  const pageSize = 100;

  try {
    while (true) {
      const response = await axios.get(`/api/v1/models/Fact_Acct`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        params: {
          $skip: (pageCount - 1) * pageSize,
          $top: pageSize,
          fields: 'DateAcct,AmtAcctDr,AmtAcctCr,Account_ID'
        }
      });

      const records = response.data.records || [];
      allFactLines.push(...records);
      if (records.length < pageSize) break;
      pageCount++;
    }

    const filteredLines = allFactLines.filter(line => {
      const date = new Date(line.DateAcct);
      return date >= startDate && date <= endDate;
    });

    rawData.value = filteredLines;

    const monthlyData = {};
    for (const line of filteredLines) {
      const date = new Date(line.DateAcct);
      const month = date.toLocaleString('en-US', { month: 'long' });

      const accountRes = await axios.get(`/api/v1/models/C_ElementValue/${line.Account_ID.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const value = accountRes.data.Value;
      if (!value) continue;

      const isCharge = value.startsWith('6');
      const isRevenue = value.startsWith('7');
      if (!isCharge && !isRevenue) continue;

      if (!monthlyData[month]) {
        monthlyData[month] = { revenue: 0, charge: 0, net: 0 };
      }

      if (isRevenue) {
        monthlyData[month].revenue += (line.AmtAcctCr - line.AmtAcctDr);
      } else if (isCharge) {
        monthlyData[month].charge += (line.AmtAcctDr - line.AmtAcctCr);
      }

      monthlyData[month].net = monthlyData[month].revenue - monthlyData[month].charge;
    }

    tableData.value = Object.entries(monthlyData).map(([month, values]) => ({
      month,
      revenue: values.revenue.toFixed(2),
      charge: values.charge.toFixed(2),
      net: values.net.toFixed(2)
    }));

    const labels = Object.keys(monthlyData);
    const revenues = labels.map(month => monthlyData[month].revenue);
    const charges = labels.map(month => monthlyData[month].charge);
    const net = labels.map(month => monthlyData[month].net);

    chartData.value = {
      labels,
      datasets: [
        {
          label: 'Chiffre d\'affaires',
          data: revenues,
          borderColor: 'green',
          backgroundColor: 'rgba(0, 255, 0, 0.2)',
          fill: true,
        },
        {
          label: 'Charges',
          data: charges,
          borderColor: 'red',
          backgroundColor: 'rgba(255, 0, 0, 0.2)',
          fill: true,
        },
        {
          label: 'Résultat net',
          data: net,
          borderColor: 'blue',
          backgroundColor: 'rgba(0, 0, 255, 0.2)',
          fill: true,
        }
      ]
    };

    await createChart();
  } catch (err) {
    console.error('Erreur lors du chargement des écritures comptables :', err.message);
  } finally {
    loading.value = false;
  }
};

const createChart = async () => {
  await nextTick();

  if (!canvasRef.value) {
    console.error("Canvas non trouvé !");
    return;
  }

  const ctx = canvasRef.value.getContext('2d');
  if (window.myChart) {
    window.myChart.destroy?.();
  }

  window.myChart = new Chart(ctx, {
    type: 'line',
    data: chartData.value,
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        tooltip: { mode: 'index', intersect: false }
      },
      scales: {
        x: { title: { display: true, text: 'Mois' } },
        y: { title: { display: true, text: 'Montant (€)' } }
      }
    }
  });
};

const exportCSV = () => {
  const rows = rawData.value.map(l => `${l.DateAcct},${l.Account_ID.id},${l.AmtAcctDr},${l.AmtAcctCr}`);
  const csvContent = "data:text/csv;charset=utf-8,Date,Account ID,Debit,Credit\n" + rows.join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "fact_acct_debug.csv");
  document.body.appendChild(link);
  link.click();
};

onMounted(() => {
  loadData();
});

watch(selectedYear, () => {
  loadData();
});
</script>

<template>
  <Header />
  <main>
    <h1>Sales Revenue & Charges & Net Profit</h1>
    <div style="margin-bottom: 20px;">
      <label for="yearSelect">Select Year:</label>
      <select id="yearSelect" v-model="selectedYear" style="margin-left: 10px;">
        <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
      </select>
    </div>

    <div v-if="loading" class="loading">Loading...</div>
    <div v-else class="tableToutesCesDonnees">
        <table>
            <thead>
            <tr>
                <th>Month</th>
                <th>Revenue</th>
                <th>Charges</th>
                <th>Net profit</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="row in tableData" :key="row.month">
                <td>{{ row.month }}</td>
                <td>{{ row.revenue }}</td>
                <td>{{ row.charge }}</td>
                <td :style="{ color: row.net < 0 ? 'red' : 'green' }">{{ row.net }}</td>
            </tr>
            </tbody>
        </table>
    </div>
    <div class="graphe">
        <h1>Evolution per year (select the year on the top)</h1>
        <canvas ref="canvasRef" width="400" height="200"></canvas>
    </div>
    
  </main>
</template>

<style scoped>
main {
  min-height: 100vh;
  background: #f4f4f4;
  font-family: 'Satoshi', sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 0;
}

h1 {
  color: #007bff;
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 24px;
  text-align: center;
}

.loading {
  font-size: 1.3rem;
  color: #007bff;
  margin: 40px 0;
}

.tableToutesCesDonnees {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.10);
  padding: 24px;
  min-width: 320px;
  width: 90%;
  max-width: 900px;
  margin-bottom: 24px;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

th, td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: center;
}

th {
  background-color: #f2f2f2;
  font-weight: bold;
}

button {
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  padding: 12px 24px;
  font-size: 1rem;
}

button:hover {
  background-color: #0056b3;
}
</style>
