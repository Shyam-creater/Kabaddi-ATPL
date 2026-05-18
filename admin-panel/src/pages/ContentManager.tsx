import { useEffect, useState } from 'react';
import { contentService } from '../services/contentService';
import { Trash2, Plus, Users, Briefcase, BarChart2, Newspaper, Edit2, Quote as QuoteIcon, PlayCircle, Megaphone, Share2, Lightbulb, BellRing, BookOpen } from 'lucide-react';

export default function ContentManager() {
    const [activeTab, setActiveTab] = useState<'partners' | 'trending' | 'polls' | 'news' | 'quotes' | 'highlights' | 'ads' | 'social' | 'trivia' | 'banners' | 'blogs'>('partners');
    const [loading, setLoading] = useState(true);

    // Data
    const [partners, setPartners] = useState<any[]>([]);
    const [players, setPlayers] = useState<any[]>([]);
    const [polls, setPolls] = useState<any[]>([]);
    const [news, setNews] = useState<any[]>([]);
    const [quotes, setQuotes] = useState<any[]>([]);
    const [highlights, setHighlights] = useState<any[]>([]);
    const [ads, setAds] = useState<any[]>([]);
    const [socials, setSocials] = useState<any[]>([]);
    const [trivia, setTrivia] = useState<any[]>([]);
    const [banners, setBanners] = useState<any[]>([]);
    const [blogs, setBlogs] = useState<any[]>([]);

    // Edit Mode State
    const [editingId, setEditingId] = useState<string | null>(null);

    // Forms
    const [partnerForm, setPartnerForm] = useState({ name: '', logo: '', link: '' });
    const [playerForm, setPlayerForm] = useState({ name: '', role: '', image: '', type: 'image', rank: 1 });
    const [pollForm, setPollForm] = useState({ question: '', optionA: '', optionB: '', active: true });
    const [newsForm, setNewsForm] = useState({ title: '', category: '', image: '', link: '' });
    const [quoteForm, setQuoteForm] = useState({ text: '', author: '', image: '' });
    const [highlightForm, setHighlightForm] = useState({ title: '', duration: '', image: '', videoUrl: '', uploadType: 'url' });
    const [adForm, setAdForm] = useState({ text: '', buttonText: 'Play Now', link: '', active: true });
    const [socialForm, setSocialForm] = useState({ user: '', content: '', image: '', likes: '0', platform: 'twitter' });
    const [triviaForm, setTriviaForm] = useState({ fact: '' });
    const [bannerForm, setBannerForm] = useState({ title: '', text: '', image: '', active: true, link: '/tournament' });
    const [blogForm, setBlogForm] = useState({ title: '', excerpt: '', content: '', image: '', author: '', category: '', tags: '' as string | string[] });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [p, t, pl, n, q, h, a, s, tr, b, bl] = await Promise.all([
                contentService.getPartners().catch(() => []),
                contentService.getTrendingPlayers().catch(() => []),
                contentService.getPolls().catch(() => []),
                contentService.getNews().catch(() => []),
                contentService.getQuotes().catch(() => []),
                contentService.getHighlights().catch(() => []),
                contentService.getAds().catch(() => []),
                contentService.getSocials().catch(() => []),
                contentService.getTrivia().catch(() => []),
                contentService.getBanners().catch(() => []),
                contentService.getBlogs().catch(() => [])
            ]);
            setPartners(Array.isArray(p) ? p : []);
            setPlayers(Array.isArray(t) ? t : []);
            setPolls(Array.isArray(pl) ? pl : []);
            setNews(Array.isArray(n) ? n : []);
            setQuotes(Array.isArray(q) ? q : []);
            setHighlights(Array.isArray(h) ? h : []);
            setAds(Array.isArray(a) ? a : []);
            setSocials(Array.isArray(s) ? s : []);
            setTrivia(Array.isArray(tr) ? tr : []);
            setBanners(Array.isArray(b) ? b : []);
            setBlogs(Array.isArray(bl) ? bl : []);
        } catch (error) {
            console.error('Failed to load content', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Videos can be slightly larger for demo
        if (type === 'highlight-video' && file.size > 50 * 1024 * 1024) return alert('Video too large (Max 50MB)');
        else if (type !== 'highlight-video' && file.size > 10 * 1024 * 1024) return alert('File too large (Max 10MB)');

        const reader = new FileReader();
        reader.onloadend = () => {
            const val = reader.result as string;
            if (type === 'partner') setPartnerForm(p => ({ ...p, logo: val }));
            if (type === 'player') setPlayerForm(p => ({ ...p, image: val }));
            if (type === 'news') setNewsForm(p => ({ ...p, image: val }));
            if (type === 'quote') setQuoteForm(p => ({ ...p, image: val }));
            if (type === 'highlight') setHighlightForm(p => ({ ...p, image: val }));
            if (type === 'highlight-video') setHighlightForm(p => ({ ...p, videoUrl: val }));
            if (type === 'social') setSocialForm(p => ({ ...p, image: val }));
            if (type === 'banner') setBannerForm(p => ({ ...p, image: val }));
            if (type === 'blog') setBlogForm(p => ({ ...p, image: val }));
        };
        reader.readAsDataURL(file);
    };

    // Helper: Generic Submit
    const handleSubmit = async (e: React.FormEvent, apiFuncs: any, form: any, reset: any, setForm: any) => {
        e.preventDefault();
        try {
            if (editingId) await apiFuncs.update(editingId, form);
            else await apiFuncs.create(form);
            setForm(reset);
            setEditingId(null);
            loadData();
        } catch (error) { alert('Operation failed'); }
    };

    // Submit Handlers
    const submitPartner = (e: any) => handleSubmit(e, { create: contentService.createPartner, update: contentService.updatePartner }, partnerForm, { name: '', logo: '', link: '' }, setPartnerForm);
    const submitPlayer = (e: any) => handleSubmit(e, { create: contentService.createTrendingPlayer, update: contentService.updateTrendingPlayer }, playerForm, { name: '', role: '', image: '', type: 'image', rank: 1 }, setPlayerForm);
    const submitPoll = (e: any) => handleSubmit(e, { create: contentService.createPoll, update: contentService.updatePoll }, pollForm, { question: '', optionA: '', optionB: '', active: true }, setPollForm);
    const submitNews = (e: any) => handleSubmit(e, { create: contentService.createNews, update: contentService.updateNews }, newsForm, { title: '', category: '', image: '', link: '' }, setNewsForm);
    const submitQuote = (e: any) => handleSubmit(e, { create: contentService.createQuote, update: contentService.updateQuote }, quoteForm, { text: '', author: '', image: '' }, setQuoteForm);
    const submitHighlight = (e: any) => handleSubmit(e, { create: contentService.createHighlight, update: contentService.updateHighlight }, highlightForm, { title: '', duration: '', image: '', videoUrl: '', uploadType: 'url' }, setHighlightForm);
    const submitAd = (e: any) => handleSubmit(e, { create: contentService.createAd, update: contentService.updateAd }, adForm, { text: '', buttonText: 'Play Now', link: '', active: true }, setAdForm);
    const submitSocial = (e: any) => handleSubmit(e, { create: contentService.createSocial, update: contentService.updateSocial }, socialForm, { user: '', content: '', image: '', likes: '0', platform: 'twitter' }, setSocialForm);
    const submitTrivia = (e: any) => handleSubmit(e, { create: contentService.createTrivia, update: contentService.updateTrivia }, triviaForm, { fact: '' }, setTriviaForm);
    const submitBanner = (e: any) => handleSubmit(e, { create: contentService.createBanner, update: contentService.updateBanner }, bannerForm, { title: '', text: '', image: '', active: true, link: '/tournament' }, setBannerForm);
    const submitBlog = (e: any) => {
        let tagsArray = [];
        if (typeof blogForm.tags === 'string') {
            tagsArray = blogForm.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag);
        } else {
            tagsArray = blogForm.tags || [];
        }
        const dataToSubmit = { ...blogForm, tags: tagsArray };
        handleSubmit(e, { create: contentService.createBlog, update: contentService.updateBlog }, dataToSubmit, { title: '', excerpt: '', content: '', image: '', author: '', category: '', tags: '' }, setBlogForm);
    };

    const handleDelete = async (id: string, type: string) => {
        if (!confirm('Are you sure?')) return;
        try {
            if (type === 'partner') await contentService.deletePartner(id);
            if (type === 'player') await contentService.deleteTrendingPlayer(id);
            if (type === 'poll') await contentService.deletePoll(id);
            if (type === 'news') await contentService.deleteNews(id);
            if (type === 'quote') await contentService.deleteQuote(id);
            if (type === 'highlight') await contentService.deleteHighlight(id);
            if (type === 'ad') await contentService.deleteAd(id);
            if (type === 'social') await contentService.deleteSocial(id);
            if (type === 'trivia') await contentService.deleteTrivia(id);
            if (type === 'banner') await contentService.deleteBanner(id);
            if (type === 'blog') await contentService.deleteBlog(id);

            loadData();
        } catch (error) { alert('Delete failed'); }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setPartnerForm({ name: '', logo: '', link: '' });
        setPlayerForm({ name: '', role: '', image: '', type: 'image', rank: 1 });
        setPollForm({ question: '', optionA: '', optionB: '', active: true });
        setNewsForm({ title: '', category: '', image: '', link: '' });
        setQuoteForm({ text: '', author: '', image: '' });
        setHighlightForm({ title: '', duration: '', image: '', videoUrl: '', uploadType: 'url' });
        setAdForm({ text: '', buttonText: 'Play Now', link: '', active: true });
        setSocialForm({ user: '', content: '', image: '', likes: '0', platform: 'twitter' });

        setTriviaForm({ fact: '' });
        setBannerForm({ title: '', text: '', image: '', active: true, link: '/tournament' });
        setBlogForm({ title: '', excerpt: '', content: '', image: '', author: '', category: '', tags: '' });
    };

    // UI Classes
    // UI Classes - Refined for Compactness & Visibility
    const labelClass = "block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1";
    const inputClass = "w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 outline-none transition-all text-sm font-semibold text-gray-900 placeholder-gray-400";
    const btnClass = "w-full bg-gray-900 hover:bg-black text-white text-xs font-black py-3.5 rounded-xl shadow-lg shadow-gray-900/20 transition-all hover:-translate-y-0.5 mt-2 active:scale-95 uppercase tracking-wider";
    const cardClass = "bg-white rounded-2xl p-0 border border-gray-100 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 group relative overflow-hidden";
    const editBtnClass = "p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors";
    const deleteBtnClass = "p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors";

    if (loading) return (
        <div className="flex justify-center items-center h-[calc(100vh-100px)]">
            <div className="flex flex-col items-center gap-4 animate-pulse">
                <div className="w-12 h-12 border-4 border-gray-900 border-t-transparent rounded-full animate-spin" />
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Content...</div>
            </div>
        </div>
    );

    const sections = [
        { id: 'partners', label: 'Partners', icon: Briefcase },
        { id: 'trending', label: 'Stars', icon: Users },
        { id: 'polls', label: 'Fan Pulse', icon: BarChart2 },
        { id: 'news', label: 'News', icon: Newspaper },
        { id: 'quotes', label: 'Quotes', icon: QuoteIcon },
        { id: 'highlights', label: 'Highlights', icon: PlayCircle },
        { id: 'ads', label: 'Ads', icon: Megaphone },
        { id: 'social', label: 'Social', icon: Share2 },
        { id: 'trivia', label: 'Did You Know', icon: Lightbulb },
        { id: 'banners', label: 'Registration Banners', icon: BellRing },
        { id: 'blogs', label: 'Blogs', icon: BookOpen },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-100 pb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        Home Content <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold tracking-wide">CMS</span>
                    </h1>
                    <p className="text-xs font-semibold text-gray-500 mt-2 uppercase tracking-wide">Manage app homepage sections & featured content</p>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 w-[calc(100%+2rem)] md:w-auto md:mx-0 md:pb-0 scrollbar-hide">
                    <div className="flex bg-gray-50/80 backdrop-blur p-1.5 rounded-2xl border border-gray-200">
                        {sections.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id as any); cancelEdit(); }}
                                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-gray-900 shadow-md transform scale-[1.02]' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-indigo-500' : ''}`} /> {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* FORM COLUMN */}
                <div className="lg:col-span-4 max-h-[calc(100vh-140px)] sticky top-6 overflow-y-auto pr-2 scrollbar-hide">
                    <div className="bg-white rounded-3xl p-6 shadow-xl shadow-gray-100/50 border border-gray-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-bl-[100px] -z-0 opacity-50" />

                        <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center justify-between relative z-10">
                            <span className="flex items-center gap-2"><div className="p-1.5 bg-gray-900 text-white rounded-lg"><Plus className="w-4 h-4" /></div> {editingId ? 'Edit' : 'Add'} Content</span>
                            {editingId && <button onClick={cancelEdit} className="text-[10px] bg-red-50 text-red-500 hover:bg-red-100 px-3 py-1.5 rounded-full font-bold transition-colors uppercase tracking-wider">Cancel Editing</button>}
                        </h3>

                        {activeTab === 'partners' && (
                            <form onSubmit={submitPartner} className="space-y-4 relative z-10">
                                <div><label className={labelClass}>Brand Name</label><input required value={partnerForm.name} onChange={e => setPartnerForm({ ...partnerForm, name: e.target.value })} className={inputClass} placeholder="Enter partner name" /></div>
                                <div><label className={labelClass}>Logo</label><div className="relative"><input type="file" onChange={(e) => handleFileUpload(e, 'partner')} className="w-full text-xs text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer" /></div></div>
                                <div><label className={labelClass}>Link</label><input value={partnerForm.link} onChange={e => setPartnerForm({ ...partnerForm, link: e.target.value })} className={inputClass} placeholder="https://" /></div>
                                <button type="submit" className={btnClass}>{editingId ? 'Update Partner' : 'Add Partner'}</button>
                            </form>
                        )}

                        {activeTab === 'trending' && (
                            <form onSubmit={submitPlayer} className="space-y-4 relative z-10">
                                <div><label className={labelClass}>Player Name</label><input required value={playerForm.name} onChange={e => setPlayerForm({ ...playerForm, name: e.target.value })} className={inputClass} /></div>
                                <div><label className={labelClass}>Role / Title</label><input required value={playerForm.role} onChange={e => setPlayerForm({ ...playerForm, role: e.target.value })} className={inputClass} /></div>
                                <div><label className={labelClass}>Display Rank</label><input type="number" required value={playerForm.rank} onChange={e => setPlayerForm({ ...playerForm, rank: parseInt(e.target.value) })} className={inputClass} /></div>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setPlayerForm({ ...playerForm, type: 'image' })} className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${playerForm.type === 'image' ? 'bg-gray-900 text-white shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>IMAGE</button>
                                    <button type="button" onClick={() => setPlayerForm({ ...playerForm, type: 'video' })} className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${playerForm.type === 'video' ? 'bg-gray-900 text-white shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>VIDEO</button>
                                </div>
                                <div><label className={labelClass}>Media File</label><input type="file" onChange={(e) => handleFileUpload(e, 'player')} className="text-xs w-full" /></div>
                                <button type="submit" className={btnClass}>{editingId ? 'Update Player' : 'Add Player'}</button>
                            </form>
                        )}

                        {activeTab === 'polls' && (
                            <form onSubmit={submitPoll} className="space-y-4 relative z-10">
                                <div><label className={labelClass}>Question</label><textarea required value={pollForm.question} onChange={e => setPollForm({ ...pollForm, question: e.target.value })} className={inputClass} rows={2} /></div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div><label className={labelClass}>Option A</label><input required value={pollForm.optionA} onChange={e => setPollForm({ ...pollForm, optionA: e.target.value })} className={inputClass} /></div>
                                    <div><label className={labelClass}>Option B</label><input required value={pollForm.optionB} onChange={e => setPollForm({ ...pollForm, optionB: e.target.value })} className={inputClass} /></div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer" onClick={() => setPollForm({ ...pollForm, active: !pollForm.active })}>
                                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${pollForm.active ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-300'}`}>
                                        {pollForm.active && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                                    </div>
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide cursor-pointer select-none">Set as Active Poll</label>
                                </div>
                                <button type="submit" className={btnClass}>{editingId ? 'Update Poll' : 'Create Poll'}</button>
                            </form>
                        )}

                        {activeTab === 'news' && (
                            <form onSubmit={submitNews} className="space-y-4 relative z-10">
                                <div><label className={labelClass}>Headline</label><textarea required value={newsForm.title} onChange={e => setNewsForm({ ...newsForm, title: e.target.value })} className={inputClass} rows={2} /></div>
                                <div><label className={labelClass}>Category Tag</label><input required value={newsForm.category} onChange={e => setNewsForm({ ...newsForm, category: e.target.value })} className={inputClass} placeholder="e.g. CRICKET" /></div>
                                <div><label className={labelClass}>Cover Image</label><input type="file" onChange={(e) => handleFileUpload(e, 'news')} className="text-xs w-full" /></div>
                                <div><label className={labelClass}>Article Link</label><input value={newsForm.link} onChange={e => setNewsForm({ ...newsForm, link: e.target.value })} className={inputClass} /></div>
                                <button type="submit" className={btnClass}>{editingId ? 'Update Article' : 'Publish Article'}</button>
                            </form>
                        )}

                        {activeTab === 'quotes' && (
                            <form onSubmit={submitQuote} className="space-y-4 relative z-10">
                                <div><label className={labelClass}>Quote</label><textarea required value={quoteForm.text} onChange={e => setQuoteForm({ ...quoteForm, text: e.target.value })} className={inputClass} rows={3} placeholder="Enter the inspiring quote..." /></div>
                                <div><label className={labelClass}>Author</label><input required value={quoteForm.author} onChange={e => setQuoteForm({ ...quoteForm, author: e.target.value })} className={inputClass} /></div>
                                <div><label className={labelClass}>Author Image</label><input type="file" onChange={(e) => handleFileUpload(e, 'quote')} className="text-xs w-full" /></div>
                                <button type="submit" className={btnClass}>{editingId ? 'Update Quote' : 'Save Quote'}</button>
                            </form>
                        )}

                        {activeTab === 'highlights' && (
                            <form onSubmit={submitHighlight} className="space-y-4 relative z-10">
                                <div><label className={labelClass}>Video Title</label><input required value={highlightForm.title} onChange={e => setHighlightForm({ ...highlightForm, title: e.target.value })} className={inputClass} /></div>
                                <div><label className={labelClass}>Duration</label><input required value={highlightForm.duration} onChange={e => setHighlightForm({ ...highlightForm, duration: e.target.value })} className={inputClass} placeholder="e.g. 10:24" /></div>
                                <div><label className={labelClass}>Thumbnail</label><input type="file" onChange={(e) => handleFileUpload(e, 'highlight')} className="text-xs w-full" /></div>

                                <label className={labelClass}>Video Source</label>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setHighlightForm({ ...highlightForm, uploadType: 'url', videoUrl: '' })} className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${highlightForm.uploadType !== 'file' ? 'bg-gray-900 text-white shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>PASTE URL</button>
                                    <button type="button" onClick={() => setHighlightForm({ ...highlightForm, uploadType: 'file', videoUrl: '' })} className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${highlightForm.uploadType === 'file' ? 'bg-gray-900 text-white shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>UPLOAD FILE</button>
                                </div>

                                {highlightForm.uploadType === 'file' ? (
                                    <div><label className={labelClass}>Upload Video (MP4)</label><input type="file" accept="video/*" onChange={(e) => handleFileUpload(e, 'highlight-video')} className="text-xs w-full" /></div>
                                ) : (
                                    <div><label className={labelClass}>Video URL</label><input value={highlightForm.videoUrl} onChange={e => setHighlightForm({ ...highlightForm, videoUrl: e.target.value })} className={inputClass} placeholder="YouTube URL or raw video URL" /></div>
                                )}

                                <button type="submit" className={btnClass}>{editingId ? 'Update Highlight' : 'Add Highlight'}</button>
                            </form>
                        )}

                        {activeTab === 'ads' && (
                            <form onSubmit={submitAd} className="space-y-4 relative z-10">
                                <div><label className={labelClass}>Ad Content</label><textarea required value={adForm.text} onChange={e => setAdForm({ ...adForm, text: e.target.value })} className={inputClass} rows={2} /></div>
                                <div><label className={labelClass}>Button Text</label><input required value={adForm.buttonText} onChange={e => setAdForm({ ...adForm, buttonText: e.target.value })} className={inputClass} /></div>
                                <div><label className={labelClass}>Target Link</label><input value={adForm.link} onChange={e => setAdForm({ ...adForm, link: e.target.value })} className={inputClass} /></div>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer" onClick={() => setAdForm({ ...adForm, active: !adForm.active })}>
                                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${adForm.active ? 'bg-green-500 border-green-500' : 'bg-white border-gray-300'}`}>
                                        {adForm.active && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                                    </div>
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide cursor-pointer select-none">Set as Active Ad</label>
                                </div>
                                <button type="submit" className={btnClass}>{editingId ? 'Update Ad' : 'Publish Ad'}</button>
                            </form>
                        )}

                        {activeTab === 'social' && (
                            <form onSubmit={submitSocial} className="space-y-4 relative z-10">
                                <div><label className={labelClass}>Social Handle</label><input required value={socialForm.user} onChange={e => setSocialForm({ ...socialForm, user: e.target.value })} className={inputClass} placeholder="@username" /></div>
                                <div><label className={labelClass}>Post Content</label><textarea required value={socialForm.content} onChange={e => setSocialForm({ ...socialForm, content: e.target.value })} className={inputClass} rows={3} /></div>
                                <div><label className={labelClass}>Platform</label><select value={socialForm.platform} onChange={e => setSocialForm({ ...socialForm, platform: e.target.value })} className={inputClass}><option value="twitter">Twitter / X</option><option value="instagram">Instagram</option></select></div>
                                <div><label className={labelClass}>Likes Count</label><input value={socialForm.likes} onChange={e => setSocialForm({ ...socialForm, likes: e.target.value })} className={inputClass} /></div>
                                <div><label className={labelClass}>Post Image</label><input type="file" onChange={(e) => handleFileUpload(e, 'social')} className="text-xs w-full" /></div>
                                <button type="submit" className={btnClass}>{editingId ? 'Update Post' : 'Add Social Post'}</button>
                            </form>
                        )}

                        {activeTab === 'trivia' && (
                            <form onSubmit={submitTrivia} className="space-y-4 relative z-10">
                                <div><label className={labelClass}>Trivia Fact</label><textarea required value={triviaForm.fact} onChange={e => setTriviaForm({ ...triviaForm, fact: e.target.value })} className={inputClass} rows={3} placeholder="Did you know..." /></div>
                                <button type="submit" className={btnClass}>{editingId ? 'Update Fact' : 'Add Trivia'}</button>
                            </form>
                        )}

                        {activeTab === 'banners' && (
                            <form onSubmit={submitBanner} className="space-y-4 relative z-10">
                                <div><label className={labelClass}>Banner Title</label><input required value={bannerForm.title} onChange={e => setBannerForm({ ...bannerForm, title: e.target.value })} className={inputClass} placeholder="Register for Season 5!" /></div>
                                <div><label className={labelClass}>One Line Text</label><input required value={bannerForm.text} onChange={e => setBannerForm({ ...bannerForm, text: e.target.value })} className={inputClass} placeholder="Join the biggest cricket tournament this year." /></div>
                                <div><label className={labelClass}>Background Image</label><input type="file" onChange={(e) => handleFileUpload(e, 'banner')} className="text-xs w-full" /></div>
                                <div><label className={labelClass}>Target Link</label><input value={bannerForm.link} onChange={e => setBannerForm({ ...bannerForm, link: e.target.value })} className={inputClass} placeholder="/tournament or specific URL" /></div>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer" onClick={() => setBannerForm({ ...bannerForm, active: !bannerForm.active })}>
                                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${bannerForm.active ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-300'}`}>
                                        {bannerForm.active && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                                    </div>
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide cursor-pointer select-none">Show on Homepage</label>
                                </div>
                                <button type="submit" className={btnClass}>{editingId ? 'Update Banner' : 'Publish Banner'}</button>
                            </form>
                        )}

                        {activeTab === 'blogs' && (
                            <form onSubmit={submitBlog} className="space-y-4 relative z-10">
                                <div><label className={labelClass}>Blog Title</label><input required value={blogForm.title} onChange={e => setBlogForm({ ...blogForm, title: e.target.value })} className={inputClass} /></div>
                                <div><label className={labelClass}>Author</label><input required value={blogForm.author} onChange={e => setBlogForm({ ...blogForm, author: e.target.value })} className={inputClass} /></div>
                                <div><label className={labelClass}>Category</label><input required value={blogForm.category} onChange={e => setBlogForm({ ...blogForm, category: e.target.value })} className={inputClass} /></div>
                                <div><label className={labelClass}>Excerpt</label><textarea required value={blogForm.excerpt} onChange={e => setBlogForm({ ...blogForm, excerpt: e.target.value })} className={inputClass} rows={2} /></div>
                                <div><label className={labelClass}>Full Content</label><textarea required value={blogForm.content} onChange={e => setBlogForm({ ...blogForm, content: e.target.value })} className={inputClass} rows={5} /></div>
                                <div><label className={labelClass}>Tags (comma-separated)</label><input value={Array.isArray(blogForm.tags) ? blogForm.tags.join(', ') : blogForm.tags} onChange={e => setBlogForm({ ...blogForm, tags: e.target.value })} className={inputClass} placeholder="e.g. cricket, tips" /></div>
                                <div><label className={labelClass}>Cover Image</label><input type="file" onChange={(e) => handleFileUpload(e, 'blog')} className="text-xs w-full" /></div>
                                <button type="submit" className={btnClass}>{editingId ? 'Update Blog' : 'Publish Blog'}</button>
                            </form>
                        )}
                    </div>
                </div>

                {/* LIST COLUMN - NOW GRID */}
                <div className="lg:col-span-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {/* Partners List */}
                        {activeTab === 'partners' && partners.map((p, idx) => (
                            <div key={p._id} className={cardClass} style={{ animationDelay: `${idx * 0.05}s` }}>
                                <div className="p-6 flex flex-col items-center text-center gap-5 h-full">
                                    <div className="w-24 h-24 p-4 bg-gray-50/50 rounded-2xl flex items-center justify-center border border-gray-100 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                        <img src={p.logo} className="w-full h-full object-contain" />
                                    </div>
                                    <div className="flex-1 w-full">
                                        <div className="font-black text-lg text-gray-900 mb-1">{p.name}</div>
                                        {p.link && <a href={p.link} target="_blank" className="text-[10px] font-semibold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md hover:bg-indigo-100 transition-colors truncate block max-w-full">{p.link}</a>}
                                    </div>
                                    <div className="flex items-center gap-2 mt-auto w-full pt-4 border-t border-gray-50 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setPartnerForm(p); setEditingId(p._id); }} className="flex-1 text-xs font-bold py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700">Edit</button>
                                        <button onClick={() => handleDelete(p._id, 'partner')} className="flex-1 text-xs font-bold py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600">Delete</button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Trending List */}
                        {activeTab === 'trending' && players.map(p => (
                            <div key={p._id} className={cardClass}>
                                <div className="relative w-full aspect-[4/3] bg-gray-100 mb-0 overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                                    <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    <div className="absolute top-3 right-3 z-20 bg-white/20 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border border-white/20">{p.type}</div>
                                    <div className="absolute -bottom-1 -left-4 text-9xl font-black text-white/10 z-0 italic select-none">{p.rank}</div>

                                    <div className="absolute bottom-4 left-4 z-20 text-white">
                                        <div className="text-xl font-black leading-none mb-1">{p.name}</div>
                                        <div className="text-xs font-bold text-gray-300 opacity-80 uppercase tracking-wider">{p.role}</div>
                                    </div>
                                </div>
                                <div className="p-3 flex justify-end gap-2 bg-white">
                                    <button onClick={() => { setPlayerForm(p); setEditingId(p._id); }} className={editBtnClass}><Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete(p._id, 'player')} className={deleteBtnClass}><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))}

                        {/* Polls List */}
                        {activeTab === 'polls' && polls.map(p => (
                            <div key={p._id} className={`${cardClass} ${p.active ? 'ring-2 ring-gray-900 ring-offset-2' : ''}`}>
                                <div className="p-6 h-full flex flex-col">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                            <BarChart2 size={14} /> Poll
                                        </div>
                                        {p.active && <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">LIVE</span>}
                                    </div>
                                    <div className="font-black text-xl text-gray-900 leading-tight mb-6">{p.question}</div>
                                    <div className="flex-1 flex flex-col gap-3">
                                        <div className="p-3 bg-gray-50 rounded-xl text-sm font-bold border border-gray-100 flex justify-between items-center group/opt hover:border-gray-300 transition-colors">
                                            <span>{p.optionA}</span>
                                            <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-xl text-sm font-bold border border-gray-100 flex justify-between items-center group/opt hover:border-gray-300 transition-colors">
                                            <span>{p.optionB}</span>
                                            <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                                        </div>
                                    </div>
                                    <div className="flex gap-2 w-full pt-4 mt-6 border-t border-gray-100">
                                        <button onClick={() => { setPollForm(p); setEditingId(p._id); }} className={`${editBtnClass} flex-1 text-center bg-gray-50`}>Edit</button>
                                        <button onClick={() => handleDelete(p._id, 'poll')} className={`${deleteBtnClass} flex-1 text-center bg-red-50`}>Delete</button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* News List */}
                        {activeTab === 'news' && news.map(n => (
                            <div key={n._id} className={cardClass}>
                                <div className="w-full aspect-video bg-gray-100 mb-0 overflow-hidden relative">
                                    <img src={n.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute top-3 left-3 bg-indigo-600 text-white text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider shadow-lg">{n.category}</div>
                                </div>
                                <div className="p-5">
                                    <h3 className="font-black text-gray-900 line-clamp-2 leading-snug text-lg mb-4">{n.title}</h3>
                                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                                        <button onClick={() => { setNewsForm(n); setEditingId(n._id); }} className={`${editBtnClass} flex-1 text-center`}>EDIT</button>
                                        <button onClick={() => handleDelete(n._id, 'news')} className={`${deleteBtnClass} flex-1 text-center`}>DELETE</button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Quotes List */}
                        {activeTab === 'quotes' && quotes.map(p => (
                            <div key={p._id} className={cardClass}>
                                {p.image && (
                                    <div className="absolute inset-0 z-0">
                                        <img src={p.image} className="w-full h-full object-cover opacity-10" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-white/90" />
                                    </div>
                                )}
                                <div className="p-8 h-full flex flex-col w-full relative z-10">
                                    <QuoteIcon className="w-8 h-8 text-indigo-500 mb-4 opacity-50" />
                                    <div className="font-serif italic text-xl text-gray-800 leading-relaxed flex-1 mb-6">"{p.text}"</div>
                                    <div className="flex items-center gap-3">
                                        <div className="h-0.5 flex-1 bg-gray-100" />
                                        <div className="text-sm font-black text-gray-900 uppercase tracking-wider">{p.author}</div>
                                    </div>
                                    <div className="flex gap-2 w-full pt-4 mt-6 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setQuoteForm(p); setEditingId(p._id); }} className="flex-1 text-xs font-bold text-indigo-600 hover:underline">Edit Quote</button>
                                        <button onClick={() => handleDelete(p._id, 'quote')} className="flex-1 text-xs font-bold text-red-500 hover:underline">Delete Quote</button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Highlights List */}
                        {activeTab === 'highlights' && highlights.map(p => (
                            <div key={p._id} className={cardClass}>
                                <div className="relative w-full aspect-video bg-gray-900 mb-0 overflow-hidden group-hover:scale-[1.02] transition-transform origin-bottom duration-300">
                                    <img src={p.image} className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <PlayCircle className="w-12 h-12 text-white drop-shadow-lg" />
                                        </div>
                                    </div>
                                    <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">{p.duration}</div>
                                </div>
                                <div className="p-4">
                                    <div className="font-bold text-gray-900 line-clamp-2 mb-3">{p.title}</div>
                                    <div className="flex gap-2 w-full pt-3 border-t border-gray-100">
                                        <button onClick={() => { setHighlightForm(p); setEditingId(p._id); }} className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-900"><Edit2 size={16} /></button>
                                        <button onClick={() => handleDelete(p._id, 'highlight')} className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Ads List */}
                        {activeTab === 'ads' && ads.map(p => (
                            <div key={p._id} className="relative rounded-2xl p-6 bg-gradient-to-br from-gray-900 to-black text-white shadow-xl overflow-hidden group hover:-translate-y-1 transition-transform">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />
                                <div className="relative z-10 flex flex-col h-full items-center text-center gap-4">
                                    <div className="text-[9px] font-black tracking-[0.2em] text-white/40 bg-white/5 px-3 py-1.5 rounded-lg uppercase">SPONSORED AD</div>
                                    <div className="font-black text-xl leading-tight flex-1 py-4">{p.text}</div>
                                    <button className="px-6 py-3 bg-white text-black text-xs font-black rounded-xl w-full uppercase tracking-wider hover:bg-gray-200 transition-colors">{p.buttonText}</button>

                                    <div className="flex gap-4 w-full pt-4 mt-2 border-t border-white/10 opacity-50 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setAdForm(p); setEditingId(p._id); }} className="flex-1 text-xs font-bold text-white hover:text-white hover:underline">Edit</button>
                                        <button onClick={() => handleDelete(p._id, 'ad')} className="flex-1 text-xs font-bold text-red-400 hover:text-red-300 hover:underline">Remove</button>
                                    </div>
                                    {p.active && <div className="absolute top-4 right-4 w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />}
                                </div>
                            </div>
                        ))}

                        {/* Social List */}
                        {activeTab === 'social' && socials.map(p => (
                            <div key={p._id} className={cardClass}>
                                {p.image && <div className="w-full h-36 mb-0 bg-cover bg-center" style={{ backgroundImage: `url(${p.image})` }} />}
                                <div className="p-5">
                                    <div className="flex items-center gap-3 mb-3 -mt-10 relative z-10">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg border-2 border-white ${p.platform === 'instagram' ? 'bg-gradient-to-bl from-purple-600 to-orange-500' : 'bg-black'}`}>
                                            <Share2 className="w-5 h-5" />
                                        </div>
                                        <div className="mt-6">
                                            <div className="font-black text-sm text-gray-900">{p.user}</div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{p.likes} Likes</div>
                                        </div>
                                    </div>
                                    <div className="text-sm font-medium text-gray-600 mb-4 line-clamp-3 leading-relaxed">"{p.content}"</div>
                                    <div className="flex gap-2 w-full pt-3 border-t border-gray-100">
                                        <button onClick={() => { setSocialForm(p); setEditingId(p._id); }} className={`${editBtnClass} flex-1 text-center`}>Edit</button>
                                        <button onClick={() => handleDelete(p._id, 'social')} className={`${deleteBtnClass} flex-1 text-center`}>Delete</button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Trivia List */}
                        {activeTab === 'trivia' && trivia.map(p => (
                            <div key={p._id} className={`${cardClass} bg-yellow-50/50 border-yellow-200/50`}>
                                <div className="p-6 flex flex-col h-full gap-4">
                                    <div className="flex items-center gap-2 text-yellow-700 font-black text-xs uppercase tracking-widest">
                                        <Lightbulb className="w-4 h-4" /> Did You Know?
                                    </div>
                                    <div className="font-bold text-gray-800 text-lg leading-snug flex-1">{p.fact}</div>
                                    <div className="flex gap-2 w-full pt-4 mt-2 border-t border-yellow-200/50">
                                        <button onClick={() => { setTriviaForm(p); setEditingId(p._id); }} className="p-2 text-yellow-700 hover:bg-yellow-100 rounded-lg flex-1 flex justify-center items-center"><Edit2 className="w-4 h-4" /></button>
                                        <button onClick={() => handleDelete(p._id, 'trivia')} className="p-2 text-red-600 hover:bg-red-50 rounded-lg flex-1 flex justify-center items-center"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Banners List */}
                        {activeTab === 'banners' && banners.map(p => (
                            <div key={p._id} className={`${cardClass} overflow-hidden`}>
                                <div className="relative w-full aspect-[2/1] bg-gray-900">
                                    <img src={p.image} className="w-full h-full object-cover opacity-60" />
                                    <div className="absolute inset-0 p-4 flex flex-col justify-end bg-gradient-to-t from-black/80 to-transparent">
                                        <div className="font-black text-white text-sm uppercase leading-tight mb-1">{p.title}</div>
                                        <div className="text-[10px] text-gray-300 font-bold line-clamp-1">{p.text}</div>
                                    </div>
                                    {p.active && <div className="absolute top-2 right-2 bg-green-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">Active</div>}
                                </div>
                                <div className="p-3 flex gap-2 bg-white">
                                    <button onClick={() => { setBannerForm(p); setEditingId(p._id); }} className={editBtnClass}><Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete(p._id, 'banner')} className={deleteBtnClass}><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))}

                        {/* Blogs List */}
                        {activeTab === 'blogs' && blogs.map(p => (
                            <div key={p._id} className={cardClass}>
                                <div className="w-full h-40 bg-gray-100 mb-0 overflow-hidden relative">
                                    <img src={p.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute top-3 left-3 bg-indigo-600 text-white text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider">{p.category}</div>
                                </div>
                                <div className="p-5">
                                    <h3 className="font-black text-gray-900 line-clamp-2 leading-snug text-lg mb-2">{p.title}</h3>
                                    <div className="text-xs text-gray-500 mb-4">By {p.author}</div>
                                    <div className="text-sm font-medium text-gray-600 mb-4 line-clamp-3">{p.excerpt}</div>
                                    <div className="flex gap-2 w-full pt-3 border-t border-gray-100">
                                        <button onClick={() => { setBlogForm({...p, tags: Array.isArray(p.tags) ? p.tags.join(', ') : p.tags}); setEditingId(p._id); }} className={`${editBtnClass} flex-1 text-center`}>Edit</button>
                                        <button onClick={() => handleDelete(p._id, 'blog')} className={`${deleteBtnClass} flex-1 text-center`}>Delete</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div >
    );
}
