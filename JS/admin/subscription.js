

    // 1. Import Firebase SDKs
    import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
    import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
    import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
    import { enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";



    // 2. Your Firebase config
    const firebaseConfig = {
        apiKey: "AIzaSyAixrIUsksJ4xYvYowbl85L4qV6gEAUqUs",
        authDomain: "mizanapro-2950c.firebaseapp.com",
        projectId: "mizanapro-2950c",
        storageBucket: "mizanapro-2950c.firebasestorage.app",
        messagingSenderId: "754283606394",
        appId: "1:754283606394:web:ff9a9dabcc1586c1c7e6c3",
        measurementId: "G-RK9G1WFH5X"
    };

    // 3. Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    // After const db = getFirestore(app);
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        // Multiple tabs open – persistence can only be enabled in one tab at a time.
        console.log('Persistence failed: multiple tabs open');
    } else if (err.code == 'unimplemented') {
        // Browser doesn't support persistence
        console.log('Persistence not supported');
    }
});

    // 4. Plan selection logic
    let selectedPlan = null;

    const planCards = document.querySelectorAll('.plan-card');
    planCards.forEach(card => {
        card.addEventListener('click', () => {
            // Remove active class from all cards
            planCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');

            // Determine selected plan
            const title = card.querySelector('.plan-title').innerText;
            if (title.includes('Free Trial')) {
                selectedPlan = 'trial';
            } else if (title.includes('Monthly')) {
                selectedPlan = 'monthly';
            } else if (title.includes('Annual')) {
                selectedPlan = 'annual';
            }
            console.log('Selected plan:', selectedPlan);
        });
    });

    // 5. Subscribe button handler
    document.getElementById('subscribeBtn').addEventListener('click', async () => {
        if (!selectedPlan) {
            alert('Please select a plan first.');
            return;
        }

        const user = auth.currentUser;
        if (!user) {
            // Not logged in – redirect to login
            window.location.href = 'login.html';
            return;
        }

        try {
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            if (!userDoc.exists()) {
                alert('User profile not found. Please contact support.');
                return;
            }

            let subscriptionData = {};

            if (selectedPlan === 'trial') {
                // Calculate trial end date (7 days from now)
                const now = new Date();
                const trialEnd = new Date(now);
                trialEnd.setDate(now.getDate() + 7);

                subscriptionData = {
                    plan: 'trial',
                    status: 'trialing',
                    startDate: now.toISOString(),
                    trialEnds: trialEnd.toISOString()
                };
            } else {
                // For paid plans, you would integrate payment here
                alert(`You selected the ${selectedPlan} plan. Payment integration needed.`);
                return;
            }

            // Update Firestore with subscription info
            await updateDoc(userDocRef, {
                subscription: subscriptionData
            });

            // Redirect to dashboard
            window.location.href = '../app/dashboard.html';
        } catch (error) {
            console.error('Subscription error:', error);
            alert('Error: ' + error.message);
        }
    });

    // Optional: check authentication on load
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            console.log('No user logged in - will redirect on button click');
        } else {
            console.log('User is logged in:', user.email);
        }
    });