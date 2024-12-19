import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js';
import { getFirestore, collection, query, where, getDocs, doc, getDoc, updateDoc,increment, limit, addDoc , onSnapshot  } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

let redirecting = false; // Prevents double redirects

// Authentication state listener
onAuthStateChanged(auth, (user) => {
    if (!user && !redirecting) {
        console.log("User not logged in.");
        redirecting = true;
        setTimeout(() => {
            window.location.href = 'loading.html';
        }, 0.22);
    } else if (user) {
        console.log("User logged in:", user);
        redirecting = false;
        fetchUserInfo(); // Fetch and display the username
        fetchOrderHistory();
        listenForWithdrawRequestChanges();
    }
});
// Fetch user info (username) from Firestore
async function fetchUserInfo() {
    const user = auth.currentUser;
    if (!user) {
        console.error("User is not logged in.");
        return;
    }

    try {
        // Fetch user document from Firestore 'users' collection
        const userDocRef = doc(firestore, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            // Display the username in the element with id 'username'
            document.getElementById("username").innerText = `Hello, ${userData.username}!`;
        } else {
            console.log("No user data found.");
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
    }
}
// Fetch user info (username) from Firestore
// Fetch user order history from Firestore
async function fetchOrderHistory(dateFilter = '', statusFilter = 'all', paymentFilter = 'all') {
    const user = auth.currentUser;
    if (!user) {
        console.error("User is not logged in.");
        return;
    }

    let ordersRef = collection(firestore, "orders");
    let filters = [where("userId", "==", user.uid)]; // Filter orders for logged-in user

    // Apply date filter (e.g., orders from a specific day)
    if (dateFilter) {
        const startOfDay = new Date(dateFilter);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(dateFilter);
        endOfDay.setHours(23, 59, 59, 999);

        filters.push(where("date", ">=", startOfDay));
        filters.push(where("date", "<=", endOfDay));
    }

    if (statusFilter !== 'all') {
        filters.push(where("statusFilter", "==", statusFilter));
    }

    if (paymentFilter !== 'all') {
        filters.push(where("paymentType", "==", paymentFilter));
    }

    const ordersQuery = query(ordersRef, ...filters);

    try {
        const snapshot = await getDocs(ordersQuery);

        // Initialize counters
        let totalOrders = 0;
        let completedOrders = 0;
        let pendingOrders = 0;

        // Clear the table body
        const tbody = document.getElementById("orderHistoryBody");
        tbody.innerHTML = "";

        snapshot.forEach(async (orderDoc) => {
            const order = orderDoc.data();
            const orderId = orderDoc.id;
            totalOrders++;
            if (order.statusFilter === "completed") completedOrders++;
            if (order.statusFilter === "ongoing") pendingOrders++;

            let withdrawButton = '';

            // Check if the order status is completed and payment type is COD
            if (order.statusFilter === "completed" && order.paymentType === "COD") {
                // Query the `withdraw_request` collection to check the withdrawal status for this order
                const withdrawQuery = query(
                    collection(firestore, "withdraw_request"),
                    where("orderId", "==", orderId),
                    limit(1) // Fetch only the first matching document
                );

                const withdrawSnapshot = await getDocs(withdrawQuery);

                if (!withdrawSnapshot.empty) {
                    // If a withdrawal request exists, check its status
                    const withdrawDoc = withdrawSnapshot.docs[0].data();
                    if (withdrawDoc.status === "requested") {
                        withdrawButton = `<span>Requested</span>`; // If status is "requested"
                    } else if (withdrawDoc.status === "paid") {
                        withdrawButton = `<span>Paid</span>`; // If status is "paid"
                    }
                } else {
                    // If no withdrawal request exists, display the Withdraw button
                    withdrawButton = `<button class="withdraw-button" data-id="${order.orderID}" data-amount="${order.orderAmount}">Withdraw</button>`;
                }
            }

            // Create table row for the order
            const row = `<tr>
                <td>${order.orderID}</td>
                <td>${order.date.toDate().toLocaleDateString()}</td>
                <td>${order.receiverName}</td>
                <td>${order.deliveryAddress}</td>
                <td>${order.orderItem}</td>
                <td>${order.reciverPhone}</td>
                <td>${order.orderAmount}</td>
                <td>${order.paymentType}</td>
                <td>${order.statusFilter}</td>
                <td>${withdrawButton}</td>
            </tr>`;
            tbody.innerHTML += row;
        });

        // Update counters on the UI
        document.getElementById("totalOrders").querySelector("p").innerText = totalOrders;
        document.getElementById("completedOrders").querySelector("p").innerText = completedOrders;
        document.getElementById("pendingOrders").querySelector("p").innerText = pendingOrders;

        // Attach click event listeners to withdraw buttons
        const withdrawModal = document.getElementById("withdrawModal");
        const withdrawForm = document.getElementById("withdrawForm");
        const closeModal = document.getElementById("closeModal");

        // Attach click event listeners to withdraw buttons
        tbody.addEventListener('click', (event) => {
            if (event.target && event.target.classList.contains('withdraw-button')) {
                const orderId = event.target.getAttribute("data-id");
                const orderAmount = event.target.getAttribute("data-amount");

                const withdrawModal = document.getElementById("withdrawModal");
                withdrawModal.dataset.orderId = orderId;

                document.getElementById("withdrawAmount").value = orderAmount;
                withdrawModal.classList.remove("hidden");
            }
        });

        document.getElementById("closeModal").addEventListener("click", () => {
            document.getElementById("withdrawModal").classList.add("hidden");
        });

        document.getElementById("withdrawForm").addEventListener("submit", async (event) => {
            event.preventDefault();

            const withdrawAmount = document.getElementById("withdrawAmount").value;
            const withdrawMethod = document.getElementById("withdrawMethod").value;
            const withdrawNumber = document.getElementById("withdrawNumber").value;
            const orderId = document.getElementById("withdrawModal").dataset.orderId;

            try {
                const withdrawRef = collection(firestore, "withdraw_request");

                await addDoc(withdrawRef, {
                    userId: user.uid,
                    amount: withdrawAmount,
                    method: withdrawMethod,
                    reference: withdrawNumber,
                    status: "requested",
                    requestDate: new Date(),
                    requestId: "WR" + Math.floor(Math.random() * 100000) + 1,
                    orderId: orderId,
                });

                fetchOrderHistory(); // Refresh the order history table
                document.getElementById("withdrawModal").classList.add("hidden");
                event.target.reset();
            } catch (error) {
                console.error("Failed to submit withdrawal request:", error);
                alert("Failed to submit withdrawal request.");
            }
        });
    } catch (error) {
        console.error("Error fetching orders:", error);
        alert("Failed to fetch order history.");
    }
}

function listenForWithdrawRequestChanges() {
    const withdrawRef = collection(firestore, "withdraw_request");
    onSnapshot(withdrawRef, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added" || change.type === "modified") {
                const request = change.doc.data();
                const withdrawButton = document.querySelector(`.withdraw-button[data-id="${request.orderId}"]`);
                if (withdrawButton) {
                    const spanElement = document.createElement("span");
                    spanElement.textContent = request.status === "requested" ? "Requested" : request.status;
                    withdrawButton.replaceWith(spanElement);
                }
            }
        });
    
    });
}

