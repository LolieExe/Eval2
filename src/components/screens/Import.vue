<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Papa from 'papaparse';
import axios from 'axios';
import Header from '../organics/Header.vue';

const parsedAccounts = ref([]);
const parsedLedger = ref([]);
const route = useRoute();
const router = useRouter();

const handleFile = (event, type) => {
  const file = event.target.files[0];
  if (!file) return;

  if (file.type !== 'text/csv') {
    alert('Only CSV files are supported.');
    return;
  }

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (result) => {
      if (type === 'account') {
        parsedAccounts.value = result.data;
        alert('✅ Account CSV parsed successfully!');
      } else if (type === 'ledger') {
        parsedLedger.value = result.data;
        alert('✅ General Ledger CSV parsed successfully!');
      }
    },
    error: (err) => {
      console.error('CSV parsing error:', err);
      alert('Error parsing CSV file.');
    }
  });
};

const handleAccountCSV = async (data) => {
  const token = localStorage.getItem('idempiere_session');
  const elementId = 105;

  for (const row of data) {
    if (!row.compte || !row.libelle) continue;

    try {
      const body = {
        Value: row.compte,
        Name: row.libelle,
        AccountType: "L",
        C_Element_ID: elementId,
      };

      const response = await axios.post(`/api/v1/models/C_ElementValue`, body, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('✅ Account created:', response.data);
    } catch (err) {
      console.error('❌ Error creating account:', row.compte, err.message);
    }
  }
};

const handleLedgerCSV = async (data) => {
  const token = localStorage.getItem('idempiere_session');

  const constants = {
    C_AcctSchema_ID: 101,
    GL_Category_ID: 0,
    AD_Table_ID: 224,
    C_Currency_ID: 297,
    PostingType: "A",
  };

  const isValidDate = (dateStr) => {
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = dateStr.match(regex);
    if (!match) return false;

    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    const date = new Date(year, month - 1, day);

    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  };

  for (const row of data) {
    if (!row.compte || (!row.debit && !row.credit)) continue;

    if (!row.date || !isValidDate(row.date)) {
      console.error(`❌ Invalid or missing date in row: ${JSON.stringify(row)}`);
      alert(`Erreur de date au format incorrect ou invalide : ${row.date}`);
      continue;
    }

    try {
      const accountResponse = await axios.get(`/api/v1/models/C_ElementValue`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          filter: `Value eq '${row.compte}'`,
        },
      });

      const account = accountResponse.data.records[0];
      if (!account) {
        console.warn(`⚠️ Account not found for code ${row.compte}`);
        continue;
      }

      const [day, month, year] = row.date.split('/');
      const dateFormatted = `${year}-${month}-${day}`;

      const body = {
        C_AcctSchema_ID: constants.C_AcctSchema_ID,
        Account_ID: account.id,
        DateAcct: dateFormatted,
        DateTrx: dateFormatted,
        AmtAcctDr: Number(row.debit) || 0,
        AmtAcctCr: Number(row.credit) || 0,
        Description: `${row.reference} - ${row.journal}`,
        GL_Category_ID: constants.GL_Category_ID,
        AD_Table_ID: constants.AD_Table_ID,
        Record_ID: 200000,
        C_Currency_ID: constants.C_Currency_ID,
        PostingType: constants.PostingType,
      };

      const insertResponse = await axios.post(`/api/v1/models/Fact_Acct`, body, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log(`✅ Ledger entry created: ${row.compte} - ${insertResponse.data.id}`);
    } catch (err) {
      console.error(`❌ Failed to insert ledger for ${row.compte}:`, err.message);
    }
  }
};



const validateAndImportAccount = () => {
  if (!parsedAccounts.value.length) {
    alert("⚠️ Please select and parse an account CSV file first.");
    return;
  }
  handleAccountCSV(parsedAccounts.value);
};

const validateAndImportLedger = () => {
  if (!parsedLedger.value.length) {
    alert("⚠️ Please select and parse a general ledger CSV file first.");
    return;
  }
  handleLedgerCSV(parsedLedger.value);
};
onMounted(() => {
    if (!localStorage.getItem('idempiere_session')) {
        router.push('/login');
    }
});
</script>

<template>
  <Header />
  <main class="import-screen">
    <h1>Import datas</h1>

    <!-- Account Import Section -->
    <div class="import-div">
      <h2>Account import</h2>
      <input type="file" class="file-input" accept=".csv" @change="e => handleFile(e, 'account')" />
      <button class="import-btn" @click="validateAndImportAccount">Validate & Import Accounts</button>
    </div>

    <!-- General Ledger Import Section -->
    <div class="import-div">
      <h2>General Ledger import</h2>
      <input type="file" class="file-input" accept=".csv" @change="e => handleFile(e, 'ledger')" />
      <button class="import-btn" @click="validateAndImportLedger">Validate & Import Ledger</button>
    </div>
  </main>
</template>


<style scoped>
.import-screen {
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

.import-div {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.10);
  padding: 24px;
  min-width: 320px;
  width: 90%;
  max-width: 500px;
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

h2 {
  color: #333;
  font-size: 1.2rem;
  margin-bottom: 16px;
  text-align: center;
}

.file-input {
  margin-top: 8px;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: #fafafa;
  font-size: 1rem;
  width: 100%;
  max-width: 350px;
}

@media (max-width: 600px) {
  .import-div {
    padding: 12px;
    min-width: unset;
    width: 100%;
  }
  h1 {
    font-size: 1.3rem;
  }
  h2 {
    font-size: 1rem;
  }
}
.import-btn {
  margin-top: 16px;
  padding: 10px 20px;
  background-color: #007bff;
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
}

.import-btn:hover {
  background-color: #0056b3;
}

</style>
