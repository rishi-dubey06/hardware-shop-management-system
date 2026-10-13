import React, { useState, useEffect } from 'react';
import { NavLink, useSearchParams } from 'react-router-dom';
import { productApi } from '../services/api';
import { StockProgressBar } from '../components/StockProgressBar';
import { Grid, List, Search, PackageSearch, Wrench } from 'lucide-react';

export const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [layout, setLayout] = useState('grid');
  const [loading, setLoading] = useState(true);
  const [pageData, setPageData] = useState({ page: 0, totalPages: 1, totalElements: 0 });

  const query = searchParams.get('query') || '';
  const category = searchParams.get('category') || '';
  const page = parseInt(searchParams.get('page') || '0', 10);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [query, category, page]);

  const loadCategories = async () => {
    try {
      const res = await productApi.getCategories();
      if (res.success && res.data) {
        setCategories(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await productApi.getProducts({ page, size: 12, query, category });
      if (res.success && res.data) {
        setProducts(res.data.content || []);
        setPageData({
          page: res.data.number || 0,
          totalPages: res.data.totalPages || 1,
          totalElements: res.data.totalElements || 0,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (val) => {
    const params = new URLSearchParams(searchParams);
    if (val) params.set('query', val);
    else params.delete('query');
    params.set('page', '0');
    setSearchParams(params);
  };

  const handleCategorySelect = (cat) => {
    const params = new URLSearchParams(searchParams);
    if (cat) params.set('category', cat);
    else params.delete('category');
    params.set('page', '0');
    setSearchParams(params);
  };

  const setPage = (p) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', p.toString());
    setSearchParams(params);
  };

  return (
    <div className="space-y-6 py-4">
      {/* Catalog Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Retail & Wholesale Product Catalog</h1>
          <p className="text-xs text-slate-500">Live hardware inventory, selling prices and warehouse stock levels.</p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl self-start">
          <button
            onClick={() => setLayout('grid')}
            className={`p-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              layout === 'grid' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>Grid</span>
          </button>
          <button
            onClick={() => setLayout('list')}
            className={`p-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              layout === 'list' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <List className="w-4 h-4" />
            <span>List</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            defaultValue={query}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search tools, pipes, hardware..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => handleCategorySelect('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              category === '' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Items
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => handleCategorySelect(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                category === c ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Product Content */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">Loading catalog items...</div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
          <PackageSearch className="w-12 h-12 mx-auto text-slate-300" />
          <h3 className="font-extrabold text-sm text-slate-800">No matching products found</h3>
          <p className="text-xs text-slate-400">Try clearing category or search filters.</p>
        </div>
      ) : layout === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((p) => {
            const isOutOfStock = p.availableQuantity <= 0;
            const isLowStock = !isOutOfStock && p.availableQuantity <= p.lowStockLimit;

            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col group hover:shadow-md transition"
              >
                <div className="relative overflow-hidden h-44 bg-slate-100 flex items-center justify-center">
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <Wrench className="w-10 h-10 text-slate-300" />
                  )}
                  <span
                    className={`absolute top-2.5 right-2.5 text-[10px] font-black px-2 py-0.5 rounded-full ${
                      isOutOfStock
                        ? 'badge-out-of-stock'
                        : isLowStock
                        ? 'badge-low-stock'
                        : 'badge-available'
                    }`}
                  >
                    {isOutOfStock ? 'OUT OF STOCK' : isLowStock ? `LOW (${p.availableQuantity})` : 'IN STOCK'}
                  </span>
                  {p.category && (
                    <span className="absolute bottom-2.5 left-2.5 text-[10px] font-bold bg-slate-900/80 text-white px-2 py-0.5 rounded backdrop-blur-xs">
                      {p.category}
                    </span>
                  )}
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm truncate">{p.name}</h3>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                      {p.description || 'Quality hardware supply item.'}
                    </p>
                  </div>

                  <StockProgressBar available={p.availableQuantity} limit={p.lowStockLimit} />

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Price</span>
                      <span className="text-base font-black text-slate-900">₹{Number(p.price).toFixed(2)}</span>
                    </div>
                    <NavLink
                      to={`/products/${p.id}`}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                    >
                      Details
                    </NavLink>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((p) => {
            const isOutOfStock = p.availableQuantity <= 0;
            const isLowStock = !isOutOfStock && p.availableQuantity <= p.lowStockLimit;

            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 hover:shadow-md transition"
              >
                <div className="flex items-center space-x-4 w-full sm:w-auto">
                  <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden shrink-0 flex items-center justify-center border border-slate-200">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <Wrench className="w-6 h-6 text-slate-300" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          isOutOfStock
                            ? 'badge-out-of-stock'
                            : isLowStock
                            ? 'badge-low-stock'
                            : 'badge-available'
                        }`}
                      >
                        {isOutOfStock ? 'OUT OF STOCK' : isLowStock ? `LOW (${p.availableQuantity})` : 'IN STOCK'}
                      </span>
                      {p.category && (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {p.category}
                        </span>
                      )}
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-sm mt-1">{p.name}</h3>
                    <p className="text-xs text-slate-400 line-clamp-1 max-w-md">{p.description}</p>
                  </div>
                </div>

                <div className="w-full sm:w-60">
                  <StockProgressBar available={p.availableQuantity} limit={p.lowStockLimit} />
                </div>

                <div className="flex items-center justify-between sm:justify-end space-x-4 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-bold">Price</span>
                    <span className="text-lg font-black text-slate-900">₹{Number(p.price).toFixed(2)}</span>
                  </div>
                  <NavLink
                    to={`/products/${p.id}`}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                  >
                    Details
                  </NavLink>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pageData.totalPages > 1 && (
        <div className="pt-4 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing page <strong>{pageData.page + 1}</strong> of <strong>{pageData.totalPages}</strong> (
            {pageData.totalElements} items)
          </div>
          <div className="flex space-x-2">
            <button
              disabled={pageData.page === 0}
              onClick={() => setPage(pageData.page - 1)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold disabled:opacity-50"
            >
              Prev
            </button>
            <button
              disabled={pageData.page >= pageData.totalPages - 1}
              onClick={() => setPage(pageData.page + 1)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;

