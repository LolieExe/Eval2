<script setup>
import axios from 'axios';
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import Header from '../organics/Header.vue';

const balance = ref([]);
const schemas = ref([]);
const loading = ref(true);
const error = ref('');

const startDate = ref('');
const endDate = ref('');
const selectedSchema = ref('');
const router = useRouter();

const getBalanceFromIdempiere = async (token) => {
  let allRecords = [];
  let pageCount = 1;
  const pageSize = 100;

  while (true) {
    try {
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
      allRecords = [...allRecords, ...records];

      if (records.length < pageSize) {
        break; // Exit when less than pageSize records are returned
      }

      pageCount++;
    } catch (err) {
      throw new Error(`Error fetching balance: ${err.message}`);
    }
  }

  return allRecords;
};

const fetchSchemas = async (token) => {
  const response = await axios.get('/api/v1/models/C_AcctSchema', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  schemas.value = response.data?.records || [];
};

const filteredBalance = computed(() => {
  return balance.value.filter(entry => {
    const date = entry.DateAcct;
    const schemaId = entry.C_AcctSchema_ID?.id;

    if (!date) return false;
    if (startDate.value && date < startDate.value) return false;
    if (endDate.value && date > endDate.value) return false;
    if (selectedSchema.value && schemaId !== selectedSchema.value) return false;

    return true;
  });
});

const calculateBalance = (factEntries) => {
  const grouped = {};

  factEntries.forEach(entry => {
    const accountCode = entry.Account_ID?.identifier || 'N/A';
    const libelle = entry.Account_ID?.propertyLabel || '';
    const debit = entry.AmtAcctDr || 0;
    const credit = entry.AmtAcctCr || 0;

    if (!grouped[accountCode]) {
      grouped[accountCode] = {
        code: accountCode,
        libelle,
        totalDebit: 0,
        totalCredit: 0,
      };
    }

    grouped[accountCode].totalDebit += debit;
    grouped[accountCode].totalCredit += credit;
  });

  return Object.values(grouped).map(account => ({
    ...account,
    solde: account.totalDebit - account.totalCredit,
  }));
};

const goToGrandLivre = (accountCode) => {
  router.push(`/grandLivre/${accountCode}`);
};

onMounted(async () => {
  try {
    const token = localStorage.getItem('idempiere_session');
    if (!token) {
      router.push('/login');
      return;
    }
    const rawEntries = await getBalanceFromIdempiere(token);
    await fetchSchemas(token);
    balance.value = rawEntries;
  } catch (err) {
    error.value = 'Erreur de chargement : ' + err.message;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <Header />
  <main>
    <div class="balance-screen">
      <h1>Trial Balance</h1>

      <!-- Filters -->
      <div class="filters">
        <div class="date-filters">
          <label>
            From :
            <input type="date" v-model="startDate" />
          </label>
          <label>
            To :
            <input type="date" v-model="endDate" />
          </label>
        </div>
        <div class="schema-filter">
          <label>
            Accounting Schema :
            <select v-model="selectedSchema">
              <option value="">All</option>
              <option v-for="schema in schemas" :key="schema.id" :value="schema.id">
                {{ schema.Name}}
              </option>
            </select>
          </label>
        </div>
      </div>

      <!-- Status -->
      <div v-if="loading">Loading...</div>
      <div v-else-if="error">{{ error }}</div>

      <!-- Table -->
      <div v-else class="balance-content">
        <table>
          <thead>
            <tr>
              <th>Account</th>
              <th>Label</th>
              <th>Total debit</th>
              <th>Total credit</th>
              <th>Balance</th>
              <th>Dates</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="compte in calculateBalance(filteredBalance)"
              :key="compte.code"
              @click="goToGrandLivre(compte.code)"
              style="cursor: pointer"
            >
              <td>{{ compte.code }}</td>
              <td>{{ compte.libelle }}</td>
              <td>{{ compte.totalDebit.toFixed(2) }}</td>
              <td>{{ compte.totalCredit.toFixed(2) }}</td>
              <td>{{ compte.solde.toFixed(2) }}</td>
              <td>
                {{
                  balance
                    .filter(e => e.Account_ID?.identifier === compte.code)
                    .map(e => e.DateAcct)
                    .filter((v, i, arr) => arr.indexOf(v) === i)
                    .join(', ')
                }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </main>
</template>


<style scoped>
.balance-screen {
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

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  justify-content: center;
  margin-bottom: 20px;
}

.date-filters label,
.schema-filter label {
  font-size: 1rem;
  color: #333;
}

.balance-content {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  padding: 24px;
  min-width: 320px;
  width: 90%;
  max-width: 900px;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
  background: #fff;
}

th,
td {
  border: 1px solid #ddd;
  padding: 12px 8px;
  text-align: left;
  font-size: 1rem;
  word-break: break-word;
}

th {
  background-color: #f4f4f4;
  font-weight: bold;
  color: #00ff15;
}

tr:nth-child(even) {
  background-color: #f9f9f9;
}

@media (max-width: 600px) {
  .balance-content {
    padding: 12px;
    min-width: unset;
    width: 100%;
  }

  th,
  td {
    font-size: 0.95rem;
    padding: 8px 4px;
  }

  h1 {
    font-size: 1.3rem;
  }
}
</style>
