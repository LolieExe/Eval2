<script setup>
import { ref } from 'vue';
import axios from 'axios';
import router from '@/router';


const username = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

const handleLogin = async () => {
    if (!username.value || !password.value) {
        error.value = 'Please enter both username and password.';
        return;
    }

    error.value = '';
    loading.value = true;
    

    try {
        const response = await axios.post(`/api/v1/auth/tokens`, {
            userName: username.value,
            password: password.value,
            
        });

        const sessionIdGardenWorld = response.data.token;
        console.log('Session ID:', sessionIdGardenWorld);

        const response2 = await axios.put(`/api/v1/auth/tokens`,{
            clientId: 11,
            roleId: 102,
            organizationId:0,
            warehouseId: 0,
            language: "en_US"
        },
        {
            headers: {
                'Authorization': `Bearer ${sessionIdGardenWorld}`,
                'Content-Type': 'application/json',
            }
        }
    );
        
        const sessionIdGardenAdmin = response2.data.token;
        console.log('Session ID Garden Admin:', sessionIdGardenAdmin);

        if (sessionIdGardenAdmin) {
            localStorage.setItem('idempiere_session',sessionIdGardenAdmin);
            alert(`Logged in as ${username.value}`);
            router.push('/balance');
        } else {
            error.value = 'Invalid response from server.';
        }
    } catch (err) {
        error.value = 'Login failed. Please check your credentials.';
        console.error(err);
    } finally {
        loading.value = false;
    }
};
</script>


<template>
    
    <div class="login-screen">
        <div class="login-box">
            <h1>Login to Idempiere finances</h1>
            <input
                v-model="username"
                type="text"
                placeholder="Username"
                class="login-input"
            />
            <input
                v-model="password"
                type="password"
                placeholder="Password"
                class="login-input"
            />
            <button class="login-btn" @click="handleLogin">Login</button>
            <div v-if="error" class="login-error">{{ error }}</div>
        </div>
    </div>
</template>

<style scoped>
.login-screen {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f4f4f4;
    font-family: 'Satoshi', sans-serif;
}

.login-box {
    background: #fff;
    padding: 32px 24px;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.10);
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 320px;
}

h1 {
    margin-bottom: 24px;
    color: #007bff;
    font-size: 2rem;
    font-weight: bold;
}

.login-input {
    width: 100%;
    padding: 12px;
    margin-bottom: 16px;
    border: 1px solid #ccc;
    border-radius: 6px;
    font-size: 1rem;
    font-family: 'Satoshi', sans-serif;
    outline: none;
    transition: border-color 0.2s;
}

.login-input:focus {
    border-color: #007bff;
}

.login-btn {
    width: 100%;
    padding: 12px;
    background: #007bff;
    color: #fff;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.2s;
    margin-bottom: 8px;
}

.login-btn:hover {
    background: #0056b3;
}

.login-error {
    color: #dc3545;
    font-size: 0.95rem;
    margin-top: 8px;
    text-align: center;
}

</style>