/**
 * Main JavaScript File for Milk Dairy Management Website
 * Handles localStorage ("Database"), Authentication, and Helper functions.
 */

/* ===========================
   DATABASE INIT (LocalStorage)
   =========================== */
const DB_VERSION = '1.4'; // Bumped for Admin Email Typo Fix

function initDB() {
    let shouldInit = false;
    const dataStr = localStorage.getItem('milk_app_data');

    if (!dataStr) {
        shouldInit = true;
    } else {
        const data = JSON.parse(dataStr);
        if (!data.version || data.version !== DB_VERSION) {
            shouldInit = true;
            console.log('Database version mismatch. Updating...');
        }
    }

    if (shouldInit) {
        const initialData = {
            version: DB_VERSION,
            users: [
                { id: 1, name: 'John Doe', email: 'user@milk.com', password: 'user123', role: 'user', address: '123 Dairy Lane', phone: '123-456-7890', blocked: false },
                { id: 2, name: 'Admin Boss', email: 'ranjithsang62@gmail.com', password: '12345678', role: 'admin', address: 'Admin HQ', phone: '999-999-9999', blocked: false }
            ],
            products: [
                { id: 1, name: 'Fresh Cow Milk', price: 60, image: 'https://placehold.co/300x200/E3F2FD/007bff?text=Cow+Milk', description: 'Pure organic cow milk, 1L' },
                { id: 2, name: 'Buffalo Milk', price: 70, image: 'https://placehold.co/300x200/E3F2FD/007bff?text=Buffalo+Milk', description: 'Rich creamy buffalo milk, 1L' },
                { id: 3, name: 'Curd / Dahi', price: 40, image: 'https://placehold.co/300x200/E8F5E9/28a745?text=Curd', description: 'Fresh homemade style curd, 500g' },
                { id: 4, name: 'Paneer', price: 120, image: 'https://placehold.co/300x200/FFF3E0/E65100?text=Paneer', description: 'Soft malai paneer, 200g' },
                { id: 5, name: 'Ghee', price: 500, image: 'https://placehold.co/300x200/FFF8E1/FF6F00?text=Ghee', description: 'Pure desi ghee, 500ml' }
            ],
            orders: [], // { id, userId, date, items: [], total, status }
            cart: [] // This might be better stored per user, but for simple demo logic we can session-store or simple mock
        };
        localStorage.setItem('milk_app_data', JSON.stringify(initialData));
        console.log('Database Initialized');
    }
}

// Helper to get Data
function getDB() {
    return JSON.parse(localStorage.getItem('milk_app_data'));
}

// Helper to save Data
function saveDB(data) {
    localStorage.setItem('milk_app_data', JSON.stringify(data));
}

// Current User Session
function getCurrentUser() {
    const userStr = localStorage.getItem('milk_current_user');
    return userStr ? JSON.parse(userStr) : null;
}

function setCurrentUser(user) {
    localStorage.setItem('milk_current_user', JSON.stringify(user));
}

function logout() {
    localStorage.removeItem('milk_current_user');
    window.location.href = '../enter.html';
}

/* ===========================
   AUTHENTICATION
   =========================== */
function register(name, email, password, address, phone) {
    const db = getDB();

    // Check if email exists
    if (db.users.find(u => u.email === email)) {
        alert('Email already registered!');
        return false;
    }

    const newUser = {
        id: Date.now(),
        name: name,
        email: email,
        password: password,
        role: 'user',
        address: address,
        phone: phone,
        blocked: false
    };

    db.users.push(newUser);
    saveDB(db);
    alert('Registration successful! Please login.');
    return true;
}

function login(email, password, requiredRole) {
    const db = getDB();
    const user = db.users.find(u => u.email === email && u.password === password);

    if (user) {
        if (user.blocked) {
            alert('Your account has been blocked. Contact Admin.');
            return false;
        }
        if (user.role !== requiredRole) {
            alert('Invalid role for this login portal.');
            return false;
        }
        // Success
        setCurrentUser(user);
        return true;
    } else {
        alert('Invalid email or password.');
        return false;
    }
}

