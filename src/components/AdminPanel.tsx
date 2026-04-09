import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError } from '../lib/firebase';
import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Team } from '../types';
import { Plus, Trophy, Target, Trash2, Palette, Globe as GlobeIcon, Save, RefreshCcw, GripVertical, X } from 'lucide-react';
import { motion } from 'motion/react';

interface AdminPanelProps {
  teams: Team[];
  onClose: () => void;
  preSelectedTeamId?: string | null;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ teams, onClose, preSelectedTeamId }) => {
  const [activeTab, setActiveTab] = useState<'scores' | 'teams'>('scores');
  const [loading, setLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Score Update State
  const [selectedTeamId, setSelectedTeamId] = useState(preSelectedTeamId || '');
  const [goals, setGoals] = useState(0);
  const [points, setPoints] = useState(0);
  const [teamColor, setTeamColor] = useState('#3b82f6');

  useEffect(() => {
    if (preSelectedTeamId) {
      setSelectedTeamId(preSelectedTeamId);
      setActiveTab('scores');
    }
  }, [preSelectedTeamId]);

  // New Team State
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamCode, setNewTeamCode] = useState('');
  const [newTeamColor, setNewTeamColor] = useState('#3b82f6');
  const [newTeamGroup, setNewTeamGroup] = useState('');

  useEffect(() => {
    if (selectedTeamId) {
      const team = teams.find(t => t.id === selectedTeamId);
      if (team) {
        setTeamColor(team.color || '#3b82f6');
        setGoals(team.goals || 0);
        setPoints(team.points || 0);
      }
    } else {
      setGoals(0);
      setPoints(0);
    }
  }, [selectedTeamId, teams]);

  const handleUpdateScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId) return;

    setLoading(true);
    try {
      const teamRef = doc(db, 'teams', selectedTeamId);
      await updateDoc(teamRef, {
        goals: goals,
        points: points,
        color: teamColor,
        lastMatchDate: new Date().toISOString()
      });
      // No alert as per instructions
    } catch (error) {
      handleFirestoreError(error, 'update', `teams/${selectedTeamId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetAll = async () => {
    setLoading(true);
    try {
      const promises = teams.map(team => 
        updateDoc(doc(db, 'teams', team.id), {
          points: 0,
          goals: 0,
          lastMatchDate: new Date().toISOString()
        })
      );
      await Promise.all(promises);
    } catch (error) {
      handleFirestoreError(error, 'update', 'teams/all');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'teams'), {
        name: newTeamName,
        countryCode: newTeamCode.toUpperCase(),
        color: newTeamColor,
        callCenterGroup: newTeamGroup,
        points: 0,
        goals: 0,
        lastMatchDate: new Date().toISOString()
      });
      setNewTeamName('');
      setNewTeamCode('');
      setNewTeamGroup('');
    } catch (error) {
      handleFirestoreError(error, 'create', 'teams');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeam = async (id: string) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'teams', id));
      setConfirmDeleteId(null);
    } catch (error) {
      handleFirestoreError(error, 'delete', `teams/${id}`);
    } finally {
      setLoading(false);
    }
  };

  const getFlagUrl = (code: string) => {
    if (!code) return '';
    // Convert 3-letter code to 2-letter if possible, or just use a service that supports 3-letter
    // FlagCDN uses 2-letter codes. For simplicity, we'll assume the user provides 2-letter codes or we map them.
    // Most common 3-letter codes can be mapped or we can use a different service.
    // Let's use a service that handles ISO codes.
    return `https://flagcdn.com/w40/${code.toLowerCase().slice(0, 2)}.png`;
  };

  return (
    <motion.div 
      drag
      dragMomentum={false}
      className="bg-gray-900/95 backdrop-blur-xl p-6 rounded-3xl border border-gray-800 shadow-2xl w-full max-w-md pointer-events-auto"
    >
      <div className="flex items-center justify-between mb-4 cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-2 text-gray-400">
          <GripVertical size={20} />
          <span className="text-sm font-bold uppercase tracking-widest">Panel de Control</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="flex gap-4 mb-6 border-b border-gray-800 pb-4">
        <button
          onClick={() => setActiveTab('scores')}
          className={`flex-1 py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'scores' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
        >
          <Trophy size={18} /> Resultados
        </button>
        <button
          onClick={() => setActiveTab('teams')}
          className={`flex-1 py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'teams' ? 'bg-green-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
        >
          <GlobeIcon size={18} /> Equipos
        </button>
      </div>

      {activeTab === 'scores' ? (
        <form onSubmit={handleUpdateScore} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Seleccionar Equipo</label>
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              required
            >
              <option value="">Seleccione un país...</option>
              {teams.map((team, index) => (
                <option key={`${team.id}-${index}`} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1 flex items-center gap-1">
                <Target size={14} /> Goles Totales
              </label>
              <input
                type="number"
                value={goals}
                onChange={(e) => setGoals(parseInt(e.target.value) || 0)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1 flex items-center gap-1">
                <Trophy size={14} /> Puntos Totales
              </label>
              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1 flex items-center gap-1">
              <Palette size={14} /> Color del Equipo
            </label>
            <div className="flex gap-3 items-center">
              <input
                type="color"
                value={teamColor}
                onChange={(e) => setTeamColor(e.target.value)}
                className="h-10 w-20 bg-transparent border-none cursor-pointer"
              />
              <span className="text-xs font-mono text-gray-500 uppercase">{teamColor}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !selectedTeamId}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white font-bold py-3 rounded-xl transition-all transform active:scale-95 flex items-center justify-center gap-2"
          >
            <Save size={18} /> {loading ? 'Actualizando...' : 'Guardar Cambios'}
          </button>

          <button
            type="button"
            onClick={handleResetAll}
            disabled={loading || teams.length === 0}
            className="w-full mt-4 bg-red-600/20 hover:bg-red-600/30 text-red-400 font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-2 border border-red-500/30"
          >
            <RefreshCcw size={16} /> Reiniciar Todos a 0
          </button>
        </form>
      ) : (
        <div className="space-y-6">
          <form onSubmit={handleCreateTeam} className="space-y-4 bg-gray-800/30 p-4 rounded-2xl border border-gray-700/50">
            <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <Plus size={16} className="text-green-500" /> Nuevo Equipo
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <input
                placeholder="Nombre (ej: Argentina)"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white outline-none"
                required
              />
              <input
                placeholder="Código (ej: AR)"
                value={newTeamCode}
                onChange={(e) => setNewTeamCode(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white outline-none"
                required
                maxLength={3}
              />
            </div>
            <input
              placeholder="Grupo Call Center"
              value={newTeamGroup}
              onChange={(e) => setNewTeamGroup(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white outline-none"
            />
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={newTeamColor}
                onChange={(e) => setNewTeamColor(e.target.value)}
                className="h-8 w-16 bg-transparent border-none cursor-pointer"
              />
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-xl text-sm transition-all"
              >
                Crear Equipo
              </button>
            </div>
          </form>

          <div className="space-y-2">
            <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Equipos Existentes</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {teams.map((team, index) => (
                <div key={`${team.id}-${index}`} className="flex items-center justify-between bg-gray-800/50 p-3 rounded-xl border border-gray-700">
                  <div className="flex items-center gap-3">
                    <img 
                      src={getFlagUrl(team.countryCode)} 
                      alt={team.countryCode} 
                      className="w-6 h-4 object-cover rounded-sm shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color || '#3b82f6' }} />
                    <span className="font-medium text-sm">{team.name}</span>
                  </div>
                  
                  {confirmDeleteId === team.id ? (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleDeleteTeam(team.id)}
                        className="text-xs bg-red-600 px-2 py-1 rounded text-white"
                      >
                        Sí
                      </button>
                      <button 
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-xs bg-gray-700 px-2 py-1 rounded text-white"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(team.id)}
                      className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AdminPanel;
