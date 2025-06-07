<template>
  <div class="p-6 max-w-4xl mx-auto">
    <h1 class="text-2xl font-bold mb-4">iDempiere CSV Importer</h1>

    <div class="mb-6">
      <label class="block font-medium">Accounts CSV (compte/libelle)</label>
      <input type="file" @change="handleAccountsUpload" accept=".csv" />
    </div>

    <div class="mb-6">
      <label class="block font-medium">Journal Entries CSV</label>
      <input type="file" @change="handleJournalUpload" accept=".csv" />
    </div>

    <div v-if="accounts.length" class="mb-8">
      <h2 class="text-xl font-semibold mb-2">Accounts Preview</h2>
      <table class="w-full text-sm border">
        <thead>
          <tr>
            <th class="border px-2 py-1">Compte</th>
            <th class="border px-2 py-1">Libellé</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in accounts" :key="index">
            <td class="border px-2 py-1">{{ row.compte }}</td>
            <td class="border px-2 py-1">{{ row.libelle }}</td>
          </tr>
        </tbody>
      </table>
      <button
        class="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        @click="insertAccounts"
      >
        Import Accounts
      </button>
    </div>

    <div v-if="journalEntries.length">
      <h2 class="text-xl font-semibold mb-2">Journal Entries Preview</h2>
      <table class="w-full text-sm border">
        <thead>
          <tr>
            <th class="border px-2 py-1">Date</th>
            <th class="border px-2 py-1">Reference</th>
            <th class="border px-2 py-1">Journal</th>
            <th class="border px-2 py-1">Compte</th>
            <th class="border px-2 py-1">Débit</th>
            <th class="border px-2 py-1">Crédit</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in journalEntries" :key="index">
            <td class="border px-2 py-1">{{ row.date }}</td>
            <td class="border px-2 py-1">{{ row.reference }}</td>
            <td class="border px-2 py-1">{{ row.journal }}</td>
            <td class="border px-2 py-1">{{ row.compte }}</td>
            <td class="border px-2 py-1">{{ row.debit }}</td>
            <td class="border px-2 py-1">{{ row.credit }}</td>
          </tr>
        </tbody>
      </table>
      <button
        class="mt-4 px-4 py-2 bg-green-600 text-white rounded"
        @click="insertJournalEntries"
      >
        Import GL Journals
      </button>
    </div>
  </div>
</template>

<script setup>
import Papa from "papaparse";
import axios from "axios";
import { ref } from "vue";

const accounts = ref([]);
const journalEntries = ref([]);

const handleAccountsUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        accounts.value = results.data;
      },
    });
  }
};

const handleJournalUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        journalEntries.value = results.data;
      },
    });
  }
};

