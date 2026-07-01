import React, { useState } from 'react';
import { Users, UserPlus, Trash2, IdCard, Calendar, ShieldAlert, CheckCircle, ArrowLeft, Trophy } from 'lucide-react';
import { Tournament, Team, Player } from '../types';

interface TeamRosterManagerProps {
  tournament: Tournament;
  isAdmin: boolean;
  onRequestAdmin: (callback: () => void) => void;
  onUpdateTeams: (updatedTeams: Team[]) => void;
}

export default function TeamRosterManager({
  tournament,
  isAdmin,
  onRequestAdmin,
  onUpdateTeams,
}: TeamRosterManagerProps) {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  
  // New player form state
  const [name, setName] = useState('');
  const [rg, setRg] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const selectedTeam = tournament.teams.find(t => t.id === selectedTeamId);
  const currentPlayers = selectedTeam?.players || [];

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedTeam) return;

    // Secure via admin permission check
    onRequestAdmin(() => {
      const activePlayers = selectedTeam.players || [];
      
      if (activePlayers.length >= 15) {
        setError('Limite atingido! Cada equipe pode ter no máximo 15 jogadores.');
        return;
      }

      const trimmedName = name.trim();
      const trimmedRg = rg.trim();
      
      if (!trimmedName) {
        setError('O nome do jogador é obrigatório.');
        return;
      }
      if (!trimmedRg) {
        setError('O RG do jogador é obrigatório.');
        return;
      }
      if (!birthDate) {
        setError('A data de nascimento é obrigatória.');
        return;
      }

      const newPlayer: Player = {
        id: crypto.randomUUID(),
        name: trimmedName,
        rg: trimmedRg,
        birthDate: birthDate,
      };

      const updatedTeams = tournament.teams.map(t => {
        if (t.id === selectedTeam.id) {
          return {
            ...t,
            players: [...(t.players || []), newPlayer]
          };
        }
        return t;
      });

      onUpdateTeams(updatedTeams);
      setName('');
      setRg('');
      setBirthDate('');
      setSuccess('Jogador cadastrado com sucesso!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    });
  };

  const handleDeletePlayer = (playerId: string, playerName: string) => {
    if (!selectedTeam) return;

    onRequestAdmin(() => {
      if (confirm(`Deseja realmente remover o jogador "${playerName}" da equipe?`)) {
        const updatedTeams = tournament.teams.map(t => {
          if (t.id === selectedTeam.id) {
            return {
              ...t,
              players: (t.players || []).filter(p => p.id !== playerId)
            };
          }
          return t;
        });

        onUpdateTeams(updatedTeams);
        setSuccess('Jogador removido!');
        setTimeout(() => setSuccess(''), 3000);
      }
    });
  };

  const handleUpdateCards = (playerId: string, cardType: 'yellowCards' | 'redCards' | 'doubleYellows', increment: boolean) => {
    onRequestAdmin(() => {
      const updatedTeams = tournament.teams.map(t => {
        if (t.id === selectedTeam.id) {
          return {
            ...t,
            players: (t.players || []).map(p => {
              if (p.id === playerId) {
                const currentVal = p[cardType] || 0;
                const newVal = increment ? currentVal + 1 : Math.max(0, currentVal - 1);
                return {
                  ...p,
                  [cardType]: newVal
                };
              }
              return p;
            })
          };
        }
        return t;
      });
      onUpdateTeams(updatedTeams);
    });
  };

  const handleUpdateGoals = (playerId: string, increment: boolean) => {
    onRequestAdmin(() => {
      const updatedTeams = tournament.teams.map(t => {
        if (t.id === selectedTeam.id) {
          return {
            ...t,
            players: (t.players || []).map(p => {
              if (p.id === playerId) {
                const currentVal = p.goals || 0;
                const newVal = increment ? currentVal + 1 : Math.max(0, currentVal - 1);
                return {
                  ...p,
                  goals: newVal
                };
              }
              return p;
            })
          };
        }
        return t;
      });
      onUpdateTeams(updatedTeams);
    });
  };

  const getSuspensionStatus = (p: Player) => {
    const yellows = p.yellowCards || 0;
    const reds = p.redCards || 0;
    const doubleYs = p.doubleYellows || 0;

    if (reds >= 1) {
      return { isSuspended: true, label: 'Suspenso 🟥', reason: 'Vermelho Direto' };
    }
    if (doubleYs >= 1) {
      return { isSuspended: true, label: 'Suspenso 🟨🟨', reason: '2 Amarelos na mesma partida' };
    }
    if (yellows >= 3) {
      return { isSuspended: true, label: 'Suspenso 🟨🟨🟨', reason: 'Acúmulo de 3 Amarelos' };
    }
    return { isSuspended: false, label: 'Regularizado ✔️', reason: 'Elegível para jogo' };
  };

  return (
    <div className="space-y-6">
      {!selectedTeamId ? (
        // TEAM SELECTION GRID VIEW
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <span>Elencos das Equipes</span>
              </h2>
              <p className="text-zinc-400 text-xs mt-1">
                Selecione uma equipe para visualizar ou gerenciar a lista de atletas cadastrados (máx. 15 por equipe).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tournament.teams.map(team => {
              const count = team.players?.length || 0;
              const isFull = count >= 15;
              return (
                <button
                  key={team.id}
                  onClick={() => {
                    setSelectedTeamId(team.id);
                    setError('');
                    setSuccess('');
                  }}
                  className="p-5 bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 rounded-2xl text-left transition-all hover:scale-[1.01] group flex flex-col justify-between h-36 relative overflow-hidden"
                >
                  {/* Subtle color stripe */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${team.color}`} />
                  
                  <div className="pl-2">
                    <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight truncate">
                      {team.name}
                    </h3>
                    <p className="text-xs text-zinc-500 font-mono mt-1">Arena Camaleão Club</p>
                  </div>

                  <div className="pl-2 flex items-center justify-between w-full mt-auto">
                    <span className="text-xs font-mono font-bold text-zinc-400 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-zinc-600" />
                      <span>{count} / 15 Atletas</span>
                    </span>

                    <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                      isFull 
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                        : count > 0 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    }`}>
                      {isFull ? 'Completo' : count === 0 ? 'Sem atletas' : 'Ativo'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        // DETAIL VIEW: SPECIFIC TEAM ROSTER
        <div className="space-y-6 animate-fade-in">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedTeamId(null)}
                className="p-2 bg-zinc-900 border border-zinc-800 hover:border-emerald-500/30 text-zinc-400 hover:text-white rounded-xl transition-all"
                title="Voltar para lista"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2.5">
                <div className={`w-3.5 h-3.5 rounded-full shrink-0 ${selectedTeam.color}`} />
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-white truncate max-w-xs sm:max-w-md">
                    {selectedTeam.name}
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Total cadastrado: <span className="font-mono font-bold text-emerald-400">{currentPlayers.length}/15</span> atletas
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedTeamId(null)}
              className="text-xs text-zinc-400 hover:text-white hover:underline font-bold"
            >
              Escolher outro time
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: CURRENT PLAYERS LIST */}
            <div className="lg:col-span-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 overflow-hidden">
              <div className="flex justify-between items-center pb-3 border-b border-zinc-800/60">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>Jogadores Inscritos & Cartões</span>
                </h3>
                <span className="text-xs font-mono font-bold text-zinc-500">
                  {currentPlayers.length} Inscritos
                </span>
              </div>

              {currentPlayers.length === 0 ? (
                <div className="text-center py-12 px-4 bg-zinc-950/40 border border-dashed border-zinc-850 rounded-xl">
                  <Users className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                  <p className="text-sm text-zinc-400 font-bold">Nenhum atleta cadastrado ainda</p>
                  <p className="text-xs text-zinc-600 mt-1 max-w-xs mx-auto">
                    {isAdmin 
                      ? 'Preencha o formulário ao lado para registrar o primeiro jogador deste time!' 
                      : 'Esta equipe ainda não possui atletas cadastrados no sistema.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[750px]">
                    <thead>
                      <tr className="border-b border-zinc-850 text-[10px] font-mono tracking-wider text-zinc-500 uppercase">
                        <th className="py-2 pb-3 pr-2">Atleta</th>
                        <th className="py-2 pb-3 px-2">RG</th>
                        <th className="py-2 pb-3 px-2 text-center">Nascimento</th>
                        <th className="py-2 pb-3 px-2 text-center w-28">Gols ⚽</th>
                        <th className="py-2 pb-3 px-2 text-center w-28">Amarelos</th>
                        <th className="py-2 pb-3 px-2 text-center w-28">2 Amarelos (Jogo)</th>
                        <th className="py-2 pb-3 px-2 text-center w-28">Vermelhos</th>
                        <th className="py-2 pb-3 px-2 text-center">Status / Suspensão</th>
                        {isAdmin && <th className="py-2 pb-3 text-right">Ação</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-850 text-sm">
                      {currentPlayers.map((player) => {
                        const status = getSuspensionStatus(player);
                        return (
                          <tr key={player.id} className="hover:bg-zinc-850/20 transition-colors">
                            {/* Player Name */}
                            <td className="py-3 pr-2">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-xs uppercase text-zinc-300 shrink-0">
                                  {player.name.substring(0, 2)}
                                </div>
                                <span className="font-semibold text-white truncate max-w-[130px]" title={player.name}>
                                  {player.name}
                                </span>
                              </div>
                            </td>

                            {/* RG - Protected by LGPD */}
                            <td className="py-3 px-2 font-mono text-xs text-zinc-400">
                              {isAdmin ? (
                                player.rg
                              ) : (
                                <span className="text-zinc-600 italic text-[11px]" title="Ocultado por conformidade com a LGPD">Protegido (LGPD)</span>
                              )}
                            </td>

                            {/* DOB - Protected by LGPD */}
                            <td className="py-3 px-2 text-center font-mono text-xs text-zinc-400">
                              {isAdmin ? (
                                player.birthDate ? new Date(player.birthDate + 'T00:00:00').toLocaleDateString('pt-BR') : '-'
                              ) : (
                                <span className="text-zinc-600 italic text-[11px]" title="Ocultado por conformidade com a LGPD">Protegido (LGPD)</span>
                              )}
                            </td>

                            {/* Goals Scored */}
                            <td className="py-3 px-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {isAdmin ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateGoals(player.id, false)}
                                      className="w-5 h-5 bg-zinc-800 hover:bg-zinc-750 text-zinc-400 hover:text-white rounded flex items-center justify-center text-xs font-bold transition-all"
                                      title="Subtrair Gol"
                                    >
                                      -
                                    </button>
                                    <span className="w-7 text-center font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 py-0.5 rounded text-xs">
                                      {player.goals || 0}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateGoals(player.id, true)}
                                      className="w-5 h-5 bg-zinc-800 hover:bg-emerald-500 hover:text-zinc-950 text-zinc-400 rounded flex items-center justify-center text-xs font-bold transition-all"
                                      title="Lançar Gol"
                                    >
                                      +
                                    </button>
                                  </>
                                ) : (
                                  <span className="w-7 text-center font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 py-0.5 px-1.5 rounded text-xs">
                                    {player.goals || 0}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Yellow Cards Accumulator */}
                            <td className="py-3 px-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {isAdmin ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateCards(player.id, 'yellowCards', false)}
                                      className="w-5 h-5 bg-zinc-800 hover:bg-zinc-750 text-zinc-400 hover:text-white rounded flex items-center justify-center text-xs font-bold transition-all"
                                    >
                                      -
                                    </button>
                                    <span className="w-7 text-center font-bold text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 py-0.5 rounded text-xs">
                                      {player.yellowCards || 0}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateCards(player.id, 'yellowCards', true)}
                                      className="w-5 h-5 bg-zinc-800 hover:bg-yellow-500 hover:text-zinc-950 text-zinc-400 rounded flex items-center justify-center text-xs font-bold transition-all"
                                    >
                                      +
                                    </button>
                                  </>
                                ) : (
                                  <span className="w-7 text-center font-bold text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 py-0.5 px-1.5 rounded text-xs">
                                    {player.yellowCards || 0}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Double Yellow (same game) Accumulator */}
                            <td className="py-3 px-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {isAdmin ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateCards(player.id, 'doubleYellows', false)}
                                      className="w-5 h-5 bg-zinc-800 hover:bg-zinc-750 text-zinc-400 hover:text-white rounded flex items-center justify-center text-xs font-bold transition-all"
                                    >
                                      -
                                    </button>
                                    <span className="w-7 text-center font-bold text-orange-400 bg-orange-400/10 border border-orange-400/20 py-0.5 rounded text-xs">
                                      {player.doubleYellows || 0}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateCards(player.id, 'doubleYellows', true)}
                                      className="w-5 h-5 bg-zinc-800 hover:bg-orange-500 hover:text-zinc-950 text-zinc-400 rounded flex items-center justify-center text-xs font-bold transition-all"
                                    >
                                      +
                                    </button>
                                  </>
                                ) : (
                                  <span className="w-7 text-center font-bold text-orange-400 bg-orange-400/10 border border-orange-400/20 py-0.5 px-1.5 rounded text-xs">
                                    {player.doubleYellows || 0}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Red Cards Accumulator */}
                            <td className="py-3 px-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {isAdmin ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateCards(player.id, 'redCards', false)}
                                      className="w-5 h-5 bg-zinc-800 hover:bg-zinc-750 text-zinc-400 hover:text-white rounded flex items-center justify-center text-xs font-bold transition-all"
                                    >
                                      -
                                    </button>
                                    <span className="w-7 text-center font-bold text-red-500 bg-red-500/10 border border-red-500/20 py-0.5 rounded text-xs">
                                      {player.redCards || 0}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateCards(player.id, 'redCards', true)}
                                      className="w-5 h-5 bg-zinc-800 hover:bg-red-500 hover:text-zinc-950 text-zinc-400 rounded flex items-center justify-center text-xs font-bold transition-all"
                                    >
                                      +
                                    </button>
                                  </>
                                ) : (
                                  <span className="w-7 text-center font-bold text-red-500 bg-red-500/10 border border-red-500/20 py-0.5 px-1.5 rounded text-xs">
                                    {player.redCards || 0}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Active Suspension Status & Reason */}
                            <td className="py-3 px-2 text-center">
                              <span
                                className={`inline-block text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                                  status.isSuspended
                                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                }`}
                                title={status.reason || 'Jogador regularizado'}
                              >
                                {status.label}
                              </span>
                            </td>

                            {/* Delete Action (Admin-only) */}
                            {isAdmin && (
                              <td className="py-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleDeletePlayer(player.id, player.name)}
                                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-all"
                                  title="Remover Jogador"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: REGISTER NEW PLAYER FORM */}
            <div className="lg:col-span-4 space-y-4">
              {isAdmin ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <UserPlus className="w-4.5 h-4.5 text-emerald-400" />
                      <span>Inscrever Novo Atleta</span>
                    </h3>
                    <p className="text-zinc-500 text-xs mt-0.5">
                      Preencha os dados abaixo para vincular o jogador a este time.
                    </p>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl font-semibold flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {success && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl font-semibold flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <span>{success}</span>
                    </div>
                  )}

                  <form onSubmit={handleAddPlayer} className="space-y-4">
                    {/* Name input */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono font-bold tracking-wider text-zinc-400 uppercase">
                        Nome Completo
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: João Silva de Souza"
                        disabled={currentPlayers.length >= 15}
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                      />
                    </div>

                    {/* RG & DOB row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* RG input */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-mono font-bold tracking-wider text-zinc-400 uppercase flex items-center gap-1">
                          <IdCard className="w-3.5 h-3.5" />
                          <span>RG</span>
                        </label>
                        <input
                          type="text"
                          value={rg}
                          onChange={(e) => setRg(e.target.value)}
                          placeholder="Ex: 12.345.678-9"
                          disabled={currentPlayers.length >= 15}
                          className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 text-sm font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                        />
                      </div>

                      {/* Birthdate input */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-mono font-bold tracking-wider text-zinc-400 uppercase flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Nascimento</span>
                        </label>
                        <input
                          type="date"
                          value={birthDate}
                          onChange={(e) => setBirthDate(e.target.value)}
                          disabled={currentPlayers.length >= 15}
                          className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 text-sm font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                        />
                      </div>
                    </div>

                    {/* Submit Button */}
                    {currentPlayers.length >= 15 ? (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl text-amber-400 text-xs font-medium flex gap-2">
                        <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>Este elenco já atingiu o limite de inscrição de 15 jogadores. Remova algum jogador para habilitar nova inscrição.</span>
                      </div>
                    ) : (
                      <button
                        type="submit"
                        className="w-full py-3 bg-gradient-to-r from-emerald-500 to-orange-500 text-white font-black text-xs uppercase tracking-wider rounded-xl hover:scale-[1.01] transition-transform shadow-md cursor-pointer"
                      >
                        Salvar Jogador
                      </button>
                    )}
                  </form>
                </div>
              ) : (
                <div className="bg-zinc-900/50 border border-zinc-850 rounded-2xl p-5 space-y-3">
                  <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-zinc-500" />
                    <span>Acesso Restrito</span>
                  </h4>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    Você está visualizando a escalação em modo de consulta. Para adicionar ou remover atletas deste clube, autentique-se como administrador.
                  </p>
                  <button
                    onClick={() => onRequestAdmin(() => {})}
                    className="w-full py-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-bold rounded-xl transition-all"
                  >
                    Entrar como Admin
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
