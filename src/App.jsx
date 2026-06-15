import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken, 
  signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut,
  GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail
} from 'firebase/auth';
import { 
  getFirestore, collection, doc, setDoc, getDoc, updateDoc, onSnapshot 
} from 'firebase/firestore';
import { 
  Clock, ShieldAlert, Link as LinkIcon, PlusCircle, Copy, AlertTriangle, 
  User, LogOut, BookOpen, Lock
} from 'lucide-react';

const firebaseConfig = {
  apiKey: "AIzaSyCGJLpVAXZMm2US7S-bwjNjyJtf0VsSV2Y",
  authDomain: "authorsafe.firebaseapp.com",
  projectId: "authorsafe",
  storageBucket: "authorsafe.firebasestorage.app",
  messagingSenderId: "453655231430",
  appId: "1:453655231430:web:d94246f4574e70f4ed90c7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ==========================================
// KOMPONEN UTAMA: ROUTER & LAYOUT
// ==========================================
export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('reader'); // Default view untuk klien (Pembaca)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // WAJIB: Otentikasi awal (Anonim untuk Pembaca)
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth error:", err);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50"><p className="text-indigo-500 animate-pulse font-medium">Menghubungkan ke Server Cloud...</p></div>;

  const handleLogout = async () => {
    await signOut(auth);
    // Setelah logout, jadikan anonim lagi agar fitur pembaca tetap jalan
    await signInAnonymously(auth);
    setView('reader');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-indigo-200 selection:text-indigo-900">
      {/* Navbar Premium & Responsive */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 flex flex-row justify-between items-center gap-2 sm:gap-4 w-full">
        <h1 className="text-xl sm:text-2xl font-bold text-indigo-700 flex items-center gap-1.5 shrink-0">
          <ShieldAlert className="w-6 h-6 sm:w-7 sm:h-7" />
          <span className="hidden xs:inline">WriterSecure</span>
          <span className="text-[10px] sm:text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full ml-1 whitespace-nowrap">Cloud V3</span>
        </h1>
        
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <button 
            onClick={() => setView('reader')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-sm sm:text-base font-medium transition-all duration-300 flex items-center gap-1.5 ${view === 'reader' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
          >
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5"/> 
            <span className="hidden sm:inline">Akses Klien</span>
            <span className="inline sm:hidden">Klien</span>
          </button>
          <button 
            onClick={() => setView('admin')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-sm sm:text-base font-medium transition-all duration-300 flex items-center gap-1.5 ${view === 'admin' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
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

      <main className="p-4 sm:p-6 max-w-6xl mx-auto w-full overflow-hidden">
        {/* Logika Tampilan Berdasarkan Status Login */}
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
    setError('');
    setInfoMsg('');
    setIsProcessing(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') setError('Email ini sudah terdaftar.');
      else if (err.code === 'auth/wrong-password') setError('Password salah.');
      else if (err.code === 'auth/user-not-found') setError('Email belum terdaftar.');
      else setError('Terjadi kesalahan. Pastikan email valid & password min 6 karakter.');
    }
    setIsProcessing(false);
  };

  // Fungsi Login Menggunakan Google
  const handleGoogleLogin = async () => {
    setError('');
    setInfoMsg('');
    setIsProcessing(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error(err);
      setError('Gagal login dengan akun Google. Silakan coba lagi.');
    }
    setIsProcessing(false);
  };

  // Fungsi Kirim Tautan Reset Password
  const handleResetPassword = async () => {
    setError('');
    setInfoMsg('');
    if (!email) {
      setError('Masukkan alamat email Anda di kolom email, lalu klik "Lupa Password?".');
      return;
    }
    setIsProcessing(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setInfoMsg('Tautan reset password telah dikirim. Silakan cek kotak masuk atau spam email Anda.');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/user-not-found') setError('Email tersebut belum terdaftar.');
      else setError('Gagal mengirim email reset. Pastikan format email Anda benar.');
    }
    setIsProcessing(false);
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 mt-6 sm:mt-10">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3">
          <User className="w-8 h-8 -rotate-3" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Ruang Khusus Penulis</h2>
        <p className="text-slate-500 text-sm mt-2">Masuk untuk menulis cerita dan mengelola klien.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
          <input 
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            placeholder="nama@email.com"
          />
        </div>
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-sm font-medium text-slate-700">Password</label>
            {isLogin && (
              <button type="button" onClick={handleResetPassword} className="text-xs text-indigo-600 hover:text-indigo-800 font-bold transition-colors">
                Lupa Password?
              </button>
            )}
          </div>
          <input 
            type="password" required={isLogin} value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            placeholder="Minimal 6 karakter"
          />
        </div>
        
        {error && <p className="text-rose-600 text-sm font-medium bg-rose-50 border border-rose-100 p-3 rounded-xl animate-fade-in">{error}</p>}
        {infoMsg && <p className="text-emerald-700 text-sm font-medium bg-emerald-50 border border-emerald-100 p-3 rounded-xl animate-fade-in">{infoMsg}</p>}

        <button 
          type="submit" disabled={isProcessing}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-medium transition-all shadow-md active:scale-95 disabled:opacity-50 mt-4"
        >
          {isProcessing ? 'Memproses...' : (isLogin ? 'Masuk dengan Email' : 'Daftar Akun Baru')}
        </button>
      </form>

      {/* Pembatas "Atau masuk dengan" */}
      <div className="mt-6 flex items-center justify-between">
        <span className="w-1/5 border-b border-slate-200"></span>
        <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Atau masuk dengan</span>
        <span className="w-1/5 border-b border-slate-200"></span>
      </div>

      {/* Tombol Login Google */}
      <button 
        onClick={handleGoogleLogin} disabled={isProcessing}
        className="w-full mt-6 bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-700 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
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
  const [stories, setStories] = useState([]);
  const [tokens, setTokens] = useState([]);
  
  // State Form Cerita
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // State Form Tautan
  const [selectedStory, setSelectedStory] = useState('');
  const [duration, setDuration] = useState('30');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState('');

  // 1. Sinkronisasi Data Cloud Berdasarkan Akun (Email/UID)
  useEffect(() => {
    if (!user || user.isAnonymous) return;

    // Ambil Cerita
    const storiesRef = collection(db, 'artifacts', appId, 'public', 'data', 'stories');
    const unsubStories = onSnapshot(storiesRef, (snapshot) => {
      const allStories = snapshot.docs.map(doc => doc.data());
      // Filter: Hanya tampilkan cerita milik akun yang sedang login!
      const myStories = allStories.filter(s => s.authorId === user.uid).sort((a,b) => b.createdAt - a.createdAt);
      setStories(myStories);
      if (myStories.length > 0 && !selectedStory) setSelectedStory(myStories[0].id);
    });

    // Ambil Tautan/Token
    const tokensRef = collection(db, 'artifacts', appId, 'public', 'data', 'access_tokens');
    const unsubTokens = onSnapshot(tokensRef, (snapshot) => {
      const allTokens = snapshot.docs.map(doc => doc.data());
      // Filter: Hanya tampilkan token milik akun yang sedang login!
      const myTokens = allTokens.filter(t => t.authorId === user.uid).sort((a,b) => b.createdAt - a.createdAt);
      setTokens(myTokens);
    });

    return () => { unsubStories(); unsubTokens(); };
  }, [user]);

  // 2. Fungsi Simpan Cerita
  const handleSaveStory = async () => {
    if (!title || !content) return alert("Judul dan isi cerita harus diisi!");
    setIsSaving(true);
    
    const storyId = `story-${Date.now()}`;
    const storyRef = doc(db, 'artifacts', appId, 'public', 'data', 'stories', storyId);
    
    await setDoc(storyRef, {
      id: storyId,
      title: title,
      content: content,
      authorId: user.uid, // Tanda pengenal pemilik cerita
      authorEmail: user.email,
      createdAt: Date.now()
    });

    setTitle('');
    setContent('');
    setIsSaving(false);
  };

  // 3. Fungsi Buat Tautan Klien
  const handleGenerateLink = async () => {
    if (!selectedStory) return alert("Pilih cerita terlebih dahulu!");
    if (!duration || parseInt(duration) < 1) return alert("Durasi minimal 1 menit!");
    
    setIsGenerating(true);
    const tokenId = `token-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const tokenRef = doc(db, 'artifacts', appId, 'public', 'data', 'access_tokens', tokenId);
    
    const targetStory = stories.find(s => s.id === selectedStory);

    await setDoc(tokenRef, {
      id: tokenId,
      storyId: selectedStory,
      storyTitle: targetStory.title,
      authorId: user.uid, // Tanda pengenal pemilik token
      duration: parseInt(duration) * 60 * 1000, // Konversi menit ke ms
      status: 'pending',
      createdAt: Date.now(),
      startedAt: null,
      deviceId: null
    });

    setIsGenerating(false);
  };

  const copyToClipboard = (tokenId) => {
    navigator.clipboard.writeText(tokenId);
    setCopied(tokenId);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      
      {/* Notifikasi Login */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-5 sm:p-6 rounded-3xl shadow-lg shadow-indigo-200 flex items-center justify-between">
        <div>
          <p className="text-sm text-indigo-100 font-medium mb-0.5">Login sebagai Penulis:</p>
          <p className="font-bold text-lg">{user.email}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-indigo-100 font-medium mb-0.5">Total Karya</p>
          <p className="font-bold text-xl sm:text-2xl">{stories.length} <span className="text-base font-normal opacity-80">Cerita</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* KOLOM KIRI: TULIS CERITA */}
        <div className="bg-white p-5 sm:p-8 rounded-3xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-1">📝 Tulis Cerita Baru</h2>
          <p className="text-slate-500 text-sm mb-6">Cerita yang disimpan terkunci aman di Cloud.</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Judul Cerita / Bab</label>
              <input 
                type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="Contoh: Sang Pengelana (Bab 1)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Isi Cerita</label>
              <textarea 
                rows="6" value={content} onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-y min-h-[120px]"
                placeholder="Ketik rahasiamu di sini..."
              ></textarea>
            </div>
            <button 
              onClick={handleSaveStory} disabled={isSaving}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 shadow-md"
            >
              {isSaving ? 'Menyimpan...' : '💾 Simpan Cerita ke Cloud'}
            </button>
          </div>
        </div>

        {/* KOLOM KANAN: MANAJEMEN TAUTAN */}
        <div className="bg-white p-5 sm:p-8 rounded-3xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-1">🔗 Buat Tautan Klien</h2>
          <p className="text-slate-500 text-sm mb-6">Pilih cerita dan atur durasi waktu bacanya.</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Pilih Karya Anda</label>
              <select 
                value={selectedStory} onChange={(e) => setSelectedStory(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer transition-all"
              >
                {stories.length === 0 && <option value="">-- Belum ada cerita --</option>}
                {stories.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Batas Waktu (Menit)</label>
              <input 
                type="number" min="1" value={duration} onChange={(e) => setDuration(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <button 
              onClick={handleGenerateLink} disabled={isGenerating || stories.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-medium transition-all disabled:opacity-50 shadow-md shadow-indigo-200"
            >
              <PlusCircle className="w-5 h-5" />
              {isGenerating ? 'Memproses...' : 'Buat Tautan Magic'}
            </button>
          </div>
        </div>

      </div>

      {/* TABEL TAUTAN AKTIF */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 sm:px-6 py-5 border-b border-slate-200 bg-slate-50/50">
          <h3 className="font-bold text-slate-800">Daftar Tautan Klien & Riwayat</h3>
        </div>
        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
          {tokens.length === 0 ? (
            <div className="p-10 text-center text-slate-500 flex flex-col items-center">
              <LinkIcon className="w-10 h-10 mb-3 text-slate-300" />
              <p>Belum ada tautan yang digenerate.</p>
            </div>
          ) : (
            tokens.map(t => (
              <div key={t.id} className="p-5 sm:px-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-slate-50 transition-colors">
                <div>
                  <h4 className="font-semibold text-slate-800">{t.storyTitle}</h4>
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-sm">
                    <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider
                      ${t.status === 'pending' ? 'bg-amber-100 text-amber-700' : 
                        t.status === 'active' ? 'bg-indigo-100 text-indigo-700' : 
                        'bg-rose-100 text-rose-700'}`}
                    >
                      {t.status}
                    </span>
                    <span className="text-slate-600 font-mono bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 text-xs">ID: {t.id}</span>
                    <span className="text-slate-600 font-mono bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 text-xs flex items-center gap-1"><Clock className="w-3 h-3"/> {t.duration / 60000} Menit</span>
                  </div>
                  {t.status === 'active' && (
                    <p className="text-xs text-indigo-600 mt-2 font-medium flex items-center gap-1">Aktif sejak: {new Date(t.startedAt).toLocaleTimeString()}</p>
                  )}
                </div>
                
                <button 
                  onClick={() => copyToClipboard(t.id)}
                  className="shrink-0 flex items-center justify-center gap-2 px-4 py-2 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-all active:scale-95"
                >
                  <Copy className="w-4 h-4" />
                  {copied === t.id ? 'Tersalin!' : 'Copy Token'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// VIEW: SIMULASI KLIEN (READER)
// ==========================================
function ReaderSimulator({ user }) {
  const [inputToken, setInputToken] = useState('');
  const [storyData, setStoryData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [timeLeft, setTimeLeft] = useState(null);
  const timerRef = useRef(null);

  // Proteksi Keamanan: Blokir F12, Ctrl+Shift+I, dll
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.keyCode === 123 || // F12
        (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) || // Ctrl+Shift+I/J/C
        (e.ctrlKey && e.keyCode === 85) // Ctrl+U
      ) {
        e.preventDefault();
        alert("Peringatan Keamanan: Fitur Developer Tools dinonaktifkan demi melindungi hak cipta penulis.");
      }
    };
    
    // Hanya pasang proteksi jika sedang berada di layar baca (Client)
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Kunci peramban klien secara lokal
  const getDeviceId = () => {
    let deviceId = localStorage.getItem('reader_device_v3');
    if (!deviceId) {
      deviceId = `device-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('reader_device_v3', deviceId);
    }
    return deviceId;
  };

  const handleAccess = async (e) => {
    e.preventDefault();
    if (!user) return;
    setErrorMsg('');
    setStoryData(null);
    
    if (!inputToken) return setErrorMsg("Masukkan Token URL yang valid.");

    try {
      const tokenRef = doc(db, 'artifacts', appId, 'public', 'data', 'access_tokens', inputToken);
      const tokenSnap = await getDoc(tokenRef);

      if (!tokenSnap.exists()) {
        return setErrorMsg("Akses Ditolak! Token tidak ditemukan di server.");
      }

      let data = tokenSnap.data();
      const currentDevice = getDeviceId();
      const now = Date.now();

      // LOGIKA 1: Buka Segel Token
      if (data.status === 'pending') {
        await updateDoc(tokenRef, {
          status: 'active',
          startedAt: now,
          deviceId: currentDevice // Gembok ke Browser ini
        });
        data.status = 'active';
        data.startedAt = now;
        data.deviceId = currentDevice;
      }

      // LOGIKA 2: Cek Gembok Browser
      if (data.deviceId !== currentDevice) {
        return setErrorMsg("Akses Ditolak! Tautan ini sudah terkunci oleh perangkat lain.");
      }

      // LOGIKA 3: Perhitungan Waktu Mundur Server
      if (data.status === 'active') {
        const timeElapsed = now - data.startedAt;
        const MAX_TIME = data.duration;

        if (timeElapsed >= MAX_TIME) {
          await updateDoc(tokenRef, { status: 'expired' });
          return setErrorMsg("Waktu baca sudah habis. Konten telah ditarik oleh sistem.");
        } else {
          // Izin Diberikan! Ambil Cerita dari Server
          const storyRef = doc(db, 'artifacts', appId, 'public', 'data', 'stories', data.storyId);
          const storySnap = await getDoc(storyRef);
          
          if (storySnap.exists()) {
            setStoryData(storySnap.data());
            startTimer(MAX_TIME - timeElapsed, tokenRef);
          } else {
            setErrorMsg("Cerita sudah dihapus oleh Penulis.");
          }
        }
      } else if (data.status === 'expired') {
        return setErrorMsg("Waktu baca sudah habis. Konten telah ditarik oleh sistem.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Terjadi gangguan saat menghubungkan ke Server.");
    }
  };

  const startTimer = (remainingMs, tokenRef) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(remainingMs);
    
    timerRef.current = setInterval(async () => {
      setTimeLeft((prev) => {
        if (prev <= 1000) {
          clearInterval(timerRef.current);
          updateDoc(tokenRef, { status: 'expired' });
          setErrorMsg("WAKTU HABIS! Teks ditarik otomatis oleh sistem.");
          setStoryData(null);
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

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {!storyData && (
        <div className="bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-slate-200 text-center mt-6 sm:mt-10 mx-auto max-w-lg">
          <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3">
            <LinkIcon className="w-10 h-10 text-indigo-600 -rotate-3" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3">Portal Klien</h2>
          <p className="text-slate-500 mb-8 text-sm sm:text-base leading-relaxed">Masukkan Token URL yang diberikan oleh Penulis Anda. Hitung mundur akan berjalan otomatis.</p>
          
          <form onSubmit={handleAccess} className="flex flex-col sm:flex-row gap-3">
            <input 
              type="text" value={inputToken} onChange={(e) => setInputToken(e.target.value.trim())}
              placeholder="Contoh: token-A1B2C3" 
              className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-center sm:text-left font-mono tracking-wider transition-all"
            />
            <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-md active:scale-95">
              Buka Dokumen
            </button>
          </form>

          {errorMsg && (
            <div className="mt-8 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl flex items-start gap-3 text-left animate-fade-in">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="font-medium text-sm sm:text-base">{errorMsg}</p>
            </div>
          )}
        </div>
      )}

      {storyData && (
        <div className="space-y-4 animate-fade-in">
          {/* Header & Timer Sticky */}
          <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between sm:items-center gap-3 sticky top-[72px] sm:top-[88px] z-40 border border-slate-700">
            <div className="overflow-hidden">
              <p className="text-slate-400 text-xs sm:text-sm font-bold tracking-widest uppercase mb-1">Sedang Membaca</p>
              <h3 className="font-bold text-base sm:text-lg truncate">{storyData.title}</h3>
            </div>
            <div className="flex sm:flex-col justify-between items-center sm:items-end bg-slate-800/50 sm:bg-transparent px-4 py-2 sm:p-0 rounded-xl sm:rounded-none">
              <p className="text-slate-400 text-xs sm:text-sm flex items-center gap-1.5 font-medium mb-0 sm:mb-1">
                <Clock className="w-4 h-4" /> Sisa Waktu
              </p>
              <p className={`text-2xl sm:text-3xl font-mono font-bold tracking-wider ${timeLeft < 60000 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                {formatTime(timeLeft)}
              </p>
            </div>
          </div>

          {/* Area Baca Proteksi Tingkat Tinggi */}
          <div 
            className="bg-white p-6 sm:p-10 md:p-16 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 min-h-[60vh] relative overflow-hidden"
            onContextMenu={(e) => { e.preventDefault(); alert('Peringatan: Klik Kanan Dinonaktifkan.'); }}
            onCopy={(e) => { e.preventDefault(); alert('Peringatan: Tindakan Copy Terdeteksi dan Diblokir.'); }}
            onSelectStart={(e) => e.preventDefault()}
            ondragstart={(e) => e.preventDefault()}
            style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none' }}
          >
            {/* Watermark Tipis di Background */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.02] flex items-center justify-center overflow-hidden">
               <p className="text-[150px] font-black -rotate-45 whitespace-nowrap">RAHASIA</p>
            </div>

            <div className="prose prose-base sm:prose-lg max-w-none text-slate-800 leading-loose font-serif whitespace-pre-wrap relative z-10 selection:bg-transparent">
              {storyData.content}
            </div>
            
            <div className="mt-12 sm:mt-16 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center text-slate-400 gap-2 sm:gap-3 select-none relative z-10 text-center">
              <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
              <p className="text-xs sm:text-sm font-medium max-w-sm">Dokumen ini dilindungi enkripsi sistem Cloud. Dilarang menyalin atau mendistribusikan ulang.</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}