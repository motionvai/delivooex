document.addEventListener('DOMContentLoaded', function() {
    const applyButton = document.getElementById('apply-btn');
    const loginButton = document.getElementById('login-btn');
    const applySection = document.getElementById('apply-section');
    const loginSection = document.getElementById('login-section');

    applyButton.addEventListener('click', function() {
        applyButton.classList.add('active');
        loginButton.classList.remove('active');
        applySection.classList.add('active');
        loginSection.classList.remove('active');
    });

    loginButton.addEventListener('click', function() {
        loginButton.classList.add('active');
        applyButton.classList.remove('active');
        loginSection.classList.add('active');
        applySection.classList.remove('active');
    });
    // Function to toggle password visibility
function togglePasswordVisibility(inputId, checkbox) {
    const passwordField = document.getElementById(inputId);
    passwordField.type = checkbox.checked ? "text" : "password";
}

// Signup function (example logic)
function signup() {
    const fullName = document.querySelector("#apply-form input[placeholder='Full Name']").value;
    const email = document.querySelector("#apply-form input[placeholder='Email']").value;
    const phoneNumber = document.querySelector("#apply-form input[placeholder='Phone Number']").value;
    const reason = document.querySelector("#apply-form textarea[placeholder='Why do you want to join?']").value;

    if (!fullName || !email || !phoneNumber || !reason) {
        alert("Please fill in all fields");
        return;
    }

    // Simulate signup process (could be expanded to include database calls, etc.)
    console.log("Signup successful:", { fullName, email, phoneNumber, reason });
    alert("Application submitted successfully!");
}

// Login function (example logic)
function login() {
    const email = document.querySelector("#login-form input[placeholder='Email']").value;
    const password = document.querySelector("#login-form input[placeholder='Password']").value;

    if (!email || !password) {
        alert("Please enter both email and password");
        return;
    }

    // Simulate login process (replace this with actual authentication logic)
    console.log("Login successful:", { email });
    alert("Logged in successfully!");
}

// Attach event listeners to form submission buttons
document.querySelector("#apply-form").addEventListener("submit", function(event) {
    event.preventDefault();
    signup();
});

document.querySelector("#login-form").addEventListener("submit", function(event) {
    event.preventDefault();
    login();
});

})

/*hemburger menue*/
const hamburger = document.querySelector(".hamburger");
const navMenu = document.querySelector(".nav-menu");

hamburger.addEventListener("click", ()=> {
    hamburger.classList.toggle("active");
    navMenu.classList.toggle("active");
})

document.querySelectorAll(".nav-link").forEach(n=>n.addEventListener("click", ()=>{
    hamburger.classList.remove("active")
    navMenu.classList.remove("active")
}))

// Function to show a notification message
// Wait for the DOM to load
document.addEventListener("DOMContentLoaded", () => {
    function showNotification(message) {
        const notification = document.getElementById("notification");
        const notificationMessage = document.getElementById("notification-message");

        notificationMessage.textContent = message;
        notification.style.display = "block";

        setTimeout(() => {
            notification.style.display = "none";
        }, 3000);
    }

    // Show either login or signup form
    function showForm(formType) {
        const signupForm = document.getElementById("signup-form");
        const loginForm = document.getElementById("login-form");
        const signupTab = document.getElementById("signup-tab");
        const loginTab = document.getElementById("login-tab");

        if (formType === "signup") {
            signupForm.classList.add("active");
            loginForm.classList.remove("active");
            signupTab.classList.add("active");
            loginTab.classList.remove("active");
        } else if (formType === "login") {
            loginForm.classList.add("active");
            signupForm.classList.remove("active");
            loginTab.classList.add("active");
            signupTab.classList.remove("active");
        }
    }

    function togglePasswordVisibility(passwordFieldId, checkbox) {
        const passwordField = document.getElementById(passwordFieldId);
        passwordField.type = checkbox.checked ? "text" : "password";
    }

    function signup() {
        const username = document.getElementById("signup-username").value;
        const email = document.getElementById("signup-email").value;
        const password = document.getElementById("signup-password").value;

        if (username && email && password) {
            showNotification("Signup successful for " + username + "!");
            showForm("login");
        } else {
            showNotification("Please fill in all signup fields.");
        }
    }

    function login() {
        const email = document.getElementById("login-email").value;
        const password = document.getElementById("login-password").value;

        if (email && password) {
            showNotification("Login successful for " + email + "!");
        } else {
            showNotification("Please fill in all login fields.");
        }
    }

    // Attach functions globally if necessary for inline onclick
    window.showForm = showForm;
    window.togglePasswordVisibility = togglePasswordVisibility;
    window.signup = signup;
    window.login = login;
});

