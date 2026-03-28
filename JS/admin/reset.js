
     // Import the functions you need from the SDKs you need
     import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
     import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-analytics.js";

        // Your web app's Firebase configuration
     // For Firebase JS SDK v7.20.0 and later, measurementId is optional
     const firebaseConfig = {
       apiKey: "AIzaSyAixrIUsksJ4xYvYowbl85L4qV6gEAUqUs",
       authDomain: "mizanapro-2950c.firebaseapp.com",
       projectId: "mizanapro-2950c",
       storageBucket: "mizanapro-2950c.firebasestorage.app",
       messagingSenderId: "754283606394",
       appId: "1:754283606394:web:ff9a9dabcc1586c1c7e6c3",
       measurementId: "G-RK9G1WFH5X"
     };
       // Initialize Firebase
     const app = initializeApp(firebaseConfig);
     const analytics = getAnalytics(app);
     const auth = getAuth(app);

        const form = document.getElementById('resetForm');
        const emailInput = document.getElementById('resetEmail');
        const successDiv = document.getElementById('successMessage');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = emailInput.value.trim();

            if (!email) {
                alert('Please enter your email address.');
                return;
            }

            try {
                await sendPasswordResetEmail(auth, email);

                // Show success message and hide form
                successDiv.classList.remove('hidden');
                form.style.display = 'none';

                // Redirect after 2 seconds
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } catch (error) {
                alert(error.message);
            }
        });