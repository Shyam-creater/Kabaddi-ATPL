import { useEffect, useState } from 'react';
import { Plus, Trash2, X, ShoppingCart, ImagePlus, Pencil } from 'lucide-react';
import {
    getProducts,
    createProduct,
    deleteProduct,
    updateProduct,
    type Product
} from '../services/storeService';

export default function Store() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        price: '',
        category: '',
        image: '',
        description: ''
    });

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const data = await getProducts();
            setProducts(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, image: reader.result as string }));
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingProduct) {
                await updateProduct(editingProduct._id, {
                    ...formData,
                    price: Number(formData.price)
                });
            } else {
                await createProduct({
                    ...formData,
                    price: Number(formData.price)
                });
            }

            setIsModalOpen(false);
            setEditingProduct(null);
            setFormData({ title: '', price: '', category: '', image: '', description: '' });
            loadProducts();
        } catch {
            alert('Action failed');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this product?')) return;
        await deleteProduct(id);
        loadProducts();
    };

    const openCreate = () => {
        setEditingProduct(null);
        setFormData({ title: '', price: '', category: '', image: '', description: '' });
        setIsModalOpen(true);
    };

    const openEdit = (p: Product) => {
        setEditingProduct(p);
        setFormData({
            title: p.title,
            price: String(p.price),
            category: p.category,
            image: p.image,
            description: p.description
        });
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6 px-4 md:px-8 xl:px-12 pb-20">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-black flex items-center gap-2">
                    Store <ShoppingCart className="text-indigo-500" />
                </h1>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold"
                >
                    <Plus size={16} /> New Product
                </button>
            </div>

            {/* Product Grid */}
            {loading ? (
                <div className="text-center text-gray-400">Loading products...</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {products.map(p => (
                        <div key={p._id} className="rounded-2xl bg-white shadow p-4 relative">
                            <img
                                src={p.image}
                                alt={p.title}
                                className="h-44 w-full object-contain rounded-xl mb-3 bg-gray-100"
                            />
                            <h3 className="font-bold text-sm">{p.title}</h3>
                            <p className="text-xs text-gray-500">{p.category}</p>
                            <p className="text-sm font-black mt-1">₹{p.price}</p>

                            <div className="flex gap-2 mt-3">
                                <button
                                    onClick={() => openEdit(p)}
                                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                                >
                                    <Pencil size={14} />
                                </button>
                                <button
                                    onClick={() => handleDelete(p._id)}
                                    className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* CREATE / UPDATE MODAL */}
            {isModalOpen && (
                <div
                    className="fixed top-[73px] left-0 md:left-72 right-0 bottom-0 bg-black/60 backdrop-blur-sm flex justify-center items-start z-[999] p-4 overflow-y-auto"
                    onClick={() => {
                        setIsModalOpen(false);
                        setEditingProduct(null);
                    }}
                >
                    <div
                        className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-10 animate-scale-in"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
                            <h2 className="font-black text-lg">
                                {editingProduct ? 'Edit Product' : 'Create Product'}
                            </h2>
                            <button
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setEditingProduct(null);
                                }}
                            >
                                <X />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-5">


                            {/* Image Upload */}
                            <label className="block">
                                <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    Product Image
                                </span>

                                <input
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    onChange={e => e.target.files && handleImageUpload(e.target.files[0])}
                                />

                                <div className="h-40 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-all">
                                    {formData.image ? (
                                        <img
                                            src={formData.image}
                                            className="h-full w-full object-cover rounded-2xl"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center text-gray-400">
                                            <ImagePlus size={28} />
                                            <span className="text-xs mt-1 font-semibold">Upload Image</span>
                                        </div>
                                    )}
                                </div>
                            </label>

                            {/* Title */}
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    Product Title
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Premium Sports Jersey"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl
                 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900
                 outline-none transition-all text-sm font-semibold text-gray-900
                 placeholder-gray-400"
                                />
                            </div>

                            {/* Price & Category */}
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                                        Price
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        placeholder="Ex: 999"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl
                   focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900
                   outline-none text-sm font-semibold text-gray-900"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                                        Category
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ex: Sportswear"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl
                   focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900
                   outline-none text-sm font-semibold text-gray-900"
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    Description
                                </label>
                                <textarea
                                    required
                                    placeholder="Short product description..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl
                 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900
                 outline-none transition-all text-sm font-semibold text-gray-900
                 placeholder-gray-400 h-24 resize-none"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setEditingProduct(null);
                                    }}
                                    className="flex-1 py-3 text-xs font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-gray-900 text-white text-xs font-bold rounded-xl
                 hover:bg-black shadow-lg shadow-gray-900/20 transition-all hover:scale-[1.02]"
                                >
                                    {editingProduct ? 'Update Product' : 'Create Product'}
                                </button>
                            </div>

                        </form>

                    </div>
                </div>
            )}
        </div>
    );
}
