// ------------------- IndexedDB Setup (with error handling) -------------------
let db;
const DB_NAME = 'MizanaPro';
const DB_VERSION = 1;

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = e => reject(e);
        request.onsuccess = e => { db = e.target.result; resolve(db); };
        request.onupgradeneeded = e => {
            db = e.target.result;
            if (!db.objectStoreNames.contains('products')) {
                const store = db.createObjectStore('products', { keyPath: 'id' });
                store.createIndex('userId', 'userId', { unique: false });
            }
        };
    });
}

async function saveProductLocal(product) {
    const tx = db.transaction('products', 'readwrite');
    tx.objectStore('products').put(product);
    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = e => reject(e);
    });
}

async function getProductsLocal(userId) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction('products', 'readonly');
        const store = tx.objectStore('products');
        const index = store.index('userId');
        const request = index.getAll(userId);
        request.onsuccess = e => resolve(e.target.result);
        request.onerror = e => reject(e);
    });
}

// Open DB but catch errors so they don't break the rest of the page
openDB().catch(err => console.warn('IndexedDB error (non-critical):', err));

// ================== GLOBAL VARIABLES ==================
let userRole = localStorage.getItem('userRole') || 'staff'; // 'staff' or 'owner'
let appSettings = {};
let products = [];
let transactions = [];

// ================== LOAD DATA ==================
function loadProducts() {
    const stored = localStorage.getItem('products');
    products = stored ? JSON.parse(stored) : [];
}

function loadTransactions() {
    const stored = localStorage.getItem('transactions');
    transactions = stored ? JSON.parse(stored) : [];
}

function loadSettings() {
    const stored = localStorage.getItem('mizana_settings');
    if (stored) {
        try {
            appSettings = JSON.parse(stored);
        } catch (e) {
            appSettings = {};
        }
    } else {
        // Defaults
        appSettings = {
            shop: { businessName: 'Mizana Supermart', currency: '₦' },
            subscription: { plan: 'Pro Monthly', billingDate: 'Feb 20, 2026' },
            inventory: { lowStockAlert: 5 }
        };
    }
    // Update shop name
    const shopNameEl = document.getElementById('shopNameDisplay');
    if (shopNameEl) shopNameEl.innerText = appSettings.shop?.businessName || 'Shop';
    
    // Update subscription info
    const planEl = document.getElementById('subscriptionPlan');
    const dateEl = document.getElementById('billingDate');
    if (planEl) planEl.innerText = appSettings.subscription?.plan || 'N/A';
    if (dateEl) dateEl.innerText = appSettings.subscription?.billingDate || 'N/A';
}

// ================== ROLE-BASED MASKING ==================
function applyRoleMasking() {
    const isOwner = userRole === 'owner';
    const sensitiveFields = [
        { id: 'netProfit', isMoney: true },
        { id: 'projectedToday', isMoney: true },
        { id: 'stockValue', isMoney: true },
        { id: 'profitPercent', isMoney: false }
    ];
    if (!window.realValues) window.realValues = {};
    sensitiveFields.forEach(field => {
        const el = document.getElementById(field.id);
        if (!el) return;
        if (isOwner) {
            if (window.realValues[field.id] !== undefined) {
                el.innerText = window.realValues[field.id];
            }
        } else {
            if (window.realValues[field.id] === undefined) {
                window.realValues[field.id] = el.innerText;
            }
            el.innerText = field.isMoney ? '₦****' : '**%';
        }
    });
    const roleBtn = document.getElementById('roleToggleBtn');
    if (roleBtn) roleBtn.innerHTML = isOwner ? '👑 Owner' : '👤 Staff';
}

// ================== PIN PROMPT FOR OWNER SWITCH ==================
function switchToOwner() {
    const pin = prompt('Enter Owner PIN to switch:');
    if (pin === '1234') {
        userRole = 'owner';
        localStorage.setItem('userRole', 'owner');
        applyRoleMasking();
        updateDashboardMetrics();
    } else {
        alert('Incorrect PIN. Stay as staff.');
    }
}

// ================== PERIOD HELPERS ==================
function getPeriodDates(period) {
    const now = new Date();
    let start;
    if (period === 'today') {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    } else if (period === 'week') {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay(), 0, 0, 0);
    } else if (period === 'month') {
        start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    } else {
        start = new Date(0);
    }
    return { start, end: new Date() };
}

