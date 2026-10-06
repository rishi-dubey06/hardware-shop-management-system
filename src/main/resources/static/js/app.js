/**
 * XYZ Hardware Shop Management System - Client Application
 */

const API_BASE = '/api';

const app = {
    state: {
        token: localStorage.getItem('token') || null,
        user: JSON.parse(localStorage.getItem('user') || 'null'),
        currentView: 'catalog',
        catalogPage: 0,
        catalogQuery: '',
        catalogCategory: '',
        inventoryPage: 0,
        inventoryQuery: '',
        inventoryCategory: '',
        salesTab: 'pending', // 'pending' or 'all'
        salesPage: 0,
        customersPage: 0,
        customerQuery: '',
        availableProductsCache: [],
        customersCache: [],
        activeSaleForAction: null
    },

    init() {
        this.updateAuthUI();
        this.loadCatalogCategories();
        this.loadCatalogProducts();

        if (this.isAdmin()) {
            this.refreshDashboard();
            this.checkLowStockBanner();
        }

        // Auto refresh every 45s if Admin
        setInterval(() => {
            if (this.isAdmin()) {
                this.checkLowStockBanner();
            }
        }, 45000);

        lucide.createIcons();
    },

    // ---------------- AUTHENTICATION ----------------
    isAdmin() {
        return this.state.user && (this.state.user.role === 'ROLE_ADMIN' || this.state.user.role === 'ADMIN');
    },

    updateAuthUI() {
        const userInfoArea = document.getElementById('user-info-area');
        const guestButtons = document.getElementById('guest-auth-buttons');
        const adminNavGroup = document.getElementById('admin-nav-group');

        if (this.state.token && this.state.user) {
            userInfoArea.classList.remove('hidden');
            guestButtons.classList.add('hidden');
            document.getElementById('user-display-name').innerText = this.state.user.fullName || this.state.user.username;
            document.getElementById('user-role-badge').innerText = this.state.user.role.replace('ROLE_', '');

            if (this.isAdmin()) {
                adminNavGroup.classList.remove('hidden');
            } else {
                adminNavGroup.classList.add('hidden');
            }
        } else {
            userInfoArea.classList.add('hidden');
            guestButtons.classList.remove('hidden');
            adminNavGroup.classList.add('hidden');
        }
    },

    openLoginModal() {
        this.openModal('modal-login');
    },

    fillCredentials(username, password) {
        document.getElementById('login-username').value = username;
        document.getElementById('login-password').value = password;
    },

    async handleLogin(event) {
        event.preventDefault();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;

        try {
            const res = await this.apiFetch('/auth/login', 'POST', { username, password }, false);
            if (res.success && res.data) {
                this.state.token = res.data.token;
                this.state.user = {
                    username: res.data.username,
                    email: res.data.email,
                    fullName: res.data.fullName,
                    role: res.data.role
                };
                localStorage.setItem('token', this.state.token);
                localStorage.setItem('user', JSON.stringify(this.state.user));

                this.closeModal('modal-login');
                this.updateAuthUI();
                this.toast('Welcome, ' + this.state.user.fullName + '!', 'success');

                if (this.isAdmin()) {
                    this.switchView('admin-dashboard');
                    this.refreshDashboard();
                } else {
                    this.switchView('catalog');
                }
            } else {
                this.toast(res.message || 'Login failed', 'error');
            }
        } catch (err) {
            this.toast(err.message || 'Login failed', 'error');
        }
    },

    logout() {
        this.state.token = null;
        this.state.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.updateAuthUI();
        this.switchView('catalog');
        this.toast('You have been logged out', 'info');
    },

    // ---------------- VIEW ROUTING ----------------
    switchView(viewName) {
        if ((viewName.startsWith('admin-')) && !this.isAdmin()) {
            this.toast('Admin authorization required. Please sign in as Admin.', 'warning');
            this.openLoginModal();
            return;
        }

        const views = [
            'view-catalog',
            'view-admin-dashboard',
            'view-admin-inventory',
            'view-admin-sales',
            'view-admin-customers',
            'view-admin-notifications'
        ];

        views.forEach(v => {
            const el = document.getElementById(v);
            if (el) el.classList.add('hidden');
        });

        // Remove active highlight from all nav buttons
        document.querySelectorAll('header nav button').forEach(b => {
            b.classList.remove('text-teal-700', 'font-semibold', 'bg-slate-100');
        });

        const target = document.getElementById('view-' + viewName);
        if (target) {
            target.classList.remove('hidden');
            this.state.currentView = viewName;
        }

        const activeNav = document.getElementById('nav-' + viewName);
        if (activeNav) {
            activeNav.classList.add('text-teal-700', 'font-semibold', 'bg-slate-100');
        }

        // View specific initializations
        if (viewName === 'catalog') this.loadCatalogProducts();
        if (viewName === 'admin-dashboard') this.refreshDashboard();
        if (viewName === 'admin-inventory') this.loadInventoryProducts();
        if (viewName === 'admin-sales') this.loadSales();
        if (viewName === 'admin-customers') this.loadCustomers();
        if (viewName === 'admin-notifications') this.loadNotificationLogs();

        lucide.createIcons();
    },

    // ---------------- CATALOG VIEW ----------------
    async loadCatalogCategories() {
        try {
            const res = await this.apiFetch('/products/categories', 'GET', null, false);
            if (res.success && res.data) {
                const container = document.getElementById('catalog-category-pills');
                const invFilter = document.getElementById('inventory-category-filter');

                let pillsHtml = `<button onclick="app.filterCatalogCategory('')" class="category-pill px-3 py-1.5 rounded-lg text-xs font-medium ${this.state.catalogCategory === '' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} whitespace-nowrap">All Items</button>`;
                let selectOptions = `<option value="">All Categories</option>`;

                res.data.forEach(cat => {
                    const active = this.state.catalogCategory === cat;
                    pillsHtml += `<button onclick="app.filterCatalogCategory('${cat}')" class="category-pill px-3 py-1.5 rounded-lg text-xs font-medium ${active ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} whitespace-nowrap">${cat}</button>`;
                    selectOptions += `<option value="${cat}">${cat}</option>`;
                });

                container.innerHTML = pillsHtml;
                if (invFilter) invFilter.innerHTML = selectOptions;
            }
        } catch (e) {
            console.error('Failed to load categories', e);
        }
    },

    async loadCatalogProducts() {
        try {
            let url = `/products?page=${this.state.catalogPage}&size=12`;
            if (this.state.catalogQuery) url += `&query=${encodeURIComponent(this.state.catalogQuery)}`;
            if (this.state.catalogCategory) url += `&category=${encodeURIComponent(this.state.catalogCategory)}`;

            const res = await this.apiFetch(url, 'GET', null, false);
            const grid = document.getElementById('catalog-products-grid');

            if (res.success && res.data && res.data.content) {
                const products = res.data.content;
                if (products.length === 0) {
                    grid.innerHTML = `
                        <div class="col-span-full py-12 text-center text-slate-400">
                            <i data-lucide="package-search" class="w-12 h-12 mx-auto mb-2 text-slate-300"></i>
                            <p class="text-base font-semibold">No products found</p>
                            <p class="text-xs text-slate-500">Try adjusting your search or category filters.</p>
                        </div>
                    `;
                    lucide.createIcons();
                    return;
                }

                grid.innerHTML = products.map(p => this.renderCatalogCard(p)).join('');
                this.renderPagination('catalog-pagination', res.data, (page) => {
                    this.state.catalogPage = page;
                    this.loadCatalogProducts();
                });
                lucide.createIcons();
            }
        } catch (e) {
            this.toast('Error loading catalog products', 'error');
        }
    },

    renderCatalogCard(p) {
        let badgeClass = 'badge-available';
        let badgeText = 'IN STOCK';
        if (p.stockStatus === 'OUT_OF_STOCK' || p.availableQuantity <= 0) {
            badgeClass = 'badge-out-of-stock';
            badgeText = 'OUT OF STOCK';
        } else if (p.stockStatus === 'LOW_STOCK' || p.availableQuantity <= p.lowStockLimit) {
            badgeClass = 'badge-low-stock';
            badgeText = 'LOW STOCK (' + p.availableQuantity + ' LEFT)';
        } else {
            badgeText = `${p.availableQuantity} IN STOCK`;
        }

        const imgTag = p.imageUrl
            ? `<img src="${p.imageUrl}" alt="${p.name}" class="w-full h-48 object-cover group-hover:scale-105 transition duration-300">`
            : `<div class="w-full h-48 bg-slate-100 flex items-center justify-center text-slate-300"><i data-lucide="image" class="w-12 h-12"></i></div>`;

        let restockHtml = '';
        if (p.outOfStock && p.expectedRestockDate) {
            restockHtml = `<div class="text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200 mt-2">
                Expected restock: <strong>${p.expectedRestockDate}</strong>
            </div>`;
        }

        return `
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition">
                <div class="relative overflow-hidden">
                    ${imgTag}
                    <span class="absolute top-2.5 right-2.5 text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${badgeClass}">
                        ${badgeText}
                    </span>
                    ${p.category ? `<span class="absolute bottom-2.5 left-2.5 text-[10px] font-semibold bg-slate-900/70 text-white px-2 py-0.5 rounded backdrop-blur-sm">${p.category}</span>` : ''}
                </div>
                <div class="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                        <h3 class="font-bold text-slate-800 text-base leading-snug group-hover:text-teal-700 transition">${p.name}</h3>
                        <p class="text-xs text-slate-500 mt-1 line-clamp-2">${p.description || 'Quality hardware item'}</p>
                        ${restockHtml}
                    </div>
                    <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <div>
                            <span class="text-xs text-slate-400 block font-medium">Selling Price</span>
                            <span class="text-lg font-black text-slate-900">₹${Number(p.price).toFixed(2)}</span>
                        </div>
                        ${this.isAdmin() ? `
                            <button onclick="app.openStockModal(${p.id}, '${p.name.replace(/'/g, "\\'")}', ${p.availableQuantity})" class="px-2.5 py-1.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 transition" title="Adjust Stock">
                                Manage Stock
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    },

    filterCatalogCategory(cat) {
        this.state.catalogCategory = cat;
        this.state.catalogPage = 0;
        this.loadCatalogCategories();
        this.loadCatalogProducts();
    },

    handleCatalogSearch(e) {
        clearTimeout(this.searchDebounce);
        this.searchDebounce = setTimeout(() => {
            this.state.catalogQuery = e.target.value.trim();
            this.state.catalogPage = 0;
            this.loadCatalogProducts();
        }, 300);
    },

    // ---------------- ADMIN DASHBOARD ----------------
    async refreshDashboard() {
        if (!this.isAdmin()) return;
        try {
            const res = await this.apiFetch('/admin/dashboard', 'GET');
            if (res.success && res.data) {
                const d = res.data;
                document.getElementById('dash-total-products').innerText = d.totalProducts;
                document.getElementById('dash-total-stock').innerText = d.totalStock;
                document.getElementById('dash-low-stock-count').innerText = d.lowStockCount;
                document.getElementById('dash-out-of-stock-count').innerText = d.outOfStockCount;

                document.getElementById('dash-today-sales-amount').innerText = '₹' + Number(d.todaySalesAmount || 0).toLocaleString('en-IN');
                document.getElementById('dash-today-sales-count').innerText = d.todaySalesCount;

                document.getElementById('dash-total-paid-amount').innerText = '₹' + Number(d.totalPaidAmount || 0).toLocaleString('en-IN');
                document.getElementById('dash-pending-payments-count').innerText = d.pendingPaymentsCount;

                // Pending badge on nav
                const pendingBadge = document.getElementById('pending-sales-count-badge');
                if (d.pendingSalesCount > 0) {
                    pendingBadge.innerText = d.pendingSalesCount;
                    pendingBadge.classList.remove('hidden');
                } else {
                    pendingBadge.classList.add('hidden');
                }

                // Render low stock list
                const lowList = document.getElementById('dash-low-stock-list');
                if (d.lowStockProducts && d.lowStockProducts.length > 0) {
                    lowList.innerHTML = d.lowStockProducts.map(p => `
                        <div class="flex items-center justify-between p-3 rounded-lg bg-amber-50/60 border border-amber-200">
                            <div>
                                <div class="font-bold text-xs text-slate-800">${p.name}</div>
                                <div class="text-[11px] text-amber-800 font-medium">Stock: <strong>${p.availableQuantity}</strong> (Threshold: ${p.lowStockLimit})</div>
                            </div>
                            <button onclick="app.openStockModal(${p.id}, '${p.name.replace(/'/g, "\\'")}', ${p.availableQuantity})" class="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold shadow-sm transition">
                                Restock +
                            </button>
                        </div>
                    `).join('');
                } else {
                    lowList.innerHTML = `<div class="text-xs text-slate-400 py-6 text-center">All inventory stock levels are healthy!</div>`;
                }

                // Render recent sales
                const recentList = document.getElementById('dash-recent-sales-list');
                if (d.recentSales && d.recentSales.length > 0) {
                    recentList.innerHTML = d.recentSales.map(s => `
                        <div class="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                            <div>
                                <div class="font-bold text-slate-800">${s.billNumber} • ${s.customerName}</div>
                                <div class="text-slate-500 text-[11px]">${s.saleDate} • ${s.items.length} items</div>
                            </div>
                            <div class="text-right">
                                <div class="font-black text-slate-900">₹${Number(s.totalAmount).toFixed(2)}</div>
                                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded ${s.saleStatus === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
                                    ${s.saleStatus}
                                </span>
                            </div>
                        </div>
                    `).join('');
                } else {
                    recentList.innerHTML = `<div class="text-xs text-slate-400 py-6 text-center">No sales recorded yet.</div>`;
                }
            }
        } catch (e) {
            console.error('Error refreshing dashboard', e);
        }
    },

    async checkLowStockBanner() {
        if (!this.isAdmin()) return;
        try {
            const res = await this.apiFetch('/admin/products/low-stock', 'GET');
            const banner = document.getElementById('top-alert-banner');
            const alertText = document.getElementById('top-alert-text');

            if (res.success && res.data && res.data.length > 0) {
                alertText.innerText = `Alert: ${res.data.length} product(s) are at or below their low-stock alert threshold!`;
                banner.classList.remove('hidden');
            } else {
                banner.classList.add('hidden');
            }
        } catch (e) {
            // Ignore
        }
    },

    // ---------------- ADMIN INVENTORY ----------------
    async loadInventoryProducts() {
        if (!this.isAdmin()) return;
        try {
            let url = `/admin/products?page=${this.state.inventoryPage}&size=15`;
            if (this.state.inventoryQuery) url += `&query=${encodeURIComponent(this.state.inventoryQuery)}`;
            if (this.state.inventoryCategory) url += `&category=${encodeURIComponent(this.state.inventoryCategory)}`;

            const res = await this.apiFetch(url, 'GET');
            const tbody = document.getElementById('inventory-table-body');

            if (res.success && res.data && res.data.content) {
                const products = res.data.content;
                if (products.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-slate-400">No inventory products found</td></tr>`;
                    return;
                }

                tbody.innerHTML = products.map(p => {
                    let stockClass = 'text-emerald-700 bg-emerald-50 border-emerald-200';
                    if (p.availableQuantity <= 0) {
                        stockClass = 'text-red-700 bg-red-50 border-red-200';
                    } else if (p.availableQuantity <= p.lowStockLimit) {
                        stockClass = 'text-amber-700 bg-amber-50 border-amber-200';
                    }

                    return `
                        <tr class="hover:bg-slate-50 transition">
                            <td class="p-3.5">
                                <div class="flex items-center space-x-3">
                                    ${p.imageUrl ? `<img src="${p.imageUrl}" class="w-9 h-9 rounded object-cover border border-slate-200">` : `<div class="w-9 h-9 rounded bg-slate-100 flex items-center justify-center text-slate-400"><i data-lucide="package" class="w-4 h-4"></i></div>`}
                                    <div>
                                        <div class="font-bold text-slate-800">${p.name}</div>
                                        <div class="text-[11px] text-slate-400">ID: ${p.id}</div>
                                    </div>
                                </div>
                            </td>
                            <td class="p-3.5"><span class="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 font-medium">${p.category || '-'}</span></td>
                            <td class="p-3.5 text-right font-bold text-slate-900">₹${Number(p.price).toFixed(2)}</td>
                            <td class="p-3.5 text-center">
                                <span class="px-2.5 py-1 rounded-full text-xs font-bold border ${stockClass}">
                                    ${p.availableQuantity}
                                </span>
                            </td>
                            <td class="p-3.5 text-center font-medium">${p.lowStockLimit}</td>
                            <td class="p-3.5 text-center">
                                <span class="px-2 py-0.5 rounded text-[11px] font-semibold ${p.lowStockNotificationEnabled ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-slate-100 text-slate-400'}">
                                    ${p.lowStockNotificationEnabled ? 'ENABLED' : 'DISABLED'}
                                </span>
                            </td>
                            <td class="p-3.5 text-right space-x-1 whitespace-nowrap">
                                <button onclick="app.openStockModal(${p.id}, '${p.name.replace(/'/g, "\\'")}', ${p.availableQuantity})" class="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded text-xs font-semibold border border-teal-200" title="Adjust Stock">
                                    +/- Stock
                                </button>
                                <button onclick="app.openLowStockSettingsModal(${p.id}, '${p.name.replace(/'/g, "\\'")}', ${p.lowStockLimit}, ${p.lowStockNotificationEnabled})" class="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded text-xs font-semibold border border-amber-200" title="Alert Limit">
                                    Alerts
                                </button>
                                <button onclick="app.openEditProductModal(${JSON.stringify(p).replace(/"/g, '&quot;')})" class="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium" title="Edit">
                                    Edit
                                </button>
                                <button onclick="app.deleteProduct(${p.id}, '${p.name.replace(/'/g, "\\'")}')" class="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded text-xs font-medium" title="Delete">
                                    Del
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('');

                this.renderPagination('inventory-pagination', res.data, (page) => {
                    this.state.inventoryPage = page;
                    this.loadInventoryProducts();
                });
                lucide.createIcons();
            }
        } catch (e) {
            this.toast('Error loading inventory', 'error');
        }
    },

    handleInventorySearch(e) {
        clearTimeout(this.invSearchDebounce);
        this.invSearchDebounce = setTimeout(() => {
            this.state.inventoryQuery = e.target.value.trim();
            this.state.inventoryPage = 0;
            this.loadInventoryProducts();
        }, 300);
    },

    filterInventoryCategory() {
        this.state.inventoryCategory = document.getElementById('inventory-category-filter').value;
        this.state.inventoryPage = 0;
        this.loadInventoryProducts();
    },

    openAddProductModal() {
        document.getElementById('product-modal-title').innerText = 'Add New Product';
        document.getElementById('product-form-id').value = '';
        document.getElementById('product-form-name').value = '';
        document.getElementById('product-form-category').value = '';
        document.getElementById('product-form-price').value = '';
        document.getElementById('product-form-quantity').value = '';
        document.getElementById('product-form-quantity').disabled = false;
        document.getElementById('product-form-low-limit').value = '10';
        document.getElementById('product-form-notification-enabled').checked = true;
        document.getElementById('product-form-description').value = '';
        document.getElementById('product-form-image-url').value = '';
        document.getElementById('product-form-image-preview').classList.add('hidden');
        document.getElementById('product-form-file').value = '';

        this.openModal('modal-product-form');
    },

    openEditProductModal(p) {
        document.getElementById('product-modal-title').innerText = 'Edit Product';
        document.getElementById('product-form-id').value = p.id;
        document.getElementById('product-form-name').value = p.name;
        document.getElementById('product-form-category').value = p.category || '';
        document.getElementById('product-form-price').value = p.price;
        document.getElementById('product-form-quantity').value = p.availableQuantity;
        document.getElementById('product-form-low-limit').value = p.lowStockLimit;
        document.getElementById('product-form-notification-enabled').checked = p.lowStockNotificationEnabled;
        document.getElementById('product-form-description').value = p.description || '';
        document.getElementById('product-form-image-url').value = p.imageUrl || '';

        const preview = document.getElementById('product-form-image-preview');
        if (p.imageUrl) {
            preview.querySelector('img').src = p.imageUrl;
            preview.classList.remove('hidden');
        } else {
            preview.classList.add('hidden');
        }

        this.openModal('modal-product-form');
    },

    async handleProductSubmit(event) {
        event.preventDefault();
        const id = document.getElementById('product-form-id').value;
        const fileInput = document.getElementById('product-form-file');
        let imageUrl = document.getElementById('product-form-image-url').value;

        // Handle image upload first if file is chosen (Requirement 28)
        if (fileInput.files.length > 0) {
            const formData = new FormData();
            formData.append('file', fileInput.files[0]);

            try {
                const uploadRes = await fetch(`${API_BASE}/admin/upload/image`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${this.state.token}` },
                    body: formData
                });
                const uploadJson = await uploadRes.json();
                if (uploadJson.success && uploadJson.data) {
                    imageUrl = uploadJson.data.imageUrl;
                } else {
                    this.toast(uploadJson.message || 'Image upload failed', 'error');
                    return;
                }
            } catch (err) {
                this.toast('Image upload failed: ' + err.message, 'error');
                return;
            }
        }

        const payload = {
            name: document.getElementById('product-form-name').value.trim(),
            category: document.getElementById('product-form-category').value.trim(),
            price: parseFloat(document.getElementById('product-form-price').value),
            availableQuantity: parseInt(document.getElementById('product-form-quantity').value, 10),
            lowStockLimit: parseInt(document.getElementById('product-form-low-limit').value, 10),
            lowStockNotificationEnabled: document.getElementById('product-form-notification-enabled').checked,
            description: document.getElementById('product-form-description').value.trim(),
            imageUrl: imageUrl
        };

        try {
            let res;
            if (id) {
                res = await this.apiFetch(`/admin/products/${id}`, 'PUT', payload);
            } else {
                res = await this.apiFetch('/admin/products', 'POST', payload);
            }

            if (res.success) {
                this.toast(res.message || 'Product saved successfully!', 'success');
                this.closeModal('modal-product-form');
                this.loadInventoryProducts();
                this.loadCatalogCategories();
                this.checkLowStockBanner();
            } else {
                this.toast(res.message || 'Failed to save product', 'error');
            }
        } catch (e) {
            this.toast(e.message || 'Error saving product', 'error');
        }
    },

    openStockModal(id, name, currentStock) {
        document.getElementById('stock-modal-product-id').value = id;
        document.getElementById('stock-modal-product-info').innerHTML = `
            Product: <strong>${name}</strong><br>
            Current Stock: <strong>${currentStock}</strong> units
        `;
        document.getElementById('stock-modal-delta').value = '';
        document.getElementById('stock-modal-reason').value = '';
        this.openModal('modal-stock');
    },

    async handleStockSubmit(event) {
        event.preventDefault();
        const id = document.getElementById('stock-modal-product-id').value;
        const delta = parseInt(document.getElementById('stock-modal-delta').value, 10);
        const reason = document.getElementById('stock-modal-reason').value.trim();

        try {
            const res = await this.apiFetch(`/admin/products/${id}/stock`, 'POST', {
                quantityChange: delta,
                reason: reason || 'Manual stock update'
            });

            if (res.success) {
                this.toast(`Stock updated for ${res.data.name}. New Stock: ${res.data.availableQuantity}`, 'success');
                this.closeModal('modal-stock');
                this.loadInventoryProducts();
                this.refreshDashboard();
                this.checkLowStockBanner();
            } else {
                this.toast(res.message || 'Stock update failed', 'error');
            }
        } catch (e) {
            this.toast(e.message || 'Failed to update stock', 'error');
        }
    },

    openLowStockSettingsModal(id, name, limit, enabled) {
        document.getElementById('low-stock-modal-product-id').value = id;
        document.getElementById('low-stock-modal-info').innerHTML = `Product: <strong>${name}</strong>`;
        document.getElementById('low-stock-modal-limit').value = limit;
        document.getElementById('low-stock-modal-enabled').checked = enabled;
        this.openModal('modal-low-stock-settings');
    },

    async handleLowStockSettingsSubmit(event) {
        event.preventDefault();
        const id = document.getElementById('low-stock-modal-product-id').value;
        const limit = parseInt(document.getElementById('low-stock-modal-limit').value, 10);
        const enabled = document.getElementById('low-stock-modal-enabled').checked;

        try {
            const res = await this.apiFetch(`/admin/products/${id}/low-stock-settings`, 'PUT', {
                lowStockLimit: limit,
                lowStockNotificationEnabled: enabled
            });

            if (res.success) {
                this.toast('Low-stock alert settings updated', 'success');
                this.closeModal('modal-low-stock-settings');
                this.loadInventoryProducts();
                this.checkLowStockBanner();
            } else {
                this.toast(res.message || 'Failed to update alert settings', 'error');
            }
        } catch (e) {
            this.toast(e.message || 'Error updating settings', 'error');
        }
    },

    async deleteProduct(id, name) {
        if (!confirm(`Are you sure you want to delete product "${name}"?`)) return;

        try {
            const res = await this.apiFetch(`/admin/products/${id}`, 'DELETE');
            if (res.success) {
                this.toast('Product deleted', 'success');
                this.loadInventoryProducts();
                this.refreshDashboard();
            } else {
                this.toast(res.message || 'Failed to delete product', 'error');
            }
        } catch (e) {
            this.toast(e.message || 'Error deleting product', 'error');
        }
    },

    // ---------------- ADMIN SALES & BILLING ----------------
    switchSalesTab(tab) {
        this.state.salesTab = tab;
        this.state.salesPage = 0;

        const tabPending = document.getElementById('tab-sales-pending');
        const tabAll = document.getElementById('tab-sales-all');

        if (tab === 'pending') {
            tabPending.className = 'pb-3 border-b-2 border-teal-600 text-teal-600 font-bold flex items-center space-x-2';
            tabAll.className = 'pb-3 border-b-2 border-transparent text-slate-500 hover:text-slate-700';
        } else {
            tabAll.className = 'pb-3 border-b-2 border-teal-600 text-teal-600 font-bold';
            tabPending.className = 'pb-3 border-b-2 border-transparent text-slate-500 hover:text-slate-700 flex items-center space-x-2';
        }

        this.loadSales();
    },

    async loadSales() {
        if (!this.isAdmin()) return;
        try {
            let url = (this.state.salesTab === 'pending')
                ? `/admin/sales/pending?page=${this.state.salesPage}&size=15`
                : `/admin/sales?page=${this.state.salesPage}&size=15`;

            const res = await this.apiFetch(url, 'GET');
            const tbody = document.getElementById('sales-table-body');

            if (res.success && res.data && res.data.content) {
                const sales = res.data.content;

                // Update pending count badge
                if (this.state.salesTab === 'pending') {
                    document.getElementById('tab-pending-badge').innerText = res.data.totalElements;
                }

                if (sales.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-slate-400">No sales found in this section</td></tr>`;
                    return;
                }

                tbody.innerHTML = sales.map(s => {
                    const isPending = s.saleStatus === 'PENDING';
                    const isPaymentPending = s.paymentStatus === 'PENDING';

                    let itemsSummary = s.items.map(it => `${it.productName} (${it.quantity})`).join(', ');
                    if (itemsSummary.length > 35) itemsSummary = itemsSummary.substring(0, 32) + '...';

                    return `
                        <tr class="hover:bg-slate-50 transition">
                            <td class="p-3.5 font-mono font-bold text-slate-800 text-xs">${s.billNumber}</td>
                            <td class="p-3.5 text-xs text-slate-500">${s.saleDate}</td>
                            <td class="p-3.5">
                                <div class="font-bold text-slate-800 text-xs">${s.customerName}</div>
                                <div class="text-[11px] text-slate-400">${s.customerPhone}</div>
                            </td>
                            <td class="p-3.5 text-xs text-slate-600" title="${s.items.map(i => i.productName + ' x' + i.quantity).join(', ')}">
                                ${itemsSummary}
                            </td>
                            <td class="p-3.5 text-right font-black text-slate-900">₹${Number(s.totalAmount).toFixed(2)}</td>
                            <td class="p-3.5 text-center">
                                <span class="px-2 py-0.5 rounded text-[11px] font-bold ${isPending ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}">
                                    ${s.saleStatus}
                                </span>
                            </td>
                            <td class="p-3.5 text-center">
                                <span class="px-2 py-0.5 rounded text-[11px] font-bold ${isPaymentPending ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}">
                                    ${s.paymentStatus}
                                </span>
                            </td>
                            <td class="p-3.5 text-right space-x-1 whitespace-nowrap">
                                ${isPending ? `
                                    <button onclick="app.openSellModal(${JSON.stringify(s).replace(/"/g, '&quot;')})" class="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded text-xs font-bold shadow-sm transition">
                                        SELL
                                    </button>
                                ` : ''}

                                ${isPaymentPending ? `
                                    <button onclick="app.openPaymentModal(${JSON.stringify(s).replace(/"/g, '&quot;')})" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-sm transition">
                                        Confirm Pay
                                    </button>
                                ` : ''}

                                <button onclick="app.openBillModal(${s.id})" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium border border-slate-300">
                                    Bill
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('');

                this.renderPagination('sales-pagination', res.data, (page) => {
                    this.state.salesPage = page;
                    this.loadSales();
                });
            }
        } catch (e) {
            this.toast('Error loading sales', 'error');
        }
    },

    // ---------------- CREATE PENDING SALE MODAL ----------------
    async openCreateSaleModal() {
        if (!this.isAdmin()) return;

        // Fetch products and customers for selection dropdowns
        try {
            const [prodRes, custRes] = await Promise.all([
                this.apiFetch('/admin/products?size=100', 'GET'),
                this.apiFetch('/admin/customers?size=100', 'GET')
            ]);

            if (prodRes.success && prodRes.data) {
                this.state.availableProductsCache = prodRes.data.content;
            }
            if (custRes.success && custRes.data) {
                this.state.customersCache = custRes.data.content;
            }

            const custSelect = document.getElementById('sale-customer-select');
            custSelect.innerHTML = '<option value="">-- Or enter new customer below --</option>' +
                this.state.customersCache.map(c => `<option value="${c.id}">${c.name} (${c.phoneNumber})</option>`).join('');

            // Reset fields
            document.getElementById('sale-customer-name').value = '';
            document.getElementById('sale-customer-phone').value = '';
            document.getElementById('sale-customer-address').value = '';
            document.getElementById('sale-notes').value = '';

            // Add first product row
            document.getElementById('sale-items-container').innerHTML = '';
            this.addSaleItemRow();
            this.calculateSaleTotal();

            this.openModal('modal-create-sale');
        } catch (e) {
            this.toast('Failed to load products for sale form', 'error');
        }
    },

    handleCustomerSelectChange() {
        const select = document.getElementById('sale-customer-select');
        const custId = select.value;
        if (custId) {
            const cust = this.state.customersCache.find(c => c.id == custId);
            if (cust) {
                document.getElementById('sale-customer-name').value = cust.name;
                document.getElementById('sale-customer-phone').value = cust.phoneNumber;
                document.getElementById('sale-customer-address').value = cust.address;
            }
        }
    },

    addSaleItemRow() {
        const container = document.getElementById('sale-items-container');
        const rowIndex = container.children.length;

        const options = this.state.availableProductsCache.map(p =>
            `<option value="${p.id}" data-price="${p.price}" data-stock="${p.availableQuantity}">
                ${p.name} - ₹${p.price} (${p.availableQuantity} in stock)
            </option>`
        ).join('');

        const row = document.createElement('div');
        row.className = 'sale-item-row flex items-center space-x-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200';
        row.innerHTML = `
            <div class="flex-1">
                <select class="item-product-id w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white focus:ring-2 focus:ring-teal-500" onchange="app.handleProductRowChange(this)">
                    <option value="">-- Select Product --</option>
                    ${options}
                </select>
            </div>
            <div class="w-20">
                <input type="number" min="1" value="1" class="item-quantity w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-center font-bold" oninput="app.calculateSaleTotal()">
            </div>
            <div class="w-24 text-right">
                <span class="item-subtotal text-xs font-black text-slate-800">₹0.00</span>
            </div>
            <button type="button" onclick="this.closest('.sale-item-row').remove(); app.calculateSaleTotal();" class="p-1 text-slate-400 hover:text-red-500 transition">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
        `;
        container.appendChild(row);
        lucide.createIcons();
    },

    handleProductRowChange(selectEl) {
        this.calculateSaleTotal();
    },

    calculateSaleTotal() {
        let grandTotal = 0;
        document.querySelectorAll('.sale-item-row').forEach(row => {
            const select = row.querySelector('.item-product-id');
            const qtyInput = row.querySelector('.item-quantity');
            const subtotalEl = row.querySelector('.item-subtotal');

            const selectedOption = select.options[select.selectedIndex];
            if (selectedOption && selectedOption.value) {
                const price = parseFloat(selectedOption.getAttribute('data-price') || 0);
                const qty = parseInt(qtyInput.value || 1, 10);
                const sub = price * qty;
                subtotalEl.innerText = '₹' + sub.toFixed(2);
                grandTotal += sub;
            } else {
                subtotalEl.innerText = '₹0.00';
            }
        });

        document.getElementById('sale-calculated-total').innerText = '₹' + grandTotal.toFixed(2);
    },

    async handleCreateSale(event) {
        event.preventDefault();

        const custSelect = document.getElementById('sale-customer-select').value;
        const name = document.getElementById('sale-customer-name').value.trim();
        const phone = document.getElementById('sale-customer-phone').value.trim();
        const address = document.getElementById('sale-customer-address').value.trim();
        const method = document.getElementById('sale-payment-method').value;
        const notes = document.getElementById('sale-notes').value.trim();

        const items = [];
        document.querySelectorAll('.sale-item-row').forEach(row => {
            const prodId = row.querySelector('.item-product-id').value;
            const qty = parseInt(row.querySelector('.item-quantity').value, 10);
            if (prodId && qty > 0) {
                items.push({ productId: parseInt(prodId, 10), quantity: qty });
            }
        });

        if (items.length === 0) {
            this.toast('Please add at least one product to the sale', 'warning');
            return;
        }

        const payload = {
            customerId: custSelect ? parseInt(custSelect, 10) : null,
            customerName: name,
            customerPhone: phone,
            customerAddress: address,
            paymentMethod: method,
            notes: notes,
            items: items
        };

        try {
            const res = await this.apiFetch('/admin/sales', 'POST', payload);
            if (res.success && res.data) {
                this.toast('Pending Sale created! Stock remains untouched until you click SELL.', 'success');
                this.closeModal('modal-create-sale');
                this.switchSalesTab('pending');
                this.loadSales();
                this.refreshDashboard();
            } else {
                this.toast(res.message || 'Failed to create sale', 'error');
            }
        } catch (e) {
            this.toast(e.message || 'Error creating sale', 'error');
        }
    },

    // ---------------- SELL CONFIRMATION (Requirement 26) ----------------
    openSellModal(sale) {
        this.state.activeSaleForAction = sale;
        const summary = document.getElementById('sell-modal-summary');

        const itemsList = sale.items.map(i => `${i.productName} (Qty: ${i.quantity})`).join('<br>');

        summary.innerHTML = `
            <strong>Bill: ${sale.billNumber}</strong><br>
            Customer: <strong>${sale.customerName}</strong> (${sale.customerPhone})<br>
            Total Amount: <strong>₹${Number(sale.totalAmount).toFixed(2)}</strong><br>
            Items:<br>${itemsList}
        `;

        this.openModal('modal-sell-confirm');
    },

    async executeSell() {
        if (!this.state.activeSaleForAction) return;
        const saleId = this.state.activeSaleForAction.id;
        const btn = document.getElementById('btn-execute-sell');
        btn.disabled = true;
        btn.innerText = 'Processing...';

        try {
            const res = await this.apiFetch(`/admin/sales/${saleId}/sell`, 'POST');
            if (res.success) {
                this.toast('Sale Confirmed! Stock Updated & Customer Purchase Notification Dispatched.', 'success');
                this.closeModal('modal-sell-confirm');
                this.loadSales();
                this.refreshDashboard();
                this.checkLowStockBanner();
            } else {
                this.toast(res.message || 'Sale confirmation failed', 'error');
            }
        } catch (e) {
            this.toast(e.message || 'Failed to confirm sale', 'error');
        } finally {
            btn.disabled = false;
            btn.innerText = 'CONFIRM SELL';
        }
    },

    // ---------------- PAYMENT CONFIRMATION (Requirement 27) ----------------
    openPaymentModal(sale) {
        this.state.activeSaleForAction = sale;
        const info = document.getElementById('payment-modal-sale-info');
        info.innerHTML = `
            Bill No: <strong>${sale.billNumber}</strong><br>
            Customer: <strong>${sale.customerName}</strong><br>
            Amount to Pay: <strong>₹${Number(sale.totalAmount).toFixed(2)}</strong><br>
            Current Payment Status: <strong class="text-rose-600">${sale.paymentStatus}</strong>
        `;
        document.getElementById('payment-confirm-method').value = sale.paymentMethod || 'UPI';
        document.getElementById('payment-confirm-ref').value = '';

        this.openModal('modal-payment-confirm');
    },

    async executeConfirmPayment() {
        if (!this.state.activeSaleForAction) return;
        const saleId = this.state.activeSaleForAction.id;
        const method = document.getElementById('payment-confirm-method').value;
        const ref = document.getElementById('payment-confirm-ref').value.trim();

        const btn = document.getElementById('btn-execute-payment');
        btn.disabled = true;
        btn.innerText = 'Confirming...';

        try {
            const res = await this.apiFetch(`/admin/sales/${saleId}/confirm-payment`, 'POST', {
                paymentMethod: method,
                transactionReference: ref
            });

            if (res.success) {
                this.toast('Payment Status: SUCCESS! Customer Payment Confirmation Dispatched.', 'success');
                this.closeModal('modal-payment-confirm');
                this.loadSales();
                this.refreshDashboard();
            } else {
                this.toast(res.message || 'Payment confirmation failed', 'error');
            }
        } catch (e) {
            this.toast(e.message || 'Failed to confirm payment', 'error');
        } finally {
            btn.disabled = false;
            btn.innerText = 'CONFIRM PAYMENT';
        }
    },

    // ---------------- BILL VIEW (Requirement 14) ----------------
    async openBillModal(saleId) {
        try {
            const res = await this.apiFetch(`/admin/sales/${saleId}/bill`, 'GET');
            if (res.success && res.data) {
                const b = res.data;
                const billArea = document.getElementById('printable-bill-area');

                const itemsRows = b.items.map(it => `
                    <tr class="border-b border-slate-100">
                        <td class="py-2 text-slate-800 font-medium">${it.productName}</td>
                        <td class="py-2 text-center text-slate-600">${it.quantity}</td>
                        <td class="py-2 text-right text-slate-600">₹${Number(it.unitPrice).toFixed(2)}</td>
                        <td class="py-2 text-right font-bold text-slate-900">₹${Number(it.subtotal).toFixed(2)}</td>
                    </tr>
                `).join('');

                billArea.innerHTML = `
                    <div class="text-center border-b border-slate-200 pb-4">
                        <h2 class="text-xl font-extrabold text-slate-900 tracking-tight">${b.shopName}</h2>
                        <p class="text-xs text-slate-500 mt-0.5">${b.shopAddress}</p>
                        <p class="text-xs text-slate-500 font-medium">Contact: ${b.shopContact}</p>
                    </div>

                    <div class="grid grid-cols-2 text-xs py-2 border-b border-slate-200 gap-4">
                        <div>
                            <div class="text-slate-400 uppercase font-semibold text-[10px]">Customer Details</div>
                            <div class="font-bold text-slate-800 mt-0.5">${b.customerName}</div>
                            <div class="text-slate-600">${b.customerPhone}</div>
                            <div class="text-slate-600">${b.customerAddress}</div>
                        </div>
                        <div class="text-right">
                            <div class="text-slate-400 uppercase font-semibold text-[10px]">Tax Invoice</div>
                            <div class="font-mono font-bold text-slate-900 mt-0.5">${b.billNumber}</div>
                            <div class="text-slate-600">Date: ${b.saleDate}</div>
                            <div class="text-slate-600">Time: ${b.saleTime || ''}</div>
                        </div>
                    </div>

                    <div class="py-2">
                        <table class="w-full text-xs">
                            <thead>
                                <tr class="border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                                    <th class="py-1.5 text-left">Item Description</th>
                                    <th class="py-1.5 text-center">Qty</th>
                                    <th class="py-1.5 text-right">Price</th>
                                    <th class="py-1.5 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsRows}
                            </tbody>
                        </table>
                    </div>

                    <div class="border-t border-slate-200 pt-3 space-y-1.5">
                        <div class="flex items-center justify-between text-base font-extrabold text-slate-900">
                            <span>TOTAL AMOUNT:</span>
                            <span class="text-teal-700">₹${Number(b.totalAmount).toFixed(2)}</span>
                        </div>
                        <div class="flex items-center justify-between text-xs text-slate-600">
                            <span>Payment Method: <strong>${b.paymentMethod}</strong></span>
                            <span>Status: <strong class="${b.paymentStatus === 'SUCCESS' ? 'text-emerald-700' : 'text-amber-700'}">${b.paymentStatus}</strong></span>
                        </div>
                    </div>

                    <div class="border-t border-dashed border-slate-200 pt-4 text-center text-[11px] text-slate-400">
                        Thank you for shopping with ${b.shopName}!
                    </div>

                    <!-- Pre-formatted Monospace Representation per Req 14 -->
                    <details class="text-[11px] text-slate-400 no-print mt-4">
                        <summary class="cursor-pointer hover:text-slate-600 font-semibold">View Plain Monospace Receipt</summary>
                        <pre class="bg-slate-900 text-teal-300 p-4 rounded-lg font-mono text-[11px] overflow-x-auto mt-2">${b.printableReceiptText}</pre>
                    </details>
                `;

                // Set download link
                const pdfBtn = document.getElementById('bill-pdf-download-btn');
                pdfBtn.href = `${API_BASE}/admin/sales/${saleId}/bill/pdf`;

                this.openModal('modal-bill');
                lucide.createIcons();
            }
        } catch (e) {
            this.toast('Failed to load bill receipt', 'error');
        }
    },

    // ---------------- ADMIN CUSTOMERS ----------------
    async loadCustomers() {
        if (!this.isAdmin()) return;
        try {
            let url = `/admin/customers?page=${this.state.customersPage}&size=15`;
            if (this.state.customerQuery) url += `&query=${encodeURIComponent(this.state.customerQuery)}`;

            const res = await this.apiFetch(url, 'GET');
            const tbody = document.getElementById('customers-table-body');

            if (res.success && res.data && res.data.content) {
                const customers = res.data.content;
                if (customers.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-slate-400">No customer records found</td></tr>`;
                    return;
                }

                tbody.innerHTML = customers.map(c => `
                    <tr class="hover:bg-slate-50 transition">
                        <td class="p-3.5 font-bold text-slate-800 text-xs">${c.name}</td>
                        <td class="p-3.5 text-xs text-slate-600">${c.phoneNumber}</td>
                        <td class="p-3.5 text-xs text-slate-600 max-w-xs truncate">${c.address}</td>
                        <td class="p-3.5 text-xs text-slate-400">${c.email || '-'}</td>
                        <td class="p-3.5 text-right whitespace-nowrap">
                            <button onclick="app.viewCustomerHistory(${c.id}, '${c.name.replace(/'/g, "\\'")}')" class="px-2.5 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 rounded text-xs font-medium border border-slate-200">
                                Purchase History
                            </button>
                        </td>
                    </tr>
                `).join('');

                this.renderPagination('customers-pagination', res.data, (page) => {
                    this.state.customersPage = page;
                    this.loadCustomers();
                });
            }
        } catch (e) {
            this.toast('Error loading customers', 'error');
        }
    },

    handleCustomerSearch(e) {
        clearTimeout(this.custSearchDebounce);
        this.custSearchDebounce = setTimeout(() => {
            this.state.customerQuery = e.target.value.trim();
            this.state.customersPage = 0;
            this.loadCustomers();
        }, 300);
    },

    openAddCustomerModal() {
        document.getElementById('customer-modal-name').value = '';
        document.getElementById('customer-modal-phone').value = '';
        document.getElementById('customer-modal-address').value = '';
        document.getElementById('customer-modal-email').value = '';
        this.openModal('modal-customer');
    },

    async handleCustomerSubmit(event) {
        event.preventDefault();
        const payload = {
            name: document.getElementById('customer-modal-name').value.trim(),
            phoneNumber: document.getElementById('customer-modal-phone').value.trim(),
            address: document.getElementById('customer-modal-address').value.trim(),
            email: document.getElementById('customer-modal-email').value.trim() || null
        };

        try {
            const res = await this.apiFetch('/admin/customers', 'POST', payload);
            if (res.success) {
                this.toast('Customer created successfully', 'success');
                this.closeModal('modal-customer');
                this.loadCustomers();
            } else {
                this.toast(res.message || 'Failed to create customer', 'error');
            }
        } catch (e) {
            this.toast(e.message || 'Error saving customer', 'error');
        }
    },

    async viewCustomerHistory(customerId, customerName) {
        try {
            const res = await this.apiFetch(`/admin/customers/${customerId}/sales`, 'GET');
            document.getElementById('customer-history-title').innerText = `Purchase History: ${customerName}`;
            const container = document.getElementById('customer-history-content');

            if (res.success && res.data && res.data.length > 0) {
                container.innerHTML = res.data.map(s => `
                    <div class="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                        <div class="flex items-center justify-between font-bold text-slate-800">
                            <span>Bill ${s.billNumber} • ${s.saleDate}</span>
                            <span class="text-teal-700">₹${Number(s.totalAmount).toFixed(2)}</span>
                        </div>
                        <div class="text-slate-500">
                            ${s.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}
                        </div>
                        <div class="flex items-center space-x-2 pt-1 text-[10px]">
                            <span class="px-1.5 py-0.5 rounded font-bold ${s.saleStatus === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">${s.saleStatus}</span>
                            <span class="px-1.5 py-0.5 rounded font-bold ${s.paymentStatus === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">${s.paymentStatus}</span>
                        </div>
                    </div>
                `).join('');
            } else {
                container.innerHTML = `<div class="p-6 text-center text-xs text-slate-400">No purchases found for this customer.</div>`;
            }

            this.openModal('modal-customer-history');
        } catch (e) {
            this.toast('Failed to load customer history', 'error');
        }
    },

    // ---------------- NOTIFICATIONS LOGS ----------------
    async loadNotificationLogs() {
        if (!this.isAdmin()) return;
        try {
            const res = await this.apiFetch('/admin/notifications/logs', 'GET');
            const container = document.getElementById('notification-logs-list');

            if (res.success && res.data && res.data.length > 0) {
                container.innerHTML = res.data.map(l => {
                    let channelBadge = l.channel === 'WHATSAPP'
                        ? '<span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">WHATSAPP</span>'
                        : '<span class="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded text-[10px]">SMS</span>';

                    let typeBadge = l.notificationType === 'LOW_STOCK_ALERT'
                        ? '<span class="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded text-[10px]">LOW STOCK ALERT</span>'
                        : l.notificationType === 'PURCHASE_CONFIRMATION'
                            ? '<span class="px-2 py-0.5 bg-teal-100 text-teal-800 font-bold rounded text-[10px]">PURCHASE CONFIRMATION</span>'
                            : '<span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">PAYMENT SUCCESS</span>';

                    return `
                        <div class="p-4 hover:bg-slate-50 transition space-y-2">
                            <div class="flex items-center justify-between text-xs">
                                <div class="flex items-center space-x-2">
                                    ${channelBadge}
                                    ${typeBadge}
                                    <span class="font-bold text-slate-800">To: ${l.recipient}</span>
                                </div>
                                <span class="text-slate-400 text-[11px]">${l.createdAt ? new Date(l.createdAt).toLocaleString() : ''}</span>
                            </div>
                            <pre class="bg-slate-900 text-teal-200 p-3 rounded-lg text-xs font-mono whitespace-pre-wrap leading-relaxed">${l.message}</pre>
                        </div>
                    `;
                }).join('');
            } else {
                container.innerHTML = `<div class="p-8 text-center text-xs text-slate-400">No notifications dispatched yet. Execute a sale or payment to see live dispatch logs!</div>`;
            }
        } catch (e) {
            this.toast('Error loading notification logs', 'error');
        }
    },

    // ---------------- UTILS & HELPERS ----------------
    openModal(modalId) {
        const m = document.getElementById(modalId);
        if (m) {
            m.classList.remove('hidden');
            lucide.createIcons();
        }
    },

    closeModal(modalId) {
        const m = document.getElementById(modalId);
        if (m) m.classList.add('hidden');
    },

    renderPagination(elementId, pageData, onPageClick) {
        const el = document.getElementById(elementId);
        if (!el || !pageData) return;

        if (pageData.totalPages <= 1) {
            el.innerHTML = '';
            return;
        }

        const current = pageData.number;
        const total = pageData.totalPages;

        let html = `<div>Showing page <strong>${current + 1}</strong> of <strong>${total}</strong> (${pageData.totalElements} items)</div><div class="flex space-x-1">`;
        if (current > 0) {
            html += `<button onclick="(${onPageClick})(${current - 1})" class="px-2.5 py-1 border rounded text-xs bg-white hover:bg-slate-50 font-semibold">Prev</button>`;
        }
        if (current < total - 1) {
            html += `<button onclick="(${onPageClick})(${current + 1})" class="px-2.5 py-1 border rounded text-xs bg-white hover:bg-slate-50 font-semibold">Next</button>`;
        }
        html += `</div>`;
        el.innerHTML = html;
    },

    toast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const colors = {
            success: 'bg-emerald-600 text-white',
            error: 'bg-rose-600 text-white',
            warning: 'bg-amber-600 text-white',
            info: 'bg-slate-800 text-white'
        };

        const t = document.createElement('div');
        t.className = `${colors[type] || colors.info} px-4 py-2.5 rounded-lg text-xs font-semibold shadow-lg flex items-center space-x-2 transition-all transform duration-300 pointer-events-auto`;
        t.innerHTML = `<span>${message}</span>`;
        container.appendChild(t);

        setTimeout(() => {
            t.style.opacity = '0';
            t.style.transform = 'translateY(10px)';
            setTimeout(() => t.remove(), 300);
        }, 4000);
    },

    async apiFetch(endpoint, method = 'GET', body = null, requireAuth = true) {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (this.state.token) {
            headers['Authorization'] = `Bearer ${this.state.token}`;
        } else if (requireAuth) {
            this.openLoginModal();
            throw new Error('Authentication required');
        }

        const config = { method, headers };
        if (body) {
            config.body = JSON.stringify(body);
        }

        const response = await fetch(`${API_BASE}${endpoint}`, config);

        if (response.status === 401) {
            this.logout();
            this.openLoginModal();
            throw new Error('Session expired. Please sign in again.');
        }

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || `Request failed with status ${response.status}`);
        }

        return data;
    }
};

// Initialize application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