const insertAccounts = async () => {
  const token = localStorage.getItem("idempiere_session");
  if (!token) {
    alert("No iDempiere session token found in localStorage.");
    return;
  }

  const endpoint = "/api/v1/models/C_ElementValue";

  for (const account of accounts.value) {
    const payload = {
      Value: account.compte,
      Name: account.libelle,
      AccountType: "E", // 'E' for Expense; adjust as needed
      IsSummary: false,
      C_Element_ID: 105,
    };

    try {
      const response = await axios.post(endpoint, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      console.log(`Inserted account ${account.compte}:`, response.data);
    } catch (error) {
      console.error(
        `Error inserting account ${account.compte}:`,
        error.response?.data || error.message
      );
    }
  }
};
const insertGL_Category = async () => {
  const token = localStorage.getItem("idempiere_session");
  if (!token) {
    alert("No iDempiere session token found in localStorage.");
    return;
  }

  const endpoint = "/api/v1/models/GL_Category";

  // Extract unique journal names
  const uniqueJournals = [...new Set(journalEntries.value.map(entry => entry.journal))];

  for (const journalName of uniqueJournals) {
    const payload = {
      Name: journalName,
      Description: `Imported category ${journalName}`,
      IsDefault: false,
      IsActive: true
    };

    try {
      const response = await axios.post(endpoint, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      console.log(`Inserted GL_Category ${journalName}:`, response.data);
    } catch (error) {
      console.error(`Error inserting GL_Category ${journalName}:`, error.response?.data || error.message);
    }
  }
};

const insertGL_Journal = async () => {
  const token = localStorage.getItem('idempiere_session');
  if (!token) {
    alert('No iDempiere session token found in localStorage.');
    return;
  }

  const endpoint = '/api/v1/models/GL_Journal';

  // Group journal entries by date and reference
  const groupedEntries = {};
  journalEntries.value.forEach(entry => {
    const key = `${entry.date}_${entry.reference}`;
    if (!groupedEntries[key]) {
      groupedEntries[key] = [];
    }
    groupedEntries[key].push(entry);
  });

  for (const [key, entries] of Object.entries(groupedEntries)) {
    const [rawDate, reference] = key.split('_');

    // Parse and format date to ISO 8601
    const [day, month, year] = rawDate.split('/');
    const formattedDate = `${year}-${month}-${day}T00:00:00Z`;

    // Calculate total debit and credit
    let totalDr = 0;
    let totalCr = 0;
    entries.forEach(entry => {
      const debit = parseFloat(entry.debit) || 0;
      const credit = parseFloat(entry.credit) || 0;
      totalDr += debit;
      totalCr += credit;
    });

    const journalName = entries[0].journal;

    const payload = {
      DocumentNo: reference,
      DateDoc: formattedDate,
      DateAcct: formattedDate,
      C_AcctSchema_ID: 200000, // Replace with your Accounting Schema ID
      C_DocType_ID: 115,       // Replace with your Document Type ID
      C_Currency_ID: 102,      // Replace with your Currency ID
      AD_Org_ID: 11,           // Replace with your Organization ID
      GL_Category_ID: { "identifier": journalName },
      C_Period_ID: 155,        // Replace with your Period ID
      PostingType: 'A',        // 'A' for Actual
      Description: `Imported journal ${reference}`,
      TotalDr: totalDr,
      TotalCr: totalCr
    };

    try {
      const response = await axios.post(endpoint, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log(`Inserted GL_Journal ${reference}:`, response.data);
    } catch (error) {
      console.error(`Error inserting GL_Journal ${reference}:`, error.response?.data || error.message);
    }
  }
};


const insertGL_JournalLine = async () => {
  const token = localStorage.getItem('idempiere_session');
  if (!token) {
    alert('No iDempiere session token found in localStorage.');
    return;
  }

  const endpoint = '/api/v1/models/GL_JournalLine';

  // Group journal entries by date and reference
  const groupedEntries = {};
  journalEntries.value.forEach(entry => {
    const key = `${entry.date}_${entry.reference}`;
    if (!groupedEntries[key]) {
      groupedEntries[key] = [];
    }
    groupedEntries[key].push(entry);
  });

  for (const [key, entries] of Object.entries(groupedEntries)) {
    const [rawDate, reference] = key.split('_');

    // Parse and format date to ISO 8601
    const [day, month, year] = rawDate.split('/');
    const formattedDate = `${year}-${month}-${day}T00:00:00Z`;

    for (const entry of entries) {
      const debit = parseFloat(entry.debit) || 0;
      const credit = parseFloat(entry.credit) || 0;

      const payload = {
        Line: 10, // Adjust line number as needed
        Description: `Line for ${reference}`,
        DateAcct: formattedDate,
        AmtSourceDr: debit,
        AmtSourceCr: credit,
        Account_ID: {
          identifier: entry.compte
        },
        GL_Journal_ID: {
          identifier: reference
        }
      };

      try {
        const response = await axios.post(endpoint, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log(`Inserted GL_JournalLine for ${reference}:`, response.data);
      } catch (error) {
        console.error(`Error inserting GL_JournalLine for ${reference}:`, error.response?.data || error.message);
      }
    }
  }
};
const processJournals = async () => {
  const token = localStorage.getItem('idempiere_session');
  if (!token) {
    alert('No iDempiere session token found in localStorage.');
    return;
  }

  // Extract unique references from journal entries
  const uniqueReferences = [...new Set(journalEntries.value.map(entry => entry.reference))];

  for (const reference of uniqueReferences) {
    try {
      // Search for the GL_Journal by DocumentNo
      const searchResponse = await axios.get(`/api/v1/models/GL_Journal`, {
        params: {
          filter: `DocumentNo eq '${reference}'`
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const records = searchResponse.data.records;
      if (records.length === 0) {
        console.warn(`No GL_Journal found for reference ${reference}`);
        continue;
      }

      const journalId = records[0].id;

      // Send PUT request to complete the journal
      const updateResponse = await axios.put(`/api/v1/models/GL_Journal/${journalId}`, {
        "doc-action": "CO"
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`Processed GL_Journal ${reference}:`, updateResponse.data);
    } catch (error) {
      console.error(`Error processing GL_Journal ${reference}:`, error.response?.data || error.message);
    }
  }
};

const insertJournalEntries = async () => {
  await insertGL_Category();
  await insertGL_Journal();
  await insertGL_JournalLine();
  await processJournals();
};
</script>

<style scoped>
table {
  border-collapse: collapse;
}
th,
td {
  border: 1px solid #ccc;
}
</style>
