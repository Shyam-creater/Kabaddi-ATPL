import { useState, useEffect } from 'react';
import { shippingService, type ShippingFee } from '../services/shippingService';
import { Truck, Plus, X, MapPin, Edit, Trash2, Search, Package, RefreshCcw, CheckCircle } from 'lucide-react';

export default function ShippingManager() {
    const [fees, setFees] = useState<ShippingFee[]>([]);
    const [filteredFees, setFilteredFees] = useState<ShippingFee[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingFee, setEditingFee] = useState<ShippingFee | null>(null);

    const [formData, setFormData] = useState<any>({
        state: '',
        productdeliveryfee: '',
        combodeliveryfee: '',
        above500_deliveryfee: '',
        above_1kg_deliveryfee: '',
    });

    useEffect(() => {
        loadFees();
    }, []);

    useEffect(() => {
        const filtered = fees.filter(f => (f.state || '').toLowerCase().includes((searchTerm || '').toLowerCase()));
        setFilteredFees(filtered);
    }, [searchTerm, fees]);

    const loadFees = async () => {
        try {
            setLoading(true);
            const data = await shippingService.getAllFees();
            setFees(data);
        } catch (error) {
            console.error('Failed to load shipping fees:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (fee?: ShippingFee) => {
        if (fee) {
            setEditingFee(fee);
            setFormData({ ...fee });
        } else {
            setEditingFee(null);
            setFormData({
                state: '',
                productdeliveryfee: '',
                combodeliveryfee: '',
                above500_deliveryfee: '',
                above_1kg_deliveryfee: '',
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingFee(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setActionLoading(true);
            const sanitizedData: ShippingFee = {
                ...formData,
                productdeliveryfee: Number(formData.productdeliveryfee) || 0,
                combodeliveryfee: Number(formData.combodeliveryfee) || 0,
                above500_deliveryfee: Number(formData.above500_deliveryfee) || 0,
                above_1kg_deliveryfee: Number(formData.above_1kg_deliveryfee) || 0,
            };
            if (editingFee && editingFee._id) {
                await shippingService.updateFee(editingFee._id, sanitizedData);
            } else {
                await shippingService.addFee(sanitizedData);
            }
            await loadFees();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving shipping fee:', error);
            alert('Failed to save shipping fee');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id?: string) => {
        if (!id) return;
        if (!confirm('Are you sure you want to delete this shipping fee configuration?')) return;
        try {
            setActionLoading(true);
            await shippingService.deleteFee(id);
            await loadFees();
        } catch (error) {
            console.error('Error deleting fee:', error);
            alert('Failed to delete shipping fee');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading && fees.length === 0) {
        return (
            <div className="flex justify-center items-center h-[calc(100vh-100px)] bg-[#fcfcfc]">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative w-20 h-20">
                        <div className="absolute inset-0 border-4 border-blue-100 rounded-full" />
                        <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <div className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] animate-pulse">Initializing Shipping DB</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-24 px-4 md:px-8 xl:px-12 space-y-10 animate-fade-in bg-[#fcfcfc]">
            {/* Header section */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pt-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20">
                        <Truck className="text-white" size={26} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900">Shipping Network</h1>
                        <div className="flex items-center gap-1 mt-1">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            <p className="text-[8px] font-medium text-gray-400 uppercase tracking-wide whitespace-nowrap">Global Delivery Grid</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full xl:w-auto">
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-gray-900 flex items-center justify-center">
                            <MapPin size={20} className="text-white" />
                        </div>
                        <div>
                            <div className="text-xl font-black text-gray-900">{fees.length}</div>
                            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Active Regions</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative group flex-1 w-full">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search by state or region..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-6 py-5 bg-white border-2 border-gray-100 rounded-[2rem] text-sm font-bold text-gray-900 outline-none focus:border-blue-600/20 focus:ring-8 focus:ring-blue-600/5 transition-all shadow-sm"
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button
                        onClick={loadFees}
                        className="p-5 bg-white border-2 border-gray-100 rounded-[1.5rem] text-gray-400 hover:text-blue-600 transition-all active:scale-95 shadow-sm"
                    >
                        <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex-1 md:w-auto px-8 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[11px] hover:shadow-xl hover:shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                        <Plus size={18} /> Add Region
                    </button>
                </div>
            </div>

            {/* Data Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredFees.map((fee, idx) => (
                    <div key={fee._id} style={{ animationDelay: `${idx * 0.05}s` }} className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group animate-fade-in overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-transparent rounded-bl-full -z-10 opacity-50" />

                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                                    <MapPin size={22} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900">{fee.state}</h3>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Zone</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleOpenModal(fee)} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                                    <Edit size={14} />
                                </button>
                                <button onClick={() => handleDelete(fee._id)} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                <span className="text-xs font-bold text-gray-500 flex items-center gap-2"><Package size={14} /> Standard Delivery</span>
                                <span className="text-sm font-black text-gray-900">₹{fee.productdeliveryfee}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                <span className="text-xs font-bold text-gray-500 flex items-center gap-2"><Package size={14} /> Combo Delivery</span>
                                <span className="text-sm font-black text-gray-900">₹{fee.combodeliveryfee}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                <span className="text-xs font-bold text-gray-500">Orders &gt; ₹500</span>
                                <span className="text-sm font-black text-emerald-600">₹{fee.above500_deliveryfee}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                <span className="text-xs font-bold text-gray-500">Weight &gt; 1kg</span>
                                <span className="text-sm font-black text-orange-500">₹{fee.above_1kg_deliveryfee}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredFees.length === 0 && !loading && (
                <div className="py-20 text-center">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Truck size={40} className="text-gray-300" />
                    </div>
                    <h3 className="text-xl font-black text-gray-300 uppercase tracking-widest">No Shipping Regions</h3>
                </div>
            )}

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed top-[88px] left-0 md:left-72 right-0 bottom-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 animate-fade-in overflow-y-auto" onClick={handleCloseModal}>
                    <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-[0_30px_60px_rgba(0,0,0,0.35)] overflow-hidden animate-scale-in my-8" onClick={e => e.stopPropagation()}>
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                                    <Truck className="text-white" size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900">{editingFee ? 'Edit Shipping Region' : 'New Shipping Region'}</h2>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">Configure Delivery Matrix</p>
                                </div>
                            </div>
                            <button onClick={handleCloseModal} className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:border-gray-900 transition-all shadow-sm">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">State / Region Name</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.state}
                                    onChange={e => setFormData({ ...formData, state: e.target.value })}
                                    className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                    placeholder="e.g., Maharashtra"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                        Standard Delivery (₹)
                                    </label>
                                    <input
                                        required
                                        type="number"
                                        min="0"
                                        value={formData.productdeliveryfee}
                                        onChange={e => {
                                            const val = e.target.value.replace(/^0+(?=\d)/, '');
                                            setFormData({
                                                ...formData,
                                                productdeliveryfee: val === '' ? '' : parseInt(val, 10),
                                            });
                                        }}
                                        placeholder="0"
                                        className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                        Combo Delivery (₹)
                                    </label>
                                    <input
                                        required
                                        type="number"
                                        min="0"
                                        value={formData.combodeliveryfee}
                                        onChange={e => {
                                            const val = e.target.value.replace(/^0+(?=\d)/, '');
                                            setFormData({
                                                ...formData,
                                                combodeliveryfee: val === '' ? '' : parseInt(val, 10),
                                            });
                                        }}
                                        placeholder="0"
                                        className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                        Orders Above ₹500 (₹)
                                    </label>
                                    <input
                                        required
                                        type="number"
                                      min="0"
                                        value={formData.above500_deliveryfee}
                                        onChange={e => {
                                            const val = e.target.value.replace(/^0+(?=\d)/, '');
                                            setFormData({
                                                ...formData,
                                                above500_deliveryfee: val === '' ? '' : parseInt(val, 10),
                                            });
                                        }}
                                        placeholder="0"
                                        className="w-full p-4 bg-emerald-50 border-2 border-emerald-100 rounded-2xl text-sm font-black text-emerald-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                        Weight Above 1kg (₹)
                                    </label>
                                    <input
                                        required
                                        type="number"
                                        min="0"
                                        value={formData.above_1kg_deliveryfee}
                                        onChange={e => {
                                            const val = e.target.value.replace(/^0+(?=\d)/, '');
                                            setFormData({
                                                ...formData,
                                                above_1kg_deliveryfee: val === '' ? '' : parseInt(val, 10),
                                            });
                                        }}
                                        placeholder="0"
                                        className="w-full p-4 bg-orange-50 border-2 border-orange-100 rounded-2xl text-sm font-black text-orange-700 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="pt-6">
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:shadow-xl hover:shadow-blue-500/30 transition-all active:scale-[0.98] disabled:opacity-50 flex justify-center items-center gap-2"
                                >
                                    {actionLoading ? <RefreshCcw size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                                    {editingFee ? 'Update Configuration' : 'Deploy Configuration'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
