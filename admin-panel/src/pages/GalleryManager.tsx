import { useState, useEffect } from 'react';
import api from '../services/api';
import { Trash2, Plus, X } from 'lucide-react';

export default function GalleryManager() {
    const [images, setImages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ title: '', image: '', category: 'General' });

    useEffect(() => {
        loadImages();
    }, []);

    const loadImages = async () => {
        try {
            const res = await api.get('/gallery');
            setImages(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this image?')) return;
        try {
            await api.delete(`/gallery/${id}`);
            loadImages();
        } catch (error) {
            alert('Failed to delete');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/gallery', formData);
            setShowModal(false);
            setFormData({ title: '', image: '', category: 'General' });
            loadImages();
        } catch (error) {
            alert('Failed to upload');
        }
    };

    return (
        <div className="space-y-8 px-4 md:px-8 xl:px-12 pb-20 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 pb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        Gallery <span className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-3 py-1 rounded-full text-xs font-bold tracking-wide shadow-lg shadow-indigo-500/20">CAM</span>
                    </h1>
                    <p className="text-xs font-semibold text-gray-500 mt-2 uppercase tracking-wide">Manage app photos & event highlights</p>
                </div>
                <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-2xl text-xs font-black hover:bg-black shadow-xl shadow-gray-900/20 transition-all hover:-translate-y-0.5 active:scale-95 uppercase tracking-wider">
                    <Plus size={16} /> Add Photo
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="flex flex-col items-center gap-4 animate-pulse">
                        <div className="w-12 h-12 border-4 border-gray-900 border-t-transparent rounded-full animate-spin" />
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Gallery...</div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {images.map((img, idx) => (
                        <div
                            key={img._id}
                            style={{ animationDelay: `${idx * 0.05}s` }}
                            className="group relative aspect-square bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 animate-scale-in"
                        >
                            <img src={img.image} alt={img.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                    <span className="inline-block px-2 py-1 bg-white/20 backdrop-blur-md border border-white/10 rounded-lg text-[9px] font-black text-white uppercase tracking-wider mb-2">
                                        {img.category}
                                    </span>
                                    <p className="text-white text-sm font-black leading-tight mb-1">{img.title}</p>
                                </div>

                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(img._id); }}
                                    className="absolute top-3 right-3 bg-white/10 hover:bg-red-500/80 text-white p-2 rounded-xl backdrop-blur-md transition-all hover:scale-110 shadow-lg"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Empty State */}
                    {images.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Plus size={24} className="text-gray-400" />
                            </div>
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">No Images Yet</h3>
                            <p className="text-xs text-gray-400 font-medium mt-1">Upload photos to get started</p>
                        </div>
                    )}
                </div>
            )}

            {showModal && (
                <div
                    className="fixed top-[73px] left-0 md:left-72 right-0 bottom-0 bg-black/60 backdrop-blur-sm flex justify-center items-start z-[999] p-4 overflow-y-auto"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-scale-in overflow-hidden my-10 flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                            <h2 className="text-lg font-black text-gray-900">Upload Photo</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20} className="text-gray-500" /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Title</label>
                                <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 transition-all placeholder-gray-400" placeholder="e.g. Championship Finals" required />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Category</label>
                                <div className="relative">
                                    <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 transition-all appearance-none cursor-pointer">
                                        <option>General</option>
                                        <option>Match Highlights</option>
                                        <option>Award Ceremony</option>
                                        <option>Behind the Scenes</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Image Upload</label>
                                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer relative group">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    setFormData({ ...formData, image: reader.result as string });
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    {formData.image ? (
                                        <div className="relative">
                                            <img src={formData.image} alt="Preview" className="h-40 mx-auto rounded-xl shadow-lg object-cover" />
                                            <div className="absolute inset-x-0 bottom-0 top-auto bg-black/50 backdrop-blur text-white text-[10px] font-bold py-1 rounded-b-xl">Change Image</div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 py-4 group-hover:scale-105 transition-transform">
                                            <div className="mx-auto w-12 h-12 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center shadow-sm">
                                                <Plus size={20} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-gray-700 uppercase tracking-wide">Click to Upload</p>
                                                <p className="text-[10px] text-gray-400 font-medium mt-1">PNG, JPG up to 10MB</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-gray-900 text-white py-3.5 rounded-xl text-xs font-black hover:bg-black shadow-lg shadow-gray-900/20 hover:-translate-y-0.5 active:scale-95 transition-all uppercase tracking-wider">
                                Upload to Gallery
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
