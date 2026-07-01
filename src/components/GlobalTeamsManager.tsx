import React, { useState } from 'react';
import { Team, Player } from '../types';
import { Users, UserPlus, Plus, Trash2, IdCard, Calendar, ShieldAlert, CheckCircle, Trophy, Paintbrush } from 'lucide-react';

interface GlobalTeamsManagerProps {
  globalTeams: Team[];
  onUpdateGlobalTeams: (teams: Team[]) => void;
  isAdmin: boolean;
}

const PALETTE_COLORS = [
  'bg-emerald-600', 'bg-blue-600', 'bg-red-600', 'bg-amber-500', 
  'bg-indigo-600', 'bg-pink-600', 'bg-purple-600', 'bg-orange-600',
  'bg-teal-600', 'bg-rose-600', 'bg-violet-650', 'bg-cyan-500',
  'bg-lime-500', 'bg-fuchsia-600', 'bg-sky-500', 'bg-emerald-400'
];

export default function GlobalTeamsManager({
  globalTeams,
  onUpdateGlobalTeams,
  isAdmin
}: GlobalTeamsManagerProps) {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  
  // New Team Form
  const [newTeamName, setNewTeamName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PALETTE_COLORS[0]);
  const [teamError, setTeamError] = useState('');
  const [teamSuccess, setTeamSuccess] = useState('');

  // New Player Form
  const [playerName, setPlayerName] = useState('');
  const [playerRg, setPlayerRg] = useState('');
  const [playerBirthDate, setPlayerBirthDate] = useState('');
  const [playerError, setPlayerError] = useState('');
  const [playerSuccess, setPlayerSuccess] = useState('');

  const activeTeam = globalTeams.find(t => t.id === selectedTeamId);
  const currentPlayers = activeTeam?.players || [];

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    setTeamError('');
    setTeamSuccess('');

    const trimmedName = newTeamName.trim();
    if (!trimmedName) {
      setTeamError('O nome do time é obrigatório!');
      return;
    }

    if (globalTeams.some(t => t.name.toLowerCase() === trimmedName.toLowerCase())) {
      setTeamError('Já existe um time cadastrado com este nome!');
      return;
    }

    const newTeam: Team = {
      id: `team-global-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: trimmedName,
      color: selectedColor,
      players: []
    };

    const updated = [...globalTeams, newTeam];
    onUpdateGlobalTeams(updated);
    setNewTeamName('');
    // Select another color next
    const nextIndex = (PALETTE_COLORS.indexOf(selectedColor) + 1) % PALETTE_COLORS.length;
    setSelectedColor(PALETTE_COLORS[nextIndex]);
    setTeamSuccess('Equipe cadastrada com sucesso!');
    setTimeout(() => setTeamSuccess(''), 3500);
  };

  const handleDeleteTeam = (teamId: string, teamName: string) => {
    if (confirm(`Deseja realmente remover a equipe "${teamName}" do cadastro global?`)) {
      const updated = globalTeams.filter(t => t.id !== teamId);
      onUpdateGlobalTeams(updated);
      if (selectedTeamId === teamId) {
        setSelectedTeamId(null);
      }
    }
  };

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    setPlayerError('');
    setPlayerSuccess('');

    if (!activeTeam) return;

    const trimmedName = playerName.trim();
    const trimmedRg = playerRg.trim();

    if (!trimmedName) {
      setPlayerError('O nome do jogador é obrigatório.');
      return;
    }
    if (!trimmedRg) {
      setPlayerError('O RG do jogador é obrigatório.');
      return;
    }
    if (!playerBirthDate) {
      setPlayerError('A data de nascimento é obrigatória.');
      return;
    }

    if (currentPlayers.length >= 15) {
      setPlayerError('Limite atingido! Cada equipe pode ter no máximo 15 jogadores.');
      return;
    }

    const newPlayer: Player = {
      id: `player-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: trimmedName,
      rg: trimmedRg,
      birthDate: playerBirthDate
    };

    const updated = globalTeams.map(t => {
      if (t.id === activeTeam.id) {
        return {
          ...t,
          players: [...(t.players || []), newPlayer]
        };
      }
      return t;
    });

    onUpdateGlobalTeams(updated);
    setPlayerName('');
    setPlayerRg('');
    setPlayerBirthDate('');
    setPlayerSuccess('Jogador cadastrado no elenco!');
    setTimeout(() => setPlayerSuccess(''), 3000);
  };

  const handleDeletePlayer = (playerId: string, pName: string) => {
    if (!activeTeam) return;

    if (confirm(`Remover jogador "${pName}" desta equipe?`)) {
      const updated = globalTeams.map(t => {
        if (t.id === activeTeam.id) {
          return {
            ...t,
            players: (t.players || []).filter(p => p.id !== playerId)
          };
        }
        return t;
      });

      onUpdateGlobalTeams(updated);
      setPlayerSuccess('Jogador removido!');
      setTimeout(() => setPlayerSuccess(''), 3000);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <ShieldAlert className="w-12 h-12 text-zinc-500 mx-auto mb-4 animate-pulse" />
        <h3 className="text-lg font-bold text-white mb-2">Acesso Restrito ao Administrador</h3>
        <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
          O cadastro de times independentes e jogadores é de uso exclusivo do administrador do sistema.
          Por favor, ative a área administrativa no topo da página.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-800 pb-6">
        <div>
          <span className="text-xs font-mono text-emerald-400 tracking-wider uppercase">Painel de Controle Administrativo</span>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2.5 mt-1">
            <Users className="w-7 h-7 text-emerald-400" />
            <span>Tabela de Times & Elencos</span>
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Gerencie as equipes e jogadores independentes. Os campeonatos serão criados com base nos clubes cadastrados aqui.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT PANEL: CLUB CREATION & REGISTERED CLUBS (5 COLS) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* CREATE NEW CLUB FORM */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-4.5 h-4.5 text-emerald-400" />
                <span>Adicionar Novo Time</span>
              </h3>
              <p className="text-zinc-500 text-xs mt-0.5">Cadastre um clube permanente na tabela global.</p>
            </div>

            {teamError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl font-semibold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{teamError}</span>
              </div>
            )}

            {teamSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{teamSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold tracking-wider text-zinc-400 uppercase">
                  Nome do Clube / Escudo
                </label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="Ex: Vila Silvânia Sub-17 ⚽"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Color picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold tracking-wider text-zinc-400 uppercase flex items-center gap-1">
                  <Paintbrush className="w-3.5 h-3.5" />
                  <span>Cor de Identificação</span>
                </label>
                <div className="grid grid-cols-8 gap-2">
                  {PALETTE_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`w-7 h-7 rounded-lg ${color} relative transition-transform ${
                        selectedColor === color ? 'scale-110 ring-2 ring-emerald-400 ring-offset-2 ring-offset-zinc-900' : 'hover:scale-105'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-orange-500 text-white font-black text-xs uppercase tracking-wider rounded-xl hover:scale-[1.01] transition-transform shadow-md cursor-pointer"
              >
                Cadastrar Clube 🛡️
              </button>
            </form>
          </div>

          {/* LIST OF REGISTERED CLUBS */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Clubes Cadastrados
              </h3>
              <span className="text-xs font-mono font-bold text-zinc-500">
                {globalTeams.length} no total
              </span>
            </div>

            {globalTeams.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-sm">
                Nenhum clube cadastrado ainda. Use o formulário acima para registrar.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {globalTeams.map((team) => {
                  const isActive = team.id === selectedTeamId;
                  const count = team.players?.length || 0;
                  return (
                    <div
                      key={team.id}
                      onClick={() => setSelectedTeamId(team.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isActive
                          ? 'bg-emerald-500/5 border-emerald-500/45 shadow-sm'
                          : 'bg-zinc-950/40 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <div className={`w-3.5 h-3.5 rounded-full shrink-0 ${team.color}`} />
                        <span className="text-sm font-bold text-white truncate uppercase">{team.name}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-mono font-semibold text-zinc-400">
                          {count} Atletas
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTeam(team.id, team.name);
                          }}
                          className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Remover Clube"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: PLAYER ROSTER AND ROSTER MANAGER (7 COLS) */}
        <div className="lg:col-span-7 space-y-6">
          {activeTeam ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-xl animate-fade-in">
              
              {/* Active Team Header */}
              <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${activeTeam.color}`} />
                  <div>
                    <h2 className="text-lg font-black uppercase text-white truncate max-w-sm">
                      {activeTeam.name}
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Gerenciando elenco independente de campeonatos (<strong className="text-emerald-400 font-mono">{currentPlayers.length}/15</strong> atletas)
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                
                {/* Active Team Players List (7 columns) */}
                <div className="md:col-span-7 bg-zinc-950/40 border border-zinc-850 rounded-xl p-4 space-y-4">
                  <div className="flex justify-between items-center text-xs text-zinc-400 uppercase font-mono font-bold pb-2 border-b border-zinc-800">
                    <span>Atletas Inscritos</span>
                    <span>{currentPlayers.length} / 15</span>
                  </div>

                  {currentPlayers.length === 0 ? (
                    <div className="text-center py-10 px-4">
                      <Users className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                      <p className="text-xs font-bold text-zinc-500">Nenhum jogador no elenco</p>
                      <p className="text-[10px] text-zinc-600 mt-1">Use o painel ao lado para registrar atletas neste clube.</p>
                    </div>
                  ) : (
                    <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1">
                      {currentPlayers.map((player) => (
                        <div 
                          key={player.id}
                          className="p-2.5 bg-zinc-900/60 border border-zinc-850 rounded-lg flex items-center justify-between text-xs hover:border-zinc-700 transition-colors"
                        >
                          <div className="truncate pr-2">
                            <span className="font-bold text-white block truncate">{player.name}</span>
                            <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">
                              RG: {player.rg} • {player.birthDate ? new Date(player.birthDate + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeletePlayer(player.id, player.name)}
                            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all shrink-0"
                            title="Remover Atleta"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add Player Form (5 columns) */}
                <div className="md:col-span-5 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                      <UserPlus className="w-4 h-4 text-emerald-400" />
                      <span>Inscrição de Atleta</span>
                    </h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Cadastre o atleta no elenco fixo deste clube.</p>
                  </div>

                  {playerError && (
                    <div className="p-2.5 bg-red-500/10 border border-red-500/25 text-red-400 text-[10px] rounded-lg font-bold flex gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{playerError}</span>
                    </div>
                  )}

                  {playerSuccess && (
                    <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] rounded-lg font-bold flex gap-1">
                      <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{playerSuccess}</span>
                    </div>
                  )}

                  <form onSubmit={handleAddPlayer} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold tracking-wider text-zinc-400 uppercase">
                        Nome Completo
                      </label>
                      <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="Ex: Carlos Santana Jr"
                        disabled={currentPlayers.length >= 15}
                        className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold tracking-wider text-zinc-400 uppercase flex items-center gap-1">
                        <IdCard className="w-3 h-3 text-zinc-500" />
                        <span>RG</span>
                      </label>
                      <input
                        type="text"
                        value={playerRg}
                        onChange={(e) => setPlayerRg(e.target.value)}
                        placeholder="Ex: 50.123.456-x"
                        disabled={currentPlayers.length >= 15}
                        className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 text-xs font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold tracking-wider text-zinc-400 uppercase flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-zinc-500" />
                        <span>Nascimento</span>
                      </label>
                      <input
                        type="date"
                        value={playerBirthDate}
                        onChange={(e) => setPlayerBirthDate(e.target.value)}
                        disabled={currentPlayers.length >= 15}
                        className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 text-xs font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                      />
                    </div>

                    {currentPlayers.length >= 15 ? (
                      <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] rounded-lg">
                        Limite de 15 jogadores atingido.
                      </div>
                    ) : (
                      <button
                        type="submit"
                        className="w-full py-2 bg-gradient-to-r from-emerald-500 to-orange-500 text-white font-black text-xs uppercase tracking-wider rounded-lg hover:scale-[1.01] transition-transform shadow-md cursor-pointer"
                      >
                        Inscrição Fina ✍️
                      </button>
                    )}
                  </form>
                </div>

              </div>

            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center h-[500px] flex flex-col justify-center items-center shadow-xl">
              <Users className="w-16 h-16 text-zinc-700 mb-4 stroke-1 animate-bounce" />
              <h3 className="text-lg font-bold text-white mb-2">Nenhum Time Selecionado</h3>
              <p className="text-zinc-500 text-sm max-w-sm mx-auto">
                Selecione um clube na lista à esquerda para carregar, inscrever e gerenciar sua lista de atletas.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
