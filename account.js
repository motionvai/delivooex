// Import Firebase SDKs
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js';
import { getFirestore, collection, addDoc, query, where, getDocs, doc, getDoc,  orderBy, limit} from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js';
import { onSnapshot } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDypcHCrpqFsBQULOwAPTdw_L2bvU_ssc4",
    authDomain: "delivoo-ex.firebaseapp.com",
    databaseURL: "https://delivoo-ex-default-rtfirestore.firebaseio.com",
    projectId: "delivoo-ex",
    storageBucket: "delivoo-ex.firebasestorage.app",
    messagingSenderId: "441132716224",
    appId: "1:441132716224:web:03bdd830b2af05c5275d25",
    measurementId: "G-M0ZB0MYPYV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

// DOM elements
const packageOptionsDiv = document.getElementById("package-options");
const paymentSegmentDiv = document.getElementById("payment-segment");
const packageNameSpan = document.getElementById("package-name");
const startDateSpan = document.getElementById("start-date");
const endDateSpan = document.getElementById("end-date");
const dueDeliveriesSpan = document.getElementById("due-deliveries");
const areaSpan = document.getElementById("area");

// Tracks the logged-in user
let currentUser = null;

// Utility: Show/hide an element
const toggleElementVisibility = (element, visible) => {
    element.style.display = visible ? "block" : "none";
};

// Load subscription packages
async function loadSubscriptionPackages() {
    const packagesRef = collection(firestore, "subscriptionPackages");
    const packagesSnapshot = await getDocs(packagesRef);

    packageOptionsDiv.innerHTML = ""; // Clear existing packages

    packagesSnapshot.forEach(doc => {
        const packageData = doc.data();
        const packageDiv = document.createElement("div");
        packageDiv.classList.add("package");
        packageDiv.innerHTML = `
            <h3>${packageData.packageName}</h3>
            <p>Price: $${packageData.price}</p>
            <p>Duration: ${packageData.Duration} days</p>
            <p>Deliveries Due: ${packageData.dueDeliveries}</p>
            <p>Area: ${packageData.Area}</p>

            <button onclick="purchasePackage('${doc.id}', '${packageData.price}')">Purchase</button>
        `;
        packageOptionsDiv.appendChild(packageDiv);
    });
}

// Purchase subscription package
window.purchasePackage = (packageId, price) => {
    if (!currentUser) {
        showNotification("You must be logged in to purchase a package.");
        return;
    }
    toggleElementVisibility(paymentSegmentDiv, true); // Show payment form
    document.getElementById("payment-price").innerText = `$${price}`;
    document.getElementById("submit-payment").dataset.packageId = packageId; // Store packageId in the button's dataset
};

// Submit payment details
window.submitPayment = async (event) => {
    event.preventDefault();

    const submitButton = event.target; // The submit button element
    const packageId = submitButton.dataset.packageId; // Retrieve packageId from the button's dataset
    const userId = currentUser?.uid;

    // Validate data
    if (!packageId || !userId) {
        showNotification("Error: Missing user or package data.");
        return;
    }

    const paymentDetails = {
        number: document.getElementById("payment-number").value,
        transactionId: document.getElementById("transectionID").value,
        reference: document.getElementById("reference").value,
        amount: parseFloat(document.getElementById("payment-price").innerText.replace("$", "")),
    };

    if (!paymentDetails.number || !paymentDetails.transactionId || !paymentDetails.reference) {
        showNotification("Please fill in all payment details.");
        return;
    }

    try {
        const packageDoc = await getDoc(doc(firestore, "subscriptionPackages", packageId));
        if (!packageDoc.exists()) {
            showNotification("Package not found.");
            return;
        }

        const packageData = packageDoc.data();

        // Construct subscription request object
        const subscriptionRequest = {
            userId,
            
            packageId,
            paymentDetails,
            packageName: packageData.packageName,
            packagePrice: packageData.price,
            Duration: packageData.Duration,
            dueDeliveries: packageData.dueDeliveries,
            status: "pending",
            requestDate: new Date().toISOString(),
        };

        // Add data to Firestore
        await addDoc(collection(firestore, "subscriptionRequest"), subscriptionRequest);

        showNotification("Payment request submitted successfully.");
        toggleElementVisibility(paymentSegmentDiv, false); // Hide payment form
    } catch (error) {
        console.error("Error submitting payment:", error);
        showNotification("Error submitting payment. Please try again.");
    }
};

