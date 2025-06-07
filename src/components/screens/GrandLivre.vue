<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import Header from '../organics/Header.vue';

const route = useRoute();
const accountCode = route.params.accountId;

const entries = ref([]);
const schemas = ref([]);
const selectedSchemaId = ref('');
const startDate = ref('');
const endDate = ref('');
const loading = ref(true);
const error = ref('');

const getGeneralLedger = async () => {
  let allEntries = [];
  let pageCount = 1;
  const pageSize = 100;

  try {
    const token = localStorage.getItem('idempiere_session');
    while (true) {
      const response = await axios.get('/api/v1/models/Fact_Acct', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        params: {
          '_sort': 'DateAcct:asc',
          '$skip': (pageCount - 1) * pageSize,
          '$top': pageSize,
        },
      });

      const records = response.data.records || [];
      allEntries = [...allEntries, ...records];

      if (records.length < pageSize) {
        break; // Plus d'autres pages à charger
      }

      pageCount++;
    }

    entries.value = allEntries.filter(
      (entry) => entry.Account_ID?.identifier === decodeURIComponent(accountCode)
    );
  } catch (err) {
    error.value = 'Erreur lors du chargement du Grand Livre : ' + err.message;
  } finally {
    loading.value = false;
  }
};


const fetchSchemas = async (token) => {
  try {
    const response = await axios.get('/api/v1/models/C_AcctSchema', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    schemas.value = response.data?.records || [];
  } catch (err) {
    error.value = 'Erreur lors du chargement des schémas comptables : ' + err.message;
  }
};

// Filtered entries based on selected schema and date range
const filteredEntries = computed(() => {
  return entries.value.filter(entry => {
    const entryDate = new Date(entry.DateAcct);
    const matchSchema = !selectedSchemaId.value || entry.C_AcctSchema_ID?.id === selectedSchemaId.value;
    const matchStartDate = !startDate.value || entryDate >= new Date(startDate.value);
    const matchEndDate = !endDate.value || entryDate <= new Date(endDate.value);
    return matchSchema && matchStartDate && matchEndDate;
  });
});

onMounted(async () => {
  const token = localStorage.getItem('idempiere_session');
  await fetchSchemas(token);
  await getGeneralLedger();
});
</script>

<template>
  <Header />
  <main>
    <h1>General Ledger for : {{ accountCode }}</h1>

    <div v-if="loading">Loading...</div>
    <div v-else-if="error">{{ error }}</div>

    <div v-else>
      <div style="margin: 1rem 0; display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
        <div>
          <label for="schema">Accounting Schema :</label>
          <select id="schema" v-model="selectedSchemaId">
            <option value="">All</option>
            <option
              v-for="schema in schemas"
              :key="schema.id"
              :value="schema.id"
            >
              {{ schema.Name }}
            </option>
          </select>
        </div>

        <div>
          <label for="start">From :</label>
          <input type="date" id="start" v-model="startDate" />
        </div>

        <div>
          <label for="end">To :</label>
          <input type="date" id="end" v-model="endDate" />
        </div>
      </div>

      <table v-if="filteredEntries.length > 0">
        <thead>
          <tr>
            <th>Date</th>
            <th>Journal</th>
            <th>Description</th>
            <th>Debit</th>
            <th>Credit</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in filteredEntries" :key="entry.id">
            <td>{{ entry.DateAcct }}</td>
            <td>{{ entry.GL_Category_ID?.identifier || 'N/A' }}</td>
            <td>{{ entry.Description || '-' }}</td>
            <td>{{ entry.AmtAcctDr.toFixed(2) }}</td>
            <td>{{ entry.AmtAcctCr.toFixed(2) }}</td>
          </tr>
        </tbody>
      </table>

      <div v-else>None Found.</div>
    </div>
  </main>
</template>

<style scoped>
main {
  padding: 2rem;
  font-family: 'Satoshi', sans-serif;
}

h1 {
  color: #007bff;
  margin-bottom: 1rem;
}

label {
  font-weight: bold;
  margin-right: 0.5rem;
}

select,
input[type="date"] {
  padding: 0.3rem;
  font-size: 1rem;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

th, td {
  border: 1px solid #ccc;
  padding: 0.5rem;
  text-align: left;
}

th {
  background-color: #f0f0f0;
  color: #00ff15;
}
</style>
