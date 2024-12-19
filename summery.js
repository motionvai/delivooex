// Load order summary from localStorage on page load
window.addEventListener('load', () => {
    const orderSummary = JSON.parse(localStorage.getItem('orderSummary'));

    if (!orderSummary) {
        alert("No order details found. Redirecting...");
        window.location.href = 'new_order.html';
        return;
    }

    // Populate fields with order summary data
    document.getElementById('receiverName').textContent = orderSummary.receiverName;
    document.getElementById('deliveryAddress').textContent = orderSummary.deliveryAddress;
    document.getElementById('orderItem').textContent = orderSummary.orderItem;
    document.getElementById('receiverPhone').textContent = orderSummary.reciverPhone;

    document.getElementById('orderAmount').textContent = orderSummary.orderAmount || "N/A";
    document.getElementById('paymentType').textContent = orderSummary.paymentType;
    document.getElementById('boxSize').textContent = orderSummary.boxSize;
    document.getElementById('orderWeight').textContent = orderSummary.orderWeight || "N/A";
    document.getElementById('pickupAddress').textContent = `${orderSummary.pickupAddress.name}, ${orderSummary.pickupAddress.address}, ${orderSummary.pickupAddress.phone}`;
    document.getElementById('totalAmount').textContent = `$${calculateTotal(orderSummary.orderAmount)}`; // Example total calculation
});

/**
 * Calculate the total amount by adding a fixed delivery fee
 * @param {string|number} orderAmount - The order amount
 * @returns {string} - The total amount as a string
 */
function calculateTotal(orderAmount) {
    const baseAmount = parseFloat(orderAmount) || 0;
    const deliveryFee = 10; // Fixed delivery fee
    return (baseAmount + deliveryFee).toFixed(2);
}

// Function to create an order and store it in Firestore
async function createOrder(orderSummary) {
    const { receiverName, deliveryAddress, orderItem, reciverPhone, orderAmount, paymentType, deliveryMap, boxSize, orderWeight, pickupAddress } = orderSummary;

    if (!userId) {
        throw new Error("User not authenticated. Please log in to create an order.");
    }

    // Fetch active subscription
    const subscriptionData = await loadSubscriptionDetails();
    if (!subscriptionData || subscriptionData.dueDeliveries <= 0) {
        throw new Error("No deliveries left or active subscription.");
    }

    const orderData = {
        orderID: generateUniqueOrderID(),
        date: new Date(),
        receiverName,
        deliveryAddress,
        orderItem,
        receiverPhone: reciverPhone,
        orderAmount,
        paymentType,
        statusFilter: "ongoing",
        pickupAddress, // Include the full pickup address details
        deliveryMap,
        boxSize,
        orderWeight,
        userId,
        codStatus: paymentType === "COD" ? "pending" : "paid",
    };

    try {
        // Save the order in the "orders" collection
        const orderRef = await addDoc(collection(db, "orders"), orderData);

        // Decrement due deliveries in the subscription
        const subscriptionRef = doc(db, "subscriptionRequest", subscriptionData.subscriptionId);
        await setDoc(subscriptionRef, { dueDeliveries: subscriptionData.dueDeliveries - 1 }, { merge: true });

        console.log("Order created with ID:", orderRef.id);
    } catch (error) {
        throw new Error("Error creating order: " + error.message);
    }
}

// Add event listener to "Create Order" button
document.getElementById('createOrderButton').addEventListener('click', async () => {
    const orderSummary = JSON.parse(localStorage.getItem('orderSummary'));

    if (!orderSummary) {
        showNotification("Order summary not found. Please try again.");
        return;
    }

    try {
        await createOrder(orderSummary); // Call the createOrder function
        showNotification("Order created successfully!");
        localStorage.removeItem('orderSummary'); // Clear the order summary after successful creation
        window.location.href = 'order_success.html'; // Redirect to success page
    } catch (error) {
        console.error("Error creating order:", error);
        showNotification("Error creating order: " + error.message);
    }
});

// Show notifications to the user
function showNotification(message) {
    const notification = document.getElementById("notification");
    const notificationMessage = document.getElementById("notification-message");
    notificationMessage.textContent = message;
    notification.style.display = "block";
    setTimeout(() => (notification.style.display = "none"), 3000);
}

// Generate a unique order ID
function generateUniqueOrderID() {
    const timestamp = Date.now().toString().slice(-6);
    return `OD${timestamp}`; // 'OD' is a prefix, you can customize it
}
