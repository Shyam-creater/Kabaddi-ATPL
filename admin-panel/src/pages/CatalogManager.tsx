import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
} from '@mui/material';
import { Pencil, Trash2, Plus, Image as ImageIcon, Sparkles, FolderTree, Tag, Layers, X } from 'lucide-react';
import { useSnackbar } from 'notistack';
// @ts-ignore
import { brandApi } from '../services/brandApi';
// @ts-ignore
import { categoryApi } from '../services/categoryApi';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function CatalogManager() {
  const { enqueueSnackbar } = useSnackbar();

  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);

  // Data states
  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [selectedCategoryForSub, setSelectedCategoryForSub] = useState('');

  // Dialog states
  const [brandDialog, setBrandDialog] = useState(false);
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [subCategoryDialog, setSubCategoryDialog] = useState(false);

  // Edit states
  const [editingBrand, setEditingBrand] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingSubCategory, setEditingSubCategory] = useState<any>(null);

  // Form states
  const [brandForm, setBrandForm] = useState<{ name: string; description: string; logo: File | string | null }>(
    { name: '', description: '', logo: null }
  );
  const [categoryForm, setCategoryForm] = useState<{
    name: string;
    description: string;
    status: string;
    image: File | string | null;
  }>({ name: '', description: '', status: 'active', image: null });
  const [subCategoryForm, setSubCategoryForm] = useState<{
    name: string;
    description: string;
    status: string;
    image: File | string | null;
  }>({ name: '', description: '', status: 'active', image: null });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const fetchBrands = async () => {
    try {
      const data = await brandApi.getAllBrands();
      setBrands(Array.isArray(data) ? data : []);
    } catch (error: any) {
      enqueueSnackbar(error?.message || 'Failed to fetch brands', { variant: 'error' });
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await categoryApi.getAllCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error: any) {
      enqueueSnackbar(error?.message || 'Failed to fetch categories', { variant: 'error' });
    }
  };

  const fetchSubCategories = async (categoryId: string) => {
    if (!categoryId) return;
    try {
      const data = await categoryApi.getSubCategories(categoryId);
      setSubCategories(data?.subCategories || []);
    } catch (error: any) {
      enqueueSnackbar(error?.message || 'Failed to fetch subcategories', { variant: 'error' });
    }
  };

  useEffect(() => {
    fetchBrands();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategoryForSub) {
      fetchSubCategories(selectedCategoryForSub);
    } else {
      setSubCategories([]);
    }
  }, [selectedCategoryForSub]);

  const handleOpenBrandDialog = (brand?: any) => {
    if (brand) {
      setEditingBrand(brand);
      setBrandForm({ name: brand.name || '', description: brand.description || '', logo: brand.logo || null });
    } else {
      setEditingBrand(null);
      setBrandForm({ name: '', description: '', logo: null });
    }
    setBrandDialog(true);
  };

  const handleSaveBrand = async () => {
    if (!brandForm.name.trim()) {
      enqueueSnackbar('Brand name is required', { variant: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', brandForm.name);
      fd.append('description', brandForm.description);
      if (brandForm.logo instanceof File) {
        fd.append('logo', brandForm.logo);
      }

      if (editingBrand) {
        await brandApi.updateBrand(editingBrand._id, fd);
        enqueueSnackbar('Brand updated', { variant: 'success' });
      } else {
        await brandApi.createBrand(fd);
        enqueueSnackbar('Brand created', { variant: 'success' });
      }

      await fetchBrands();
      setBrandDialog(false);
    } catch (error: any) {
      enqueueSnackbar(error?.message || 'Failed to save brand', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBrand = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this brand?')) return;
    try {
      await brandApi.deleteBrand(id);
      enqueueSnackbar('Brand deleted', { variant: 'success' });
      await fetchBrands();
    } catch (error: any) {
      enqueueSnackbar(error?.message || 'Failed to delete brand', { variant: 'error' });
    }
  };

  const handleOpenCategoryDialog = (category?: any) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.cName || '',
        description: category.cDescription || '',
        status: category.cStatus || 'active',
        image: Array.isArray(category.cImage) ? category.cImage[0] : category.cImage || null,
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: '', description: '', status: 'active', image: null });
    }
    setCategoryDialog(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) {
      enqueueSnackbar('Category name is required', { variant: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...categoryForm,
      };

      if (editingCategory) {
        // Keep existing behavior: sending categoryForm directly (as your previous code did)
        await categoryApi.updateCategory(editingCategory._id, payload);
        enqueueSnackbar('Category updated', { variant: 'success' });
      } else {
        await categoryApi.createCategory(payload);
        enqueueSnackbar('Category created', { variant: 'success' });
      }

      await fetchCategories();
      setCategoryDialog(false);
    } catch (error: any) {
      enqueueSnackbar(error?.message || 'Failed to save category', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await categoryApi.deleteCategory(id);
      enqueueSnackbar('Category deleted', { variant: 'success' });
      await fetchCategories();
      if (selectedCategoryForSub === id) setSelectedCategoryForSub('');
    } catch (error: any) {
      enqueueSnackbar(error?.message || 'Failed to delete category', { variant: 'error' });
    }
  };

  const handleOpenSubCategoryDialog = (subCategory?: any) => {
    if (!selectedCategoryForSub) {
      enqueueSnackbar('Please select a category first', { variant: 'warning' });
      return;
    }

    if (subCategory) {
      setEditingSubCategory(subCategory);
      setSubCategoryForm({
        name: subCategory.name || '',
        description: subCategory.description || '',
        status: subCategory.status || 'active',
        image: subCategory.image || null,
      });
    } else {
      setEditingSubCategory(null);
      setSubCategoryForm({ name: '', description: '', status: 'active', image: null });
    }

    setSubCategoryDialog(true);
  };

  const handleSaveSubCategory = async () => {
    if (!subCategoryForm.name.trim()) {
      enqueueSnackbar('Subcategory name is required', { variant: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', subCategoryForm.name);
      fd.append('description', subCategoryForm.description);
      fd.append('status', subCategoryForm.status);
      if (subCategoryForm.image instanceof File) {
        fd.append('image', subCategoryForm.image);
      }

      if (editingSubCategory) {
        await categoryApi.updateSubCategory(selectedCategoryForSub, editingSubCategory._id, fd);
        enqueueSnackbar('Subcategory updated', { variant: 'success' });
      } else {
        await categoryApi.createSubCategory(selectedCategoryForSub, fd);
        enqueueSnackbar('Subcategory created', { variant: 'success' });
      }

      await fetchSubCategories(selectedCategoryForSub);
      setSubCategoryDialog(false);
    } catch (error: any) {
      enqueueSnackbar(error?.message || 'Failed to save subcategory', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubCategory = async (subCategoryId: string) => {
    if (!window.confirm('Are you sure you want to delete this subcategory?')) return;
    try {
      await categoryApi.deleteSubCategory(selectedCategoryForSub, subCategoryId);
      enqueueSnackbar('Subcategory deleted', { variant: 'success' });
      await fetchSubCategories(selectedCategoryForSub);
    } catch (error: any) {
      enqueueSnackbar(error?.message || 'Failed to delete subcategory', { variant: 'error' });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setForm: Function) => {
    if (e.target.files && e.target.files[0]) {
      setForm((prev: any) => ({ ...prev, image: e.target.files![0], logo: e.target.files![0] }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600">
                <Sparkles size={20} />
              </div>
              <h1 className="text-2xl font-black text-[#0f172a] tracking-tight">
                Catalog Manager
              </h1>
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <FolderTree size={14} />
              Organize Categories, Subcategories & Brands
            </p>
          </div>
        </div>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="catalog tabs"
            sx={{
              '& .MuiTab-root': {
                fontWeight: 700,
                textTransform: 'none',
                fontSize: '0.95rem',
                minWidth: 120,
              },
            }}
          >
            <Tab label="Categories" />
            <Tab label="Subcategories" />
            <Tab label="Brands" />
          </Tabs>
        </Box>

        {/* BRANDS TAB */}
        <CustomTabPanel value={tabValue} index={2}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-black text-[#0f172a] flex items-center gap-2">
              <Tag className="text-pink-500" size={20} />
              Manage Brands
            </h2>
            <button
              onClick={() => handleOpenBrandDialog()}
              className="px-4 py-2 bg-[#0f172a] text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center gap-2"
            >
              <Plus size={16} />
              Add Brand
            </button>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-xl border border-white/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">Logo</th>
                    <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">Name</th>
                    <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">Description</th>
                    <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50">
                  {brands.map((brand) => (
                    <tr key={brand._id} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden flex items-center justify-center p-1">
                          {brand.logo ? (
                            <img src={brand.logo} alt={brand.name} className="w-full h-full object-contain" />
                          ) : (
                            <ImageIcon className="text-slate-300" size={20} />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-700">{brand.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">{brand.description || '-'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenBrandDialog(brand)}
                            className="w-9 h-9 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteBrand(brand._id)}
                            className="w-9 h-9 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {brands.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Tag size={32} className="text-slate-300 mb-2" />
                          No brands found. Click "Add Brand" to create one.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CustomTabPanel>

        {/* CATEGORIES TAB */}
        <CustomTabPanel value={tabValue} index={0}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-black text-[#0f172a] flex items-center gap-2">
              <Layers className="text-amber-500" size={20} />
              Manage Categories
            </h2>
            <button
              onClick={() => handleOpenCategoryDialog()}
              className="px-4 py-2 bg-[#0f172a] text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center gap-2"
            >
              <Plus size={16} />
              Add Category
            </button>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-xl border border-white/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">Image</th>
                    <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">Name</th>
                    <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">Description</th>
                    <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">Status</th>
                    <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50">
                  {categories.map((cat) => (
                    <tr key={cat._id} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden flex items-center justify-center p-1">
                          {cat.cImage ? (
                            <img src={Array.isArray(cat.cImage) ? cat.cImage[0] : cat.cImage} alt={cat.cName} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="text-slate-300" size={20} />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-700">{cat.cName}</td>
                      <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">{cat.cDescription || '-'}</td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          cat.cStatus === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cat.cStatus === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                          {cat.cStatus}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenCategoryDialog(cat)}
                            className="w-9 h-9 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat._id)}
                            className="w-9 h-9 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Layers size={32} className="text-slate-300 mb-2" />
                          No categories found. Click "Add Category" to create one.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CustomTabPanel>

        {/* SUBCATEGORIES TAB */}
        <CustomTabPanel value={tabValue} index={1}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-black text-[#0f172a] flex items-center gap-2">
              <Layers className="text-sky-500" size={20} />
              Manage Subcategories
            </h2>

            <div className="flex items-center gap-4">
              <FormControl sx={{ minWidth: 250, '& .MuiOutlinedInput-root': { borderRadius: '1rem' } }}>
                <InputLabel>Select Category</InputLabel>
                <Select
                  value={selectedCategoryForSub}
                  label="Select Category"
                  onChange={(e) => setSelectedCategoryForSub(e.target.value)}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat._id} value={cat._id}>
                      {cat.cName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <button
                onClick={() => handleOpenSubCategoryDialog()}
                disabled={!selectedCategoryForSub}
                className="px-4 py-2 bg-[#0f172a] text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center gap-2 disabled:opacity-50 h-[56px]"
              >
                <Plus size={16} />
                Add Subcategory
              </button>
            </div>
          </div>

          {selectedCategoryForSub ? (
            <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-xl border border-white/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">Image</th>
                      <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">Name</th>
                      <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">Description</th>
                      <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">Status</th>
                      <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/50">
                    {subCategories.map((sub) => (
                      <tr key={sub._id} className="hover:bg-indigo-50/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden flex items-center justify-center p-1">
                            {sub.image ? (
                              <img src={sub.image} alt={sub.name} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              <ImageIcon className="text-slate-300" size={20} />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-700">{sub.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">{sub.description || '-'}</td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            sub.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sub.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                            {sub.status}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleOpenSubCategoryDialog(sub)}
                              className="w-9 h-9 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteSubCategory(sub._id)}
                              className="w-9 h-9 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {subCategories.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Layers size={32} className="text-slate-300 mb-2" />
                            No subcategories found in this category. Click "Add Subcategory" to create one.
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50/50 rounded-[2.5rem] p-12 text-center border border-slate-200 border-dashed flex flex-col items-center justify-center">
              <FolderTree size={48} className="text-slate-300 mb-4" />
              <h3 className="text-lg font-black text-slate-700 mb-1">Select a Category</h3>
              <p className="text-slate-500 font-medium">Please select a category from the dropdown above to view and manage its subcategories.</p>
            </div>
          )}
        </CustomTabPanel>

        {/* --- DIALOGS --- */}

        {/* Brand Dialog */}
        {brandDialog && (
        <div className="fixed top-[88px] left-0 md:left-72 right-0 bottom-0 bg-black/60 backdrop-blur-sm z-[999] flex items-start justify-center p-4 animate-fade-in overflow-y-auto" onClick={() => setBrandDialog(false)}>
          <div className="bg-white/95 backdrop-blur-xl border border-white/50 rounded-[2.5rem] w-full max-w-xl shadow-[0_30px_60px_rgba(0,0,0,0.35)] overflow-hidden animate-scale-in my-8" onClick={e => e.stopPropagation()}>
            <div className="border-b border-slate-100 flex items-center justify-between py-6 px-8 bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center text-pink-600 shadow-sm">
                  <Tag size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#0f172a]">{editingBrand ? 'Edit Brand' : 'Add Brand'}</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{editingBrand ? 'Modify existing brand' : 'Create a new brand'}</p>
                </div>
              </div>
              <button onClick={() => setBrandDialog(false)} className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-all shadow-sm">
                <X size={18} />
              </button>
            </div>
            <div className="p-8">
            <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Brand Name"
                fullWidth
                value={brandForm.name}
                onChange={(e) => setBrandForm((p) => ({ ...p, name: e.target.value }))}
              />
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={brandForm.description}
                onChange={(e) => setBrandForm((p) => ({ ...p, description: e.target.value }))}
              />

              <Button variant="outlined" component="label" startIcon={<ImageIcon />}>
                Upload Logo
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, setBrandForm)}
                />
              </Button>

              {brandForm.logo && (
                <Typography variant="caption" color="text.secondary">
                  {brandForm.logo instanceof File ? brandForm.logo.name : 'Image uploaded'}
                </Typography>
              )}
            </Box>
            </div>

            <div className="border-t border-slate-100 p-6 flex justify-end gap-3 bg-slate-50/50">
              <button 
                onClick={() => setBrandDialog(false)}
                className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl transition-all shadow-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveBrand} 
                disabled={loading}
                className="px-6 py-2.5 text-sm font-bold text-white bg-pink-600 hover:bg-pink-700 rounded-2xl transition-all shadow-lg shadow-pink-200 flex items-center gap-2"
              >
                {loading ? <CircularProgress size={16} color="inherit" /> : null}
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
        )}

        {/* Category Dialog */}
        {categoryDialog && (
        <div className="fixed top-[88px] left-0 md:left-72 right-0 bottom-0 bg-black/60 backdrop-blur-sm z-[999] flex items-start justify-center p-4 animate-fade-in overflow-y-auto" onClick={() => setCategoryDialog(false)}>
          <div className="bg-white/95 backdrop-blur-xl border border-white/50 rounded-[2.5rem] w-full max-w-xl shadow-[0_30px_60px_rgba(0,0,0,0.35)] overflow-hidden animate-scale-in my-8" onClick={e => e.stopPropagation()}>
            <div className="border-b border-slate-100 flex items-center justify-between py-6 px-8 bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-sm">
                  <Layers size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#0f172a]">{editingCategory ? 'Edit Category' : 'Add Category'}</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{editingCategory ? 'Modify existing category' : 'Create a new category'}</p>
                </div>
              </div>
              <button onClick={() => setCategoryDialog(false)} className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-all shadow-sm">
                <X size={18} />
              </button>
            </div>
            <div className="p-8">
            <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Category Name"
                fullWidth
                value={categoryForm.name}
                onChange={(e) => setCategoryForm((p) => ({ ...p, name: e.target.value }))}
              />
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={categoryForm.description}
                onChange={(e) => setCategoryForm((p) => ({ ...p, description: e.target.value }))}
              />

              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={categoryForm.status}
                  label="Status"
                  onChange={(e) => setCategoryForm((p) => ({ ...p, status: e.target.value }))}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>

              <Button variant="outlined" component="label" startIcon={<ImageIcon />}>
                Upload Image
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, setCategoryForm)}
                />
              </Button>

              {categoryForm.image && (
                <Typography variant="caption" color="text.secondary">
                  {categoryForm.image instanceof File ? categoryForm.image.name : 'Image uploaded'}
                </Typography>
              )}
            </Box>
            </div>

            <div className="border-t border-slate-100 p-6 flex justify-end gap-3 bg-slate-50/50">
              <button 
                onClick={() => setCategoryDialog(false)}
                className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl transition-all shadow-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveCategory} 
                disabled={loading}
                className="px-6 py-2.5 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-2xl transition-all shadow-lg shadow-amber-200 flex items-center gap-2"
              >
                {loading ? <CircularProgress size={16} color="inherit" /> : null}
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
        )}

        {/* Subcategory Dialog */}
        {subCategoryDialog && (
        <div className="fixed top-[88px] left-0 md:left-72 right-0 bottom-0 bg-black/60 backdrop-blur-sm z-[999] flex items-start justify-center p-4 animate-fade-in overflow-y-auto" onClick={() => setSubCategoryDialog(false)}>
          <div className="bg-white/95 backdrop-blur-xl border border-white/50 rounded-[2.5rem] w-full max-w-xl shadow-[0_30px_60px_rgba(0,0,0,0.35)] overflow-hidden animate-scale-in my-8" onClick={e => e.stopPropagation()}>
            <div className="border-b border-slate-100 flex items-center justify-between py-6 px-8 bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-600 shadow-sm">
                  <FolderTree size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#0f172a]">{editingSubCategory ? 'Edit Subcategory' : 'Add Subcategory'}</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{editingSubCategory ? 'Modify existing subcategory' : 'Create a new subcategory'}</p>
                </div>
              </div>
              <button onClick={() => setSubCategoryDialog(false)} className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-all shadow-sm">
                <X size={18} />
              </button>
            </div>
            <div className="p-8">
            <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Subcategory Name"
                fullWidth
                value={subCategoryForm.name}
                onChange={(e) => setSubCategoryForm((p) => ({ ...p, name: e.target.value }))}
              />

              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={subCategoryForm.description}
                onChange={(e) => setSubCategoryForm((p) => ({ ...p, description: e.target.value }))}
              />

              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={subCategoryForm.status}
                  label="Status"
                  onChange={(e) => setSubCategoryForm((p) => ({ ...p, status: e.target.value }))}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>

              <Button variant="outlined" component="label" startIcon={<ImageIcon />}>
                Upload Image
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, setSubCategoryForm)}
                />
              </Button>

              {subCategoryForm.image && (
                <Typography variant="caption" color="text.secondary">
                  {subCategoryForm.image instanceof File ? subCategoryForm.image.name : 'Image uploaded'}
                </Typography>
              )}
            </Box>
            </div>

            <div className="border-t border-slate-100 p-6 flex justify-end gap-3 bg-slate-50/50">
              <button 
                onClick={() => setSubCategoryDialog(false)}
                className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl transition-all shadow-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveSubCategory} 
                disabled={loading}
                className="px-6 py-2.5 text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-2xl transition-all shadow-lg shadow-sky-200 flex items-center gap-2"
              >
                {loading ? <CircularProgress size={16} color="inherit" /> : null}
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