function checkAuth(requiredRole) {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = '../enter.html';
        return;
    }
    if (requiredRole && user.role !== requiredRole) {
        alert('Unauthorized access');
        window.location.href = '../enter.html'; // or appropriate dashboard
    }
}

/* ===========================
   PRODUCTS LOGIC
   =========================== */
function getProducts() {
    return getDB().products;
}

function addProduct(product) {
    const db = getDB();
    product.id = Date.now(); // Simple ID gen
    db.products.push(product);
    saveDB(db);
}

function deleteProduct(id) {
    const db = getDB();
    db.products = db.products.filter(p => p.id != id);
    saveDB(db);
}

function updateProduct(updatedProduct) {
    const db = getDB();
    const index = db.products.findIndex(p => p.id == updatedProduct.id);
    if (index !== -1) {
        db.products[index] = updatedProduct;
        saveDB(db);
    }
}

/* ===========================
   CART & ORDERS LOGIC
   =========================== */
// Simple Cart for current session (stored in localStorage key 'milk_cart_' + userId)
function getCart() {
    const user = getCurrentUser();
    if (!user) return [];
    const cart = localStorage.getItem('milk_cart_' + user.id);
    return cart ? JSON.parse(cart) : [];
}

function addToCart(product) {
    const user = getCurrentUser();
    if (!user) return;

    let cart = getCart();
    const existingItem = cart.find(item => item.id == product.id);

    if (existingItem) {
        existingItem.qty += 1;
    } else {
        cart.push({ ...product, qty: 1 });
    }

    localStorage.setItem('milk_cart_' + user.id, JSON.stringify(cart));
    alert('Added to cart!');
}

function removeFromCart(id) {
    const user = getCurrentUser();
    if (!user) return;
    let cart = getCart();
    cart = cart.filter(item => item.id != id);
    localStorage.setItem('milk_cart_' + user.id, JSON.stringify(cart));
}

function clearCart() {
    const user = getCurrentUser();
    if (!user) return;
    localStorage.removeItem('milk_cart_' + user.id);
}

function placeOrder() {
    const user = getCurrentUser();
    if (!user) return false;
    const cart = getCart();
    if (cart.length === 0) {
        alert('Cart is empty!');
        return false;
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    const db = getDB();
    const newOrder = {
        id: 'ORD-' + Date.now(),
        userId: user.id,
        userName: user.name,
        date: new Date().toLocaleDateString(),
        items: cart,
        total: total,
        status: 'Pending'
    };

    db.orders.push(newOrder);
    saveDB(db);
    clearCart();
    return true;
}

function getAllOrders() {
    return getDB().orders;
}

function getUserOrders(userId) {
    const db = getDB();
    return db.orders.filter(o => o.userId == userId);
}

function updateOrderStatus(orderId, status) {
    const db = getDB();
    const order = db.orders.find(o => o.id == orderId);
    if (order) {
        order.status = status;
        saveDB(db);
    }
}

/* ===========================
   USER MANAGEMENT
   =========================== */
function getAllUsers() {
    const db = getDB();
    return db.users.filter(u => u.role === 'user');
}

function deleteUser(userId) {
    const db = getDB();
    db.users = db.users.filter(u => u.id != userId);
    saveDB(db);
}

function toggleBlockUser(userId) {
    const db = getDB();
    const user = db.users.find(u => u.id == userId);
    if (user) {
        user.blocked = !user.blocked;
        saveDB(db);
    }
}

function updateProfile(updatedData) {
    const db = getDB();
    const currentUser = getCurrentUser();
    const userIndex = db.users.findIndex(u => u.id == currentUser.id);

    if (userIndex !== -1) {
        db.users[userIndex] = { ...db.users[userIndex], ...updatedData };
        saveDB(db);
        setCurrentUser(db.users[userIndex]); // Update session
    }
}


/* ===========================
   INITIALIZE
   =========================== */
// Run on load
initDB();
