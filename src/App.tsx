import React, { useState, useEffect } from 'react';
import { auth, db, googleProvider, handleFirestoreError, seedDatabase } from './lib/firebase';
import { signInWithPopup, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, doc, getDoc, setDoc } from 'firebase/firestore';
import { Team, Match, UserProfile } from './types';
import Globe from './components/Globe';
import TeamDetails from './components/TeamDetails';
import AdminPanel from './components/AdminPanel';
import SpaceBackground from './components/SpaceBackground';
import LoadingScreen from './components/LoadingScreen';
import { Trophy, LogIn, LogOut, Settings, Globe as GlobeIcon, List, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ADMIN_EMAILS = ['juan.s.windmarhome@gmail.com'];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(null);
  const [adminSelectedTeamId, setAdminSelectedTeamId] = useState<string | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const profile = userDoc.data() as UserProfile;
            setUserProfile(profile);
            if (profile.role === 'admin') seedDatabase();
          } else {
            // Nuevo usuario: crear y guardar perfil en Firestore
            const isAdmin = ADMIN_EMAILS.includes(currentUser.email || '');
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              role: isAdmin ? 'admin' : 'user'
            };
            await setDoc(doc(db, 'users', currentUser.uid), newProfile);
            setUserProfile(newProfile);
            if (isAdmin) seedDatabase();
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    const qTeams = query(collection(db, 'teams'), orderBy('points', 'desc'));
    const unsubscribeTeams = onSnapshot(qTeams, (snapshot) => {
      const teamsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
      setTeams(teamsData);
    }, (error) => handleFirestoreError(error, 'list', 'teams'));

    const qMatches = query(collection(db, 'matches'), orderBy('date', 'desc'));
    const unsubscribeMatches = onSnapshot(qMatches, (snapshot) => {
      const matchesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
      setMatches(matchesData);
    }, (error) => handleFirestoreError(error, 'list', 'matches'));

    return () => {
      unsubscribeAuth();
      unsubscribeTeams();
      unsubscribeMatches();
    };
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = () => signOut(auth);

  const selectedTeam = teams.find(t => t.countryCode === selectedCountryCode) || null;

  return (
    <div className="h-screen w-screen bg-black text-white overflow-hidden relative font-sans">

      {/* Pantalla de inicio animada */}
      {showIntro && (
        <LoadingScreen
          ready={!loading}
          onComplete={() => setShowIntro(false)}
        />
      )}

      <SpaceBackground />
      
      {/* Header */}
      <header className="absolute top-0 left-0 w-full p-6 z-40 flex justify-between items-center pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tighter bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent flex items-center gap-3">
              <Trophy className="text-blue-500" /> MUNDIAL CALL CENTER
            </h1>
            <p className="text-xs md:text-sm text-gray-400 font-medium tracking-widest uppercase mt-1">Competencia de Equipos 2026</p>
          </div>
          <div className="hidden md:block w-px h-10 bg-white/15 self-center" />
          <img
            src="https://i.postimg.cc/44pJ0vXw/logo.png"
            alt="Windmar Home"
            className="hidden md:block h-10 object-contain"
            style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.18))' }}
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="flex gap-3 pointer-events-auto">
          {!user ? (
            <button
              onClick={handleLogin}
              className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-full font-bold hover:bg-blue-50 transition-all shadow-lg shadow-white/10"
            >
              <LogIn size={18} /> <span className="hidden md:inline">Ingresar</span>
            </button>
          ) : (
            <div className="flex items-center gap-3">
              {userProfile?.role === 'admin' && (
                <button
                  onClick={() => setShowAdmin(!showAdmin)}
                  className={`p-2.5 rounded-full transition-all ${showAdmin ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                  title="Panel Admin"
                >
                  <Settings size={20} />
                </button>
              )}
              <button
                onClick={() => setShowLeaderboard(!showLeaderboard)}
                className={`p-2.5 rounded-full transition-all ${showLeaderboard ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                title="Tabla de Posiciones"
              >
                <List size={20} />
              </button>
              <button
                onClick={handleLogout}
                className="p-2.5 bg-gray-800 text-gray-400 hover:text-red-400 rounded-full transition-all"
                title="Salir"
              >
                <LogOut size={20} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full h-full">
        <Globe
          teams={teams}
          matches={matches}
          onCountryClick={setSelectedCountryCode}
          selectedCountryCode={selectedCountryCode}
        />
      </main>

      {/* Overlays */}
      <AnimatePresence>
        {selectedCountryCode && (
          <TeamDetails 
            team={selectedTeam} 
            matches={matches} 
            onClose={() => setSelectedCountryCode(null)}
            allTeams={teams}
          />
        )}

        {showAdmin && userProfile?.role === 'admin' && (
          <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
            <AdminPanel 
              teams={teams} 
              onClose={() => {
                setShowAdmin(false);
                setAdminSelectedTeamId(null);
              }} 
              preSelectedTeamId={adminSelectedTeamId}
            />
          </div>
        )}

        {showLeaderboard && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed right-0 top-0 h-full w-full md:w-96 bg-gray-900/95 backdrop-blur-md border-l border-gray-800 text-white z-50 overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Trophy className="text-yellow-500" /> Posiciones
                </h2>
                <button onClick={() => setShowLeaderboard(false)} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {teams.map((team, index) => (
                  <div 
                    key={`${team.id}-${index}`} 
                    className="bg-gray-800/30 p-4 rounded-2xl border border-gray-700/50 flex items-center justify-between group hover:bg-gray-800/50 transition-all cursor-pointer"
                  >
                    <div 
                      className="flex items-center gap-4 flex-1"
                      onClick={() => {
                        setSelectedCountryCode(team.countryCode);
                        setShowLeaderboard(false);
                      }}
                    >
                      <span className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold ${
                        index === 0 ? 'bg-yellow-500 text-black' : 
                        index === 1 ? 'bg-gray-400 text-black' : 
                        index === 2 ? 'bg-orange-600 text-white' : 
                        'bg-gray-800 text-gray-500'
                      }`}>
                        {index + 1}
                      </span>
                      <img 
                        src={`https://flagcdn.com/w40/${team.countryCode.toLowerCase().slice(0, 2)}.png`} 
                        alt={team.countryCode} 
                        className="w-8 h-5 object-cover rounded shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="font-bold text-sm">{team.name}</div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider">{team.callCenterGroup}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-black text-blue-400 font-mono leading-none">{team.points}</div>
                        <div className="text-[10px] text-gray-500 font-medium">PTS</div>
                      </div>
                      {userProfile?.role === 'admin' && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setAdminSelectedTeamId(team.id);
                            setShowAdmin(true);
                          }}
                          className="p-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/40 transition-colors"
                        >
                          <Settings size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions */}
      {!selectedCountryCode && !showLeaderboard && !showAdmin && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="bg-black/50 backdrop-blur-sm px-6 py-2 rounded-full border border-white/10 text-gray-400 text-sm font-medium"
          >
            Desliza el globo y haz clic en un país para ver detalles
          </motion.div>
        </div>
      )}
    </div>
  );
}
