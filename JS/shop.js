   // ================== GLOBAL VARIABLES ==================
        let products = [];
        let cart = [];
        let salesHistory = [];
        let isGridView = true;
        let currentSort = 'nameAsc';
        let searchTerm = '';
        let showFavouritesOnly = false;
        let showArchived = false;
        let selectedCategory = 'all';
        let userRole = 'staff';
        let selectedProductForMenu = null;
        let menuQty = 1;
        let contextMenuTarget = null;

        // ================== LOAD & SAVE ==================
        function loadData() {
            try {
                const savedProducts = localStorage.getItem('products');
                products = savedProducts ? JSON.parse(savedProducts) : [];

                const savedCart = localStorage.getItem('cart');
                cart = savedCart ? JSON.parse(savedCart) : [];

                const savedHistory = localStorage.getItem('salesHistory');
                salesHistory = savedHistory ? JSON.parse(savedHistory) : [];

                const savedRole = localStorage.getItem('userRole');
                if (savedRole) userRole = savedRole;
            } catch (e) {
                console.error('Error loading data', e);
            }
        }

        function saveData() {
            try {
                localStorage.setItem('products', JSON.stringify(products));
                localStorage.setItem('cart', JSON.stringify(cart));
                localStorage.setItem('salesHistory', JSON.stringify(salesHistory));
                localStorage.setItem('userRole', userRole);
            } catch (e) {
                console.error('Error saving data', e);
            }
        }

        // ================== RENDER PRODUCTS ==================
        function renderProducts() {
            const container = document.getElementById('productContainer');
            if (!container) return;

            let filtered = products.filter(p => {
                if (!p) return false;
                const nameMatch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase());
                const catMatch = selectedCategory === 'all' || p.category === selectedCategory;
                const favMatch = !showFavouritesOnly || p.favourite;
                const archivedMatch = showArchived ? p.archived : !p.archived;
                return nameMatch && catMatch && favMatch && archivedMatch;
            });

            filtered.sort((a, b) => {
                if (currentSort === 'nameAsc') return (a.name || '').localeCompare(b.name || '');
                if (currentSort === 'nameDesc') return (b.name || '').localeCompare(a.name || '');
                if (currentSort === 'priceAsc') return (a.price || 0) - (b.price || 0);
                if (currentSort === 'priceDesc') return (b.price || 0) - (a.price || 0);
            });

            if (filtered.length === 0) {
                container.innerHTML = `
                    <div class="col-span-full text-center py-20 text-gray-500">
                        <i class="fas fa-box-open text-5xl mb-4 opacity-30"></i>
                        <p class="text-lg font-bold">No products yet</p>
                        <p class="text-sm">Upload products from the <a href="upload.html" class="text-brand-accent underline">inventory page</a>.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = filtered.map(p => {
                const lowStock = p.stock !== undefined && p.stock <= 5 ? '<span class="low-stock-badge">Low</span>' : '';
                return `
                <div class="product-card tap-pulse bg-white dark:bg-gray-800 p-4 rounded-2xl border dark:border-gray-700 shadow-sm flex flex-col gap-2 relative cursor-pointer ${p.archived ? 'archived-item' : ''}" 
                     onclick="handleProductClick(event, ${p.id})">
                    <div class="favourite-star" onclick="toggleFavourite(event, ${p.id})">
                        <i class="fas fa-star ${p.favourite ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'}"></i>
                    </div>
                    ${lowStock}
                    <div class="prod-img h-20 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center text-3xl">
                        ${p.img || '📦'}
                    </div>
                    <div class="flex-1">
                        <h4 class="font-bold dark:text-white text-sm truncate">${p.name || ''}</h4>
                        <p class="text-brand-accent font-bold">₦${(p.price || 0).toLocaleString()}</p>
                        <p class="text-xs text-gray-500">Stock: ${p.stock || 0}</p>
                    </div>
                    <button onclick="openContextMenu(event, ${p.id})" class="absolute top-2 right-2 w-8 h-8 flex items-center justify-center text-gray-400" aria-label="More options">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                </div>
            `}).join('');
        }

        // ================== RENDER CART ==================
        function renderCart() {
            const container = document.getElementById('cartItems');
            const mobileContainer = document.getElementById('mobileCartItems');
            const totalSpan = document.getElementById('totalDisplay');
            const mobileTotalSpan = document.getElementById('mobileTotalDisplay');
            const mobileBarTotal = document.getElementById('mobileBarTotal');
            const mobileItemCount = document.getElementById('mobileItemCount');

            if (cart.length === 0) {
                const emptyMsg = `<p class="text-center text-gray-400 mt-10">Tap products to sell</p>`;
                if (container) container.innerHTML = emptyMsg;
                if (mobileContainer) mobileContainer.innerHTML = emptyMsg;
                if (totalSpan) totalSpan.innerText = "₦0";
                if (mobileTotalSpan) mobileTotalSpan.innerText = "₦0";
                if (mobileBarTotal) mobileBarTotal.innerText = "₦0";
                if (mobileItemCount) mobileItemCount.innerText = "0";
                return;
            }

            let total = 0, totalQty = 0;
            const cartHtml = cart.map(item => {
                if (!item) return '';
                total += (item.price || 0) * (item.qty || 0);
                totalQty += item.qty || 0;
                return `
                    <div class="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl flex justify-between items-center border dark:border-gray-700">
                        <div class="flex-1">
                            <p class="font-bold text-sm dark:text-white">${item.name || ''}</p>
                            <p class="text-xs text-gray-500">₦${(item.price || 0).toLocaleString()} × ${item.qty || 0}</p>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="font-bold text-brand-accent">₦${((item.price || 0) * (item.qty || 0)).toLocaleString()}</span>
                            <button onclick="adjustCartItem(${item.id}, -1)" class="text-gray-400 hover:text-red-500 w-6 h-6 rounded-full flex items-center justify-center">−</button>
                            <button onclick="adjustCartItem(${item.id}, 1)" class="text-gray-400 hover:text-brand-accent w-6 h-6 rounded-full flex items-center justify-center">+</button>
                            <button onclick="removeCartItem(${item.id})" class="text-gray-400 hover:text-red-500 w-6 h-6 flex items-center justify-center"><i class="fas fa-trash-alt text-xs"></i></button>
                        </div>
                    </div>
                `;
            }).join('');

            if (container) container.innerHTML = cartHtml;
            if (mobileContainer) mobileContainer.innerHTML = cartHtml;
            if (totalSpan) totalSpan.innerText = `₦${total.toLocaleString()}`;
            if (mobileTotalSpan) mobileTotalSpan.innerText = `₦${total.toLocaleString()}`;
            if (mobileBarTotal) mobileBarTotal.innerText = `₦${total.toLocaleString()}`;
            if (mobileItemCount) mobileItemCount.innerText = totalQty;
        }

        // ================== CART ACTIONS ==================
        function addToCart(id, qty) {
            const product = products.find(p => p && p.id === id);
            if (!product) return;
            if (product.stock < qty) { alert(`Only ${product.stock} available.`); return; }
            const existing = cart.find(item => item.id === id);
            if (existing) {
                if (product.stock < existing.qty + qty) { alert(`Only ${product.stock} available.`); return; }
                existing.qty += qty;
            } else {
                cart.push({ ...product, qty });
            }
            product.stock -= qty;
            renderCart();
            renderProducts();
            saveData();
            highlightProduct(id);
        }

        function adjustCartItem(id, delta) {
            const item = cart.find(i => i.id === id);
            if (!item) return;
            const product = products.find(p => p.id === id);
            if (!product) return;
            const newQty = item.qty + delta;
            if (newQty <= 0) {
                product.stock += item.qty;
                cart = cart.filter(i => i.id !== id);
            } else {
                if (delta > 0 && product.stock < 1) { alert('Out of stock'); return; }
                if (delta > 0) product.stock -= 1;
                else product.stock += 1;
                item.qty = newQty;
            }
            renderCart();
            renderProducts();
            saveData();
        }

        function removeCartItem(id) {
            const item = cart.find(i => i.id === id);
            if (item) {
                const product = products.find(p => p.id === id);
                if (product) product.stock += item.qty;
                cart = cart.filter(i => i.id !== id);
            }
            renderCart();
            renderProducts();
            saveData();
        }

        function clearCart() {
            cart.forEach(item => {
                const product = products.find(p => p.id === item.id);
                if (product) product.stock += item.qty;
            });
            cart = [];
            renderCart();
            renderProducts();
            saveData();
        }

        function checkout() {
            if (cart.length === 0) { alert('Cart is empty'); return; }
            const discount = parseFloat(document.getElementById('discountPercent')?.value || 0) || 0;
            const mobileDiscount = parseFloat(document.getElementById('mobileDiscountPercent')?.value || 0) || 0;
            const finalDiscount = Math.max(discount, mobileDiscount);
            const subtotal = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
            const total = subtotal * (1 - finalDiscount / 100);
            const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value ||
                document.querySelector('input[name="mobilePayment"]:checked')?.value || 'Cash';
            const sale = {
                id: Date.now(),
                items: cart.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
                subtotal, discount: finalDiscount, total, paymentMethod,
                timestamp: new Date().toLocaleString()
            };
            salesHistory.push(sale);
            saveData();
            alert(`Checkout total: ₦${total.toLocaleString()}\nPaid by ${paymentMethod}\nThank you!`);
            cart = [];
            renderCart();
            renderProducts();
            document.getElementById('cartDrawer')?.classList.remove('open');
        }

        // ================== OTHER FUNCTIONS ==================
        function toggleFavourite(event, id) {
            event.stopPropagation();
            const product = products.find(p => p.id === id);
            if (product) { product.favourite = !product.favourite; renderProducts(); saveData(); }
        }

        function archiveProduct(id) {
            const product = products.find(p => p.id === id);
            if (product) { product.archived = true; renderProducts(); saveData(); hideContextMenu(); }
        }

        function restoreProduct(id) {
            const product = products.find(p => p.id === id);
            if (product) { product.archived = false; renderProducts(); saveData(); hideContextMenu(); }
        }

        function toggleFavouritesFilter() {
            showFavouritesOnly = !showFavouritesOnly;
            const icon = document.getElementById('favouritesFilterIcon');
            if (icon) icon.classList.toggle('text-yellow-500', showFavouritesOnly);
            renderProducts();
        }

        function toggleShowArchived() {
            showArchived = !showArchived;
            const icon = document.getElementById('showArchivedIcon');
            if (icon) icon.classList.toggle('text-blue-500', showArchived);
            renderProducts();
        }

        function filterCategory(category) {
            selectedCategory = category;
            document.querySelectorAll('.category-chip').forEach(chip => {
                chip.classList.toggle('active', chip.dataset.category === category);
            });
            renderProducts();
        }

        function highlightProduct(id) {
            document.querySelectorAll('.product-card').forEach(card => {
                if (card.querySelector(`[onclick*="${id}"]`)) {
                    card.classList.add('highlight');
                    setTimeout(() => card.classList.remove('highlight'), 500);
                }
            });
        }

        function handleProductClick(e, id) {
            if (e.target.closest('button') || e.target.closest('.favourite-star')) return;
            addToCart(id, 1);
        }

        function toggleView() {
            isGridView = !isGridView;
            const container = document.getElementById('productContainer');
            if (container) container.className = isGridView ? 'product-grid' : 'product-list';
            const icon = document.getElementById('viewIcon');
            if (icon) icon.className = isGridView ? 'fas fa-th-large' : 'fas fa-list';
        }

        function toggleSortMenu() { document.getElementById('sortMenu')?.classList.toggle('hidden'); }
        function sortProducts(type) { currentSort = type; renderProducts(); document.getElementById('sortMenu')?.classList.add('hidden'); }

        function simulateBarcodeScan() {
            const code = prompt('Enter barcode number (e.g., 5901234123457):');
            if (!code) return;
            const product = products.find(p => p.barcode === code);
            if (product) addToCart(product.id, 1);
            else alert('Product not found');
        }

        function openContextMenu(event, id) {
            event.stopPropagation();
            const product = products.find(p => p.id === id);
            if (!product) return;
            hideContextMenu();
            const menu = document.getElementById('contextMenu');
            if (!menu) return;
            menu.innerHTML = '';
            menu.classList.remove('hidden');

            const addOne = document.createElement('button');
            addOne.innerHTML = '<i class="fas fa-cart-plus w-5"></i> Add 1';
            addOne.onclick = (e) => { e.stopPropagation(); addToCart(id, 1); hideContextMenu(); };
            menu.appendChild(addOne);

            const chooseQty = document.createElement('button');
            chooseQty.innerHTML = '<i class="fas fa-list-ol w-5"></i> Choose quantity';
            chooseQty.onclick = (e) => { e.stopPropagation(); openMenu(e, id); hideContextMenu(); };
            menu.appendChild(chooseQty);

            const favBtn = document.createElement('button');
            favBtn.innerHTML = product.favourite ? '<i class="fas fa-star text-yellow-500 w-5"></i> Remove from favourites' : '<i class="far fa-star w-5"></i> Add to favourites';
            favBtn.onclick = (e) => { e.stopPropagation(); toggleFavourite(e, id); hideContextMenu(); };
            menu.appendChild(favBtn);

            if (userRole === 'manager') {
                const editStock = document.createElement('button');
                editStock.innerHTML = '<i class="fas fa-pencil-alt w-5"></i> Edit stock';
                editStock.onclick = (e) => {
                    e.stopPropagation();
                    const newStock = prompt('Enter new stock quantity:', product.stock);
                    if (newStock !== null) { product.stock = parseInt(newStock) || 0; renderProducts(); saveData(); }
                    hideContextMenu();
                };
                menu.appendChild(editStock);
            }

            if (product.archived && showArchived) {
                const restoreBtn = document.createElement('button');
                restoreBtn.innerHTML = '<i class="fas fa-undo-alt w-5"></i> Restore';
                restoreBtn.onclick = (e) => { e.stopPropagation(); restoreProduct(id); };
                menu.appendChild(restoreBtn);
            } else if (!product.archived) {
                const archiveBtn = document.createElement('button');
                archiveBtn.innerHTML = '<i class="fas fa-archive w-5"></i> Archive';
                archiveBtn.onclick = (e) => { e.stopPropagation(); archiveProduct(id); };
                menu.appendChild(archiveBtn);
            }

            const rect = event.target.getBoundingClientRect();
            menu.style.top = rect.bottom + window.scrollY + 'px';
            menu.style.left = rect.left + window.scrollX - 150 + 'px';
            if (parseInt(menu.style.left) < 10) menu.style.left = '10px';
            contextMenuTarget = menu;
            setTimeout(() => document.addEventListener('click', handleOutsideClick), 0);
        }

        function hideContextMenu() {
            const menu = document.getElementById('contextMenu');
            if (menu) menu.classList.add('hidden');
            document.removeEventListener('click', handleOutsideClick);
        }

        function handleOutsideClick(e) {
            const menu = document.getElementById('contextMenu');
            if (menu && !menu.contains(e.target)) hideContextMenu();
        }

        function openMenu(e, id) {
            e.stopPropagation();
            selectedProductForMenu = products.find(p => p.id === id);
            menuQty = 1;
            const nameSpan = document.getElementById('menuProductName');
            if (nameSpan) nameSpan.innerText = selectedProductForMenu ? selectedProductForMenu.name : '';
            const qtySpan = document.getElementById('menuQtyValue');
            if (qtySpan) qtySpan.innerText = menuQty;
            const menuDiv = document.getElementById('actionMenu');
            if (menuDiv) menuDiv.classList.remove('hidden');
        }

        function adjustMenuQty(delta) {
            menuQty = Math.max(1, menuQty + delta);
            const qtySpan = document.getElementById('menuQtyValue');
            if (qtySpan) qtySpan.innerText = menuQty;
        }

        function confirmBulkAdd() {
            if (selectedProductForMenu) addToCart(selectedProductForMenu.id, menuQty);
            closeMenu();
        }

        function closeMenu() {
            const menuDiv = document.getElementById('actionMenu');
            if (menuDiv) menuDiv.classList.add('hidden');
        }

        function closeMenuOnOverlay(event) {
            if (event.target === event.currentTarget) closeMenu();
        }

        function toggleCartDrawer() {
            document.getElementById('cartDrawer')?.classList.toggle('open');
        }

        function toggleRole() {
            userRole = userRole === 'staff' ? 'manager' : 'staff';
            localStorage.setItem('userRole', userRole);
            const roleBtn = document.getElementById('roleToggle');
            if (roleBtn) roleBtn.innerHTML = userRole === 'staff' ? '👤 Staff' : '👑 Manager';
            renderProducts();
        }

        function showHistory() {
            const modal = document.getElementById('historyModal');
            const list = document.getElementById('historyList');
            if (!modal || !list) return;
            if (salesHistory.length === 0) list.innerHTML = '<p class="text-gray-500">No sales yet.</p>';
            else {
                list.innerHTML = salesHistory.reverse().map(sale => `
                    <div class="border-b dark:border-gray-700 pb-2 mb-2">
                        <div class="flex justify-between"><span class="font-bold">${sale.timestamp}</span><span>₦${sale.total.toLocaleString()}</span></div>
                        <div class="text-sm">${sale.items.map(i => `${i.name} x${i.qty}`).join(', ')}</div>
                        <div class="text-xs text-gray-500">Payment: ${sale.paymentMethod} | Discount: ${sale.discount}%</div>
                    </div>
                `).join('');
            }
            modal.classList.remove('hidden');
        }

        function closeHistoryModal(e) {
            if (!e || e.target === e.currentTarget) document.getElementById('historyModal')?.classList.add('hidden');
        }

        // ================== CALCULATOR ==================
        const display = document.getElementById('display');
        const historyList = document.getElementById('history-list');

        document.addEventListener('keydown', (event) => {
            const modal = document.getElementById('calculatorModal');
            if (!modal || modal.style.display !== 'flex') return;
            const key = event.key;
            if (/[0-9]/.test(key)) addToDisplay(key);
            else if (['+', '-', '*', '/', '.'].includes(key)) addToDisplay(key);
            else if (key === 'Enter') { calculate(); event.preventDefault(); }
            else if (key === 'Backspace') deleteLast();
            else if (key === 'Escape') clearDisplay();
        });

        function addToDisplay(input) {
            if (display) display.value = (display.value === '0' || display.value === 'Error') ? input : display.value + input;
        }
        function clearDisplay() { if (display) display.value = '0'; }
        function deleteLast() { if (display) display.value = display.value.slice(0, -1) || '0'; }
        function calculate() {
            if (!display) return;
            try {
                const result = eval(display.value);
                if (display.value !== String(result)) addHistoryItem(display.value + ' = ' + result);
                display.value = result;
            } catch (error) { display.value = 'Error'; }
        }
        function addHistoryItem(text) {
            if (!historyList) return;
            const li = document.createElement('li');
            li.textContent = text;
            li.className = "text-[10px] text-white/60 border-b border-white/5 py-1";
            if (historyList.innerHTML.includes('No calculations')) historyList.innerHTML = '';
            historyList.prepend(li);
            if (historyList.children.length > 3) historyList.removeChild(historyList.lastChild);
        }
        function openCalculator() {
            const modal = document.getElementById('calculatorModal');
            if (modal) modal.style.display = 'flex';
            const container = document.getElementById('calcContainer');
            if (container) container.focus();
        }
        function closeCalculator() {
            const modal = document.getElementById('calculatorModal');
            if (modal) modal.style.display = 'none';
        }
        function toggleCalcSize() {
            document.getElementById('calcContainer')?.classList.toggle('large');
        }
        document.getElementById('id-btn-calc')?.addEventListener('click', openCalculator);
        window.onclick = function (event) {
            const modal = document.getElementById('calculatorModal');
            if (event.target == modal) closeCalculator();
        };

        // ================== DARK MODE ==================
        const darkToggle = document.getElementById('darkModeToggle');
        const prefersDark = localStorage.getItem('darkMode') === 'true';
        if (prefersDark) document.body.classList.add('dark');
        if (darkToggle) {
            darkToggle.addEventListener('click', () => {
                document.body.classList.toggle('dark');
                localStorage.setItem('darkMode', document.body.classList.contains('dark'));
            });
        }

        // ================== SIDEBAR TOGGLE ==================
        function toggleSidebar() {
            const sb = document.getElementById('sidebar');
            const overlay = document.getElementById('overlay');
            if (sb) sb.classList.toggle('-translate-x-full');
            if (overlay) overlay.classList.toggle('hidden');
        }

        // ================== SEARCH FOCUS/BLUR ==================
        function handleSearchFocus() {
            if (window.innerWidth < 768) {
                const container = document.getElementById('searchContainer');
                const actions = document.getElementById('headerActions');
                const left = document.getElementById('headerLeft');
                const input = document.getElementById('searchInput');
                if (container) {
                    container.classList.remove('w-10');
                    container.classList.add('flex-1');
                }
                if (actions) actions.classList.add('hidden');
                if (left) left.classList.add('hidden');
                if (input) {
                    input.classList.remove('placeholder-transparent');
                    input.classList.add('placeholder-gray-400');
                }
            }
        }
        function handleSearchBlur() {
            if (window.innerWidth < 768) {
                const input = document.getElementById('searchInput');
                if (input && input.value === "") {
                    const container = document.getElementById('searchContainer');
                    const actions = document.getElementById('headerActions');
                    const left = document.getElementById('headerLeft');
                    if (container) {
                        container.classList.remove('flex-1');
                        container.classList.add('w-10');
                    }
                    if (actions) actions.classList.remove('hidden');
                    if (left) left.classList.remove('hidden');
                    if (input) input.classList.add('placeholder-transparent');
                }
            }
        }

        // ================== INIT ==================
        loadData();
        renderProducts();
        renderCart();
        filterCategory('all');
        if (userRole === 'manager') {
            const historyBtn = document.getElementById('historyBtn');
            if (historyBtn) historyBtn.classList.remove('hidden');
        }

        document.addEventListener('click', function (e) {
            const sortBtn = e.target.closest('[onclick="toggleSortMenu()"]');
            const sortMenu = document.getElementById('sortMenu');
            if (!sortBtn && sortMenu && !sortMenu.contains(e.target)) sortMenu.classList.add('hidden');
        });

        // Attach search input event
        document.getElementById('searchInput')?.addEventListener('input', (e) => {
            searchTerm = e.target.value;
            renderProducts();
        });