// Load current subscription details
async function setupSubscriptionRealTimeUpdates() {
    if (!currentUser) return;

    // First, fetch subscription details
    const subscriptionQuery = query(
        collection(firestore, "subscriptionRequest"),
        where("userId", "==", currentUser.uid),
        where("status", "==", "active")
    );

    const subscriptionSnapshot = await getDocs(subscriptionQuery);
    if (!subscriptionSnapshot.empty) {
        const subscriptionDoc = subscriptionSnapshot.docs[0]; // Get the first active subscription
        const subscription = subscriptionDoc.data();
        const packageDoc = doc(firestore, "subscriptionPackages", subscription.packageId);

        // Get package details
        const packageDocSnapshot = await getDoc(packageDoc);
        if (packageDocSnapshot.exists()) {
            const packageData = packageDocSnapshot.data();
            const purchaseDate = new Date(subscription.requestDate);
            const formattedPurchaseDate = formatDate(purchaseDate);
            const Duration = parseInt(packageData.Duration.split(" ")[0], 10) || 30;
            const endDate = new Date(purchaseDate.getTime() + Duration * 86400000);
            const formattedEndDate = formatDate(endDate);

            // Update the UI with the updated subscription
            packageNameSpan.innerText = packageData.packageName;
            startDateSpan.innerText = formattedPurchaseDate;
            endDateSpan.innerText = formattedEndDate;
            dueDeliveriesSpan.innerText = ` ${subscription.dueDeliveries}`;
            areaSpan.innerText = packageData.Area;
        }
    }

    // Real-time updates with onSnapshot
    const unsubscribe = onSnapshot(subscriptionQuery, (subscriptionSnapshot) => {
        if (!subscriptionSnapshot.empty) {
            const subscriptionDoc = subscriptionSnapshot.docs[0];
            const subscription = subscriptionDoc.data();
            const packageDoc = doc(firestore, "subscriptionPackages", subscription.packageId);

            getDoc(packageDoc).then((packageDocSnapshot) => {
                if (packageDocSnapshot.exists()) {
                    const packageData = packageDocSnapshot.data();
                    const purchaseDate = new Date(subscription.requestDate);
                    const formattedPurchaseDate = formatDate(purchaseDate);
                    const Duration = parseInt(packageData.Duration.split(" ")[0], 10) || 30;
                    const endDate = new Date(purchaseDate.getTime() + Duration * 86400000);
                    const formattedEndDate = formatDate(endDate);

                    // Update the UI with the updated subscription
                    packageNameSpan.innerText = packageData.packageName;
                    startDateSpan.innerText = formattedPurchaseDate;
                    endDateSpan.innerText = formattedEndDate;
                    dueDeliveriesSpan.innerText = ` ${subscription.dueDeliveries}`;
                    areaSpan.innerText = packageData.Area;
                }
            });
        }
    });

    // Return unsubscribe function to stop listening when not needed
    return unsubscribe;
    function formatDate(date) {
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
        const year = date.getFullYear().toString().slice(-2); // Last 2 digits of the year

        return `${day}/${month}/${year}`;
    }
}

// Use onSnapshot for real-time data




// Withdrawal functionality

// Function to update Total Due Balance and Total Withdrawn Amount based on withdrawal status
// Function to update Total Due Balance and Total Withdrawn Amount based on withdrawal status
// Function to update balances and render the table
// Firebase Firestore initialization


