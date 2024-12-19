// Import necessary Firebase SDK modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-analytics.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js';
import { query, where, getDocs, getDoc } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';

import { getFirestore, doc, setDoc, collection } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';


// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDypcHCrpqFsBQULOwAPTdw_L2bvU_ssc4",
    authDomain: "delivoo-ex.firebaseapp.com",
    databaseURL: "https://delivoo-ex-default-rtdb.firebaseio.com",
    projectId: "delivoo-ex",
    storageBucket: "delivoo-ex.firebasestorage.app",
    messagingSenderId: "441132716224",
    appId: "1:441132716224:web:03bdd830b2af05c5275d25",
    measurementId: "G-M0ZB0MYPYV"
  };

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// DOMContentLoaded event to ensure all elements are accessible
document.addEventListener("DOMContentLoaded", () => {
    setupMenuToggle();
    setupFormToggle();
    setupEventListeners();
    handleAuthError();
    showNotification();
    showForm();
    
    signup();
    login();

});

// Toggle hamburger menu visibility
function setupMenuToggle() {
    const hamburger = document.querySelector(".hamburger");
    const navMenu = document.querySelector(".nav-menu");

    hamburger.addEventListener("click", () => {
        hamburger.classList.toggle("active");
        navMenu.classList.toggle("active");
    });

    document.querySelectorAll(".nav-link").forEach(n => 
        n.addEventListener("click", () => {
            hamburger.classList.remove("active");
            navMenu.classList.remove("active");
        })
    );
}

// Show notifications to the user
function showNotification(message) {
    const notification = document.getElementById("notification");
    const notificationMessage = document.getElementById("notification-message");
    notificationMessage.textContent = message;
    notification.style.display = "block";
    setTimeout(() => notification.style.display = "none", 3000);
}

// Toggle form visibility between login and signup
function setupFormToggle() {
    document.getElementById("signup-tab").addEventListener("click", () => showForm("signup"));
    document.getElementById("login-tab").addEventListener("click", () => showForm("login"));
}

function showForm(formType) {
    const signupForm = document.getElementById("signup-form");
    const loginForm = document.getElementById("login-form");
    const signupTab = document.getElementById("signup-tab");
    const loginTab = document.getElementById("login-tab");

    const isSignup = formType === "signup";
    signupForm.classList.toggle("active", isSignup);
    loginForm.classList.toggle("active", !isSignup);
    signupTab.classList.toggle("active", isSignup);
    loginTab.classList.toggle("active", !isSignup);
}

// Toggle password visibility
function togglePasswordVisibility(passwordFieldId, checkbox) {
    const passwordField = document.getElementById(passwordFieldId);
    passwordField.type = checkbox.checked ? "text" : "password";
}

// Set up event listeners for signup, login, and password visibility
function setupEventListeners() {
    document.getElementById("signup-button").addEventListener("click", signup);
    document.getElementById("login-button").addEventListener("click", login);
    document.getElementById("show-signup-password").addEventListener("change", (event) => {
        togglePasswordVisibility("signup-password", event.target);
    });
    document.getElementById("show-login-password").addEventListener("change", (event) => {
        togglePasswordVisibility("login-password", event.target);
    });
}

// Handle user signup
// Handle user signup
// Handle user signup
// Handle user signup
// Handle user signup
function signup() {
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    const username = document.getElementById("signup-username").value;
    const phone = document.getElementById("signup-phone").value;

    // Validate email
    if (!validateEmail(email)) {
        showNotification("Please enter a valid email address.");
        return;
    }

    // Validate phone number (Bangladeshi number)
    if (!validatePhoneNumber(phone)) {
        showNotification("Please enter a valid Bangladeshi phone number.");
        return;
    }

    // Validate password (at least 6 characters)
    if (password.length < 6) {
        showNotification("Password must be at least 6 characters long.");
        return;
    }

    // Check if the username already exists in the Firestore database
    const userRef = collection(db, "users");
    const usernameQuery = query(userRef, where("username", "==", username));

    // Use Firestore to check if the username is already taken
    getDocs(usernameQuery).then((querySnapshot) => {
        if (!querySnapshot.empty) {
            // If the username exists, show an error message and return
            showNotification("Username is already taken, please choose another one.");
            return; // Stop further execution if username is taken
        }

        // If username is not taken, proceed with the signup process
        createUserWithEmailAndPassword(auth, email, password)
            .then(async (userCredential) => {
                // User is signed up successfully
                const user = userCredential.user;

                // Save basic user data (username, phone, email) directly in the users/{uid} document
                const userRef = doc(db, "users", user.uid); // Document for the user
                await setDoc(userRef, {
                    username: username,
                    phone: phone,
                    email: email,
                    createdAt: new Date(), // Store the signup timestamp
                    role: "user"
                });

                // Show success notification
                showNotification("Signup successful!");

                // Optionally, switch to login form after successful signup
                showForm("login");
            })
            .catch((error) => {
                // Show error message if the signup fails
                const errorMessage = handleAuthError(error);
                showNotification(errorMessage);
            });
    }).catch((error) => {
        // Handle any errors in the query process
        showNotification("An error occurred while checking the username.");
    });
}

// Validate email format
// Validate email format and provider
function validateEmail(email) {
    // List of valid email providers
    const validProviders = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];

    // Check if email matches the format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/;
    const match = emailRegex.exec(email);

    if (match) {
        // Extract domain from the email
        const domain = match[1];

        // Check if the domain is in the valid providers list
        if (validProviders.includes(domain)) {
            return true;
        } else {
            return false; // Invalid provider
        }
    }

    // If email format doesn't match the regex
    return false;
}


// Validate Bangladeshi phone number (11 digits, starts with 01)
function validatePhoneNumber(phone) {
    const phoneRegex = /^(01)[3-9]\d{8}$/; // Bangladesh phone number regex
    return phoneRegex.test(phone);
}




// Handle user login
// Handle user login with role validation
function login() {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    signInWithEmailAndPassword(auth, email, password)
        .then(async (userCredential) => {
            const user = userCredential.user;

            // Fetch the user's role from the Firestore database
            const userRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();

                // Check if the user's role matches the required role
                if (userData.role === "user") {
                    // Redirect to user dashboard
                    window.location.href = "user_dashboard.html";
                } else {
                    // Show an error message if the role doesn't match
                    showNotification("Unauthorized access: incorrect role.");
                    signOut(auth); // Log the user out
                }
            } else {
                // If user data doesn't exist in Firestore
                showNotification("User data not found. Please contact support.");
                signOut(auth); // Log the user out
            }
        })
        .catch((error) => {
            const errorMessage = handleAuthError(error);
            showNotification(errorMessage || "Invalid Login Info");
        });
}


// Authentication error handling
// Authentication error handling
function handleAuthError(error) {
    if (error && error.code) {
        switch (error.code) {
            case "auth/weak-password":
                return "Password is too weak.";
            case "auth/email-already-in-use":
                return "Email address is already in use.";
            case "An error occurred. Please try again.":
                return "Invalid Login Info"
                
        }
    } else {
        // If no 'code' exists, return the error message directly
        return error.message || "An unexpected error occurred.";
    }
}