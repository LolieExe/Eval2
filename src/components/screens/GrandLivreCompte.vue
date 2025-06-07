<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import Header from '../organics/Header.vue';

const route = useRoute();
const router = useRouter();
const accountCode = route.params.accountId;

const entries = ref([]);
const loading = ref(true);
const error = ref('');
const startDate = ref('');
const endDate = ref('');
const searchAccount = ref('');
const searchDescription = ref('');
const searchDocumentNo = ref('');  // New filter for DocumentNo

const getDocumentNoForEntry = async (recordId) => {
  try {
    const token = localStorage.getItem('idempiere_session');
    const response = await axios.get(`/api/v1/models/GL_Journal/${recordId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data.DocumentNo || null;
  } catch (err) {
    console.error(`Failed to fetch DocumentNo for Record_ID ${recordId}`, err);
    return null;
  }
};

const getGeneralLedger = async () => {
  let allEntries = [];
  let pageCount = 1;
  const pageSize = 100;

  try {
    const token = localStorage.getItem('idempiere_session');
    if (!token) {
      router.push('/login');
      return;
    }

    while (true) {
      const response = await axios.get('/api/v1/models/Fact_Acct', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        params: {
          $skip: (pageCount - 1) * pageSize,
          $top: pageSize,
        },
      });

      const records = response.data.records || [];
      allEntries = [...allEntries, ...records];

      if (records.length < pageSize) {
        break; // No more data to fetch
      }

      pageCount++;
    }

    // Enrich entries with DocumentNo for those with AD_Table_ID 224
    for (const entry of allEntries) {
      if (entry.AD_Table_ID?.id === 224) {
        entry.DocumentNo = await getDocumentNoForEntry(entry.Record_ID);
      }
    }

    entries.value = allEntries; // set your reactive var here
  } catch (err) {
    error.value = 'Erreur lors du chargement du Grand Livre : ' + err.message;
  } finally {
    loading.value = false;
  }
};

const filteredEntries = computed(() => {
  return entries.value.filter(entry => {
    const entryDate = new Date(entry.DateAcct);
    const matchStart = !startDate.value || entryDate >= new Date(startDate.value);
    const matchEnd = !endDate.value || entryDate <= new Date(endDate.value);
    const matchAccount = !searchAccount.value || 
      entry.Account_ID?.identifier?.toLowerCase().includes(searchAccount.value.toLowerCase());
    const matchDescription =!searchDescription.value || 
      (entry.Description && entry.Description.toLowerCase().includes(searchDescription.value.toLowerCase()));
    const matchDocumentNo = !searchDocumentNo.value ||
      (entry.DocumentNo && entry.DocumentNo.toLowerCase().includes(searchDocumentNo.value.toLowerCase()));

    return matchStart && matchEnd && matchAccount && matchDescription && matchDocumentNo;
  });
});

onMounted(() => {
  getGeneralLedger();
});
</script>

<template>
  <Header />
  <main>
    <div class="grand-livre-compte">
      <h1>General Ledger</h1>

      <div v-if="loading">Loading...</div>
      <div v-else-if="error">{{ error }}</div>

      <div v-else>
        <div class="filters">
          <label for="startDate">From : </label>
          <input type="date" v-model="startDate" id="startDate" />
          <label for="endDate">To :</label>
          <input type="date" v-model="endDate" id="endDate" />
          <label for="searchAccount">Account:</label>
            <input
                type="text"
                v-model="searchAccount"
                id="searchAccount"
                placeholder="e.g. 512000"
            />
            <label for="searchDescription">Description:</label>
            <input
                type="text"
                v-model="searchDescription"
                id="searchDescription"
                placeholder="e.g. Payment"
                />
            <label for="searchDocumentNo">Document No:</label>
            <input
                type="text"
                v-model="searchDocumentNo"
                id="searchDocumentNo"
                placeholder="e.g. GLJ-2025-0001"
            />
        </div>

        <table v-if="filteredEntries.length > 0">
          <thead>
            <tr>
              <th>Date</th>
              <th>Account</th>
              <th>Journal</th>
              <th>Description</th>
              <th>Debit</th>
              <th>Credit</th>
              <th>Document No</th> <!-- New column for DocumentNo -->
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in filteredEntries" :key="entry.id">
              <td>{{ entry.DateAcct }}</td>
              <td>{{ entry.Account_ID?.identifier || '-' }}</td>
              <td>{{ entry.GL_Category_ID?.identifier || 'N/A' }}</td>
              <td>{{ entry.Description || '-' }}</td>
              <td>{{ entry.AmtAcctDr?.toFixed(2) }}</td>
              <td>{{ entry.AmtAcctCr?.toFixed(2) }}</td>
              <td>{{ entry.DocumentNo || '-' }}</td> <!-- Display DocumentNo -->
            </tr>
          </tbody>
        </table>

        <div v-else>None Found.</div>
      </div>
    </div>
  </main>
</template>

<style scoped>
main {
  padding: 2rem;
  font-family: 'Satoshi', sans-serif;
}

h1 {
  margin-bottom: 1rem;
  color: #007bff;
}

.filters {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin: 1rem 0;
  flex-wrap: wrap;
}

label {
  font-weight: bold;
}

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

input[type="text"] {
  padding: 0.3rem;
  font-size: 1rem;
}
</style>