function filterTransactionsByPeriod(period) {
    const { start, end } = getPeriodDates(period);
    return transactions.filter(t => {
        const tDate = new Date(t.timestamp);
        return tDate >= start && tDate <= end;
    });
}

function getPreviousPeriod(period) {
    const now = new Date();
    if (period === 'today') {
        return {
            start: new Date(now.getFullYear(), now.getMonth(), now.getDate()-1, 0,0,0),
            end: new Date(now.getFullYear(), now.getMonth(), now.getDate()-1, 23,59,59)
        };
    } else if (period === 'week') {
        return {
            start: new Date(now.getFullYear(), now.getMonth(), now.getDate()-7, 0,0,0),
            end: new Date(now.getFullYear(), now.getMonth(), now.getDate()-1, 23,59,59)
        };
    } else if (period === 'month') {
        return {
            start: new Date(now.getFullYear(), now.getMonth()-1, 1, 0,0,0),
            end: new Date(now.getFullYear(), now.getMonth(), 0, 23,59,59)
        };
    }
    return null;
}

// ================== UPDATE DASHBOARD ==================
function updateDashboardMetrics() {
    const period = document.getElementById('periodFilter').value;
    const currentTx = filterTransactionsByPeriod(period);
    const prevPeriod = getPreviousPeriod(period);
    const prevTx = prevPeriod ? transactions.filter(t => {
        const tDate = new Date(t.timestamp);
        return tDate >= prevPeriod.start && tDate <= prevPeriod.end;
    }) : [];

    let totalSalesAmount = 0, totalSalesCount = 0, totalCost = 0;
    currentTx.forEach(t => {
        totalSalesAmount += t.total || 0;
        totalSalesCount += t.items?.reduce((sum, i) => sum + i.qty, 0) || 0;
        totalCost += t.items?.reduce((sum, i) => sum + (i.costPrice || 0) * i.qty, 0) || 0;
    });
    let netProfit = totalSalesAmount - totalCost;

    let prevAmount = prevTx.reduce((sum, t) => sum + (t.total || 0), 0);
    let percentChange = prevAmount ? ((totalSalesAmount - prevAmount) / prevAmount * 100).toFixed(1) : 0;
    percentChange = (percentChange > 0 ? '+' : '') + percentChange + '%';

    loadProducts();
    let totalStock = 0, totalStockValue = 0, lowStockCount = 0, expiringCount = 0;
    products.forEach(p => {
        const stock = p.stock || 0;
        totalStock += stock;
        totalStockValue += (p.sellPerPiece || 0) * stock;
        if (stock < (appSettings.inventory?.lowStockAlert || 5)) lowStockCount++;
        if (p.expiryDate) {
            const daysUntil = (new Date(p.expiryDate) - new Date()) / (1000 * 60 * 60 * 24);
            if (daysUntil < 7 && daysUntil >= 0) expiringCount++;
        }
    });

    let projected = 0;
    const last7Days = transactions.filter(t => (new Date() - new Date(t.timestamp)) <= 7 * 24 * 60 * 60 * 1000);
    if (last7Days.length > 0) {
        projected = last7Days.reduce((sum, t) => sum + t.total, 0) / 7;
    }

    const formatMoney = (val) => {
        let symbol = appSettings.shop?.currency || '₦';
        if (symbol.length > 1) symbol = symbol.charAt(0);
        return symbol + val.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };
    const formatNumber = (val) => val.toLocaleString();

    window.realValues = window.realValues || {};
    window.realValues.netProfit = formatMoney(netProfit);
    window.realValues.profitPercent = percentChange;
    window.realValues.projectedToday = formatMoney(projected);
    window.realValues.stockValue = `${appSettings.shop?.currency || '₦'}${totalStockValue.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} total value`;

    document.getElementById('netProfit').innerText = formatMoney(netProfit);
    document.getElementById('profitPercent').innerText = percentChange;
    document.getElementById('totalSales').innerText = formatMoney(totalSalesAmount);
    document.getElementById('salesCount').innerText = formatNumber(totalSalesCount);
    document.getElementById('projectedToday').innerText = formatMoney(projected);
    document.getElementById('stockCount').innerText = formatNumber(totalStock);
    document.getElementById('stockValue').innerHTML = window.realValues.stockValue;
    document.getElementById('lowStockText').innerText = `${lowStockCount} item(s) need restocking`;
    document.getElementById('expiryText').innerText = `${expiringCount} item(s) expiring soon`;

    document.getElementById('lowStockAlert').style.display = lowStockCount === 0 ? 'none' : 'flex';
    document.getElementById('expiryAlert').style.display = expiringCount === 0 ? 'none' : 'flex';

    applyRoleMasking();
}