// Fetch COD Account Summary
/*var codTotal = 0;
var availCODTotal = 0;
var totalApprovedBalance = 0;
var totalWithdrawnAmount = 0;
var hasPendingApprovedRequest = false; // Track if an approved withdrawal exists

// Function to Fetch COD Summary
async function fetchCODSummary() {
    if (!currentUser) {
        console.error("User is not logged in.");
        return;
    }

    try {
        const ordersRef = collection(firestore, "orders");
        const userOrdersQuery = query(
            ordersRef,
            where("userId", "==", currentUser.uid),
            where("paymentType", "==", "COD")
        );
        const snapshot = await getDocs(userOrdersQuery);

        // Reset totals
        codTotal = 0;
        availCODTotal = 0;

        snapshot.forEach((doc) => {
            const order = doc.data();
            const orderAmount = Number(order.orderAmount) || 0;

            if (order.statusFilter === "completed") {
                codTotal += orderAmount;

                if (order.codStatus === "approved") {
                    availCODTotal += orderAmount;
                }
            }
        });

        // Update the DOM
        document.getElementById("cod-total").innerText = codTotal.toFixed(2);
        document.getElementById("availCODTotal").innerText = availCODTotal.toFixed(2);
    } catch (error) {
        console.error("Error fetching COD summary:", error);
    }
}

// Function to Fetch Withdrawal Requests
// Function to Fetch Withdrawal Requests
async function fetchWithdrawals() {
    if (!currentUser) {
        console.error("User is not logged in.");
        return;
    }

    try {
        const withdrawRef = collection(firestore, "withdraw_request");
        const withdrawQuery = query(
            withdrawRef,
            where("userId", "==", currentUser.uid),
            orderBy("requestDate", "desc"),
            limit(10)
        );
        const snapshot = await getDocs(withdrawQuery);

        // Reset totals and track processed requests
        totalApprovedBalance = 0;
        totalWithdrawnAmount = 0;
        hasPendingApprovedRequest = false;
        let processedRequests = new Set();

        const withdrawTableBody = document.getElementById("withdraw-table-body");
        withdrawTableBody.innerHTML = ""; // Clear the table

        snapshot.forEach((doc) => {
            const request = doc.data();
            const requestId = doc.id; // Unique ID for the request
            const requestDate = request.requestDate.toDate().toLocaleDateString();
            const status = request.status;
            const amount = Number(request.amount) || 0;

            // Skip if this request is already processed
            if (processedRequests.has(requestId)) return;
            processedRequests.add(requestId);

            if (status === "pending") {
                if (!hasPendingApprovedRequest) {
                    availCODTotal -= amount; // Deduct once for the first pending request
                    hasPendingApprovedRequest = true; // Mark as having a pending request
                }
            } else if (status === "approved") {
                availCODTotal -= amount; // Deduct approved amount
                totalWithdrawnAmount += amount; // Add to withdrawn total
            } else if (status === "paid") {
                availCODTotal -= amount;
                totalWithdrawnAmount += amount; // Finalize paid amount
            }

            // Add row to the table
            const row = `
                <tr>
                    <td>${requestDate}</td>
                    <td>$${amount.toFixed(2)}</td>
                    <td>${status}</td>
                </tr>`;
            withdrawTableBody.innerHTML += row;
        });

        // Update the DOM with the latest values
        document.getElementById("totalApprovedBalance").innerText = totalApprovedBalance.toFixed(2);
        document.getElementById("totalWithdrawnAmount").innerText = totalWithdrawnAmount.toFixed(2);
        document.getElementById("availCODTotal").innerText = availCODTotal.toFixed(2); // Reflect updated balance

    } catch (error) {
        console.error("Error fetching withdrawal requests:", error);
    }
}



// Show Withdrawal Form when the Withdraw button is clicked
document.getElementById("withdraw-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!currentUser) {
        console.error("User is not logged in.");
        return;
    }

    const withdrawAmount = parseFloat(document.getElementById("withdraw-amount").value);
    const withdrawMethod = document.getElementById("withdraw-method").value;
    const withdrawReference = document.getElementById("withdraw-reference").value;
    const minimumWithdrawAmount = 505;

    // Validate the withdrawal amount
    if (!withdrawAmount || withdrawAmount < minimumWithdrawAmount || withdrawAmount % minimumWithdrawAmount !== 0) {
        const maxValidWithdrawal = Math.floor(availCODTotal / minimumWithdrawAmount) * minimumWithdrawAmount;
        showNotification(
            `Invalid amount! Enter a multiple of ${minimumWithdrawAmount}. You can withdraw up to $${maxValidWithdrawal.toFixed(2)}.`
        );
        return;
    }

    if (withdrawAmount > availCODTotal) {
        showNotification(`Insufficient balance! Available: $${availCODTotal.toFixed(2)}.`);
        return;
    }

    try {
        // Add withdrawal request to Firestore
        const withdrawRef = collection(firestore, "withdraw_request");
        await addDoc(withdrawRef, {
            userId: currentUser.uid,
            amount: withdrawAmount,
            method: withdrawMethod,
            reference: withdrawReference,
            status: "pending", // Set the status to pending
            requestDate: new Date(),
            requestId: "WR" + Math.floor(Math.random() * 100000) + 1,
        });

        // Deduct the requested amount immediately
        //availCODTotal == availCODTotal;
        document.getElementById("availCODTotal").innerText = availCODTotal.toFixed(2);

        showNotification("Withdrawal request submitted successfully!");
        document.getElementById("withdraw-form").reset();
        fetchWithdrawals(); // Refresh the withdrawal table
    } catch (error) {
        console.error("Error submitting withdrawal request:", error);
        showNotification("Failed to submit withdrawal request.");
    }
});


// Show Withdrawal Form when the Withdraw button is clicked
document.getElementById("withdraw-btn", "submit-withdraw").addEventListener("click", () => {
    if (hasPendingApprovedRequest) {
        showNotification(
            "You cannot submit a new withdrawal request until the existing approved request is paid."
        );
        return;
    }

    const withdrawFormSection = document.getElementById("withdraw-form-section");
    

    // Toggle visibility
    if (withdrawFormSection.style.display === "none" || withdrawFormSection.style.display === "") {
        withdrawFormSection.style.display = "block"; // Show the form
    } else {
        withdrawFormSection.style.display = "none"; // Hide the form
    }
});

// Show Withdrawal Form when the Withdraw button is clicked
document.getElementById( "submit-withdraw").addEventListener("click", () => {
    if (hasPendingApprovedRequest) {
        showNotification(
            "You cannot submit a new withdrawal request until the existing approved request is paid."
        );
        return;
    }

    const withdrawFormSection = document.getElementById("withdraw-form-section");
    

    // Toggle visibility
    if (withdrawFormSection.style.display === "none" || withdrawFormSection.style.display === "") {
        withdrawFormSection.style.display = "block"; // Show the form
    } else {
        withdrawFormSection.style.display = "none"; // Hide the form
    }
});

*/


