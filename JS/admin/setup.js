import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { getFirestore, doc, setDoc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

// Firebase config (same as before)
const firebaseConfig = {
    apiKey: "AIzaSyAixrIUsksJ4xYvYowbl85L4qV6gEAUqUs",
    authDomain: "mizanapro-2950c.firebaseapp.com",
    projectId: "mizanapro-2950c",
    storageBucket: "mizanapro-2950c.firebasestorage.app",
    messagingSenderId: "754283606394",
    appId: "1:754283606394:web:ff9a9dabcc1586c1c7e6c3",
    measurementId: "G-RK9G1WFH5X"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Simple client-side hash (INSECURE – for testing only!)
async function simpleHash(pin) {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin + 'mizana-salt'); // add a salt
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ========== Step Navigation ==========
let currentStep = 1;
const steps = {
    1: document.getElementById('step1'),
    2: document.getElementById('step2'),
    3: document.getElementById('step3')
};
const indicators = {
    1: document.getElementById('step1-indicator'),
    2: document.getElementById('step2-indicator'),
    3: document.getElementById('step3-indicator')
};

function showStep(step) {
    Object.values(steps).forEach(s => s.classList.remove('active'));
    steps[step].classList.add('active');
    Object.values(indicators).forEach(ind => ind.classList.remove('active'));
    indicators[step].classList.add('active');
    currentStep = step;
}

// Step 1 next
document.getElementById('step1-next').addEventListener('click', () => {
    const shopName = document.getElementById('shopName').value.trim();
    if (!shopName) {
        alert('Please enter a shop name');
        return;
    }
    showStep(2);
});

// Step 2 back / next
document.getElementById('step2-back').addEventListener('click', () => showStep(1));
document.getElementById('step2-next').addEventListener('click', () => {
    const pin = document.getElementById('adminPin').value;
    if (!/^\d{4}$/.test(pin)) {
        alert('PIN must be exactly 4 digits');
        return;
    }
    showStep(3);
});

// Step 3 back
document.getElementById('step3-back').addEventListener('click', () => showStep(2));

// ========== Authentication Check ==========
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists() && userDoc.data().shopId) {
        window.location.href = '../app/dashboard.html';
    }
});

// ========== Final Submission ==========
document.getElementById('complete-setup').addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    const shopName = document.getElementById('shopName').value.trim();
    const currency = document.getElementById('currency').value;
    const shopType = document.getElementById('shopType').value;
    const pin = document.getElementById('adminPin').value;

    if (!shopName || !pin) {
        alert('Please complete all steps');
        showStep(1);
        return;
    }
    if (!/^\d{4}$/.test(pin)) {
        alert('PIN must be exactly 4 digits');
        showStep(2);
        return;
    }

    try {
        // Hash the PIN client-side (temporary – NOT secure for production)
        const pinHash = await simpleHash(pin);

        // Create shop document
        const shopRef = doc(db, 'shops', user.uid);
        await setDoc(shopRef, {
            name: shopName,
            currency,
            type: shopType,
            ownerId: user.uid,
            staffIds: [],
            createdAt: new Date().toISOString()
        });

        // Update user document
        await updateDoc(doc(db, 'users', user.uid), {
            shopId: shopRef.id,
            pinHash: pinHash
        });
        

        window.location.href = '../app/dashboard.html';
    } catch (error) {
        console.error('Setup error:', error);
        alert('Setup failed: ' + error.message);
    }
});