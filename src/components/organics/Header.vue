<script setup>
import { ref } from 'vue';

// State to toggle the burger menu
const isMenuOpen = ref(false);

// Function to toggle the menu
const toggleMenu = () => {
    isMenuOpen.value = !isMenuOpen.value;
};
</script>

<template>
    <header class="header">
        <div class="logo"><a href="/">Idempiere shop</a></div>
        <nav class="nav" :class="{ 'nav-open': isMenuOpen }">
            <ul>
                <li><a href="/totalSales">Total sales</a></li>
                <li><a href="/panier">Cart</a></li>
                <li><a href="/balance">Balance</a></li>
                <li><a href="/grandLivre">General Ledger </a></li>
                <li><a href="/import">Import Datas</a></li>
                <li><a href="/chiffreAffaires">Sales Revenue & Charges & Net Profit</a></li>
            </ul>
        </nav>
        <button class="burger-menu" @click="toggleMenu" aria-label="Toggle menu">
            <span></span>
            <span></span>
            <span></span>
        </button>
    </header>
</template>

<style scoped>

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 20px;
    background-color: #007bff;
    color: white;
    font-family: 'Satoshi', sans-serif;
    position: relative;
}


.logo a{
    font-size: 1.5rem;
    font-weight: bold;
    color: white;
    text-decoration: none;

}


.nav {
    display: flex;
    gap: 20px;
}

.nav ul {
    display: flex;
    justify-content: space-evenly;
    list-style: none;
}

.nav li {
    margin-left: 30px;
}

.nav a {
    color: white;
    text-decoration: none;
    font-size: 1rem;
    transition: color 0.3s;
}

.nav a:hover {
    color: #ffcc00;
}

.burger-menu {
    display: none;
    flex-direction: column;
    justify-content: space-between;
    width: 25px;
    height: 20px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
}

.burger-menu span {
    display: block;
    width: 100%;
    height: 3px;
    background-color: white;
    border-radius: 2px;
    transition: transform 0.3s, opacity 0.3s;
}


@media (max-width: 768px) {
    .nav {
        display: none;
        flex-direction: column;
        position: absolute;
        top: 100%;
        right: 0;
        background-color: #007bff;
        width: 200px;
        padding: 10px;
        border-radius: 8px;
    }

    .nav.nav-open {
        display: flex;
    }

    .burger-menu {
        display: flex;
    }
}
</style>