   
     // Import the functions you need from the SDKs you need
     import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
     import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
     import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-analytics.js";
     // TODO: Add SDKs for Firebase products that you want to use
     // https://firebase.google.com/docs/web/setup#available-libraries
   
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
     
   
     
   
     document.querySelector('form').addEventListener('submit', async (e) => {
       e.preventDefault();

       const email = document.querySelector('input[type="email"]').value;
       const password = document.querySelector('input[type="password"]').value;
   
       try {
         // 1. Create Firebase Auth user
         const userCredential = await signInWithEmailAndPassword(auth, email, password);
         const user = userCredential.user;
         console.log("Account signed in....");
         
   
         // 5. Redirect to dashboard or shop setup
         window.location.href = "../app/dashboard.html"; // adjust as needed
       } catch (error) {
         alert(error.message);
       }
     });
            
        
