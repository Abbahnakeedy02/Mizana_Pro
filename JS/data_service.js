// js/data-service.js
// Hybrid data service - works offline, syncs to Firebase when online

import { auth, db } from './firebase-config.js';
import { collection, doc, getDoc, setDoc, updateDoc, addDoc, query, where, getDocs } from "firebase/firestore";

// ================== SYNC STATUS ==================
let isOnline = navigator.onLine;
let syncQueue = []; // store pending changes when offline

// Listen for online/offline events
window.addEventListener('online', () => {
    isOnline = true;
    processSyncQueue();
    console.log('Back online - syncing data...');
});

window.addEventListener('offline', () => {
    isOnline = false;
    console.log('Offline - changes will be saved locally');
});

// ================== HELPER FUNCTIONS ==================
function getCurrentUserId() {
    return auth.currentUser?.uid || null;
}

async function getCurrentShopId() {
    const user = auth.currentUser;
    if (!user) return null;
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    return userDoc.data()?.shopId || null;
}

// ================== SETTINGS SERVICE ==================
export const settingsService = {
    // Load settings - first try localStorage, then Firebase if online
    async load() {
        // Always get from localStorage first (fast)
        const localSettings = localStorage.getItem('mizana_settings');
        const settings = localSettings ? JSON.parse(localSettings) : null;
        
        // If online, also fetch from Firebase and merge if newer
        if (isOnline) {
            try {
                const shopId = await getCurrentShopId();
                if (shopId) {
                    const shopDoc = await getDoc(doc(db, 'shops', shopId));
                    const cloudSettings = shopDoc.data()?.settings;
                    
                    if (cloudSettings) {
                        // Merge - cloud version wins (or implement conflict resolution)
                        const merged = { ...settings, ...cloudSettings };
                        localStorage.setItem('mizana_settings', JSON.stringify(merged));
                        return merged;
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch from Firebase:', error);
            }
        }
        
        return settings || {};
    },
    
    // Save settings - save locally, then sync to cloud if online
    async save(newSettings) {
        // Always save to localStorage first (instant)
        localStorage.setItem('mizana_settings', JSON.stringify(newSettings));
        
        // If online, also save to Firebase
        if (isOnline) {
            try {
                const shopId = await getCurrentShopId();
                if (shopId) {
                    await setDoc(doc(db, 'shops', shopId), 
                        { settings: newSettings }, 
                        { merge: true }
                    );
                }
            } catch (error) {
                console.warn('Failed to save to Firebase:', error);
                // Add to sync queue for later
                addToSyncQueue({
                    type: 'settings',
                    data: newSettings,
                    timestamp: Date.now()
                });
            }
        } else {
            // Add to sync queue for when we're back online
            addToSyncQueue({
                type: 'settings',
                data: newSettings,
                timestamp: Date.now()
            });
        }
    }
};

// ================== PRODUCTS SERVICE ==================
export const productsService = {
    // Get all products for current shop
    async getAll() {
        // Try localStorage first
        const localProducts = localStorage.getItem('products');
        const products = localProducts ? JSON.parse(localProducts) : [];
        
        // If online, also fetch from Firebase and merge
        if (isOnline) {
            try {
                const shopId = await getCurrentShopId();
                if (shopId) {
                    const q = query(collection(db, 'products'), where('shopId', '==', shopId));
                    const snapshot = await getDocs(q);
                    const cloudProducts = snapshot.docs.map(doc => ({ 
                        id: doc.id, 
                        ...doc.data() 
                    }));
                    
                    // Simple merge: cloud wins (you can make this smarter)
                    if (cloudProducts.length > 0) {
                        localStorage.setItem('products', JSON.stringify(cloudProducts));
                        return cloudProducts;
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch products from Firebase:', error);
            }
        }
        
        return products;
    },
    
    // Add a new product
    async add(product) {
        // Add to localStorage
        const localProducts = JSON.parse(localStorage.getItem('products') || '[]');
        const newProduct = { ...product, id: product.id || 'local-' + Date.now() };
        localProducts.push(newProduct);
        localStorage.setItem('products', JSON.stringify(localProducts));
        
        // If online, add to Firebase
        if (isOnline) {
            try {
                const shopId = await getCurrentShopId();
                if (shopId) {
                    const docRef = await addDoc(collection(db, 'products'), {
                        ...newProduct,
                        shopId,
                        createdAt: new Date().toISOString()
                    });
                    // Update the local ID with the Firebase ID
                    newProduct.id = docRef.id;
                    // Update localStorage with real ID
                    const updatedProducts = JSON.parse(localStorage.getItem('products') || '[]');
                    const index = updatedProducts.findIndex(p => p.id === newProduct.id);
                    if (index !== -1) {
                        updatedProducts[index] = newProduct;
                        localStorage.setItem('products', JSON.stringify(updatedProducts));
                    }
                }
            } catch (error) {
                console.warn('Failed to add product to Firebase:', error);
                addToSyncQueue({
                    type: 'product-add',
                    data: newProduct,
                    timestamp: Date.now()
                });
            }
        } else {
            // Add to sync queue for later
            addToSyncQueue({
                type: 'product-add',
                data: newProduct,
                timestamp: Date.now()
            });
        }
        
        return newProduct;
    },
    
    // Update a product
    async update(id, updates) {
        // Update localStorage
        const localProducts = JSON.parse(localStorage.getItem('products') || '[]');
        const index = localProducts.findIndex(p => p.id === id);
        if (index !== -1) {
            localProducts[index] = { ...localProducts[index], ...updates };
            localStorage.setItem('products', JSON.stringify(localProducts));
        }
        
        // If online, update Firebase
        if (isOnline && !id.startsWith('local-')) {
            try {
                await setDoc(doc(db, 'products', id), updates, { merge: true });
            } catch (error) {
                console.warn('Failed to update product in Firebase:', error);
                addToSyncQueue({
                    type: 'product-update',
                    id,
                    data: updates,
                    timestamp: Date.now()
                });
            }
        } else {
            // Add to sync queue
            addToSyncQueue({
                type: 'product-update',
                id,
                data: updates,
                timestamp: Date.now()
            });
        }
    }
};

// ================== SYNC QUEUE ==================
function addToSyncQueue(item) {
    syncQueue.push(item);
    localStorage.setItem('syncQueue', JSON.stringify(syncQueue));
}

async function processSyncQueue() {
    if (!isOnline || syncQueue.length === 0) return;
    
    console.log('Processing sync queue...', syncQueue.length, 'items');
    
    const queue = [...syncQueue];
    syncQueue = [];
    localStorage.setItem('syncQueue', JSON.stringify(syncQueue));
    
    for (const item of queue) {
        try {
            switch (item.type) {
                case 'settings':
                    const shopId = await getCurrentShopId();
                    if (shopId) {
                        await setDoc(doc(db, 'shops', shopId), 
                            { settings: item.data }, 
                            { merge: true }
                        );
                    }
                    break;
                    
                case 'product-add':
                    const shopId2 = await getCurrentShopId();
                    if (shopId2) {
                        await addDoc(collection(db, 'products'), {
                            ...item.data,
                            shopId: shopId2
                        });
                    }
                    break;
                    
                case 'product-update':
                    await setDoc(doc(db, 'products', item.id), 
                        item.data, 
                        { merge: true }
                    );
                    break;
            }
        } catch (error) {
            console.error('Failed to sync item:', item, error);
            // Put back in queue
            addToSyncQueue(item);
        }
    }
}

// ================== STAFF SERVICE ==================
export const staffService = {
    async getAll() {
        const local = localStorage.getItem('staff');
        const staff = local ? JSON.parse(local) : [];
        
        if (isOnline) {
            try {
                const shopId = await getCurrentShopId();
                if (shopId) {
                    // Get all users with this shopId
                    const q = query(collection(db, 'users'), where('shopId', '==', shopId));
                    const snapshot = await getDocs(q);
                    const cloudStaff = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    
                    if (cloudStaff.length > 0) {
                        localStorage.setItem('staff', JSON.stringify(cloudStaff));
                        return cloudStaff;
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch staff from Firebase:', error);
            }
        }
        
        return staff;
    },
    
    // For adding staff, we'll use the cloud function approach
    // (as described in previous answer)
};

// ================== INIT ==================
// Load any pending sync queue from previous session
const savedQueue = localStorage.getItem('syncQueue');
if (savedQueue) {
    try {
        syncQueue = JSON.parse(savedQueue);
        // Try to process if we're online
        if (navigator.onLine) {
            processSyncQueue();
        }
    } catch (e) {
        console.warn('Failed to load sync queue');
    }
}