
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDypcHCrpqFsBQULOwAPTdw_L2bvU_ssc4",
  authDomain: "delivoo-ex.firebaseapp.com",
  projectId: "delivoo-ex",
  storageBucket: "delivoo-ex.firebasestorage.app",
  messagingSenderId: "441132716224",
  appId: "1:441132716224:web:a827b1865b14e497275d25",
  measurementId: "G-DTBW6E0KZK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase services

const auth = getAuth(app);
const firestore = getFirestore(app);

// Function to toggle password visibility (refactored)
// Toggle password visibility function
function togglePasswordVisibility(passwordFieldId, checkbox) {
    const passwordField = document.getElementById(passwordFieldId);
    passwordField.type = checkbox.checked ? "text" : "password";
  }
  
// Career Applicant Signup (improved structure and error handling)
async function handleCareerApplicantSignup(event) {
  event.preventDefault();

  const email = event.target.querySelector("input[type='email']").value;
  const password = event.target.querySelector("input[type='password']").value;
  const name = event.target.querySelector("input[placeholder='Full Name']").value;
  const phone = event.target.querySelector("input[placeholder='Phone Number']").value;
  const reason = event.target.querySelector("textarea").value;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Store career applicant details
    await addDoc(collection(firestore, "career_users"), {
      uid: user.uid,
      email: user.email,
      role: "careerApplicant",
      name,
      phone,
      reason,
    });

    alert("Application submitted successfully!");
    event.target.reset(); // Reset the form
  } catch (error) {
    console.error("Error during signup:", error);
    alert("Error: " + error.message);
  }
}

// Career Applicant Login (enhanced readability and error handling)
async function handleCareerApplicantLogin(event) {
  event.preventDefault();

  const email = event.target.querySelector("input[type='email']").value;
  const password = event.target.querySelector("input[type='password']").value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Verify user role
    const docSnapshot = await getDoc(doc(firestore, "career_users", user.uid));
    if (docSnapshot.exists() && docSnapshot.data().role === "careerApplicant") {
      alert("Welcome, Career Applicant!");
      window.location.href = "/career_dashboard.html";}}
    catch{}}