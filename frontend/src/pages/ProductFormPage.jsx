import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productApi } from '../services/api';
import { ArrowLeft, Camera, UploadCloud, X, Check } from 'lucide-react';

export const ProductFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    availableQuantity: '',
    lowStockLimit: '10',
    lowStockNotificationEnabled: true,
    expectedRestockDate: '',
    description: '',
    imageUrl: '',
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (isEdit) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    setLoading(true);
    try {
      const res = await productApi.getProductById(id);
      if (res.success && res.data) {
        const p = res.data;
        setFormData({
          name: p.name || '',
          category: p.category || '',
          price: p.price || '',
          availableQuantity: p.availableQuantity || '',
          lowStockLimit: p.lowStockLimit?.toString() || '10',
          lowStockNotificationEnabled: p.lowStockNotificationEnabled ?? true,
          expectedRestockDate: p.expectedRestockDate || '',
          description: p.description || '',
          imageUrl: p.imageUrl || '',
        });
        if (p.imageUrl) {
          setPreviewUrl(p.imageUrl);
        }
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds maximum 5MB limit.');
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const removeImage = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setFormData((prev) => ({ ...prev, imageUrl: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      let finalImageUrl = formData.imageUrl;

      // Upload image if newly selected
      if (selectedFile) {
        const uploadRes = await productApi.uploadImage(selectedFile);
        if (uploadRes.success && uploadRes.data) {
          finalImageUrl = uploadRes.data.imageUrl;
        } else {
          throw new Error(uploadRes.message || 'Image upload failed');
        }
      }

      const payload = {
        name: formData.name.trim(),
        category: formData.category.trim(),
        price: parseFloat(formData.price),
        availableQuantity: parseInt(formData.availableQuantity, 10),
        lowStockLimit: parseInt(formData.lowStockLimit, 10),
        lowStockNotificationEnabled: formData.lowStockNotificationEnabled,
        expectedRestockDate: formData.expectedRestockDate || null,
        description: formData.description.trim(),
        imageUrl: finalImageUrl,
      };

      if (isEdit) {
        await productApi.updateProduct(id, payload);
      } else {
        await productApi.createProduct(payload);
      }

      navigate('/admin/products');
    } catch (err) {
      alert(err.message || 'Error saving product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-24 text-center text-slate-400">Loading product editor...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6">
      <button
        onClick={() => navigate('/admin/products')}
        className="flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Products</span>
      </button>

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            {isEdit ? 'Edit Product Specifications' : 'Add New Hardware Product'}
          </h1>
          <p className="text-xs text-slate-500">
            Configure catalog details, warehouse safety threshold limits, and alerts.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Basic Information */}
          <div className="space-y-3">
            <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider block">
              1. Basic Information
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. PVC Pipe 1 inch"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Plumbing, Tools, Electrical"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Expected Restock Date</label>
                <input
                  type="date"
                  value={formData.expectedRestockDate}
                  onChange={(e) => setFormData({ ...formData, expectedRestockDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Quality, durability, technical specifications..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Pricing & Stock */}
          <div className="space-y-3">
            <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider block">
              2. Pricing & Warehouse Stock
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Selling Price (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Available Quantity *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.availableQuantity}
                  onChange={(e) => setFormData({ ...formData, availableQuantity: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alert Limit *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.lowStockLimit}
                  onChange={(e) => setFormData({ ...formData, lowStockLimit: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="notifToggle"
                checked={formData.lowStockNotificationEnabled}
                onChange={(e) => setFormData({ ...formData, lowStockNotificationEnabled: e.target.checked })}
                className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <label htmlFor="notifToggle" className="text-xs font-semibold text-slate-700 cursor-pointer">
                Enable automated WhatsApp & SMS alerts when stock reaches or breaches alert limit
              </label>
            </div>
          </div>

          {/* Section 3: Drag & Drop Image Dropzone */}
          <div className="space-y-3">
            <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider block">
              3. Product Image
            </span>

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('productImageInput').click()}
              className={`rounded-2xl p-6 text-center cursor-pointer border-2 border-dashed transition flex flex-col items-center justify-center space-y-3 ${
                dragActive ? 'border-amber-500 bg-amber-50/50' : 'border-slate-300 hover:border-amber-500'
              }`}
            >
              <input
                type="file"
                id="productImageInput"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files[0])}
              />

              {previewUrl ? (
                <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-xl shadow-md mx-auto border border-slate-200"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="text-xs text-rose-600 font-bold hover:underline"
                  >
                    Remove Image
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div className="font-bold text-xs text-slate-800">
                    Drag & Drop Image Here, or <span className="text-amber-600 underline">Browse Files</span>
                  </div>
                  <div className="text-[11px] text-slate-400">JPEG, PNG, WEBP (Max 5MB)</div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFormPage;