// Initialize onAuthStateChanged
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is logged in
        currentUser = user;
        console.log("User logged in:", user.uid);

        // Call functions that depend on the user's authentication
        setupSubscriptionRealTimeUpdates()
        loadSubscriptionPackages()
        //fetchCODSummary();
        //fetchWithdrawals();
    } else {
        // User is not logged in
        currentUser = null;
        console.error("No user is logged in.");
        showNotification("Please log in to continue.");
        // Redirect to login page
        window.location.href = "login.html";
    }
});



// On page load, check if there is a stored selection and set it
window.addEventListener('load', () => {
    const storedSelection = localStorage.getItem('sidebarSelection');
    
    if (storedSelection) {
        const dropdown = document.getElementById('sidebarDropdown');
        dropdown.value = storedSelection; // Set the dropdown to the stored value
    }
});

/* Hamburger menu */
const hamburger = document.querySelector(".hamburger");
const navMenu = document.querySelector(".nav-menu");

hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("active");
    navMenu.classList.toggle("active");
});

document.querySelectorAll(".nav-links").forEach(n => n.addEventListener("click", () => {
    hamburger.classList.remove("active");
    navMenu.classList.remove("active");
}));

// Show notifications to the user
function showNotification(message) {
    const notification = document.getElementById("notification");
    const notificationMessage = document.getElementById("notification-message");
    notificationMessage.textContent = message;
    notification.style.display = "block";
    setTimeout(() => notification.style.display = "none", 3000);
}
// Get the dropdown
document.getElementById('sidebarDropdown').addEventListener('change', function() {
    const selectedValue = this.value;

    // Store the selected value in localStorage
    if (selectedValue) {
        localStorage.setItem('sidebarSelection', selectedValue);
    }

    // Redirect to the corresponding page based on the selection
    if (selectedValue) {
        let url;
        switch (selectedValue) {
            case 'user_dashboard':
                url = 'user_dashboard.html';
                break;
            case 'new_order':
                url = 'new_order.html';
                break;
            case 'account':
                url = 'account.html';
                break;
            
        }
        window.location.href = url;
    }
});