// ================== LOGOUT ==================
function logout() {
    localStorage.removeItem('userRole');
    window.location.href = 'index.html';
}

// ================== SIDEBAR TOGGLE ==================
function toggleSidebar() {
    const sb = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    sb.classList.toggle('-translate-x-full');
    overlay.classList.toggle('hidden');
}

// ================== CALCULATOR FUNCTIONS (included because they are called in INIT) ==================
// These are defined here to ensure they exist. If you have a separate calculator.js,
// you can remove this block, but ensure it's loaded BEFORE this script.
const display = document.getElementById('display');
const historyList = document.getElementById('history-list');

function addToDisplay(input) {
    if (display.value === '0' || display.value === 'Error') display.value = input;
    else display.value += input;
}

function clearDisplay() { display.value = '0'; }

function deleteLast() {
    display.value = display.value.slice(0, -1);
    if (display.value === '') display.value = '0';
}

function calculate() {
    try {
        const result = eval(display.value);
        if (display.value !== String(result)) addHistoryItem(display.value + ' = ' + result);
        display.value = result;
    } catch (error) { display.value = 'Error'; }
}

function addHistoryItem(text) {
    const li = document.createElement('li');
    li.textContent = text;
    li.className = "text-[10px] text-white/60 border-b border-white/5 py-1";
    if(historyList.innerHTML.includes('No calculations')) historyList.innerHTML = '';
    historyList.prepend(li);
    if (historyList.children.length > 3) historyList.removeChild(historyList.lastChild);
}

function openCalculator() {
    document.getElementById('calculatorModal').style.display = 'flex';
    document.getElementById('calcContainer').focus();
}

function closeCalculator() { document.getElementById('calculatorModal').style.display = 'none'; }
function toggleCalcSize() { document.getElementById('calcContainer').classList.toggle('large'); }

window.onclick = function (event) {
    const modal = document.getElementById('calculatorModal');
    if (event.target == modal) closeCalculator();
}

// ================== DARK MODE TOGGLE ==================
const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const htmlElement = document.documentElement;

if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    htmlElement.classList.add('dark');
    if (themeIcon) themeIcon.classList.replace('fa-moon', 'fa-sun');
} else {
    htmlElement.classList.remove('dark');
    if (themeIcon) themeIcon.classList.replace('fa-sun', 'fa-moon');
}

if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        htmlElement.classList.toggle('dark');
        if (htmlElement.classList.contains('dark')) {
            if (themeIcon) themeIcon.classList.replace('fa-moon', 'fa-sun');
            localStorage.setItem('theme', 'dark');
        } else {
            if (themeIcon) themeIcon.classList.replace('fa-sun', 'fa-moon');
            localStorage.setItem('theme', 'light');
        }
    });
}

// ================== TIME FILTER LISTENER ==================
const periodFilter = document.getElementById('periodFilter');
if (periodFilter) {
    periodFilter.addEventListener('change', updateDashboardMetrics);
}

// ================== INIT ==================
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    loadProducts();
    loadTransactions();
    const roleBtn = document.getElementById('roleToggleBtn');
    if (roleBtn) roleBtn.innerHTML = userRole === 'owner' ? '👑 Owner' : '👤 Staff';
    updateDashboardMetrics();

    const roleToggleBtn = document.getElementById('roleToggleBtn');
    if (roleToggleBtn) {
        roleToggleBtn.addEventListener('click', () => {
            if (userRole === 'staff') {
                switchToOwner();
            } else {
                userRole = 'staff';
                localStorage.setItem('userRole', 'staff');
                applyRoleMasking();
            }
        });
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }

    const calcBtn = document.getElementById('id-btn-calc');
    if (calcBtn) {
        calcBtn.onclick = openCalculator;
    }

    window.addEventListener('storage', (e) => {
        if (e.key === 'products' || e.key === 'transactions' || e.key === 'mizana_settings') {
            loadProducts();
            loadTransactions();
            loadSettings();
            updateDashboardMetrics();
        }
    });
});