// Function to update withdrawal status to "paid"
// Function to update withdrawal status to "paid"
async function updateWithdrawalStatus(requestId, newStatus) {
    if (!requestId) {
        console.error("Invalid requestId:", requestId);
        return; // Ensure the requestId is valid before proceeding
    }

    try {
        // Correctly reference the withdrawal request document
        const withdrawRequestRef = doc(firestore, "withdraw_request", requestId);

        // Update the withdrawal request status to the new status (e.g., "paid")
        await updateDoc(withdrawRequestRef, {
            status: newStatus,  // Update the status field to "paid"
        });
        
        console.log(`Withdrawal status updated to: ${newStatus}`);
    } catch (error) {
        console.error("Error updating withdrawal status:", error);
    }
}

// Add event listener for admin to update status
document.addEventListener('click', (event) => {
    if (event.target && event.target.classList.contains('update-status-button')) {
        const requestId = event.target.getAttribute("data-request-id");
        const newStatus = event.target.getAttribute("data-new-status");

        if (confirm(`Are you sure you want to update the status to ${newStatus}?`)) {
            updateWithdrawalStatus(requestId, newStatus);
        }
    }
});



// DOM Content Loaded event listener
document.addEventListener('DOMContentLoaded', () => {
    const filterButton = document.getElementById("filter-section");
    if (filterButton) {
        filterButton.addEventListener("click", applyFilters);
    } else {
        console.warn("Element with ID 'filter-section' not found.");
    }

    function applyFilters() {
        const dateFilter = document.getElementById("dateFilter").value;
        const statusFilter = document.getElementById("statusFilter").value;
        const paymentFilter = document.getElementById("paymentFilter").value;

        if (dateFilter) {
            fetchOrderHistory(dateFilter, statusFilter, paymentFilter);
        } else {
            fetchOrderHistory('', statusFilter, paymentFilter); // Pass empty string if no date is selected
        }
    }

    const hamburger = document.querySelector(".hamburger");
    const navMenu = document.querySelector(".nav-menu");

    if (hamburger && navMenu) {
        hamburger.addEventListener("click", () => {
            hamburger.classList.toggle("active");
            navMenu.classList.toggle("active");
        });

        document.querySelectorAll(".nav-links").forEach(n => n.addEventListener("click", () => {
            hamburger.classList.remove("active");
            navMenu.classList.remove("active");
        }));
    } else {
        console.warn("Hamburger menu elements not found.");
    }

    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            signOut(auth).then(() => {
                showNotification("You have been logged out.");
                window.location.href = "login.html";
            }).catch((error) => {
                console.error("Error during logout:", error);
            });
        });
    } else {
        console.warn("Logout button not found.");
    }
});

// Dropdown menu
document.getElementById('sidebarDropdown').addEventListener('change', function() {
    const selectedValue = this.value;

    if (selectedValue) {
        localStorage.setItem('sidebarSelection', selectedValue);
    }

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
            default:
                url = '#';
                break;
        }
        window.location.href = url;
    }
});

// On page load, check if there is a stored selection and set it
window.addEventListener('load', () => {
    const storedSelection = localStorage.getItem('sidebarSelection');
    if (storedSelection) {
        const dropdown = document.getElementById('sidebarDropdown');
        dropdown.value = storedSelection;
    }
});
// Show notifications to the user
function showNotification(message) {
    const notification = document.getElementById("notification");
    const notificationMessage = document.getElementById("notification-message");
    notificationMessage.textContent = message;
    notification.style.display = "block";
    setTimeout(() => notification.style.display = "none", 3000);
}
