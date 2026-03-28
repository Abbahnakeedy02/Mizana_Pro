
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
  import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-analytics.js";
  import { getFirestore } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

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
  const db = getFirestore(app);
  
  

  document.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();

  const name = document.querySelector('input[placeholder*="full name"]').value;
    const email = document.querySelector('input[type="email"]').value;
    const phone = document.querySelector('input[type="tel"]').value;
    const password = document.querySelector('input[type="Password"]').value;
    const confirm = document.querySelectorAll('input[type="password"]')[1].value;
    const sign = document.querySelector('button.auth-btn');

    if (password !== confirm) {
      alert("Passwords do not match");
      return;
    }
    try {
      // 1. Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const db = getFirestore(app);
      const { updateProfile } = await import("https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js");
      console.log("Account created....");

      // 2. Update profile with name
      await updateProfile(user, { displayName: name });
      
      // 5. Redirect to dashboard or shop setup
      window.location.href = "../admin/login.html"; // adjust as needed
    } catch (error) {
      alert(error.message);
    }
  });
  export { auth, db };
  export const firebaseApp = app; 
