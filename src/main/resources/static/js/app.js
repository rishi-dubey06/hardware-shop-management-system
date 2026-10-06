/**
 * XYZ HARDWARE SHOP MANAGEMENT SYSTEM - CLIENT APPLICATION
 * Enterprise Inventory, Sales, Billing, CRM & Notification Suite
 */

const API_BASE = '/api';

const app = {
    state: {
        token: localStorage.getItem('token') || null,
        user: JSON.parse(localStorage.getItem('user') || 'null'),
        currentView: 'catalog',
        catalogLayout: 'grid', // 'grid' | 'list'
        catalogPage: 0,
        catalogQuery: '',
        catalogCategory: '',
        inventoryPage: 0,
        inventoryQuery: '',
        inventoryCategory: '',
        pendingSalesPage: 0,
        allSalesPage: 0,
        customersPage: 0,
        customerQuery: '',
        sidebarCollapsed: false,
        mobileSidebarOpen: false,
        notificationPanelOpen: false,
        availableProductsCache: [],
        customersCache: [],
        activeSaleForAction: null,
        lastConfirmedSaleId: null,
        selectedImageFile: null
    },

    init() {
        this.updateAuthUI();
        this.setupKeyboardShortcuts();
        this.setupDropzone();
        this.loadCatalogCategories();
        this.loadCatalogProducts();

        if (this.isAdmin()) {
            this.switchView('admin-dashboard');
            this.refreshDashboard();
            this.checkLowStockBanner();
            this.loadAvailableCaches();
        } else {
            this.switchView('catalog');
        }

        // Auto-refresh interval for low-stock and dashboard (every 40s)
        setInterval(() => {
            if (this.isAdmin()) {
                this.checkLowStockBanner();
                if (this.state.currentView === 'admin-dashboard') {
                    this.refreshDashboard();
                }
            }
        }, 40000);

        lucide.createIcons();
    },

    // ---------------- AUTHENTICATION & ACCESS ----------------
    isAdmin() {
        return this.state.user && (this.state.user.role === 'ROLE_ADMIN' || this.state.user.role === 'ADMIN');
    },

    updateAuthUI() {
        const btnSignIn = document.getElementById('btn-top-signin');
        const authInfo = document.getElementById('top-authenticated-info');
        const userAvatar = document.getElementById('top-user-avatar');
        const sidebarInitial = document.getElementById('sidebar-user-initial');
        const sidebarName = document.getElementById('sidebar-user-name');
        const sidebarRole = document.getElementById('sidebar-user-role');

        if (this.state.token && this.state.user) {
            const initial = (this.state.user.fullName || this.state.user.username || 'A').charAt(0).toUpperCase();
            if (btnSignIn) btnSignIn.classList.add('hidden');
            if (authInfo) authInfo.classList.remove('hidden');
            if (userAvatar) userAvatar.innerText = initial;
            if (sidebarInitial) sidebarInitial.innerText = initial;
            if (sidebarName) sidebarName.innerText = this.state.user.fullName || this.state.user.username;
            if (sidebarRole) sidebarRole.innerText = this.isAdmin() ? 'Store Administrator' : 'Verified Customer';
        } else {
            if (btnSignIn) btnSignIn.classList.remove('hidden');
            if (authInfo) authInfo.classList.add('hidden');
            if (sidebarInitial) sidebarInitial.innerText = 'G';
            if (sidebarName) sidebarName.innerText = 'Guest Visitor';
            if (sidebarRole) sidebarRole.innerText = 'Read Only Access';
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
                this.toast(`Welcome back, ${this.state.user.fullName}!`, 'success');

                if (this.isAdmin()) {
                    this.switchView('admin-dashboard');
                    this.refreshDashboard();
                    this.checkLowStockBanner();
                    this.loadAvailableCaches();
                } else {
                    this.switchView('catalog');
                }
            } else {
                this.toast(res.message || 'Login credentials invalid', 'error');
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
        this.toast('You have successfully signed out.', 'info');
    },

    // ---------------- NAVIGATION & SIDEBAR ----------------
    toggleSidebar() {
        const sidebar = document.getElementById('app-sidebar');
        const icon = document.getElementById('sidebar-toggle-icon');
        if (!sidebar) return;

        this.state.sidebarCollapsed = !this.state.sidebarCollapsed;
        if (this.state.sidebarCollapsed) {
            sidebar.classList.remove('sidebar-expanded');
            sidebar.classList.add('sidebar-collapsed');
            if (icon) icon.setAttribute('data-lucide', 'chevrons-right');
        } else {
            sidebar.classList.remove('sidebar-collapsed');
            sidebar.classList.add('sidebar-expanded');
            if (icon) icon.setAttribute('data-lucide', 'chevrons-left');
        }
        lucide.createIcons();
    },

    toggleMobileSidebar() {
        const sidebar = document.getElementById('app-sidebar');
        if (!sidebar) return;
        this.state.mobileSidebarOpen = !this.state.mobileSidebarOpen;
        if (this.state.mobileSidebarOpen) {
            sidebar.classList.remove('-translate-x-full');
            sidebar.classList.add('translate-x-0', 'fixed', 'inset-y-0', 'left-0', 'z-50');
        } else {
            sidebar.classList.remove('translate-x-0', 'fixed', 'inset-y-0', 'left-0', 'z-50');
        }
    },

    toggleNotificationPanel() {
        const panel = document.getElementById('notification-slide-panel');
        if (!panel) return;
        this.state.notificationPanelOpen = !this.state.notificationPanelOpen;
        if (this.state.notificationPanelOpen) {
            panel.classList.remove('translate-x-full');
            this.loadSlideNotificationItems();
        } else {
            panel.classList.add('translate-x-full');
        }
    },

    switchView(viewName) {
        if (viewName.startsWith('admin-') && !this.isAdmin()) {
            this.toast('Administrator access required. Please sign in.', 'warning');
            this.openLoginModal();
            return;
        }

        const views = [
            'admin-dashboard',
            'catalog',
            'admin-products',
            'admin-lowstock',
            'admin-create-sale',
            'admin-pending-sales',
            'admin-all-sales',
            'admin-customers',
            'admin-notifications',
            'admin-settings'
        ];

        views.forEach(v => {
            const sec = document.getElementById('view-' + v);
            if (sec) sec.classList.add('hidden');
            const navBtn = document.getElementById('nav-item-' + v);
            if (navBtn) navBtn.classList.remove('active');
        });

        const targetSec = document.getElementById('view-' + viewName);
        if (targetSec) targetSec.classList.remove('hidden');

        const targetNav = document.getElementById('nav-item-' + viewName);
        if (targetNav) targetNav.classList.add('active');

        this.state.currentView = viewName;

        // Update Top Breadcrumb Title
        const breadcrumb = document.getElementById('top-current-view-title');
        if (breadcrumb) {
            const readable = {
                'admin-dashboard': 'Executive Dashboard',
                'catalog': 'Product Catalog',
                'admin-products': 'Inventory Management',
                'admin-lowstock': 'Low Stock Restock Alerts',
                'admin-create-sale': 'Create Retail Sale',
                'admin-pending-sales': 'Pending Orders',
                'admin-all-sales': 'Sales & Invoices History',
                'admin-customers': 'Customer Directory (CRM)',
                'admin-notifications': 'Notification Logs',
                'admin-settings': 'System Settings'
            }[viewName] || viewName;
            breadcrumb.innerText = readable;
        }

        // View specific initializations
        switch (viewName) {
            case 'admin-dashboard':
                this.refreshDashboard();
                break;
            case 'catalog':
                this.loadCatalogProducts();
                break;
            case 'admin-products':
                this.loadInventoryProducts();
                break;
            case 'admin-lowstock':
                this.loadLowStockDedicatedView();
                break;
            case 'admin-create-sale':
                this.prepareCreateSaleView();
                break;
            case 'admin-pending-sales':
                this.loadPendingSales();
                break;
            case 'admin-all-sales':
                this.loadAllSales();
                break;
            case 'admin-customers':
                this.loadCustomers();
                break;
            case 'admin-notifications':
                this.loadNotificationLogs();
                break;
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
        lucide.createIcons();
    },

    // ---------------- KEYBOARD & SEARCH ----------------
    setupKeyboardShortcuts() {
        window.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                const search = document.getElementById('global-search-input');
                if (search) search.focus();
            }
        });
    },

    handleGlobalSearch(e) {
        if (e.key === 'Enter') {
            const query = e.target.value.trim();
            if (this.isAdmin() && this.state.currentView === 'admin-products') {
                this.state.inventoryQuery = query;
                this.loadInventoryProducts();
            } else {
                this.state.catalogQuery = query;
                const catInput = document.getElementById('catalog-search-input');
                if (catInput) catInput.value = query;
                this.switchView('catalog');
            }
        }
    },

    // ---------------- VISUAL STOCK PROGRESS BAR HELPER ----------------
    renderStockProgressBar(available, limit) {
        const qty = Number(available) || 0;
        const lim = Number(limit) || 10;
        const maxThreshold = Math.max(qty, lim * 2.5, 20);
        const pct = qty > 0 ? Math.min(100, Math.max(8, Math.round((qty / maxThreshold) * 100))) : 0;

        let barColor = 'bg-emerald-500';
        let statusText = `${qty} in stock`;
        let textClass = 'text-emerald-700';

        if (qty <= 0) {
            barColor = 'bg-rose-500';
            statusText = 'Out of Stock';
            textClass = 'text-rose-600';
        } else if (qty <= lim) {
            barColor = 'bg-amber-500';
            statusText = `Low: ${qty} / ${lim} limit`;
            textClass = 'text-amber-700';
        }

        return `
            <div class="space-y-1.5 w-full">
                <div class="flex items-center justify-between text-[11px] font-semibold">
                    <span class="${textClass} flex items-center space-x-1">
                        <span class="w-1.5 h-1.5 rounded-full ${barColor}"></span>
                        <span>${statusText}</span>
                    </span>
                    <span class="text-slate-400 font-mono">${qty} / ${Math.round(maxThreshold)}</span>
                </div>
                <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden shadow-inner">
                    <div class="${barColor} h-2 rounded-full transition-all duration-500" style="width: ${pct}%"></div>
                </div>
            </div>
        `;
    },

    // ---------------- PRODUCT CATALOG VIEW ----------------
    setCatalogLayout(layout) {
        this.state.catalogLayout = layout;
        const btnGrid = document.getElementById('btn-catalog-grid');
        const btnList = document.getElementById('btn-catalog-list');
        const container = document.getElementById('catalog-products-container');

        if (layout === 'grid') {
            btnGrid.className = 'p-1.5 rounded-lg bg-white shadow-xs text-slate-900 font-bold transition';
            btnList.className = 'p-1.5 rounded-lg text-slate-500 hover:text-slate-900 transition';
            container.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6';
        } else {
            btnList.className = 'p-1.5 rounded-lg bg-white shadow-xs text-slate-900 font-bold transition';
            btnGrid.className = 'p-1.5 rounded-lg text-slate-500 hover:text-slate-900 transition';
            container.className = 'space-y-4';
        }

        this.loadCatalogProducts();
    },

    async loadCatalogCategories() {
        try {
            const res = await this.apiFetch('/products/categories', 'GET', null, false);
            if (res.success && res.data) {
                const pills = document.getElementById('catalog-category-pills');
                const invFilter = document.getElementById('inventory-category-filter');

                let pillsHtml = `<button onclick="app.filterCatalogCategory('')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition ${this.state.catalogCategory === '' ? 'bg-dark-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'} shrink-0">All Items</button>`;
                let selectOptions = `<option value="">All Categories</option>`;

                res.data.forEach(cat => {
                    const active = this.state.catalogCategory === cat;
                    pillsHtml += `<button onclick="app.filterCatalogCategory('${cat}')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition ${active ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'} shrink-0">${cat}</button>`;
                    selectOptions += `<option value="${cat}">${cat}</option>`;
                });

                if (pills) pills.innerHTML = pillsHtml;
                if (invFilter) invFilter.innerHTML = selectOptions;
            }
        } catch (e) {
            console.error('Failed to load categories', e);
        }
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
        }, 250);
    },

    async loadCatalogProducts() {
        try {
            let url = `/products?page=${this.state.catalogPage}&size=12`;
            if (this.state.catalogQuery) url += `&query=${encodeURIComponent(this.state.catalogQuery)}`;
            if (this.state.catalogCategory) url += `&category=${encodeURIComponent(this.state.catalogCategory)}`;

            const res = await this.apiFetch(url, 'GET', null, false);
            const container = document.getElementById('catalog-products-container');

            if (res.success && res.data && res.data.content) {
                const products = res.data.content;
                if (products.length === 0) {
                    container.innerHTML = `
                        <div class="col-span-full py-16 text-center text-slate-400">
                            <div class="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                                <i data-lucide="package-search" class="w-8 h-8"></i>
                            </div>
                            <h3 class="text-base font-bold text-slate-700">No hardware items found</h3>
                            <p class="text-xs text-slate-400 mt-1">Try relaxing your search terms or category selection.</p>
                        </div>
                    `;
                    lucide.createIcons();
                    return;
                }

                if (this.state.catalogLayout === 'grid') {
                    container.innerHTML = products.map(p => this.renderCatalogCard(p)).join('');
                } else {
                    container.innerHTML = products.map(p => this.renderCatalogListRow(p)).join('');
                }

                this.renderPagination('catalog-pagination', res.data, (page) => {
                    this.state.catalogPage = page;
                    this.loadCatalogProducts();
                });

                lucide.createIcons();
            }
        } catch (e) {
            this.toast('Error fetching catalog products', 'error');
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
            badgeText = `LOW STOCK (${p.availableQuantity})`;
        }

        const imgTag = p.imageUrl
            ? `<img src="${p.imageUrl}" alt="${p.name}" class="w-full h-44 object-cover group-hover:scale-105 transition duration-300">`
            : `<div class="w-full h-44 bg-slate-100 flex items-center justify-center text-slate-300"><i data-lucide="wrench" class="w-10 h-10"></i></div>`;

        return `
            <div class="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col group hover:shadow-md transition">
                <div class="relative overflow-hidden cursor-pointer" onclick="app.openProductDetailsModal(${JSON.stringify(p).replace(/"/g, '&quot;')})">
                    ${imgTag}
                    <span class="absolute top-2.5 right-2.5 text-[10px] font-extrabold px-2 py-0.5 rounded-full ${badgeClass}">
                        ${badgeText}
                    </span>
                    ${p.category ? `<span class="absolute bottom-2.5 left-2.5 text-[10px] font-bold bg-slate-900/80 text-white px-2 py-0.5 rounded backdrop-blur-sm">${p.category}</span>` : ''}
                </div>

                <div class="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div class="cursor-pointer" onclick="app.openProductDetailsModal(${JSON.stringify(p).replace(/"/g, '&quot;')})">
                        <h3 class="font-bold text-slate-900 text-sm leading-snug group-hover:text-amber-600 transition truncate">${p.name}</h3>
                        <p class="text-[11px] text-slate-400 mt-1 line-clamp-2">${p.description || 'Premium quality hardware hardware supply item.'}</p>
                    </div>

                    <!-- Visual Progress Bar -->
                    ${this.renderStockProgressBar(p.availableQuantity, p.lowStockLimit)}

                    <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <div>
                            <span class="text-[10px] text-slate-400 uppercase font-bold block">Price</span>
                            <span class="text-base font-extrabold text-slate-900">₹${Number(p.price).toFixed(2)}</span>
                        </div>
                        <div class="flex items-center space-x-1">
                            <button onclick="app.openProductDetailsModal(${JSON.stringify(p).replace(/"/g, '&quot;')})" class="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition" title="Inspect">
                                Details
                            </button>
                            ${this.isAdmin() ? `
                                <button onclick="app.openStockModal(${p.id}, '${p.name.replace(/'/g, "\\'")}', ${p.availableQuantity})" class="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-bold transition" title="Stock Delta">
                                    + Stock
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderCatalogListRow(p) {
        let badgeClass = 'badge-available';
        let badgeText = 'IN STOCK';
        if (p.stockStatus === 'OUT_OF_STOCK' || p.availableQuantity <= 0) {
            badgeClass = 'badge-out-of-stock';
            badgeText = 'OUT OF STOCK';
        } else if (p.stockStatus === 'LOW_STOCK' || p.availableQuantity <= p.lowStockLimit) {
            badgeClass = 'badge-low-stock';
            badgeText = `LOW STOCK (${p.availableQuantity})`;
        }

        const imgTag = p.imageUrl
            ? `<img src="${p.imageUrl}" alt="${p.name}" class="w-20 h-20 object-cover rounded-xl border border-slate-200">`
            : `<div class="w-20 h-20 bg-slate-100 rounded-xl flex items-center justify-center text-slate-300 border border-slate-200"><i data-lucide="wrench" class="w-6 h-6"></i></div>`;

        return `
            <div class="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 hover:shadow-md transition">
                <div class="flex items-center space-x-4 w-full sm:w-auto">
                    ${imgTag}
                    <div>
                        <div class="flex items-center space-x-2">
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeClass}">${badgeText}</span>
                            ${p.category ? `<span class="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">${p.category}</span>` : ''}
                        </div>
                        <h3 class="font-extrabold text-slate-900 text-sm mt-1 cursor-pointer hover:text-amber-600" onclick="app.openProductDetailsModal(${JSON.stringify(p).replace(/"/g, '&quot;')})">${p.name}</h3>
                        <p class="text-xs text-slate-400 line-clamp-1 max-w-md">${p.description || 'Hardware inventory'}</p>
                    </div>
                </div>

                <div class="w-full sm:w-60">
                    ${this.renderStockProgressBar(p.availableQuantity, p.lowStockLimit)}
                </div>

                <div class="flex items-center justify-between sm:justify-end space-x-4 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                    <div class="text-right">
                        <span class="text-[10px] text-slate-400 block font-bold">Price</span>
                        <span class="text-lg font-black text-slate-900">₹${Number(p.price).toFixed(2)}</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button onclick="app.openProductDetailsModal(${JSON.stringify(p).replace(/"/g, '&quot;')})" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition">
                            Details
                        </button>
                        ${this.isAdmin() ? `
                            <button onclick="app.openStockModal(${p.id}, '${p.name.replace(/'/g, "\\'")}', ${p.availableQuantity})" class="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-xs font-bold transition">
                                Adjust
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    },

    openProductDetailsModal(p) {
        const container = document.getElementById('product-details-content');
        if (!container) return;

        const imgTag = p.imageUrl
            ? `<img src="${p.imageUrl}" alt="${p.name}" class="w-full h-56 object-cover rounded-2xl shadow-sm border border-slate-200">`
            : `<div class="w-full h-44 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300"><i data-lucide="image" class="w-12 h-12"></i></div>`;

        let restockHtml = '';
        if (p.outOfStock && p.expectedRestockDate) {
            restockHtml = `
                <div class="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                    <strong>Expected Restocking Date:</strong> ${p.expectedRestockDate}
                </div>
            `;
        }

        container.innerHTML = `
            ${imgTag}
            <div class="space-y-1">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-amber-600 uppercase tracking-wider">${p.category || 'Hardware Item'}</span>
                    <span class="text-xs font-mono text-slate-400">SKU / ID: #${p.id}</span>
                </div>
                <h2 class="text-xl font-extrabold text-slate-900">${p.name}</h2>
                <div class="text-2xl font-black text-amber-600 mt-1">₹${Number(p.price).toFixed(2)}</div>
            </div>

            <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div class="text-xs font-bold text-slate-700 uppercase tracking-wider">Inventory & Warehouse Metrics</div>
                ${this.renderStockProgressBar(p.availableQuantity, p.lowStockLimit)}
                <div class="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200 text-slate-600">
                    <div>Safety Alert Limit: <strong>${p.lowStockLimit} units</strong></div>
                    <div>Alerts Enabled: <strong>${p.lowStockNotificationEnabled ? 'YES (SMS+WA)' : 'NO'}</strong></div>
                </div>
            </div>

            ${restockHtml}

            <div class="space-y-1">
                <div class="text-xs font-bold text-slate-700 uppercase tracking-wider">Description</div>
                <p class="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                    ${p.description || 'No specific technical specifications entered.'}
                </p>
            </div>

            ${this.isAdmin() ? `
                <div class="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                    <button onclick="app.closeModal('modal-product-details'); app.openStockModal(${p.id}, '${p.name.replace(/'/g, "\\'")}', ${p.availableQuantity})" class="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold transition">
                        Manage Stock
                    </button>
                    <button onclick="app.closeModal('modal-product-details'); app.openEditProductModal(${JSON.stringify(p).replace(/"/g, '&quot;')})" class="btn-primary px-4 py-2 rounded-xl text-xs font-bold">
                        Edit Specifications
                    </button>
                </div>
            ` : ''}
        `;

        this.openModal('modal-product-details');
    },

    // ---------------- EXECUTIVE DASHBOARD ----------------
    async refreshDashboard() {
        if (!this.isAdmin()) return;
        try {
            const res = await this.apiFetch('/admin/dashboard', 'GET');
            if (res.success && res.data) {
                const d = res.data;
                document.getElementById('dash-total-products').innerText = d.totalProducts;
                document.getElementById('dash-low-stock-count').innerText = d.lowStockCount;
                document.getElementById('dash-out-of-stock-count').innerText = d.outOfStockCount;

                document.getElementById('dash-today-sales-amount').innerText = '₹' + Number(d.todaySalesAmount || 0).toLocaleString('en-IN');
                document.getElementById('dash-today-sales-count').innerText = d.todaySalesCount;

                document.getElementById('dash-pending-payments-count').innerText = d.pendingPaymentsCount;

                // Sidebar Badges
                const lowBadge = document.getElementById('sidebar-lowstock-badge');
                if (lowBadge) {
                    if (d.lowStockCount > 0) {
                        lowBadge.innerText = d.lowStockCount;
                        lowBadge.classList.remove('hidden');
                    } else {
                        lowBadge.classList.add('hidden');
                    }
                }

                const pendingBadge = document.getElementById('sidebar-pending-sales-badge');
                if (pendingBadge) {
                    if (d.pendingSalesCount > 0) {
                        pendingBadge.innerText = d.pendingSalesCount;
                        pendingBadge.classList.remove('hidden');
                    } else {
                        pendingBadge.classList.add('hidden');
                    }
                }

                const topBell = document.getElementById('top-bell-badge');
                if (topBell) {
                    if (d.lowStockCount > 0 || d.pendingSalesCount > 0) {
                        topBell.classList.remove('hidden');
                    } else {
                        topBell.classList.add('hidden');
                    }
                }

                // Render Dashboard Low-Stock List
                const lowList = document.getElementById('dash-low-stock-list');
                if (lowList) {
                    if (d.lowStockProducts && d.lowStockProducts.length > 0) {
                        lowList.innerHTML = d.lowStockProducts.map(p => `
                            <div class="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                                <div class="flex items-center justify-between">
                                    <div class="font-bold text-xs text-slate-800 truncate">${p.name}</div>
                                    <button onclick="app.openStockModal(${p.id}, '${p.name.replace(/'/g, "\\'")}', ${p.availableQuantity})" class="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-xs">
                                        Restock +
                                    </button>
                                </div>
                                ${this.renderStockProgressBar(p.availableQuantity, p.lowStockLimit)}
                            </div>
                        `).join('');
                    } else {
                        lowList.innerHTML = `<div class="text-xs text-slate-400 py-8 text-center">All inventory stock levels are optimal!</div>`;
                    }
                }

                // Render Dashboard Recent Sales
                const recentList = document.getElementById('dash-recent-sales-list');
                if (recentList) {
                    if (d.recentSales && d.recentSales.length > 0) {
                        recentList.innerHTML = d.recentSales.map(s => `
                            <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs hover:bg-slate-100 transition">
                                <div class="space-y-0.5">
                                    <div class="font-extrabold text-slate-800 font-mono">${s.billNumber} • ${s.customerName}</div>
                                    <div class="text-slate-400 text-[11px]">${s.saleDate} • ${s.items.length} items</div>
                                </div>
                                <div class="text-right space-y-1">
                                    <div class="font-black text-slate-900">₹${Number(s.totalAmount).toFixed(2)}</div>
                                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${s.saleStatus === 'CONFIRMED' ? 'badge-confirmed' : 'badge-pending'}">
                                        ${s.saleStatus}
                                    </span>
                                </div>
                            </div>
                        `).join('');
                    } else {
                        recentList.innerHTML = `<div class="text-xs text-slate-400 py-8 text-center">No orders recorded today.</div>`;
                    }
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
                if (alertText) alertText.innerText = `Attention: ${res.data.length} product(s) are at or below their low-stock safety threshold!`;
                if (banner) banner.classList.remove('hidden');
            } else {
                if (banner) banner.classList.add('hidden');
            }
        } catch (e) {
            // silent fail
        }
    },

    // ---------------- ALL PRODUCTS / INVENTORY ----------------
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
                    tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-slate-400">No matching products found</td></tr>`;
                    return;
                }

                tbody.innerHTML = products.map(p => {
                    let stockClass = 'badge-available';
                    if (p.availableQuantity <= 0) stockClass = 'badge-out-of-stock';
                    else if (p.availableQuantity <= p.lowStockLimit) stockClass = 'badge-low-stock';

                    return `
                        <tr class="hover:bg-slate-50/80 transition">
                            <td class="p-4">
                                <div class="flex items-center space-x-3">
                                    ${p.imageUrl ? `<img src="${p.imageUrl}" class="w-10 h-10 rounded-xl object-cover border border-slate-200">` : `<div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400"><i data-lucide="package" class="w-5 h-5"></i></div>`}
                                    <div>
                                        <div class="font-extrabold text-slate-800 text-xs">${p.name}</div>
                                        <div class="text-[10px] text-slate-400 font-mono">ID #${p.id}</div>
                                    </div>
                                </div>
                            </td>
                            <td class="p-4"><span class="px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 font-semibold">${p.category || '-'}</span></td>
                            <td class="p-4 text-right font-black text-slate-900">₹${Number(p.price).toFixed(2)}</td>
                            <td class="p-4 text-center">
                                <span class="px-2.5 py-1 rounded-full text-xs font-bold ${stockClass}">
                                    ${p.availableQuantity}
                                </span>
                            </td>
                            <td class="p-4 w-44">
                                ${this.renderStockProgressBar(p.availableQuantity, p.lowStockLimit)}
                            </td>
                            <td class="p-4 text-center font-bold text-slate-600">${p.lowStockLimit}</td>
                            <td class="p-4 text-right space-x-1 whitespace-nowrap">
                                <button onclick="app.openStockModal(${p.id}, '${p.name.replace(/'/g, "\\'")}', ${p.availableQuantity})" class="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-bold transition" title="Adjust Stock">
                                    + Stock
                                </button>
                                <button onclick="app.openEditProductModal(${JSON.stringify(p).replace(/"/g, '&quot;')})" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold" title="Edit">
                                    Edit
                                </button>
                                <button onclick="app.deleteProduct(${p.id}, '${p.name.replace(/'/g, "\\'")}')" class="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold" title="Delete">
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
            this.toast('Error fetching inventory products', 'error');
        }
    },

    handleInventorySearch(e) {
        clearTimeout(this.invSearchDebounce);
        this.invSearchDebounce = setTimeout(() => {
            this.state.inventoryQuery = e.target.value.trim();
            this.state.inventoryPage = 0;
            this.loadInventoryProducts();
        }, 250);
    },

    filterInventoryCategory() {
        this.state.inventoryCategory = document.getElementById('inventory-category-filter').value;
        this.state.inventoryPage = 0;
        this.loadInventoryProducts();
    },

    // ---------------- LOW STOCK DEDICATED VIEW ----------------
    async loadLowStockDedicatedView() {
        if (!this.isAdmin()) return;
        try {
            const res = await this.apiFetch('/admin/products/low-stock', 'GET');
            const container = document.getElementById('lowstock-cards-container');

            if (res.success && res.data) {
                const items = res.data;
                if (items.length === 0) {
                    container.innerHTML = `
                        <div class="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 p-8">
                            <i data-lucide="check-circle" class="w-12 h-12 text-emerald-500 mx-auto mb-2"></i>
                            <h3 class="text-base font-extrabold text-slate-800">All Stock Levels Healthy</h3>
                            <p class="text-xs text-slate-500">There are no hardware items at or below their low-stock thresholds.</p>
                        </div>
                    `;
                    lucide.createIcons();
                    return;
                }

                container.innerHTML = items.map(p => `
                    <div class="bg-white rounded-2xl border border-amber-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
                        <div class="flex items-start justify-between">
                            <div>
                                <span class="text-[10px] font-extrabold px-2 py-0.5 rounded-full ${p.availableQuantity <= 0 ? 'badge-out-of-stock' : 'badge-low-stock'}">
                                    ${p.availableQuantity <= 0 ? 'OUT OF STOCK' : 'LOW STOCK ALERT'}
                                </span>
                                <h3 class="font-extrabold text-slate-900 text-sm mt-2">${p.name}</h3>
                                <span class="text-xs text-slate-400">${p.category || 'Hardware'}</span>
                            </div>
                            <div class="text-right">
                                <span class="text-xs text-slate-400 block">Current Stock</span>
                                <span class="text-xl font-black ${p.availableQuantity <= 0 ? 'text-rose-600' : 'text-amber-600'}">${p.availableQuantity}</span>
                            </div>
                        </div>

                        ${this.renderStockProgressBar(p.availableQuantity, p.lowStockLimit)}

                        <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
                            <div class="text-[11px] text-slate-500">
                                Safety Threshold: <strong>${p.lowStockLimit}</strong>
                            </div>
                            <div class="flex items-center space-x-2">
                                <button onclick="app.openStockModal(${p.id}, '${p.name.replace(/'/g, "\\'")}', ${p.availableQuantity})" class="btn-accent px-3 py-1.5 rounded-xl text-xs font-bold">
                                    Restock Now
                                </button>
                                <button onclick="app.openEditProductModal(${JSON.stringify(p).replace(/"/g, '&quot;')})" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold">
                                    Edit Limit
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('');

                lucide.createIcons();
            }
        } catch (e) {
            this.toast('Error loading low stock list', 'error');
        }
    },

    // ---------------- PRODUCT MODAL & DRAG/DROP ----------------
    setupDropzone() {
        const dropzone = document.getElementById('dropzone-box');
        if (!dropzone) return;

        ['dragenter', 'dragover'].forEach(name => {
            dropzone.addEventListener(name, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzone.classList.add('border-amber-500', 'bg-amber-50/30');
            }, false);
        });

        ['dragleave', 'drop'].forEach(name => {
            dropzone.addEventListener(name, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzone.classList.remove('border-amber-500', 'bg-amber-50/30');
            }, false);
        });

        dropzone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            if (dt && dt.files && dt.files.length > 0) {
                this.handleImageFileSelect(dt.files[0]);
            }
        }, false);
    },

    handleImageFileSelect(targetOrFile) {
        let file = null;
        if (targetOrFile instanceof File) {
            file = targetOrFile;
        } else if (targetOrFile && targetOrFile.files && targetOrFile.files.length > 0) {
            file = targetOrFile.files[0];
        }

        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            this.toast('Image file exceeds maximum 5MB size limit', 'warning');
            return;
        }

        this.state.selectedImageFile = file;

        const reader = new FileReader();
        reader.onload = (e) => {
            const previewImg = document.getElementById('dropzone-preview-img');
            const previewBox = document.getElementById('dropzone-preview-view');
            const emptyBox = document.getElementById('dropzone-empty-view');

            if (previewImg) previewImg.src = e.target.result;
            if (previewBox) previewBox.classList.remove('hidden');
            if (emptyBox) emptyBox.classList.add('hidden');
        };
        reader.readAsDataURL(file);
    },

    removeImageSelection() {
        this.state.selectedImageFile = null;
        const fileInput = document.getElementById('product-form-file');
        const urlInput = document.getElementById('product-form-image-url');
        const previewBox = document.getElementById('dropzone-preview-view');
        const emptyBox = document.getElementById('dropzone-empty-view');

        if (fileInput) fileInput.value = '';
        if (urlInput) urlInput.value = '';
        if (previewBox) previewBox.classList.add('hidden');
        if (emptyBox) emptyBox.classList.remove('hidden');
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
        document.getElementById('product-form-restock-date').value = '';
        document.getElementById('product-form-description').value = '';
        this.removeImageSelection();

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
        document.getElementById('product-form-restock-date').value = p.expectedRestockDate || '';
        document.getElementById('product-form-description').value = p.description || '';
        document.getElementById('product-form-image-url').value = p.imageUrl || '';

        const previewImg = document.getElementById('dropzone-preview-img');
        const previewBox = document.getElementById('dropzone-preview-view');
        const emptyBox = document.getElementById('dropzone-empty-view');

        if (p.imageUrl) {
            if (previewImg) previewImg.src = p.imageUrl;
            if (previewBox) previewBox.classList.remove('hidden');
            if (emptyBox) emptyBox.classList.add('hidden');
        } else {
            this.removeImageSelection();
        }

        this.openModal('modal-product-form');
    },

    async handleProductSubmit(event) {
        event.preventDefault();
        const id = document.getElementById('product-form-id').value;
        let imageUrl = document.getElementById('product-form-image-url').value;

        // Upload image first if selected
        if (this.state.selectedImageFile) {
            const formData = new FormData();
            formData.append('file', this.state.selectedImageFile);

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
            expectedRestockDate: document.getElementById('product-form-restock-date').value || null,
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
                this.loadCatalogProducts();
                this.refreshDashboard();
                this.checkLowStockBanner();
                this.loadAvailableCaches();
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
            Current Warehouse Stock: <strong>${currentStock}</strong> pieces
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
                reason: reason || 'Manual stock delta adjustment'
            });

            if (res.success) {
                this.toast(`Stock adjusted for ${res.data.name}. New Stock: ${res.data.availableQuantity}`, 'success');
                this.closeModal('modal-stock');
                this.loadInventoryProducts();
                this.loadCatalogProducts();
                this.refreshDashboard();
                this.checkLowStockBanner();
                this.loadAvailableCaches();
            } else {
                this.toast(res.message || 'Stock adjustment failed', 'error');
            }
        } catch (e) {
            this.toast(e.message || 'Failed to update stock', 'error');
        }
    },

    async deleteProduct(id, name) {
        if (!confirm(`Are you sure you want to delete product "${name}"? This action cannot be undone.`)) return;

        try {
            const res = await this.apiFetch(`/admin/products/${id}`, 'DELETE');
            if (res.success) {
                this.toast('Product deleted from catalog', 'success');
                this.loadInventoryProducts();
                this.loadCatalogProducts();
                this.refreshDashboard();
                this.loadAvailableCaches();
            } else {
                this.toast(res.message || 'Failed to delete product', 'error');
            }
        } catch (e) {
            this.toast(e.message || 'Error deleting product', 'error');
        }
    },

    // ---------------- TWO-COLUMN POS SALE CREATOR ----------------
    async loadAvailableCaches() {
        if (!this.isAdmin()) return;
        try {
            const [pRes, cRes] = await Promise.all([
                this.apiFetch('/admin/products?size=200', 'GET'),
                this.apiFetch('/admin/customers?size=200', 'GET')
            ]);
            if (pRes.success && pRes.data) this.state.availableProductsCache = pRes.data.content;
            if (cRes.success && cRes.data) this.state.customersCache = cRes.data.content;
        } catch (e) {
            // cache load failure
        }
    },

    async prepareCreateSaleView() {
        if (!this.isAdmin()) return;
        await this.loadAvailableCaches();

        const custSelect = document.getElementById('sale-customer-select');
        if (custSelect) {
            custSelect.innerHTML = '<option value="">-- Or enter new details below --</option>' +
                this.state.customersCache.map(c => `<option value="${c.id}">${c.name} (${c.phoneNumber})</option>`).join('');
        }

        // Reset inputs
        document.getElementById('sale-customer-name').value = '';
        document.getElementById('sale-customer-phone').value = '';
        document.getElementById('sale-customer-address').value = '';
        document.getElementById('sale-notes').value = '';

        // Initialize with one item row
        const container = document.getElementById('sale-items-container');
        if (container) {
            container.innerHTML = '';
            this.addSaleItemRow();
        }
        this.updateCheckoutSummary();
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
        if (!container) return;

        const options = this.state.availableProductsCache.map(p =>
            `<option value="${p.id}" data-price="${p.price}" data-stock="${p.availableQuantity}" data-name="${p.name.replace(/"/g, '&quot;')}">
                ${p.name} - ₹${Number(p.price).toFixed(2)} (${p.availableQuantity} in stock)
            </option>`
        ).join('');

        const row = document.createElement('div');
        row.className = 'sale-item-row flex flex-col sm:flex-row items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200';
        row.innerHTML = `
            <div class="flex-1 w-full">
                <select class="item-product-id w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-amber-500/20" onchange="app.updateCheckoutSummary()">
                    <option value="">-- Choose Hardware Product --</option>
                    ${options}
                </select>
            </div>
            <div class="flex items-center space-x-2 w-full sm:w-auto">
                <div class="w-24">
                    <input type="number" min="1" value="1" class="item-quantity w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-center font-bold" oninput="app.updateCheckoutSummary()">
                </div>
                <div class="w-28 text-right font-black text-slate-800 text-xs">
                    <span class="item-subtotal">₹0.00</span>
                </div>
                <button type="button" onclick="this.closest('.sale-item-row').remove(); app.updateCheckoutSummary();" class="p-2 text-slate-400 hover:text-red-500 transition">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        `;
        container.appendChild(row);
        lucide.createIcons();
        this.updateCheckoutSummary();
    },

    updateCheckoutSummary() {
        let total = 0;
        const lineItems = [];

        document.querySelectorAll('.sale-item-row').forEach(row => {
            const select = row.querySelector('.item-product-id');
            const qtyInput = row.querySelector('.item-quantity');
            const subtotalEl = row.querySelector('.item-subtotal');

            const selectedOpt = select.options[select.selectedIndex];
            if (selectedOpt && selectedOpt.value) {
                const price = parseFloat(selectedOpt.getAttribute('data-price') || 0);
                const name = selectedOpt.getAttribute('data-name') || 'Item';
                const qty = parseInt(qtyInput.value || 1, 10);
                const sub = price * qty;
                subtotalEl.innerText = '₹' + sub.toFixed(2);
                total += sub;

                lineItems.push({ name, qty, price, sub });
            } else {
                subtotalEl.innerText = '₹0.00';
            }
        });

        // Update preview in sticky summary
        const preview = document.getElementById('checkout-items-preview');
        if (preview) {
            if (lineItems.length === 0) {
                preview.innerHTML = `<div class="py-4 text-center text-slate-400 text-xs">No items selected yet</div>`;
            } else {
                preview.innerHTML = lineItems.map(it => `
                    <div class="flex items-center justify-between py-1.5">
                        <div class="truncate pr-2">
                            <span class="font-bold text-slate-800">${it.name}</span>
                            <span class="text-slate-400"> × ${it.qty}</span>
                        </div>
                        <span class="font-extrabold text-slate-900 shrink-0">₹${it.sub.toFixed(2)}</span>
                    </div>
                `).join('');
            }
        }

        const subtotalVal = document.getElementById('checkout-subtotal-val');
        const totalVal = document.getElementById('checkout-total-val');

        if (subtotalVal) subtotalVal.innerText = '₹' + total.toFixed(2);
        if (totalVal) totalVal.innerText = '₹' + total.toFixed(2);
    },

    async handleCreateSale(event) {
        event.preventDefault();

        const custSelect = document.getElementById('sale-customer-select').value;
        const name = document.getElementById('sale-customer-name').value.trim();
        const phone = document.getElementById('sale-customer-phone').value.trim();
        const address = document.getElementById('sale-customer-address').value.trim();
        const methodEl = document.querySelector('input[name="sale-payment-method"]:checked');
        const method = methodEl ? methodEl.value : 'CASH';
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
            this.toast('Please select at least one valid product for this sale', 'warning');
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
                this.toast('Order registered as PENDING. Stock is untouched until you click SELL.', 'success');
                this.switchView('admin-pending-sales');
                this.refreshDashboard();
            } else {
                this.toast(res.message || 'Failed to create sale', 'error');
            }
        } catch (e) {
            this.toast(e.message || 'Error creating pending sale', 'error');
        }
    },

    // ---------------- PENDING SALES VIEW (REQUIREMENT 26) ----------------
    async loadPendingSales() {
        if (!this.isAdmin()) return;
        try {
            const res = await this.apiFetch(`/admin/sales/pending?page=${this.state.pendingSalesPage}&size=15`, 'GET');
            const container = document.getElementById('pending-sales-cards-container');

            if (res.success && res.data && res.data.content) {
                const sales = res.data.content;

                // Update badge
                const badge = document.getElementById('sidebar-pending-sales-badge');
                if (badge) {
                    if (res.data.totalElements > 0) {
                        badge.innerText = res.data.totalElements;
                        badge.classList.remove('hidden');
                    } else {
                        badge.classList.add('hidden');
                    }
                }

                if (sales.length === 0) {
                    container.innerHTML = `
                        <div class="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 p-8">
                            <i data-lucide="check-circle-2" class="w-12 h-12 text-emerald-500 mx-auto mb-2"></i>
                            <h3 class="text-base font-extrabold text-slate-800">No Pending Orders</h3>
                            <p class="text-xs text-slate-500">All created orders have already been executed via SELL or no orders exist.</p>
                        </div>
                    `;
                    lucide.createIcons();
                    return;
                }

                container.innerHTML = sales.map(s => {
                    const itemsHtml = s.items.map(it => `
                        <div class="flex items-center justify-between py-1 text-xs text-slate-600">
                            <span>${it.productName} × ${it.quantity}</span>
                            <span class="font-bold text-slate-800">₹${Number(it.subtotal).toFixed(2)}</span>
                        </div>
                    `).join('');

                    return `
                        <div class="bg-white rounded-2xl border border-orange-200/80 p-5 shadow-xs space-y-4 hover:shadow-md transition">
                            <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                                <div class="flex items-center space-x-3">
                                    <div class="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                                        <i data-lucide="clock" class="w-5 h-5"></i>
                                    </div>
                                    <div>
                                        <div class="font-mono font-bold text-sm text-slate-900">${s.billNumber}</div>
                                        <div class="text-xs text-slate-400">${s.saleDate} • Customer: <strong class="text-slate-700">${s.customerName}</strong> (${s.customerPhone})</div>
                                    </div>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <span class="badge-pending badge-status">PENDING ORDER</span>
                                    <span class="text-xl font-black text-slate-900">₹${Number(s.totalAmount).toFixed(2)}</span>
                                </div>
                            </div>

                            <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-100 divide-y divide-slate-100">
                                ${itemsHtml}
                            </div>

                            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                                <span class="text-xs text-slate-400">Stock remains unchanged until SELL is confirmed.</span>
                                <div class="flex items-center space-x-2">
                                    <button onclick="app.openBillModal(${s.id})" class="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition">
                                        Inspect Pro-forma Bill
                                    </button>
                                    <button onclick="app.openSellModal(${JSON.stringify(s).replace(/"/g, '&quot;')})" class="btn-sell-action px-5 py-2 rounded-xl text-xs flex items-center space-x-1.5">
                                        <i data-lucide="check" class="w-4 h-4"></i>
                                        <span>CONFIRM SELL</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');

                lucide.createIcons();
            }
        } catch (e) {
            this.toast('Error fetching pending orders', 'error');
        }
    },

    // ---------------- SELL CONFIRMATION FLOW ----------------
    openSellModal(sale) {
        this.state.activeSaleForAction = sale;
        const summary = document.getElementById('sell-modal-summary');

        const itemsList = sale.items.map(i => `
            <div class="flex justify-between">
                <span>${i.productName} (Qty: <strong>${i.quantity}</strong>)</span>
                <span class="font-bold">₹${Number(i.subtotal).toFixed(2)}</span>
            </div>
        `).join('');

        summary.innerHTML = `
            <div class="font-mono font-bold text-slate-800">Order: ${sale.billNumber}</div>
            <div class="text-slate-600">Customer: <strong>${sale.customerName}</strong> (${sale.customerPhone})</div>
            <div class="text-slate-600">Total Payable: <strong class="text-amber-700 font-black">₹${Number(sale.totalAmount).toFixed(2)}</strong></div>
            <div class="pt-2 border-t border-slate-200 mt-2 space-y-1">
                ${itemsList}
            </div>
        `;

        this.openModal('modal-sell-confirm');
    },

    async executeSell() {
        if (!this.state.activeSaleForAction) return;
        const sale = this.state.activeSaleForAction;
        const btn = document.getElementById('btn-execute-sell');
        btn.disabled = true;
        btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Deducting Stock...</span>`;
        lucide.createIcons();

        try {
            const res = await this.apiFetch(`/admin/sales/${sale.id}/sell`, 'POST');
            if (res.success) {
                this.state.lastConfirmedSaleId = sale.id;
                this.toast('Sale Confirmed! Inventory decremented & Customer Purchase Alert Dispatched.', 'success');
                this.closeModal('modal-sell-confirm');
                this.loadPendingSales();
                this.refreshDashboard();
                this.checkLowStockBanner();
                this.loadAvailableCaches();

                // Open bill or offer prompt
                this.openBillModal(sale.id);
            } else {
                this.toast(res.message || 'Sale confirmation failed', 'error');
            }
        } catch (e) {
            this.toast(e.message || 'Failed to execute sale. Stock might be insufficient.', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i><span>CONFIRM SELL</span>`;
            lucide.createIcons();
        }
    },

    // ---------------- PAYMENT CONFIRMATION & DELIGHT MODAL ----------------
    openPaymentModal(sale) {
        this.state.activeSaleForAction = sale;
        const info = document.getElementById('payment-modal-sale-info');
        info.innerHTML = `
            Bill No: <strong>${sale.billNumber}</strong><br>
            Customer: <strong>${sale.customerName}</strong> (${sale.customerPhone})<br>
            Total Bill Amount: <strong class="text-emerald-700 font-extrabold text-sm">₹${Number(sale.totalAmount).toFixed(2)}</strong><br>
            Payment Channel: <strong>${sale.paymentMethod || 'CASH'}</strong>
        `;
        document.getElementById('payment-confirm-method').value = sale.paymentMethod || 'UPI';
        document.getElementById('payment-confirm-ref').value = '';

        this.openModal('modal-payment-confirm');
    },

    async executeConfirmPayment() {
        if (!this.state.activeSaleForAction) return;
        const sale = this.state.activeSaleForAction;
        const method = document.getElementById('payment-confirm-method').value;
        const ref = document.getElementById('payment-confirm-ref').value.trim();

        const btn = document.getElementById('btn-execute-payment');
        btn.disabled = true;
        btn.innerText = 'Confirming Receipt...';

        try {
            const res = await this.apiFetch(`/admin/sales/${sale.id}/confirm-payment`, 'POST', {
                paymentMethod: method,
                transactionReference: ref
            });

            if (res.success) {
                this.closeModal('modal-payment-confirm');
                this.state.lastConfirmedSaleId = sale.id;

                // Show animated success modal per Requirement
                const payAmt = document.getElementById('pay-success-amount');
                const payCust = document.getElementById('pay-success-customer');
                const payItems = document.getElementById('pay-success-items-list');

                if (payAmt) payAmt.innerText = '₹' + Number(sale.totalAmount).toFixed(2);
                if (payCust) payCust.innerText = `${sale.customerName} • ${sale.billNumber}`;
                if (payItems) {
                    payItems.innerHTML = sale.items.map(it => `
                        <div class="flex justify-between">
                            <span>${it.productName} × ${it.quantity}</span>
                            <span class="font-bold">₹${Number(it.subtotal).toFixed(2)}</span>
                        </div>
                    `).join('');
                }

                this.openModal('modal-payment-success');
                this.toast('Payment confirmed! Official payment receipt dispatched via WhatsApp.', 'success');

                this.loadAllSales();
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

    // ---------------- ALL SALES HISTORY ----------------
    async loadAllSales() {
        if (!this.isAdmin()) return;
        try {
            const res = await this.apiFetch(`/admin/sales?page=${this.state.allSalesPage}&size=15`, 'GET');
            const tbody = document.getElementById('all-sales-table-body');

            if (res.success && res.data && res.data.content) {
                const sales = res.data.content;
                if (sales.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-slate-400">No historical sales found</td></tr>`;
                    return;
                }

                tbody.innerHTML = sales.map(s => {
                    const isPending = s.saleStatus === 'PENDING';
                    const isPayPending = s.paymentStatus === 'PENDING';

                    let itemsSummary = s.items.map(it => `${it.productName} (${it.quantity})`).join(', ');
                    if (itemsSummary.length > 35) itemsSummary = itemsSummary.substring(0, 32) + '...';

                    return `
                        <tr class="hover:bg-slate-50/80 transition">
                            <td class="p-4 font-mono font-bold text-slate-900 text-xs">${s.billNumber}</td>
                            <td class="p-4 text-xs text-slate-500">${s.saleDate}</td>
                            <td class="p-4">
                                <div class="font-bold text-slate-800 text-xs">${s.customerName}</div>
                                <div class="text-[11px] text-slate-400 font-mono">${s.customerPhone}</div>
                            </td>
                            <td class="p-4 text-xs text-slate-600 max-w-xs truncate" title="${s.items.map(i => i.productName + ' x' + i.quantity).join(', ')}">
                                ${itemsSummary}
                            </td>
                            <td class="p-4 text-right font-black text-slate-900">₹${Number(s.totalAmount).toFixed(2)}</td>
                            <td class="p-4 text-center">
                                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${isPending ? 'badge-pending' : 'badge-confirmed'}">
                                    ${s.saleStatus}
                                </span>
                            </td>
                            <td class="p-4 text-center">
                                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${isPayPending ? 'badge-payment-pending' : 'badge-payment-success'}">
                                    ${s.paymentStatus}
                                </span>
                            </td>
                            <td class="p-4 text-right space-x-1 whitespace-nowrap">
                                ${isPending ? `
                                    <button onclick="app.openSellModal(${JSON.stringify(s).replace(/"/g, '&quot;')})" class="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition">
                                        SELL
                                    </button>
                                ` : ''}
                                ${isPayPending ? `
                                    <button onclick="app.openPaymentModal(${JSON.stringify(s).replace(/"/g, '&quot;')})" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition">
                                        Pay
                                    </button>
                                ` : ''}
                                <button onclick="app.openBillModal(${s.id})" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition">
                                    Bill
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('');

                this.renderPagination('all-sales-pagination', res.data, (page) => {
                    this.state.allSalesPage = page;
                    this.loadAllSales();
                });
                lucide.createIcons();
            }
        } catch (e) {
            this.toast('Error fetching sales history', 'error');
        }
    },

    // ---------------- COMMERCIAL INVOICE / BILL (REQUIREMENT 14) ----------------
    async openBillModal(saleId) {
        try {
            const res = await this.apiFetch(`/admin/sales/${saleId}/bill`, 'GET');
            if (res.success && res.data) {
                const b = res.data;
                const container = document.getElementById('invoice-print-container');

                const itemsRows = b.items.map((it, idx) => `
                    <tr class="border-b border-slate-100">
                        <td class="py-2.5 text-slate-400 font-mono text-[11px]">${idx + 1}</td>
                        <td class="py-2.5 text-slate-800 font-bold">${it.productName}</td>
                        <td class="py-2.5 text-center font-bold text-slate-700">${it.quantity}</td>
                        <td class="py-2.5 text-right font-medium text-slate-600">₹${Number(it.unitPrice).toFixed(2)}</td>
                        <td class="py-2.5 text-right font-extrabold text-slate-900">₹${Number(it.subtotal).toFixed(2)}</td>
                    </tr>
                `).join('');

                container.innerHTML = `
                    <!-- Invoice Header -->
                    <div class="flex items-start justify-between border-b-2 border-slate-900 pb-5">
                        <div>
                            <span class="text-xs font-extrabold text-amber-600 uppercase tracking-widest">OFFICIAL TAX INVOICE</span>
                            <h1 class="text-2xl font-black text-slate-900 tracking-tight mt-0.5">${b.shopName}</h1>
                            <p class="text-xs text-slate-500 mt-1">${b.shopAddress}</p>
                            <p class="text-xs text-slate-500 font-semibold">Helpdesk: ${b.shopContact}</p>
                        </div>
                        <div class="text-right">
                            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bill Reference</div>
                            <div class="font-mono text-base font-black text-slate-900">${b.billNumber}</div>
                            <div class="text-xs text-slate-600 mt-1">Date: <strong>${b.saleDate}</strong></div>
                            <div class="text-xs text-slate-500">${b.saleTime || ''}</div>
                        </div>
                    </div>

                    <!-- Billed To -->
                    <div class="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 text-xs">
                        <div class="space-y-1">
                            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Billed To (Customer):</span>
                            <div class="font-extrabold text-slate-900 text-sm">${b.customerName}</div>
                            <div class="text-slate-600">Phone: ${b.customerPhone}</div>
                            <div class="text-slate-600">Address: ${b.customerAddress}</div>
                        </div>
                        <div class="space-y-1 text-right">
                            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Payment Summary:</span>
                            <div class="text-slate-700">Payment Channel: <strong class="uppercase">${b.paymentMethod}</strong></div>
                            <div class="text-slate-700">Payment Status: <strong class="${b.paymentStatus === 'SUCCESS' ? 'text-emerald-700' : 'text-rose-700'}">${b.paymentStatus}</strong></div>
                        </div>
                    </div>

                    <!-- Line Items Table -->
                    <div class="py-2">
                        <table class="w-full text-left text-xs">
                            <thead>
                                <tr class="border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400">
                                    <th class="py-2 w-8">#</th>
                                    <th class="py-2">Product Description</th>
                                    <th class="py-2 text-center">Qty</th>
                                    <th class="py-2 text-right">Unit Price</th>
                                    <th class="py-2 text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsRows}
                            </tbody>
                        </table>
                    </div>

                    <!-- Totals -->
                    <div class="border-t-2 border-slate-900 pt-4 space-y-2">
                        <div class="flex items-center justify-between text-xs text-slate-600">
                            <span>Subtotal Amount:</span>
                            <span class="font-bold text-slate-800">₹${Number(b.totalAmount).toFixed(2)}</span>
                        </div>
                        <div class="flex items-center justify-between text-xs text-slate-600">
                            <span>Taxes & Cess (GST):</span>
                            <span class="font-bold text-slate-800">Inclusive</span>
                        </div>
                        <div class="flex items-center justify-between text-lg font-black text-slate-900 pt-2 border-t border-slate-200">
                            <span>NET INVOICE TOTAL:</span>
                            <span class="text-2xl text-amber-600 font-black">₹${Number(b.totalAmount).toFixed(2)}</span>
                        </div>
                    </div>

                    <div class="pt-6 border-t border-dashed border-slate-200 text-center text-[11px] text-slate-400">
                        Thank you for your business! Hardware goods once sold carry standard manufacturer warranty.
                    </div>

                    <!-- Plain Monospace View (Requirement 14) -->
                    <details class="text-[11px] text-slate-400 no-print mt-4">
                        <summary class="cursor-pointer hover:text-slate-600 font-bold">Show Plain-Text Monospace Format</summary>
                        <pre class="bg-slate-950 text-amber-300 p-4 rounded-xl font-mono text-[11px] overflow-x-auto mt-2 leading-relaxed">${b.printableReceiptText}</pre>
                    </details>
                `;

                // Set PDF download button href
                const pdfBtn = document.getElementById('bill-pdf-download-btn');
                if (pdfBtn) {
                    pdfBtn.href = `${API_BASE}/admin/sales/${saleId}/bill/pdf`;
                }

                this.openModal('modal-bill');
                lucide.createIcons();
            }
        } catch (e) {
            this.toast('Failed to load bill receipt', 'error');
        }
    },

    // ---------------- CUSTOMER DIRECTORY (CRM) ----------------
    async loadCustomers() {
        if (!this.isAdmin()) return;
        try {
            let url = `/admin/customers?page=${this.state.customersPage}&size=15`;
            if (this.state.customerQuery) url += `&query=${encodeURIComponent(this.state.customerQuery)}`;

            const res = await this.apiFetch(url, 'GET');
            const grid = document.getElementById('customers-cards-grid');

            if (res.success && res.data && res.data.content) {
                const customers = res.data.content;
                if (customers.length === 0) {
                    grid.innerHTML = `<div class="col-span-full py-12 text-center text-slate-400">No customer records found</div>`;
                    return;
                }

                grid.innerHTML = customers.map(c => `
                    <div class="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4 hover:shadow-md transition">
                        <div class="flex items-start justify-between">
                            <div class="flex items-center space-x-3">
                                <div class="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-extrabold text-sm">
                                    ${c.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 class="font-extrabold text-slate-900 text-sm">${c.name}</h3>
                                    <span class="text-xs text-slate-400 font-mono">${c.phoneNumber}</span>
                                </div>
                            </div>
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                CRM ACTIVE
                            </span>
                        </div>

                        <div class="space-y-1 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <div>Address: <strong>${c.address}</strong></div>
                            ${c.email ? `<div>Email: <strong>${c.email}</strong></div>` : ''}
                        </div>

                        <div class="pt-2 flex items-center justify-end">
                            <button onclick="app.viewCustomerHistory(${c.id}, '${c.name.replace(/'/g, "\\'")}')" class="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center space-x-1.5">
                                <i data-lucide="receipt" class="w-3.5 h-3.5"></i>
                                <span>Order History</span>
                            </button>
                        </div>
                    </div>
                `).join('');

                this.renderPagination('customers-pagination', res.data, (page) => {
                    this.state.customersPage = page;
                    this.loadCustomers();
                });
                lucide.createIcons();
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
        }, 250);
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
                this.toast('Customer record saved successfully', 'success');
                this.closeModal('modal-customer');
                this.loadCustomers();
                this.loadAvailableCaches();
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
            document.getElementById('customer-history-title').innerText = `Purchase Ledger: ${customerName}`;
            const container = document.getElementById('customer-history-content');

            if (res.success && res.data && res.data.length > 0) {
                container.innerHTML = res.data.map(s => `
                    <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                        <div class="flex items-center justify-between font-extrabold text-slate-900">
                            <span class="font-mono">${s.billNumber} • ${s.saleDate}</span>
                            <span class="text-amber-600 text-sm">₹${Number(s.totalAmount).toFixed(2)}</span>
                        </div>
                        <div class="text-slate-600">
                            ${s.items.map(i => `${i.productName} (×${i.quantity})`).join(', ')}
                        </div>
                        <div class="flex items-center justify-between pt-1">
                            <div class="flex items-center space-x-2">
                                <span class="px-2 py-0.5 rounded text-[10px] font-bold ${s.saleStatus === 'CONFIRMED' ? 'badge-confirmed' : 'badge-pending'}">${s.saleStatus}</span>
                                <span class="px-2 py-0.5 rounded text-[10px] font-bold ${s.paymentStatus === 'SUCCESS' ? 'badge-payment-success' : 'badge-payment-pending'}">${s.paymentStatus}</span>
                            </div>
                            <button onclick="app.closeModal('modal-customer-history'); app.openBillModal(${s.id});" class="text-amber-600 font-bold hover:underline">
                                View Tax Invoice &rarr;
                            </button>
                        </div>
                    </div>
                `).join('');
            } else {
                container.innerHTML = `<div class="p-8 text-center text-xs text-slate-400">No past purchases on record for this customer.</div>`;
            }

            this.openModal('modal-customer-history');
        } catch (e) {
            this.toast('Failed to load customer history', 'error');
        }
    },

    // ---------------- NOTIFICATIONS AUDIT TRAIL ----------------
    async loadNotificationLogs() {
        if (!this.isAdmin()) return;
        try {
            const res = await this.apiFetch('/admin/notifications/logs', 'GET');
            const container = document.getElementById('notification-logs-full-list');

            if (res.success && res.data && res.data.length > 0) {
                container.innerHTML = res.data.map(l => {
                    const channelBadge = l.channel === 'WHATSAPP'
                        ? '<span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">WHATSAPP</span>'
                        : '<span class="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded text-[10px]">SMS</span>';

                    const typeBadge = l.notificationType === 'LOW_STOCK_ALERT'
                        ? '<span class="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded text-[10px]">LOW STOCK ALERT</span>'
                        : l.notificationType === 'PURCHASE_CONFIRMATION'
                            ? '<span class="px-2 py-0.5 bg-indigo-100 text-indigo-800 font-bold rounded text-[10px]">PURCHASE CONFIRMATION</span>'
                            : '<span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">PAYMENT RECEIPT</span>';

                    return `
                        <div class="p-4 hover:bg-slate-50 transition space-y-2">
                            <div class="flex items-center justify-between text-xs">
                                <div class="flex items-center space-x-2">
                                    ${channelBadge}
                                    ${typeBadge}
                                    <span class="font-extrabold text-slate-800 font-mono">Recipient: ${l.recipient}</span>
                                </div>
                                <span class="text-slate-400 text-[11px]">${l.createdAt ? new Date(l.createdAt).toLocaleString() : ''}</span>
                            </div>
                            <pre class="bg-slate-950 text-amber-300 p-3.5 rounded-xl text-xs font-mono whitespace-pre-wrap leading-relaxed">${l.message}</pre>
                        </div>
                    `;
                }).join('');
            } else {
                container.innerHTML = `<div class="p-12 text-center text-xs text-slate-400">No notifications dispatched yet. Execute a sale or restock alert to see live audit dispatches.</div>`;
            }
        } catch (e) {
            this.toast('Error loading notification audit trail', 'error');
        }
    },

    async loadSlideNotificationItems() {
        if (!this.isAdmin()) return;
        try {
            const res = await this.apiFetch('/admin/notifications/logs', 'GET');
            const container = document.getElementById('slide-notification-items');
            if (res.success && res.data && res.data.length > 0) {
                const recents = res.data.slice(0, 10);
                container.innerHTML = recents.map(l => `
                    <div class="p-3 hover:bg-slate-50 transition space-y-1">
                        <div class="flex items-center justify-between">
                            <span class="font-bold text-slate-800">${l.notificationType.replace(/_/g, ' ')}</span>
                            <span class="text-[10px] text-slate-400">${l.channel}</span>
                        </div>
                        <p class="text-slate-500 line-clamp-2 font-mono text-[11px]">${l.message.split('\n')[0]}</p>
                        <span class="text-[10px] text-slate-400 block">${l.createdAt ? new Date(l.createdAt).toLocaleTimeString() : ''}</span>
                    </div>
                `).join('');
            } else {
                container.innerHTML = `<div class="p-8 text-center text-slate-400">No recent notifications</div>`;
            }
        } catch (e) {
            // ignore
        }
    },

    saveChannelSetting(channel, val) {
        localStorage.setItem(`setting_${channel}`, val);
        this.toast(`Alert preference for ${channel.toUpperCase()} updated.`, 'info');
    },

    // ---------------- MODAL CONTROLS & UTILITIES ----------------
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

        let html = `<div>Showing page <strong>${current + 1}</strong> of <strong>${total}</strong> (${pageData.totalElements} records)</div><div class="flex space-x-1">`;
        if (current > 0) {
            html += `<button onclick="(${onPageClick})(${current - 1})" class="px-3 py-1 border border-slate-200 rounded-lg text-xs bg-white hover:bg-slate-50 font-bold">Prev</button>`;
        }
        if (current < total - 1) {
            html += `<button onclick="(${onPageClick})(${current + 1})" class="px-3 py-1 border border-slate-200 rounded-lg text-xs bg-white hover:bg-slate-50 font-bold">Next</button>`;
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
            info: 'bg-slate-900 text-white'
        };

        const t = document.createElement('div');
        t.className = `${colors[type] || colors.info} px-4 py-3 rounded-2xl text-xs font-bold shadow-xl flex items-center space-x-2 transition-all transform duration-300 pointer-events-auto border border-white/10`;
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

// Initialize Application on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
