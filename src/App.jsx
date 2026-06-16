import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken, 
  signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut,
  GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail
} from 'firebase/auth';
import { 
  getFirestore, collection, doc, setDoc, getDoc, updateDoc, onSnapshot, deleteDoc, arrayUnion
} from 'firebase/firestore';
import { 
  getStorage, ref, uploadBytes, getDownloadURL 
} from 'firebase/storage';
import { 
  Clock, ShieldAlert, Link as LinkIcon, PlusCircle, Copy, AlertTriangle, 
  User, LogOut, BookOpen, Lock, UploadCloud, Star, Edit, Trash2, Search, Settings, 
  Check, FileText, Globe, Camera
} from 'lucide-react';

const firebaseConfig = {
  apiKey: "AIzaSyCGJLpVAXZMm2US7S-bwjNjyJtf0VsSV2Y",
  authDomain: "authorsafe.firebaseapp.com",
  projectId: "authorsafe",
  storageBucket: "authorsafe.firebasestorage.app",
  messagingSenderId: "453655231430",
  appId: "1:453655231430:web:d94246f4574e70f4ed90c7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); 
const appId = 'writer-dashboard-v3';

// Konfigurasi Tema Author
const THEMES = {
  emerald: { bg: 'bg-emerald-600', hover: 'hover:bg-emerald-700', text: 'text-emerald-700', light: 'bg-emerald-50', ring: 'focus:ring-emerald-500', border: 'border-emerald-200' },
  indigo: { bg: 'bg-indigo-600', hover: 'hover:bg-indigo-700', text: 'text-indigo-700', light: 'bg-indigo-50', ring: 'focus:ring-indigo-500', border: 'border-indigo-200' },
  rose: { bg: 'bg-rose-600', hover: 'hover:bg-rose-700', text: 'text-rose-700', light: 'bg-rose-50', ring: 'focus:ring-rose-500', border: 'border-rose-200' },
  slate: { bg: 'bg-slate-800', hover: 'hover:bg-slate-900', text: 'text-slate-800', light: 'bg-slate-100', ring: 'focus:ring-slate-500', border: 'border-slate-300' }
};

// ==========================================
// KOMPONEN UTAMA: ROUTER & LAYOUT
// ==========================================
export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('reader'); 
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsAuthReady(true);
      } else {
        try {
          await signInAnonymously(auth);
        } catch (err) {
          console.error("Gagal membuat sesi klien:", err);
          setIsAuthReady(true);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  if (!isAuthReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
          <p className="text-slate-700 animate-pulse font-medium text-sm">Menghubungkan ke Server...</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await signOut(auth);
    setView('reader');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 flex flex-row justify-between items-center gap-2 sm:gap-4 w-full">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-1.5 shrink-0">
          <ShieldAlert className="w-6 h-6 sm:w-7 sm:h-7" />
          <span className="hidden xs:inline">WriterSecure</span>
          <span className="text-[10px] sm:text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full ml-1 whitespace-nowrap">Cloud V4.1</span>
        </h1>
        
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <button 
            onClick={() => setView('reader')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-sm sm:text-base font-bold transition-all duration-300 flex items-center gap-1.5 ${view === 'reader' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
          >
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5"/> 
            <span className="hidden sm:inline">Akses Klien</span>
            <span className="inline sm:hidden">Klien</span>
          </button>
          <button 
            onClick={() => setView('admin')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-sm sm:text-base font-bold transition-all duration-300 flex items-center gap-1.5 ${view === 'admin' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
          >
            <Lock className="w-4 h-4 sm:w-5 sm:h-5"/> 
            <span className="hidden sm:inline">Ruang Penulis</span>
            <span className="inline sm:hidden">Penulis</span>
          </button>
          
          {user && !user.isAnonymous && (
            <button onClick={handleLogout} className="p-2 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors ml-1 sm:ml-2" title="Keluar">
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>
      </nav>

      <main className="p-4 sm:p-6 max-w-7xl mx-auto w-full overflow-hidden">
        {view === 'reader' && <ReaderSimulator user={user} />}
        {view === 'admin' && (
          user?.isAnonymous ? <AuthScreen /> : <AdminDashboard user={user} />
        )}
      </main>
    </div>
  );
}

// ==========================================
// VIEW: LOGIN & REGISTRASI EMAIL
// ==========================================
function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setInfoMsg(''); setIsProcessing(true);
    try {
      if (isLogin) await signInWithEmailAndPassword(auth, email, password);
      else await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') setError('Email ini sudah terdaftar.');
      else if (err.code === 'auth/wrong-password') setError('Password salah.');
      else if (err.code === 'auth/user-not-found') setError('Email belum terdaftar.');
      else setError('Terjadi kesalahan. Pastikan format email valid.');
    }
    setIsProcessing(false);
  };

  const handleGoogleLogin = async () => {
    setError(''); setInfoMsg(''); setIsProcessing(true);
    const provider = new GoogleAuthProvider();
    try { await signInWithPopup(auth, provider); } 
    catch (err) { setError('Gagal login dengan akun Google.'); }
    setIsProcessing(false);
  };

  const handleResetPassword = async () => {
    setError(''); setInfoMsg('');
    if (!email) return setError('Masukkan alamat email di atas terlebih dahulu, lalu klik Lupa Password.');
    setIsProcessing(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setInfoMsg('Tautan reset password telah dikirim ke email Anda.');
    } catch (err) { setError('Gagal mengirim email reset.'); }
    setIsProcessing(false);
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 mt-6 sm:mt-10">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-slate-100 text-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3">
          <User className="w-8 h-8 -rotate-3" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Ruang Khusus Penulis</h2>
        <p className="text-slate-500 text-sm mt-2">Masuk untuk menulis cerita dan mengelola klien.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-500 outline-none transition-all"
            placeholder="nama@email.com" />
        </div>
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-sm font-bold text-slate-700">Password</label>
            {isLogin && <button type="button" onClick={handleResetPassword} className="text-xs text-indigo-600 hover:text-indigo-800 font-bold transition-colors">Lupa Password?</button>}
          </div>
          <input type="password" required={isLogin} value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-500 outline-none transition-all"
            placeholder="Minimal 6 karakter" />
        </div>
        
        {error && <p className="text-rose-600 text-sm font-medium bg-rose-50 border border-rose-100 p-3 rounded-xl">{error}</p>}
        {infoMsg && <p className="text-emerald-700 text-sm font-medium bg-emerald-50 border border-emerald-100 p-3 rounded-xl">{infoMsg}</p>}

        <button type="submit" disabled={isProcessing} className="w-full bg-black hover:bg-slate-800 text-white py-3 rounded-xl font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 mt-4">
          {isProcessing ? 'Memproses...' : (isLogin ? 'Masuk dengan Email' : 'Daftar Akun Baru')}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between">
        <span className="w-1/5 border-b border-slate-200"></span>
        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Atau masuk dengan</span>
        <span className="w-1/5 border-b border-slate-200"></span>
      </div>

      <button onClick={handleGoogleLogin} disabled={isProcessing} className="w-full mt-6 bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-700 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
        <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
        Lanjutkan dengan Google
      </button>

      <div className="mt-8 text-center text-sm text-slate-600">
        {isLogin ? "Belum punya akun?" : "Sudah punya akun?"}
        <button onClick={() => {setIsLogin(!isLogin); setError(''); setInfoMsg('');}} className="text-indigo-600 font-bold ml-1 hover:text-indigo-700 hover:underline">
          {isLogin ? 'Daftar Sekarang' : 'Masuk di sini'}
        </button>
      </div>
    </div>
  );
}

// ==========================================
// VIEW: DASHBOARD PENULIS (ADMIN)
// ==========================================
function AdminDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('write'); 
  
  const [authorProfile, setAuthorProfile] = useState({ 
    displayName: user.email.split('@')[0], 
    photoURL: '', 
    theme: 'emerald',
    social: { instagram: '', twitter: '', tiktok: '', website: '' }
  });
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [stories, setStories] = useState([]);
  const [tokens, setTokens] = useState([]);
  
  // State Tulis Cerita
  const [editStoryId, setEditStoryId] = useState(null);
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [content, setContent] = useState('');
  const [pdfFile, setPdfFile] = useState(null); 
  const [savedPdfUrl, setSavedPdfUrl] = useState(''); 
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // State Link Generator
  const [searchStory, setSearchStory] = useState('');
  const [selectedStory, setSelectedStory] = useState('');
  const [duration, setDuration] = useState('30');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState('');

  // Sinkronisasi Data Author & Cerita
  useEffect(() => {
    if (!user || user.isAnonymous) return;

    // Fetch Profile
    const profileRef = doc(db, 'artifacts', appId, 'public', 'data', 'authors', user.uid);
    const unsubProfile = onSnapshot(profileRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (!data.social) data.social = { instagram: '', twitter: '', tiktok: '', website: '' }; 
        setAuthorProfile(data);
      } else {
        setDoc(profileRef, authorProfile); 
      }
    });

    // Fetch Stories
    const storiesRef = collection(db, 'artifacts', appId, 'public', 'data', 'stories');
    const unsubStories = onSnapshot(storiesRef, (snapshot) => {
      const allStories = snapshot.docs.map(doc => doc.data());
      const myStories = allStories.filter(s => s.authorId === user.uid).sort((a,b) => b.createdAt - a.createdAt);
      setStories(myStories);
    });

    // Fetch Tokens
    const tokensRef = collection(db, 'artifacts', appId, 'public', 'data', 'access_tokens');
    const unsubTokens = onSnapshot(tokensRef, (snapshot) => {
      const now = Date.now();
      const myTokens = [];
      snapshot.docs.forEach((document) => {
        const data = document.data();
        let isExpired = data.status === 'expired' || (data.status === 'active' && data.startedAt && now >= data.startedAt + data.duration);
        if (isExpired) deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'access_tokens', document.id)).catch(console.error);
        else if (data.authorId === user.uid) myTokens.push(data); 
      });
      setTokens(myTokens.sort((a,b) => b.createdAt - a.createdAt));
    });

    return () => { unsubProfile(); unsubStories(); unsubTokens(); };
  }, [user]);

  const currentTheme = THEMES[authorProfile.theme] || THEMES.emerald;
  const filteredStoriesForLink = stories.filter(s => s.title.toLowerCase().includes(searchStory.toLowerCase()));

  // Fitur Upload Foto Profil
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const storageRef = ref(storage, `avatars/${user.uid}_${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setAuthorProfile(prev => ({ ...prev, photoURL: url }));
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'authors', user.uid), { photoURL: url });
    } catch (err) {
      alert("Gagal mengunggah foto.");
      console.error(err);
    }
    setIsUploadingPhoto(false);
  };

  // Fitur Drag & Drop TXT & PDF
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (file.type === "text/plain" || file.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (e) => { setContent(e.target.result); setPdfFile(null); setSavedPdfUrl(''); };
      reader.readAsText(file);
    } else if (file.type === "application/pdf" || file.name.endsWith('.pdf')) {
      setPdfFile(file);
      setContent(''); 
    } else {
      alert("Format tidak didukung. Mohon masukkan file teks (.txt) atau dokumen (.pdf)");
    }
  };

  const handleSaveStory = async () => {
    if (!title || (!content && !pdfFile && !savedPdfUrl)) return alert("Judul dan isi cerita (atau file PDF) harus diisi!");
    setIsSaving(true);
    
    let finalPdfUrl = savedPdfUrl;

    if (pdfFile) {
      try {
        const storageRef = ref(storage, `stories/${user.uid}_${Date.now()}_${pdfFile.name}`);
        await uploadBytes(storageRef, pdfFile);
        finalPdfUrl = await getDownloadURL(storageRef);
      } catch (err) {
        alert("Gagal mengunggah file PDF.");
        setIsSaving(false);
        return;
      }
    }

    const storyId = editStoryId || `story-${Date.now()}`;
    const storyRef = doc(db, 'artifacts', appId, 'public', 'data', 'stories', storyId);
    
    const storyPayload = {
      id: storyId, title, content, genre,
      pdfUrl: finalPdfUrl, 
      authorId: user.uid, authorEmail: user.email, 
      updatedAt: Date.now()
    };

    if (!editStoryId) {
      storyPayload.createdAt = Date.now();
      storyPayload.reviews = []; 
    }
    
    if (editStoryId) await updateDoc(storyRef, storyPayload);
    else await setDoc(storyRef, storyPayload);

    setTitle(''); setContent(''); setGenre(''); setPdfFile(null); setSavedPdfUrl(''); 
    setEditStoryId(null); setIsSaving(false);
    setActiveTab('bank'); 
  };

  const editStory = (story) => {
    setEditStoryId(story.id);
    setTitle(story.title);
    setContent(story.content || '');
    setGenre(story.genre || '');
    setSavedPdfUrl(story.pdfUrl || '');
    setPdfFile(null);
    setActiveTab('write');
  };

  const deleteStory = async (storyId) => {
    if (window.confirm('Yakin ingin menghapus cerita ini?')) {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'stories', storyId));
    }
  };

  const handleGenerateLink = async () => {
    if (!selectedStory) return alert("Pilih cerita terlebih dahulu!");
    if (!duration || parseInt(duration) < 1) return alert("Durasi minimal 1 menit!");
    
    setIsGenerating(true);
    const tokenId = `token-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const tokenRef = doc(db, 'artifacts', appId, 'public', 'data', 'access_tokens', tokenId);
    const targetStory = stories.find(s => s.id === selectedStory);

    await setDoc(tokenRef, {
      id: tokenId, storyId: selectedStory, storyTitle: targetStory.title,
      authorId: user.uid, duration: parseInt(duration) * 60 * 1000, 
      status: 'pending', createdAt: Date.now(), startedAt: null, deviceId: null
    });
    setIsGenerating(false);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'authors', user.uid), authorProfile);
    alert('Profil dan Tema berhasil diperbarui!');
  };

  return (
    <div className={`space-y-6 sm:space-y-8 animate-fade-in`}>
      {/* HEADER DASHBOARD */}
      <div className={`bg-gradient-to-br from-slate-900 to-black border border-slate-800 text-white p-5 sm:p-6 rounded-3xl shadow-lg flex items-center justify-between relative overflow-hidden`}>
        <div className={`absolute top-0 right-0 w-32 h-32 ${currentTheme.text} opacity-20 blur-3xl rounded-full bg-current`}></div>
        <div className="relative z-10 flex items-center gap-4">
          <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-white/20 overflow-hidden bg-slate-800 flex items-center justify-center shrink-0`}>
            {authorProfile.photoURL ? <img src={authorProfile.photoURL} alt="Profile" className="w-full h-full object-cover" /> : <User className="w-8 h-8 text-slate-400" />}
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold mb-0.5 tracking-wider uppercase">Welcome back,</p>
            <p className="font-bold text-xl">{authorProfile.displayName}</p>
          </div>
        </div>
      </div>

      {/* TABS NAVIGASI */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 border-b border-slate-200 pb-2">
        <button onClick={() => setActiveTab('write')} className={`px-5 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all ${activeTab === 'write' ? `${currentTheme.bg} text-white shadow-md` : 'bg-white text-slate-600 hover:bg-slate-100'}`}>Tulis Cerita</button>
        <button onClick={() => setActiveTab('bank')} className={`px-5 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all ${activeTab === 'bank' ? `${currentTheme.bg} text-white shadow-md` : 'bg-white text-slate-600 hover:bg-slate-100'}`}>Bank Cerita ({stories.length})</button>
        <button onClick={() => setActiveTab('profile')} className={`px-5 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all ${activeTab === 'profile' ? `${currentTheme.bg} text-white shadow-md` : 'bg-white text-slate-600 hover:bg-slate-100'}`}>Profil & Tema</button>
      </div>

      {/* TAB 1: TULIS CERITA */}
      {activeTab === 'write' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-5 sm:p-8 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800">{editStoryId ? '✏️ Edit Cerita' : '📝 Tulis Cerita Baru'}</h2>
                <p className="text-slate-500 text-sm">Cerita otomatis terenkripsi di Cloud.</p>
              </div>
              {editStoryId && (
                <button onClick={() => {setEditStoryId(null); setTitle(''); setContent(''); setGenre(''); setPdfFile(null); setSavedPdfUrl('');}} className="text-sm font-bold text-rose-500 hover:bg-rose-50 px-3 py-1.5 rounded-lg">Batal Edit</button>
              )}
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Judul Cerita / Bab</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl ${currentTheme.ring} outline-none transition-all`} placeholder="Judul Karya" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Genre (Opsional)</label>
                  <input type="text" value={genre} onChange={(e) => setGenre(e.target.value)} className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl ${currentTheme.ring} outline-none transition-all`} placeholder="Romance, Thriller..." />
                </div>
              </div>

              {/* Area Konten atau Tampilan PDF */}
              {pdfFile || savedPdfUrl ? (
                <div className={`p-6 border-2 border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between`}>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-100 text-red-600 rounded-lg"><FileText className="w-8 h-8" /></div>
                    <div>
                      <p className="font-bold text-slate-800">File PDF Terlampir</p>
                      <p className="text-sm text-slate-500">{pdfFile ? pdfFile.name : 'Dokumen PDF tersimpan di Cloud'}</p>
                    </div>
                  </div>
                  <button onClick={() => { setPdfFile(null); setSavedPdfUrl(''); }} className="p-2 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors" title="Hapus Dokumen PDF">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div 
                  className={`relative border-2 ${isDragging ? `${currentTheme.border} border-dashed ${currentTheme.light}` : 'border-slate-300 border-solid'} rounded-xl overflow-hidden transition-all`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                >
                  <textarea rows="10" value={content} onChange={(e) => setContent(e.target.value)}
                    className={`w-full px-4 py-4 bg-slate-50 ${currentTheme.ring} outline-none transition-all resize-y min-h-[200px]`}
                    placeholder="Ketik rahasiamu di sini, atau Drag & Drop file (.txt / .pdf) ke dalam kotak ini..."
                  ></textarea>
                  {!content && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400 opacity-60">
                      <UploadCloud className="w-10 h-10 mb-2" />
                      <p className="text-sm font-bold">Drag & Drop file (.txt / .pdf)</p>
                    </div>
                  )}
                </div>
              )}

              <button onClick={handleSaveStory} disabled={isSaving} className={`w-full ${currentTheme.bg} ${currentTheme.hover} text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 shadow-md`}>
                {isSaving ? 'Menyimpan...' : (editStoryId ? '💾 Update Cerita' : '💾 Simpan Cerita ke Cloud')}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold text-slate-800 mb-4">🔗 Buat Tautan Klien</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Cari & Pilih Karya</label>
                  <div className="relative mb-2">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input type="text" placeholder="Ketik judul..." value={searchStory} onChange={(e)=>setSearchStory(e.target.value)} className={`w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm ${currentTheme.ring} outline-none`} />
                  </div>
                  <select value={selectedStory} onChange={(e) => setSelectedStory(e.target.value)} className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl ${currentTheme.ring} outline-none cursor-pointer text-sm font-medium`}>
                    <option value="">-- Daftar Cerita --</option>
                    {filteredStoriesForLink.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Batas Waktu (Menit)</label>
                  <input type="number" min="1" value={duration} onChange={(e) => setDuration(e.target.value)} className={`w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl ${currentTheme.ring} outline-none`} />
                </div>
                <button onClick={handleGenerateLink} disabled={isGenerating || stories.length === 0} className={`w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white px-5 py-3 rounded-xl font-bold transition-all disabled:opacity-50`}>
                  <PlusCircle className="w-5 h-5" /> Buat Tautan Magic
                </button>
              </div>
            </div>

            {/* List Token Kecil */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-800 text-sm mb-3">Tautan Aktif Saat Ini</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {tokens.length === 0 ? <p className="text-xs text-slate-500">Belum ada tautan.</p> : tokens.map(t => (
                  <div key={t.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center gap-2">
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-800 truncate">{t.storyTitle}</p>
                      <p className={`text-[10px] font-bold uppercase mt-0.5 ${t.status === 'pending' ? 'text-amber-600' : 'text-emerald-600'}`}>{t.status}</p>
                    </div>
                    <button onClick={() => {navigator.clipboard.writeText(t.id); setCopied(t.id); setTimeout(()=>setCopied(''),2000)}} className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600 shrink-0">
                      {copied === t.id ? <Check className="w-4 h-4 text-emerald-500"/> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BANK CERITA */}
      {activeTab === 'bank' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
            <h3 className="font-bold text-slate-800 text-lg">Bank Cerita</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {stories.length === 0 ? (
              <div className="p-10 text-center text-slate-500"><BookOpen className="w-10 h-10 mb-3 mx-auto text-slate-300" /><p>Belum ada cerita yang disimpan.</p></div>
            ) : stories.map(s => {
                const reviewCount = s.reviews?.length || 0;
                const avgRating = reviewCount > 0 ? (s.reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviewCount).toFixed(1) : 0;
                return (
                  <div key={s.id} className="p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                      <div>
                        <h4 className="font-bold text-slate-800 text-lg mb-1 flex items-center gap-2">
                          {s.pdfUrl && <FileText className="w-4 h-4 text-red-500 shrink-0" title="Dokumen PDF" />} 
                          {s.title}
                        </h4>
                        <div className="flex items-center gap-3 text-sm mb-3">
                          {s.genre && <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium text-xs">{s.genre}</span>}
                          <span className="flex items-center gap-1 text-amber-500 font-bold"><Star className="w-4 h-4 fill-amber-500"/> {avgRating} ({reviewCount} Ulasan)</span>
                          <span className="text-slate-400 text-xs">{new Date(s.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => editStory(s)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold transition-all"><Edit className="w-4 h-4"/> Edit</button>
                        <button onClick={() => deleteStory(s.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-sm font-bold transition-all"><Trash2 className="w-4 h-4"/> Hapus</button>
                      </div>
                    </div>
                    {reviewCount > 0 && (
                      <div className="mt-4 bg-slate-100/50 p-4 rounded-xl border border-slate-200">
                        <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Ulasan Klien Terbaru:</p>
                        <div className="space-y-3">
                          {s.reviews.slice(-3).reverse().map((r, i) => (
                            <div key={i} className="text-sm">
                              <p className="font-bold text-slate-800 flex items-center gap-2">{r.readerName} <span className="flex text-amber-500"><Star className="w-3 h-3 fill-amber-500"/>{r.rating}</span></p>
                              <p className="text-slate-600 italic">"{r.note}"</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: PROFIL & TEMA */}
      {activeTab === 'profile' && (
        <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-sm border border-slate-200 max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Settings className={`w-8 h-8 ${currentTheme.text}`} />
            <h2 className="text-2xl font-bold text-slate-800">Pengaturan Profil</h2>
          </div>
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            
            {/* Foto Profil Upload */}
            <div className="flex items-center gap-5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-200 border-2 border-white shadow-sm shrink-0">
                {authorProfile.photoURL ? <img src={authorProfile.photoURL} className="w-full h-full object-cover" /> : <User className="w-full h-full text-slate-400 p-4"/>}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 mb-2">Foto Profil Penulis</p>
                <label className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 ${currentTheme.bg} ${currentTheme.hover} text-white rounded-xl text-sm font-bold transition-all shadow-md`}>
                  <Camera className="w-4 h-4" />
                  {isUploadingPhoto ? 'Mengunggah...' : 'Upload Foto Baru'}
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={isUploadingPhoto} />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Nama Pena / Profil</label>
              <input type="text" value={authorProfile.displayName} onChange={e => setAuthorProfile({...authorProfile, displayName: e.target.value})} className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl ${currentTheme.ring} outline-none`} />
            </div>

            {/* Social Media Links */}
            <div className="pt-4 border-t border-slate-100">
               <label className="block text-sm font-bold text-slate-700 mb-3">Tautan Sosial Media & Kontak</label>
               <div className="space-y-3">
                  <div className="flex items-center gap-3">
                     <svg className="w-5 h-5 text-pink-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
                     <input type="url" placeholder="https://instagram.com/username" value={authorProfile.social?.instagram} onChange={e => setAuthorProfile({...authorProfile, social: {...authorProfile.social, instagram: e.target.value}})} className="flex-1 px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none text-sm" />
                  </div>
                  <div className="flex items-center gap-3">
                     <svg className="w-5 h-5 text-slate-800 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                     <input type="url" placeholder="https://x.com/username" value={authorProfile.social?.twitter} onChange={e => setAuthorProfile({...authorProfile, social: {...authorProfile.social, twitter: e.target.value}})} className="flex-1 px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none text-sm" />
                  </div>
                  <div className="flex items-center gap-3">
                     <svg className="w-5 h-5 text-slate-800 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v7.12c-.01 2.45-1.04 4.88-2.85 6.54-2.52 2.3-6.43 2.91-9.52 1.48-3.32-1.52-5.45-5.18-4.9-8.81.48-3.15 3.06-5.83 6.17-6.52 1.05-.24 2.15-.3 3.22-.16v4.06c-.84-.13-1.74-.01-2.48.43-.86.51-1.43 1.39-1.63 2.36-.29 1.45.62 3.03 2.01 3.52 1.25.44 2.7.2 3.65-.68.84-.77 1.25-1.93 1.27-3.07V.02h.98z"/></svg>
                     <input type="url" placeholder="https://tiktok.com/@username" value={authorProfile.social?.tiktok} onChange={e => setAuthorProfile({...authorProfile, social: {...authorProfile.social, tiktok: e.target.value}})} className="flex-1 px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none text-sm" />
                  </div>
                  <div className="flex items-center gap-3">
                     <Globe className="w-5 h-5 text-indigo-500 shrink-0" />
                     <input type="url" placeholder="https://website-pribadi.com" value={authorProfile.social?.website} onChange={e => setAuthorProfile({...authorProfile, social: {...authorProfile.social, website: e.target.value}})} className="flex-1 px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none text-sm" />
                  </div>
               </div>
            </div>
            
            <div className="pt-4 border-t border-slate-100">
              <label className="block text-sm font-bold text-slate-700 mb-3">Pilih Tema Dashboard</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.keys(THEMES).map(themeKey => (
                  <button key={themeKey} type="button" onClick={() => setAuthorProfile({...authorProfile, theme: themeKey})}
                    className={`px-4 py-3 rounded-xl border-2 font-bold capitalize transition-all ${authorProfile.theme === themeKey ? `${THEMES[themeKey].border} ${THEMES[themeKey].light} ${THEMES[themeKey].text}` : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                  >
                    {themeKey}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <button type="submit" className={`w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-white shadow-md transition-all active:scale-95 ${currentTheme.bg} ${currentTheme.hover}`}>
                Simpan Pengaturan
              </button>
              
              <button type="button" onClick={() => sendPasswordResetEmail(auth, user.email).then(()=>alert("Cek email Anda untuk link reset password!")).catch(()=>alert("Terjadi kesalahan"))} className="text-sm font-bold text-rose-500 hover:bg-rose-50 px-4 py-2 rounded-lg transition-colors">
                Reset Password Akun
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ==========================================
// VIEW: SIMULASI KLIEN (READER)
// ==========================================
function ReaderSimulator({ user }) {
  const [inputToken, setInputToken] = useState('');
  const [storyData, setStoryData] = useState(null);
  const [authorData, setAuthorData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [timeLeft, setTimeLeft] = useState(null);
  const timerRef = useRef(null);

  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewNote, setReviewNote] = useState('');
  const [hasReviewed, setHasReviewed] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.keyCode === 123 || (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) || (e.ctrlKey && e.keyCode === 85)) {
        e.preventDefault(); alert("Fitur Developer Tools dinonaktifkan.");
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getDeviceId = () => {
    let deviceId = localStorage.getItem('reader_device_v4');
    if (!deviceId) { deviceId = `device-${Math.random().toString(36).substr(2, 9)}`; localStorage.setItem('reader_device_v4', deviceId); }
    return deviceId;
  };

  const handleAccess = async (e) => {
    e.preventDefault();
    if (!user) return;
    setErrorMsg(''); setStoryData(null); setAuthorData(null); setHasReviewed(false);
    
    if (!inputToken) return setErrorMsg("Masukkan Token URL yang valid.");

    try {
      const tokenRef = doc(db, 'artifacts', appId, 'public', 'data', 'access_tokens', inputToken);
      const tokenSnap = await getDoc(tokenRef);

      if (!tokenSnap.exists()) return setErrorMsg("Akses Ditolak! Token tidak ditemukan atau hangus.");

      let data = tokenSnap.data();
      const currentDevice = getDeviceId();
      const now = Date.now();

      if (data.status === 'pending') {
        await updateDoc(tokenRef, { status: 'active', startedAt: now, deviceId: currentDevice });
        data.status = 'active'; data.startedAt = now; data.deviceId = currentDevice;
      }

      if (data.deviceId !== currentDevice) return setErrorMsg("Akses Ditolak! Tautan sudah terkunci di perangkat lain.");

      if (data.status === 'active') {
        const timeElapsed = now - data.startedAt;
        const MAX_TIME = data.duration;

        if (timeElapsed >= MAX_TIME) {
          await updateDoc(tokenRef, { status: 'expired' });
          return setErrorMsg("Waktu baca sudah habis. Sesi ditutup otomatis.");
        } else {
          const storyRef = doc(db, 'artifacts', appId, 'public', 'data', 'stories', data.storyId);
          const storySnap = await getDoc(storyRef);
          
          if (storySnap.exists()) {
            setStoryData(storySnap.data());
            
            const authorRef = doc(db, 'artifacts', appId, 'public', 'data', 'authors', data.authorId);
            const authorSnap = await getDoc(authorRef);
            if(authorSnap.exists()) setAuthorData(authorSnap.data());

            startTimer(MAX_TIME - timeElapsed, tokenRef);
          } else { setErrorMsg("Cerita sudah dihapus oleh Penulis."); }
        }
      } else if (data.status === 'expired') { return setErrorMsg("Waktu baca sudah habis. Sesi ditutup otomatis."); }
    } catch (err) { console.error(err); setErrorMsg("Terjadi gangguan server."); }
  };

  const startTimer = (remainingMs, tokenRef) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(remainingMs);
    timerRef.current = setInterval(async () => {
      setTimeLeft((prev) => {
        if (prev <= 1000) {
          clearInterval(timerRef.current);
          updateDoc(tokenRef, { status: 'expired' });
          setStoryData(null); setInputToken('');
          setErrorMsg("WAKTU HABIS! Layar telah dikunci dan ditutup otomatis oleh sistem.");
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
  };

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if(!reviewName || !reviewNote) return alert("Mohon isi nama dan ulasan");
    setIsSubmittingReview(true);
    try {
      const storyRef = doc(db, 'artifacts', appId, 'public', 'data', 'stories', storyData.id);
      await updateDoc(storyRef, {
        reviews: arrayUnion({ readerName: reviewName, rating: reviewRating, note: reviewNote, date: Date.now() })
      });
      setHasReviewed(true);
    } catch(err) { console.error(err); alert("Gagal mengirim ulasan."); }
    setIsSubmittingReview(false);
  };

  useEffect(() => { return () => { if (timerRef.current) clearInterval(timerRef.current); }; }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {!storyData && (
        <div className="bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-slate-200 text-center mt-6 sm:mt-10 mx-auto max-w-lg">
          <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3">
            <LinkIcon className="w-10 h-10 text-slate-600 -rotate-3" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3">Portal Klien</h2>
          <p className="text-slate-500 mb-8 text-sm sm:text-base leading-relaxed">Masukkan Token URL yang diberikan oleh Penulis Anda. Hitung mundur akan berjalan otomatis.</p>
          
          <form onSubmit={handleAccess} className="flex flex-col sm:flex-row gap-3">
            <input type="text" value={inputToken} onChange={(e) => setInputToken(e.target.value.trim())} placeholder="Contoh: token-A1B2C3" className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-500 outline-none text-center sm:text-left font-mono tracking-wider font-bold text-slate-700" />
            <button type="submit" className="bg-slate-900 hover:bg-black text-white px-8 py-3.5 rounded-xl font-bold shadow-md active:scale-95">Buka Akses</button>
          </form>
          {errorMsg && <div className="mt-8 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl flex items-start gap-3 text-left animate-fade-in"><AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" /><p className="font-bold text-sm sm:text-base">{errorMsg}</p></div>}
        </div>
      )}

      {storyData && (
        <div className="space-y-4 animate-fade-in relative">
          <div className="flex flex-col-reverse sm:flex-row sm:items-end justify-between gap-4 mb-6 px-2 mt-4">
            <div>
              <p className="text-amber-600 text-xs sm:text-sm font-bold tracking-widest uppercase mb-1.5 flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Sedang Membaca
              </p>
              <h3 className="font-bold text-3xl sm:text-4xl text-slate-800 leading-tight">{storyData.title}</h3>
              {storyData.genre && <span className="inline-block mt-3 bg-slate-200 text-slate-600 px-3 py-1 rounded-md font-bold text-xs">{storyData.genre}</span>}
            </div>
            
            {/* Profil Author Top Right + Social Media */}
            {authorData && (
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm shrink-0 self-start sm:self-auto max-w-xs">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
                    {authorData.photoURL ? <img src={authorData.photoURL} className="w-full h-full object-cover"/> : <User className="w-full h-full text-slate-300 p-2"/>}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ditulis Oleh</p>
                    <p className="font-bold text-base text-slate-800">{authorData.displayName}</p>
                  </div>
                </div>
                {/* Ikon Sosial Media Interaktif */}
                {authorData.social && (
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                     {authorData.social.instagram && <a href={authorData.social.instagram} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-pink-50 text-pink-600 hover:bg-pink-100 rounded-lg transition-colors"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg></a>}
                     {authorData.social.twitter && <a href={authorData.social.twitter} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-slate-100 text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>}
                     {authorData.social.tiktok && <a href={authorData.social.tiktok} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-slate-100 text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v7.12c-.01 2.45-1.04 4.88-2.85 6.54-2.52 2.3-6.43 2.91-9.52 1.48-3.32-1.52-5.45-5.18-4.9-8.81.48-3.15 3.06-5.83 6.17-6.52 1.05-.24 2.15-.3 3.22-.16v4.06c-.84-.13-1.74-.01-2.48.43-.86.51-1.43 1.39-1.63 2.36-.29 1.45.62 3.03 2.01 3.52 1.25.44 2.7.2 3.65-.68.84-.77 1.25-1.93 1.27-3.07V.02h.98z"/></svg></a>}
                     {authorData.social.website && <a href={authorData.social.website} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"><Globe className="w-4 h-4" /></a>}
                     {(!authorData.social.instagram && !authorData.social.twitter && !authorData.social.tiktok && !authorData.social.website) && <p className="text-xs text-slate-400 italic">Belum ada tautan sosial</p>}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white p-6 sm:p-10 md:p-16 rounded-3xl shadow-sm border border-slate-200 min-h-[60vh] relative overflow-hidden"
            onContextMenu={(e) => { e.preventDefault(); alert('Klik Kanan Dinonaktifkan.'); }}
            onCopy={(e) => { e.preventDefault(); alert('Tindakan Copy Diblokir.'); }}
            style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none' }}
          >
            {/* Watermark hanya muncul jika bukan file PDF (karena iframe akan menutupi) */}
            {!storyData.pdfUrl && <div className="absolute inset-0 pointer-events-none opacity-[0.02] flex items-center justify-center overflow-hidden"><p className="text-[150px] font-black -rotate-45 whitespace-nowrap">RAHASIA</p></div>}
            
            {/* Tampilan Konten Teks vs PDF */}
            {storyData.pdfUrl ? (
              <div className="relative z-10 w-full rounded-2xl overflow-hidden border-2 border-slate-200">
                 <iframe src={`${storyData.pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`} className="w-full h-[75vh]" title="Document PDF"></iframe>
              </div>
            ) : (
              <div className="prose prose-base sm:prose-lg max-w-none text-slate-800 leading-loose font-serif whitespace-pre-wrap relative z-10 selection:bg-transparent">
                {storyData.content}
              </div>
            )}
            
            {/* AREA BAWAH CERITA (Copyright & Review) */}
            <div className="mt-20 pt-10 border-t-2 border-slate-100 relative z-10">
              <div className="text-center text-slate-400 mb-12">
                 <ShieldAlert className="w-6 h-6 mx-auto mb-3 opacity-50" />
                 <p className="font-bold text-sm">© {new Date(storyData.createdAt || Date.now()).getFullYear()} {authorData?.displayName || 'Author'}. All rights reserved.</p>
                 <p className="text-xs mt-1 max-w-sm mx-auto">Dokumen ini dilindungi enkripsi sistem Cloud. Dilarang menyalin atau mendistribusikan ulang.</p>
              </div>

              {!hasReviewed ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 max-w-xl mx-auto">
                  <h4 className="font-bold text-lg text-slate-800 mb-1 text-center">Beri Ulasan ke Penulis</h4>
                  <p className="text-sm text-slate-500 text-center mb-6">Bagaimana pendapat Anda tentang draft ini?</p>
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div className="flex justify-center gap-2 mb-2">
                      {[1,2,3,4,5].map(star => (
                        <Star key={star} onClick={() => setReviewRating(star)} className={`w-8 h-8 cursor-pointer transition-all hover:scale-110 ${reviewRating >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                      ))}
                    </div>
                    <input type="text" placeholder="Nama Anda (Klien)" required value={reviewName} onChange={e=>setReviewName(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:border-amber-500" />
                    <textarea rows="3" placeholder="Tulis catatan atau saran di sini..." required value={reviewNote} onChange={e=>setReviewNote(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:border-amber-500 resize-none"></textarea>
                    <button type="submit" disabled={isSubmittingReview} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50">Kirim Ulasan</button>
                  </form>
                </div>
              ) : (
                <div className="text-center p-6 bg-emerald-50 text-emerald-700 rounded-2xl max-w-xl mx-auto border border-emerald-100 font-bold">Terima kasih atas ulasan Anda! 🎉</div>
              )}
            </div>
          </div>

          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-8 sm:bottom-8 z-50 bg-black/90 backdrop-blur-md border border-slate-700 pl-3 pr-6 py-2.5 rounded-full shadow-2xl flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${timeLeft < 60000 ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-slate-700 text-slate-300'}`}><Clock className="w-5 h-5" /></div>
            <div>
              <p className="text-slate-400 text-[10px] font-bold tracking-widest uppercase mb-0.5">Sisa Waktu</p>
              <p className={`text-lg sm:text-xl font-mono font-bold leading-none ${timeLeft < 60000 ? 'text-rose-400 animate-pulse' : 'text-white'}`}>{formatTime(timeLeft)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}