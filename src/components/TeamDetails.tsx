import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, Target, Users, Calendar } from 'lucide-react';
import { Team, Match } from '../types';

interface TeamDetailsProps {
  team: Team | null;
  matches: Match[];
  onClose: () => void;
  allTeams: Team[];
}

const TeamDetails: React.FC<TeamDetailsProps> = ({ team, matches, onClose, allTeams }) => {
  if (!team) return null;

  const teamMatches = matches.filter(m => m.teamAId === team.id || m.teamBId === team.id);

  const getTeamName = (id: string) => allTeams.find(t => t.id === id)?.name || 'Desconocido';

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="fixed right-0 top-0 h-full w-full md:w-96 bg-gray-900/95 backdrop-blur-md border-l border-gray-800 text-white z-50 overflow-y-auto"
      style={{ borderLeftColor: team.color || '#3b82f6', borderLeftWidth: '4px' }}
    >
      <div className="p-6">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold tracking-tight">{team.name}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700">
            <div className="flex items-center gap-2 text-blue-400 mb-1">
              <Trophy size={18} />
              <span className="text-sm font-medium">Puntos</span>
            </div>
            <div className="text-2xl font-bold">{team.points}</div>
          </div>
          <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700">
            <div className="flex items-center gap-2 text-green-400 mb-1">
              <Target size={18} />
              <span className="text-sm font-medium">Goles</span>
            </div>
            <div className="text-2xl font-bold">{team.goals}</div>
          </div>
        </div>

        <div className="space-y-6">
          <section>
            <div className="flex items-center gap-2 text-gray-400 mb-3">
              <Users size={18} />
              <h3 className="text-sm font-semibold uppercase tracking-wider">Grupo de Call Center</h3>
            </div>
            <p className="text-lg text-gray-200">{team.callCenterGroup || 'No asignado'}</p>
          </section>

          <section>
            <div className="flex items-center gap-2 text-gray-400 mb-3">
              <Calendar size={18} />
              <h3 className="text-sm font-semibold uppercase tracking-wider">Partidos Recientes</h3>
            </div>
            <div className="space-y-3">
              {teamMatches.length === 0 ? (
                <p className="text-gray-500 italic">No hay partidos registrados</p>
              ) : (
                teamMatches.map((match, index) => (
                  <div key={`${match.id}-${index}`} className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-500">{new Date(match.date).toLocaleDateString()}</span>
                      <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full ${
                        match.status === 'completed' ? 'bg-green-500/20 text-green-400' : 
                        match.status === 'live' ? 'bg-red-500/20 text-red-400 animate-pulse' : 
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {match.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex-1 text-center font-medium truncate">{getTeamName(match.teamAId)}</div>
                      <div className="px-4 text-xl font-bold text-blue-400">{match.scoreA} - {match.scoreB}</div>
                      <div className="flex-1 text-center font-medium truncate">{getTeamName(match.teamBId)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  );
};

export default TeamDetails;
