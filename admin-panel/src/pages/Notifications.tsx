import { useState, useEffect } from 'react';
import { 
    Send, Users, Bell, Search, CheckCircle2, 
    Smartphone, Info, Sparkles, Target, Radio,
    Upload, X, Trash2, Edit2, Clock, History,
    RefreshCw
} from 'lucide-react';
import api from '../services/api';

export default function Notifications() {
    const [type, setType] = useState<'broadcast' | 'targeted'>('broadcast');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [search, setSearch] = useState('');
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [image, setImage] = useState<string | null>(null);
    const [contentImage, setContentImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    
    const [history, setHistory] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        if (type === 'targeted') {
            loadUsers();
        }
        loadHistory();
    }, [type]);

    const loadHistory = async () => {
        setHistoryLoading(true);
        try {
            const res = await api.get('/notifications/admin');
            if (res.data.success) {
                setHistory(res.data.data);
            }
        } catch (error) {
            console.error('Failed to load history:', error);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleSend = async () => {
        if (!title || !message) return alert('Please enter title and message');
        if (type === 'targeted' && selectedUsers.length === 0) return alert('Please select at least one user');

        setSending(true);
        try {
            if (editingId) {
                // UPDATE MODE
                await api.put(`/notifications/admin/${editingId}`, {
                    title,
                    body: message,
                    image,
                    contentImage
                });
                alert('Notification blast updated successfully!');
            } else {
                // CREATE MODE
                await api.post('/notifications/send', {
                    title,
                    body: message,
                    image,
                    contentImage,
                    type,
                    userIds: type === 'targeted' ? selectedUsers : []
                });
                alert('Notification stack deployed successfully!');
            }
            
            setTitle('');
            setMessage('');
            setImage(null);
            setContentImage(null);
            setSelectedUsers([]);
            setEditingId(null);
            loadHistory();
        } catch (error) {
            alert('Mission failed: ' + ((error as any).response?.data?.message || 'Server Error'));
        } finally {
            setSending(false);
        }
    };

    const handleEdit = (item: any) => {
        setEditingId(item._id);
        setTitle(item.title);
        setMessage(item.body);
        setImage(item.image);
        setContentImage(item.contentImage);
        setType(item.type);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (broadcastId: string) => {
        if (!confirm('Are you sure you want to purge this notification from all user inboxes?')) return;
        try {
            await api.delete(`/notifications/admin/${broadcastId}`);
            loadHistory();
        } catch (error) {
            alert('Failed to delete');
        }
    };

    const loadUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/users');
            if (res.data.success) {
                setUsers(res.data.data);
            }
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isContent = false) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) return alert('Image too large (Max 5MB)');

        const reader = new FileReader();
        reader.onloadend = () => {
            if (isContent) setContentImage(reader.result as string);
            else setImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const toggleUser = (userId: string) => {
        setSelectedUsers(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId) 
                : [...prev, userId]
        );
    };

    const filteredUsers = users.filter(u => 
        u.name?.toLowerCase().includes(search.toLowerCase()) || 
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="w-full space-y-6 md:space-y-8 pb-12 animate-fade-in font-['Outfit'] pt-8">
            {/* Header Suite */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-gray-100 pb-10">
                <div className="space-y-3">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-600 rounded-2xl shadow-xl shadow-red-600/20">
                            <Radio className="text-white animate-pulse" size={28} />
                        </div>
                        <h1 className="text-5xl font-black text-gray-900 tracking-tighter">Communication Matrix</h1>
                    </div>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-[0.25em] ml-1">Universal Message Control & Push Deployment</p>
                </div>

                <div className="flex bg-gray-100/80 backdrop-blur-md p-1 rounded-3xl border border-gray-200 self-start lg:self-center">
                    <button 
                        onClick={() => setType('broadcast')}
                        className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${type === 'broadcast' ? 'bg-white text-gray-900 shadow-lg shadow-gray-900/5' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Users size={16} /> Global Broadcast
                    </button>
                    <button 
                        onClick={() => setType('targeted')}
                        className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${type === 'targeted' ? 'bg-white text-gray-900 shadow-lg shadow-gray-900/5' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Target size={16} /> Targeted Transmission
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start relative">
                {/* Deployment Console */}
                <div className="xl:col-span-7 space-y-10 relative">
                    <div className="bg-white rounded-[4rem] p-12 border border-gray-100 shadow-[0_30px_70px_rgba(0,0,0,0.04)] relative overflow-hidden ring-1 ring-black/[0.02]">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                            <Send size={240} />
                        </div>

                        <div className="space-y-10 relative z-10">
                            <div className="flex items-center gap-5 border-b border-gray-50 pb-8 mb-4">
                                <div className="p-2 bg-red-50 rounded-lg">
                                    <Sparkles className="text-red-600" size={24} />
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Message Payload</h2>
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-6">Subject Line</label>
                                    <input 
                                        type="text"
                                        placeholder="Enter notification title..."
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full bg-gray-50/50 border-2 border-gray-50 focus:border-red-600 focus:bg-white p-6 rounded-[2.5rem] outline-none transition-all font-bold text-gray-900 text-lg placeholder:text-gray-300 shadow-inner"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-6">Content Body</label>
                                    <textarea 
                                        placeholder="What is your message to the users?"
                                        rows={5}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        className="w-full bg-gray-50/50 border-2 border-gray-50 focus:border-red-600 focus:bg-white p-6 rounded-[2.5rem] outline-none transition-all font-bold text-gray-900 text-lg placeholder:text-gray-300 shadow-inner resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-6">Logo Icon (Left)</label>
                                        {!image ? (
                                            <div className="relative group cursor-pointer h-40">
                                                <input 
                                                    type="file" 
                                                    onChange={handleFileUpload}
                                                    accept="image/*"
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                />
                                                <div className="w-full h-full bg-gray-50/50 border-2 border-dashed border-gray-200 group-hover:border-red-600/30 group-hover:bg-red-50/10 p-4 rounded-[2rem] flex flex-col items-center justify-center gap-2 transition-all">
                                                    <Upload className="text-gray-400 group-hover:text-red-600" size={20} />
                                                    <p className="text-[10px] font-black text-gray-900 uppercase">Logo</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="relative w-full h-40 bg-gray-900 rounded-[2rem] overflow-hidden group shadow-xl">
                                                <img src={image} className="w-full h-full object-cover opacity-80" />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => setImage(null)} className="p-3 bg-red-600 text-white rounded-full shadow-lg hover:scale-110 transition-transform"><X size={18} /></button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-6">Content Image (Right)</label>
                                        {!contentImage ? (
                                            <div className="relative group cursor-pointer h-40">
                                                <input 
                                                    type="file" 
                                                    onChange={(e) => handleFileUpload(e, true)}
                                                    accept="image/*"
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                />
                                                <div className="w-full h-full bg-gray-50/50 border-2 border-dashed border-gray-200 group-hover:border-red-600/30 group-hover:bg-red-50/10 p-4 rounded-[2rem] flex flex-col items-center justify-center gap-2 transition-all">
                                                    <Upload className="text-gray-400 group-hover:text-red-600" size={20} />
                                                    <p className="text-[10px] font-black text-gray-900 uppercase">Medium Asset</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="relative w-full h-40 bg-gray-900 rounded-[2rem] overflow-hidden group shadow-xl">
                                                <img src={contentImage} className="w-full h-full object-cover opacity-80" />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => setContentImage(null)} className="p-3 bg-red-600 text-white rounded-full shadow-lg hover:scale-110 transition-transform"><X size={18} /></button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-50/50 mt-4">
                                <button 
                                    onClick={handleSend}
                                    disabled={sending}
                                    className="w-full py-8 bg-gray-950 text-white rounded-[3.5rem] font-black uppercase tracking-[0.3em] text-[11px] flex items-center justify-center gap-6 hover:bg-red-600 hover:shadow-[0_20px_50px_rgba(220,38,38,0.3)] transition-all active:scale-[0.98] shadow-2xl shadow-gray-900/20 group overflow-hidden relative"
                                >
                                    {sending ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Transmitting Data
                                        </>
                                    ) : (
                                        <>
                                            <span className="relative z-10">{editingId ? 'Update Notification Pulse' : 'Deploy Notification Pulse'}</span>
                                            <Send size={20} className="group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform duration-500 relative z-10" />
                                        </>
                                    )}
                                </button>
                                {editingId && (
                                    <button 
                                        onClick={() => {
                                            setEditingId(null);
                                            setTitle('');
                                            setMessage('');
                                            setImage(null);
                                            setContentImage(null);
                                        }}
                                        className="w-full mt-4 py-4 bg-gray-100 text-gray-500 rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all font-['Outfit']"
                                    >
                                        Cancel Editing
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {type === 'targeted' && (
                        <div className="bg-white rounded-[4rem] p-12 border border-gray-100 shadow-[0_30px_70px_rgba(0,0,0,0.04)] animate-slide-up ring-1 ring-black/[0.02]">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
                                <div className="space-y-2">
                                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Recipient Selection</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                                        <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">{selectedUsers.length} Targets Locked</p>
                                    </div>
                                </div>
                                <div className="relative flex-1 max-w-sm">
                                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input 
                                        type="text"
                                        placeholder="Search user record..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full bg-gray-50/50 border-none pl-14 pr-6 py-5 rounded-[2rem] text-sm font-bold shadow-inner outline-none focus:ring-2 focus:ring-red-600/10"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-h-[500px] overflow-y-auto pr-6 custom-scrollbar">
                                {loading ? (
                                    <div className="col-span-full py-24 flex flex-col items-center justify-center gap-5 text-gray-300">
                                        <div className="w-14 h-14 border-[5px] border-gray-100 border-t-red-600 rounded-full animate-spin" />
                                        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400">Querying User Index...</p>
                                    </div>
                                ) : filteredUsers.map(user => (
                                    <button 
                                        key={user._id}
                                        onClick={() => toggleUser(user._id)}
                                        className={`flex items-center gap-5 p-5 rounded-[2rem] border-2 transition-all duration-300 ${
                                            selectedUsers.includes(user._id) 
                                            ? 'border-red-600 bg-red-50/40 shadow-lg shadow-red-600/5' 
                                            : 'border-gray-50 bg-white hover:border-gray-200 hover:bg-gray-50/50'
                                        }`}
                                    >
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg text-white shadow-lg transition-transform ${selectedUsers.includes(user._id) ? 'scale-110 bg-red-600' : user.gender === 'Female' ? 'bg-pink-500' : 'bg-gray-950'}`}>
                                            {selectedUsers.includes(user._id) ? <CheckCircle2 size={24} /> : user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="text-left flex-1">
                                            <p className="font-black text-gray-900 text-sm truncate max-w-[140px] uppercase tracking-tight">{user.name}</p>
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mt-0.5">{user.role}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Device Preview */}
                <div className="xl:col-span-5 space-y-12 sticky top-24 pb-12">
                    <div className="bg-gray-950 rounded-[5rem] p-7 shadow-[0_50px_100px_rgba(0,0,0,0.15)] relative border-[12px] border-gray-900 h-[780px] flex flex-col overflow-hidden ring-1 ring-white/10 mx-auto max-w-[400px]">
                        <div className="absolute top-0 inset-x-0 h-10 flex justify-center items-center z-20">
                            <div className="w-32 h-6 bg-gray-900 rounded-b-3xl" />
                        </div>

                        {/* Lock Screen Preview */}
                        <div className="flex-1 bg-gradient-to-br from-indigo-900 via-gray-950 to-black rounded-[4rem] p-8 pt-20 flex flex-col items-center gap-10">
                            <div className="text-center space-y-3">
                                <p className="text-7xl font-thin text-white/90 tracking-tighter">
                                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                <p className="text-xs font-black text-white/40 uppercase tracking-[0.3em]">
                                    {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                                </p>
                            </div>

                            {/* Notification Bubble */}
                            {(title || message) && (
                                <div className="w-full bg-white/10 backdrop-blur-3xl border border-white/20 rounded-[2.5rem] p-6 space-y-3 animate-bounce-in shadow-2xl relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/30">
                                                <Bell className="text-white" size={14} />
                                            </div>
                                            <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">ATPL SCORE</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-white/40">NOW</span>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-1 space-y-2">
                                            <h4 className="font-black text-white text-lg tracking-tight leading-tight">{title || 'Subject Line Preview'}</h4>
                                            <p className="text-sm font-medium text-white/60 leading-relaxed line-clamp-3">{message || 'Your message content will appear exactly like this on user devices...'}</p>
                                        </div>
                                        {(image || contentImage) && (
                                            <div className="flex flex-col gap-2 shrink-0">
                                                {contentImage && (
                                                    <div className="w-24 h-16 rounded-xl overflow-hidden shadow-2xl border border-white/10 shrink-0 self-start">
                                                        <img src={contentImage} className="w-full h-full object-cover" />
                                                    </div>
                                                )}
                                                {image && !contentImage && (
                                                     <div className="w-12 h-12 rounded-full overflow-hidden shadow-2xl border border-white/10 shrink-0 self-end">
                                                        <img src={image} className="w-full h-full object-cover" />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="mt-auto pb-6">
                                <div className="w-40 h-1.5 bg-white/20 rounded-full blur-[0.5px]" />
                            </div>
                        </div>

                        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-5 text-white/20 bg-white/5 px-6 py-3 rounded-full border border-white/5">
                            <Smartphone size={20} />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap">Push Emulation Mode</p>
                        </div>
                    </div>

                    <div className="bg-white/40 backdrop-blur-3xl border border-white rounded-[3rem] p-8 space-y-4 ring-1 ring-black/[0.01]">
                        <div className="flex items-center gap-4 text-red-600">
                            <div className="p-2 bg-red-50 rounded-xl">
                                <Info size={18} />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest text-gray-900">Security Certificate</span>
                        </div>
                        <p className="text-[11px] font-bold text-gray-500 leading-relaxed uppercase tracking-tight">
                            All transmissions are cryptographically signed. System broadcasts use high-priority edge delivery via **Expo Global Network** reaching all active identities.
                        </p>
                    </div>
                </div>
            </div>

            {/* Recent Transmission History */}
            <div className="space-y-8 animate-slide-up">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gray-900 rounded-2xl">
                            <History className="text-white" size={24} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Transmission History</h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Audit Log of Deployed Clusters</p>
                        </div>
                    </div>
                    <button onClick={loadHistory} className="p-3 hover:bg-gray-100 rounded-xl transition-all">
                        <RefreshCw className={`text-gray-400 ${historyLoading ? 'animate-spin text-red-600' : ''}`} size={20} />
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {historyLoading && history.length === 0 ? (
                        <div className="py-20 text-center animate-pulse">
                            <p className="text-sm font-black text-gray-300 uppercase tracking-widest">Accessing Logs...</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-gray-100">
                            <Bell className="mx-auto text-gray-100 mb-6" size={64} />
                            <p className="text-sm font-black text-gray-300 uppercase tracking-widest">No previous pulses detected in this sector</p>
                        </div>
                    ) : (
                        history.map((item) => (
                            <div key={item._id} className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm flex flex-col lg:flex-row items-center gap-8 hover:border-red-600/10 transition-all group">
                                <div className="w-20 h-20 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-100">
                                    {item.image ? (
                                        <img src={item.image} className="w-full h-full object-cover" />
                                    ) : (
                                        <Bell className="text-gray-200" size={32} />
                                    )}
                                </div>
                                <div className="flex-1 space-y-2 text-center lg:text-left">
                                    <div className="flex flex-wrap justify-center lg:justify-start items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${item.type === 'broadcast' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                                            {item.type} Pulse
                                        </span>
                                        <span className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                            <Clock size={10} /> {new Date(item.createdAt).toLocaleString()}
                                        </span>
                                        <span className="flex items-center gap-1.5 text-[9px] font-black text-red-600 uppercase tracking-widest bg-red-50 px-3 py-1 rounded-full">
                                            <Users size={10} /> {item.recipientCount} Recipients
                                        </span>
                                    </div>
                                    <h4 className="text-xl font-black text-gray-900 group-hover:text-red-600 transition-colors uppercase tracking-tight line-clamp-1">{item.title}</h4>
                                    <p className="text-xs font-bold text-gray-500 line-clamp-2 leading-relaxed">{item.body}</p>
                                </div>
                                <div className="flex items-center gap-3 lg:border-l border-gray-100 lg:pl-8">
                                    <button 
                                        onClick={() => handleEdit(item)}
                                        className="p-4 bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all active:scale-90"
                                        title="Recalibrate Pulse"
                                    >
                                        <Edit2 size={20} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(item._id)}
                                        className="p-4 bg-gray-50 text-gray-400 hover:text-gray-950 hover:bg-gray-100 rounded-2xl transition-all active:scale-90"
                                        title="Purge Transmission"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
