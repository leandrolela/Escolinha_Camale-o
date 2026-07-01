import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Save, Trash2, ArrowLeft, Trophy, Award, BarChart3, RotateCcw, Sparkles, Users, Calendar, Flame } from 'lucide-react';
import { Tournament, Match, Team, TeamStats } from '../types';
import TeamRosterManager from './TeamRosterManager';

interface LeagueTournamentProps {
  tournament: Tournament;
  onUpdateMatches: (matches: Match[]) => void;
  onBack: () => void;
  onUpdateStatus: (status: 'active' | 'completed', winnerId: string | null) => void;
  onUpdateTeams: (updatedTeams: Team[]) => void;
  isAdmin: boolean;
  onRequestAdmin: (callback: () => void) => void;
}

export default function LeagueTournament({
  tournament,
  onUpdateMatches,
  onBack,
  onUpdateStatus,
  onUpdateTeams,
  isAdmin,
  onRequestAdmin,
}: LeagueTournamentProps) {
  const [activeTab, setActiveTab] = useState<'standings' | 'matches' | 'stats' | 'scorers' | 'players'>('standings');
  const [selectedRound, setSelectedRound] = useState(1);
  const [editingScores, setEditingScores] = useState<Record<string, { home: string; away: string }>>({});

  // Calculate the total number of rounds
  const totalRounds = useMemo(() => {
    const roundsSet = new Set(tournament.matches.map(m => m.round));
    return roundsSet.size;
  }, [tournament.matches]);

  // Teams lookup dictionary
  const teamsMap = useMemo(() => {
    const map: Record<string, Team> = {};
    tournament.teams.forEach(team => {
      map[team.id] = team;
    });
    return map;
  }, [tournament.teams]);

  // Calculate top scorers list in real time
  const scorersList = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      teamId: string;
      teamName: string;
      teamColor: string;
      goals: number;
      yellowCards: number;
      doubleYellows: number;
      redCards: number;
    }> = [];

    tournament.teams.forEach((team) => {
      (team.players || []).forEach((player) => {
        list.push({
          id: player.id,
          name: player.name,
          teamId: team.id,
          teamName: team.name,
          teamColor: team.color,
          goals: player.goals || 0,
          yellowCards: player.yellowCards || 0,
          doubleYellows: player.doubleYellows || 0,
          redCards: player.redCards || 0,
        });
      });
    });

    // Sort by goals descending, then by fewer red cards, then by fewer yellow cards
    return list.sort((a, b) => {
      if (b.goals !== a.goals) return b.goals - a.goals;
      if (b.redCards !== a.redCards) return a.redCards - b.redCards;
      return a.yellowCards - b.yellowCards;
    });
  }, [tournament.teams]);

  // Calculate standings table in real time
  const standings: TeamStats[] = useMemo(() => {
    // Initialize stats for each team
    const statsMap: Record<string, TeamStats> = {};
    tournament.teams.forEach(team => {
      statsMap[team.id] = {
        teamId: team.id,
        points: 0,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0
      };
    });

    const victoryPoints = tournament.rules?.victoryPoints ?? 3;
    const drawPoints = tournament.rules?.drawPoints ?? 1;
    const defeatPoints = tournament.rules?.defeatPoints ?? 0;

    // Process each played match
    tournament.matches.forEach(match => {
      if (!match.played || match.homeScore === null || match.awayScore === null) return;

      const hStats = statsMap[match.homeTeamId];
      const aStats = statsMap[match.awayTeamId];
      if (!hStats || !aStats) return; // Guard against anomalies

      hStats.played += 1;
      aStats.played += 1;

      hStats.goalsFor += match.homeScore;
      hStats.goalsAgainst += match.awayScore;
      
      aStats.goalsFor += match.awayScore;
      aStats.goalsAgainst += match.homeScore;

      if (match.homeScore > match.awayScore) {
        hStats.wins += 1;
        hStats.points += victoryPoints;
        aStats.losses += 1;
        aStats.points += defeatPoints;
      } else if (match.homeScore < match.awayScore) {
        aStats.wins += 1;
        aStats.points += victoryPoints;
        hStats.losses += 1;
        hStats.points += defeatPoints;
      } else {
        hStats.draws += 1;
        hStats.points += drawPoints;
        aStats.draws += 1;
        aStats.points += drawPoints;
      }

      hStats.goalDifference = hStats.goalsFor - hStats.goalsAgainst;
      aStats.goalDifference = aStats.goalsFor - aStats.goalsAgainst;
    });

    // Sort standings
    return Object.values(statsMap).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points; // 1. Points
      if (b.wins !== a.wins) return b.wins - a.wins; // 2. Wins
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference; // 3. SG
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor; // 4. GP
      return aStatsCompare(a.teamId, b.teamId); // Fallback
    });

    function aStatsCompare(idA: string, idB: string) {
      const nameA = teamsMap[idA]?.name || '';
      const nameB = teamsMap[idB]?.name || '';
      return nameA.localeCompare(nameB);
    }
  }, [tournament.matches, tournament.teams, tournament.rules, teamsMap]);

  // Check if all matches are played to crown champion
  const isAllPlayed = useMemo(() => {
    return tournament.matches.every(m => m.played);
  }, [tournament.matches]);

  const championTeam = useMemo(() => {
    if (isAllPlayed && standings.length > 0) {
      return teamsMap[standings[0].teamId];
    }
    return null;
  }, [isAllPlayed, standings, teamsMap]);

  // Handle score change input
  const handleScoreChange = (matchId: string, team: 'home' | 'away', val: string) => {
    // Only allow non-negative integers or empty string
    if (val !== '' && !/^\d+$/.test(val)) return;
    
    setEditingScores(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        home: team === 'home' ? val : (prev[matchId]?.home ?? ''),
        away: team === 'away' ? val : (prev[matchId]?.away ?? ''),
      }
    }));
  };

  // Handle dropping a team onto a match side (home/away)
  const handleDropTeam = (matchId: string, side: 'home' | 'away', e: React.DragEvent) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedId) return;

    onRequestAdmin(() => {
      const match = tournament.matches.find(m => m.id === matchId);
      if (!match || match.played) return;

      const updated = tournament.matches.map(m => {
        if (m.id === matchId) {
          const prevHome = m.homeTeamId;
          const prevAway = m.awayTeamId;

          if (side === 'home') {
            if (prevAway === draggedId) {
              return { ...m, homeTeamId: draggedId, awayTeamId: prevHome };
            }
            return { ...m, homeTeamId: draggedId };
          } else {
            if (prevHome === draggedId) {
              return { ...m, awayTeamId: draggedId, homeTeamId: prevAway };
            }
            return { ...m, awayTeamId: draggedId };
          }
        }
        return m;
      });

      onUpdateMatches(updated);
    });
  };

  // Save single match score
  const saveMatchScore = (matchId: string) => {
    onRequestAdmin(() => {
      const edit = editingScores[matchId];
      if (!edit || edit.home === '' || edit.away === '') return;

      const homeScore = parseInt(edit.home);
      const awayScore = parseInt(edit.away);

      const updatedMatches = tournament.matches.map(m => {
        if (m.id === matchId) {
          return {
            ...m,
            homeScore,
            awayScore,
            played: true
          };
        }
        return m;
      });

      onUpdateMatches(updatedMatches);
      
      // Clear editing state for this match
      const newEdits = { ...editingScores };
      delete newEdits[matchId];
      setEditingScores(newEdits);

      // If this is the last match to be played, automatically complete the tournament
      const allWillBePlayed = updatedMatches.every(m => m.played);
      if (allWillBePlayed && updatedMatches.length > 0) {
        // Find top team in updated standings
        const statsMap: Record<string, number> = {};
        tournament.teams.forEach(t => { statsMap[t.id] = 0; });
        updatedMatches.forEach(m => {
          if (m.homeScore! > m.awayScore!) {
            statsMap[m.homeTeamId] += 3;
          } else if (m.homeScore! < m.awayScore!) {
            statsMap[m.awayTeamId] += 3;
          } else {
            statsMap[m.homeTeamId] += 1;
            statsMap[m.awayTeamId] += 1;
          }
        });
        const winnerId = Object.entries(statsMap).sort((a,b) => b[1] - a[1])[0][0];
        onUpdateStatus('completed', winnerId);
      } else {
        onUpdateStatus('active', null);
      }
    });
  };

  // Update match date
  const handleMatchDateChange = (matchId: string, date: string) => {
    onRequestAdmin(() => {
      const updated = tournament.matches.map(m => {
        if (m.id === matchId) {
          return { ...m, date };
        }
        return m;
      });
      onUpdateMatches(updated);
    });
  };

  // Update match time
  const handleMatchTimeChange = (matchId: string, time: string) => {
    onRequestAdmin(() => {
      const updated = tournament.matches.map(m => {
        if (m.id === matchId) {
          return { ...m, time };
        }
        return m;
      });
      onUpdateMatches(updated);
    });
  };

  // Format date helper (e.g. "YYYY-MM-DD" -> "DD/MM/YYYY")
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Reset all matches back to unplayed
  const resetChampionship = () => {
    onRequestAdmin(() => {
      if (confirm('Deseja zerar todos os placares deste campeonato?')) {
        const reset = tournament.matches.map(m => ({
          ...m,
          homeScore: null,
          awayScore: null,
          played: false
        }));
        onUpdateMatches(reset);
        onUpdateStatus('active', null);
        setEditingScores({});
      }
    });
  };

  // Quick random simulation for current round matches
  const simulateRoundMatches = () => {
    onRequestAdmin(() => {
      const currentRoundMatches = tournament.matches.filter(m => m.round === selectedRound);
      const updated = tournament.matches.map(m => {
        if (m.round === selectedRound) {
          const homeScore = Math.floor(Math.random() * 5); // 0 to 4 goals
          const awayScore = Math.floor(Math.random() * 4); // 0 to 3 goals
          return {
            ...m,
            homeScore,
            awayScore,
            played: true
          };
        }
        return m;
      });

      onUpdateMatches(updated);

      // If all are played, complete
      const allWillBePlayed = updated.every(m => m.played);
      if (allWillBePlayed) {
        // Recalculate quick winner
        const statsMap: Record<string, number> = {};
        tournament.teams.forEach(t => { statsMap[t.id] = 0; });
        updated.forEach(m => {
          if (m.homeScore! > m.awayScore!) {
            statsMap[m.homeTeamId] += 3;
          } else if (m.homeScore! < m.awayScore!) {
            statsMap[m.awayTeamId] += 3;
          } else {
            statsMap[m.homeTeamId] += 1;
            statsMap[m.awayTeamId] += 1;
          }
        });
        const winnerId = Object.entries(statsMap).sort((a,b) => b[1] - a[1])[0][0];
        onUpdateStatus('completed', winnerId);
      }
    });
  };

  // Stats Highlights
  const bestAttack = useMemo(() => {
    if (standings.length === 0) return null;
    const sorted = [...standings].sort((a, b) => b.goalsFor - a.goalsFor);
    return {
      team: teamsMap[sorted[0].teamId],
      count: sorted[0].goalsFor
    };
  }, [standings, teamsMap]);

  const bestDefense = useMemo(() => {
    if (standings.length === 0) return null;
    const sorted = [...standings].sort((a, b) => a.goalsAgainst - b.goalsAgainst);
    return {
      team: teamsMap[sorted[0].teamId],
      count: sorted[0].goalsAgainst
    };
  }, [standings, teamsMap]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white">
      {/* HEADER CONTROL */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 bg-zinc-900 border border-zinc-800 hover:border-emerald-500/30 text-zinc-400 hover:text-white rounded-xl transition-all"
            title="Voltar ao Painel"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-emerald-500/30 overflow-hidden shrink-0 flex items-center justify-center">
              <img 
                src="/src/assets/images/chameleon_logo_1782871892093.jpg" 
                alt="Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="text-xs font-mono text-emerald-400 tracking-wider uppercase font-bold">Gerenciador de Pontos Corridos</span>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white line-clamp-1">{tournament.name}</h1>
            </div>
          </div>
        </div>

        {/* Global actions */}
        <div className="flex gap-2">
          <button
            onClick={resetChampionship}
            className="px-4 py-2 bg-zinc-900 hover:bg-red-500/10 border border-zinc-800 hover:border-red-500/30 text-zinc-400 hover:text-red-400 text-xs font-bold rounded-xl transition-all flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Zerar Torneio</span>
          </button>
        </div>
      </div>

      {/* Read-only notification banner */}
      {!isAdmin && (
        <div className="mb-8 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-500 shrink-0" />
            <span className="text-xs text-zinc-400 leading-relaxed">
              Você está visualizando os resultados. Os placares e tabelas estão livres para consulta. Para registrar novos placares, simular rodadas ou zerar o torneio, acesse a <strong>Área Administrativa</strong>.
            </span>
          </div>
          <button
            onClick={() => onRequestAdmin(() => {})}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 shrink-0 hover:underline"
          >
            Acessar Área Administrativa
          </button>
        </div>
      )}

      {/* CHAMPION CORONATION BOX */}
      {tournament.status === 'completed' && championTeam && (
        <div className="bg-gradient-to-r from-emerald-50 via-white to-orange-50 border-2 border-emerald-500/40 p-6 sm:p-8 rounded-2xl text-center mb-8 shadow-xl relative overflow-hidden animate-fade-in">
          <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-orange-400/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-yellow-500/20">
            <Trophy className="w-9 h-9 text-zinc-900" />
          </div>
          <span className="text-[10px] font-mono tracking-widest text-orange-600 uppercase font-bold">TORNEIO CONCLUÍDO</span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 uppercase mt-1">
            {championTeam.name} é Campeão!
          </h2>
          <p className="text-zinc-400 text-sm max-w-sm mx-auto mt-2">
            Com as rodadas finalizadas, a equipe encerra no topo da tabela e ergue a taça da Arena Camaleão!
          </p>
        </div>
      )}

      {/* SUB-TABS NAVIGATION */}
      <div className="flex border-b border-zinc-800 mb-8 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('standings')}
          className={`px-5 py-3 text-sm font-bold tracking-wide uppercase flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'standings'
              ? 'text-emerald-400 border-emerald-400 bg-emerald-500/5'
              : 'text-zinc-400 border-transparent hover:text-white'
          }`}
        >
          <Award className="w-4.5 h-4.5" />
          <span>Tabela</span>
        </button>
        <button
          onClick={() => setActiveTab('matches')}
          className={`px-5 py-3 text-sm font-bold tracking-wide uppercase flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'matches'
              ? 'text-emerald-400 border-emerald-400 bg-emerald-500/5'
              : 'text-zinc-400 border-transparent hover:text-white'
          }`}
        >
          <Trophy className="w-4.5 h-4.5" />
          <span>Partidas / Rodadas</span>
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-5 py-3 text-sm font-bold tracking-wide uppercase flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'stats'
              ? 'text-emerald-400 border-emerald-400 bg-emerald-500/5'
              : 'text-zinc-400 border-transparent hover:text-white'
          }`}
        >
          <BarChart3 className="w-4.5 h-4.5" />
          <span>Destaques</span>
        </button>
        <button
          onClick={() => setActiveTab('scorers')}
          className={`px-5 py-3 text-sm font-bold tracking-wide uppercase flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'scorers'
              ? 'text-emerald-400 border-emerald-400 bg-emerald-500/5'
              : 'text-zinc-400 border-transparent hover:text-white'
          }`}
        >
          <Flame className="w-4.5 h-4.5 text-orange-400" />
          <span>Artilharia</span>
        </button>
        <button
          onClick={() => setActiveTab('players')}
          className={`px-5 py-3 text-sm font-bold tracking-wide uppercase flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'players'
              ? 'text-emerald-400 border-emerald-400 bg-emerald-500/5'
              : 'text-zinc-400 border-transparent hover:text-white'
          }`}
        >
          <Users className="w-4.5 h-4.5" />
          <span>Jogadores / Elencos</span>
        </button>
      </div>

      {/* TAB 1: STANDINGS TABLE */}
      {activeTab === 'standings' && (
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-zinc-950 text-[10px] font-mono tracking-wider text-zinc-500 uppercase border-b border-zinc-800">
                    <th className="py-4 px-4 text-center w-12">Pos</th>
                    <th className="py-4 px-4">Clube</th>
                    <th className="py-4 px-3 text-center bg-zinc-900/60 font-black text-zinc-300 w-14">P</th>
                    <th className="py-4 px-3 text-center w-12">J</th>
                    <th className="py-4 px-3 text-center w-12">V</th>
                    <th className="py-4 px-3 text-center w-12">E</th>
                    <th className="py-4 px-3 text-center w-12">D</th>
                    <th className="py-4 px-3 text-center w-12">GP</th>
                    <th className="py-4 px-3 text-center w-12">GC</th>
                    <th className="py-4 px-3 text-center w-12">SG</th>
                    <th className="py-4 px-3 text-center w-14">%</th>
                    <th className="py-4 px-4 text-center w-36">Últimos Jogos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/60 text-sm">
                  {standings.map((stat, idx) => {
                    const team = teamsMap[stat.teamId];
                    if (!team) return null;
                    
                    const isLeader = idx === 0;

                    // Leader is highlighted, other rows are clean/neutral without Libertadores, Sul-Americana or Z4 borders
                    let zoneBorder = 'border-l-4 border-transparent';
                    let zoneBadge = 'text-zinc-400 bg-zinc-800/40';
                    if (isLeader) {
                      zoneBorder = 'border-l-4 border-emerald-500';
                      zoneBadge = 'bg-emerald-500 text-zinc-950 font-black';
                    }

                    // Aproveitamento Calculation
                    const maxPossiblePoints = stat.played * 3;
                    const aproveitamento = maxPossiblePoints > 0 ? (stat.points / maxPossiblePoints) * 100 : 0;

                    // Recent Form Calculation (Oldest on left, Newest on right)
                    const teamMatches = tournament.matches
                      .filter(m => m.played && (m.homeTeamId === stat.teamId || m.awayTeamId === stat.teamId))
                      .sort((a, b) => a.round - b.round); // chronologically
                    
                    const recentMatches = teamMatches.slice(-5);
                    const formSymbols = recentMatches.map(m => {
                      const isHome = m.homeTeamId === stat.teamId;
                      const selfScore = isHome ? m.homeScore! : m.awayScore!;
                      const oppScore = isHome ? m.awayScore! : m.homeScore!;
                      if (selfScore > oppScore) return 'V';
                      if (selfScore < oppScore) return 'D';
                      return 'E';
                    });

                    return (
                      <tr 
                        key={stat.teamId} 
                        className={`hover:bg-zinc-900/40 transition-colors ${zoneBorder} ${
                          isLeader && isAllPlayed ? 'bg-emerald-500/5' : ''
                        }`}
                      >
                        {/* POS */}
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex w-6 h-6 items-center justify-center rounded-md text-xs font-black shadow-inner ${zoneBadge}`}>
                            {idx + 1}
                          </span>
                        </td>

                        {/* CLUB */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-3.5 h-3.5 rounded-full shrink-0 ${team.color}`} />
                            <span className="font-bold text-white tracking-tight uppercase text-xs sm:text-sm">{team.name}</span>
                          </div>
                        </td>

                        {/* POINTS (P) */}
                        <td className="py-3 px-3 text-center bg-zinc-900/60 font-black text-emerald-400">
                          {stat.points}
                        </td>

                        {/* PLAYED (J) */}
                        <td className="py-3 px-3 text-center font-bold text-zinc-300 font-mono text-xs">{stat.played}</td>

                        {/* WINS (V) */}
                        <td className="py-3 px-3 text-center text-zinc-400 font-mono text-xs">{stat.wins}</td>

                        {/* DRAWS (E) */}
                        <td className="py-3 px-3 text-center text-zinc-400 font-mono text-xs">{stat.draws}</td>

                        {/* LOSSES (D) */}
                        <td className="py-3 px-3 text-center text-zinc-400 font-mono text-xs">{stat.losses}</td>

                        {/* GOALS FOR (GP) */}
                        <td className="py-3 px-3 text-center text-zinc-400 font-mono text-xs">{stat.goalsFor}</td>

                        {/* GOALS AGAINST (GC) */}
                        <td className="py-3 px-3 text-center text-zinc-400 font-mono text-xs">{stat.goalsAgainst}</td>

                        {/* GOAL DIFFERENCE (SG) */}
                        <td className={`py-3 px-3 text-center font-bold font-mono text-xs ${
                          stat.goalDifference > 0 
                            ? 'text-emerald-500' 
                            : stat.goalDifference < 0 
                            ? 'text-red-400' 
                            : 'text-zinc-500'
                        }`}>
                          {stat.goalDifference > 0 ? `+${stat.goalDifference}` : stat.goalDifference}
                        </td>

                        {/* APROVEITAMENTO (%) */}
                        <td className="py-3 px-3 text-center font-semibold text-zinc-400 font-mono text-xs">
                          {aproveitamento.toFixed(1)}%
                        </td>

                        {/* RECENT FORM DOTS */}
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            {formSymbols.length === 0 ? (
                              <span className="text-[10px] font-mono text-zinc-600">-</span>
                            ) : (
                              formSymbols.map((symbol, sIdx) => {
                                let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                                if (symbol === 'D') badgeColor = 'bg-red-500/10 text-red-400 border-red-500/20';
                                if (symbol === 'E') badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                                return (
                                  <span 
                                    key={sIdx} 
                                    className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-black ${badgeColor}`}
                                    title={symbol === 'V' ? 'Vitória' : symbol === 'E' ? 'Empate' : 'Derrota'}
                                  >
                                    {symbol}
                                  </span>
                                );
                              })
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ROUND MATCHES */}
      {activeTab === 'matches' && (
        <div className="space-y-6 max-w-3xl mx-auto">
          {/* DRAGGABLE TEAMS POOL FOR CONFRONTATION UPDATE */}
          {isAdmin && (
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-3 shadow-md">
              <div className="flex justify-between items-center flex-wrap gap-1 pb-1 border-b border-zinc-800">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase">
                  Alterar Confrontos por Arraste e Solte 🫳
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  Arraste qualquer time e solte-o no slot da partida
                </span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {tournament.teams.map((t) => (
                  <div
                    key={t.id}
                    draggable="true"
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', t.id);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 hover:border-emerald-500/40 rounded-lg cursor-grab active:cursor-grabbing text-xs font-bold text-white uppercase flex items-center gap-2 select-none hover:scale-[1.02] transition-transform"
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${t.color}`} />
                    <span>{t.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ROUND SLIDER NAVIGATION */}
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center justify-between shadow-md">
            <button
              onClick={() => setSelectedRound(Math.max(1, selectedRound - 1))}
              disabled={selectedRound === 1}
              className="p-2 bg-zinc-950 border border-zinc-800 hover:border-emerald-500/20 disabled:opacity-20 text-emerald-400 rounded-lg transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="text-center">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold">RODADA SELECIONADA</span>
              <h3 className="text-xl font-black text-white">{selectedRound}ª Rodada <span className="text-zinc-500 text-xs font-normal">de {totalRounds}</span></h3>
            </div>

            <button
              onClick={() => setSelectedRound(Math.min(totalRounds, selectedRound + 1))}
              disabled={selectedRound === totalRounds}
              className="p-2 bg-zinc-950 border border-zinc-800 hover:border-emerald-500/20 disabled:opacity-20 text-emerald-400 rounded-lg transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Quick simulator widget for this round */}
          <div className="flex justify-end">
            <button
              onClick={simulateRoundMatches}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simular Rodada Inteira 🎲</span>
            </button>
          </div>

          {/* MATCH LIST IN THIS ROUND */}
          <div className="space-y-4">
            {tournament.matches
              .filter(match => match.round === selectedRound)
              .map((match) => {
                const homeTeam = teamsMap[match.homeTeamId];
                const awayTeam = teamsMap[match.awayTeamId];
                if (!homeTeam || !awayTeam) return null;

                const edit = editingScores[match.id] || {
                  home: match.homeScore !== null ? String(match.homeScore) : '',
                  away: match.awayScore !== null ? String(match.awayScore) : '',
                };

                const isDraftDirty = 
                  (match.homeScore === null && (edit.home !== '' || edit.away !== '')) ||
                  (match.homeScore !== null && (String(match.homeScore) !== edit.home || String(match.awayScore) !== edit.away));

                return (
                  <div 
                    key={match.id}
                    className="bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700/60 p-4 rounded-2xl shadow-md transition-all"
                  >
                    {/* DATE & TIME CALENDAR HEADER */}
                    <div className="flex flex-wrap justify-between items-center gap-2 mb-3 pb-2 border-b border-zinc-950/40 text-[11px] font-mono">
                      <span className="text-emerald-400/90 font-bold uppercase tracking-wider">
                        Jogo #{match.matchIndex + 1}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                        {isAdmin ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="date"
                              value={match.date || ''}
                              onChange={(e) => handleMatchDateChange(match.id, e.target.value)}
                              className="bg-zinc-950 border border-zinc-800 rounded px-1.5 py-0.5 text-zinc-300 focus:outline-none focus:border-emerald-500 text-[10px] w-28 font-sans cursor-pointer"
                            />
                            <input
                              type="time"
                              value={match.time || ''}
                              onChange={(e) => handleMatchTimeChange(match.id, e.target.value)}
                              className="bg-zinc-950 border border-zinc-800 rounded px-1.5 py-0.5 text-zinc-300 focus:outline-none focus:border-emerald-500 text-[10px] w-16 font-sans cursor-pointer"
                            />
                          </div>
                        ) : match.date ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg text-[10px]">
                            {formatDate(match.date)} {match.time ? `às ${match.time}` : ''}
                          </span>
                        ) : (
                          <span className="text-zinc-500">Agendado</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-12 gap-2 items-center">
                      
                      {/* HOME TEAM SLOT (DROP ZONE IF UNPLAYED & ADMIN) */}
                      <div 
                        onDragOver={(e) => {
                          if (isAdmin && !match.played) {
                            e.preventDefault();
                          }
                        }}
                        onDrop={(e) => {
                          if (isAdmin && !match.played) {
                            handleDropTeam(match.id, 'home', e);
                          }
                        }}
                        className={`col-span-4 flex items-center justify-end gap-3 text-right p-2 rounded-xl transition-all ${
                          isAdmin && !match.played
                            ? 'hover:bg-emerald-500/5 hover:ring-2 hover:ring-emerald-500/30 border border-dashed border-transparent hover:border-emerald-500/20 cursor-grab'
                            : ''
                        }`}
                        title={isAdmin && !match.played ? "Arraste um time aqui para trocar" : ""}
                      >
                        <span className="font-bold text-sm text-white line-clamp-1">{homeTeam.name}</span>
                        <div className={`w-3.5 h-3.5 rounded shrink-0 ${homeTeam.color}`} />
                      </div>

                      {/* SCOREBOARD FORM */}
                      <div className="col-span-4 flex items-center justify-center gap-2">
                        {isAdmin ? (
                          <>
                            <input
                              type="text"
                              placeholder="-"
                              value={edit.home}
                              onChange={(e) => handleScoreChange(match.id, 'home', e.target.value)}
                              className="w-11 h-11 text-center bg-zinc-950 border border-zinc-800 rounded-lg text-white font-black text-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                            />
                            <span className="text-zinc-600 font-bold text-xs">x</span>
                            <input
                              type="text"
                              placeholder="-"
                              value={edit.away}
                              onChange={(e) => handleScoreChange(match.id, 'away', e.target.value)}
                              className="w-11 h-11 text-center bg-zinc-950 border border-zinc-800 rounded-lg text-white font-black text-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                            />
                          </>
                        ) : (
                          <div className="flex items-center gap-3 bg-zinc-950/60 px-4 py-2 rounded-xl border border-zinc-800/50">
                            <span className={`text-xl font-black font-mono ${match.played ? 'text-white' : 'text-zinc-600'}`}>
                              {match.homeScore !== null ? match.homeScore : '-'}
                            </span>
                            <span className="text-zinc-600 font-bold text-xs">x</span>
                            <span className={`text-xl font-black font-mono ${match.played ? 'text-white' : 'text-zinc-600'}`}>
                              {match.awayScore !== null ? match.awayScore : '-'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* AWAY TEAM SLOT (DROP ZONE IF UNPLAYED & ADMIN) */}
                      <div 
                        onDragOver={(e) => {
                          if (isAdmin && !match.played) {
                            e.preventDefault();
                          }
                        }}
                        onDrop={(e) => {
                          if (isAdmin && !match.played) {
                            handleDropTeam(match.id, 'away', e);
                          }
                        }}
                        className={`col-span-4 flex items-center gap-3 text-left p-2 rounded-xl transition-all ${
                          isAdmin && !match.played
                            ? 'hover:bg-emerald-500/5 hover:ring-2 hover:ring-emerald-500/30 border border-dashed border-transparent hover:border-emerald-500/20 cursor-grab'
                            : ''
                        }`}
                        title={isAdmin && !match.played ? "Arraste um time aqui para trocar" : ""}
                      >
                        <div className={`w-3.5 h-3.5 rounded shrink-0 ${awayTeam.color}`} />
                        <span className="font-bold text-sm text-white line-clamp-1">{awayTeam.name}</span>
                      </div>

                    </div>

                    {/* SCORE SAVE ACTIONS */}
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-zinc-950">
                      <span className="text-[10px] font-mono text-zinc-500">
                        {match.played ? 'Placar Registrado ✓' : 'Pendente de resultado'}
                      </span>
                      
                      {isDraftDirty && (
                        <button
                          onClick={() => saveMatchScore(match.id)}
                          className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Salvar Placar</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 3: HIGHLIGHT STATISTICS */}
      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Best attack */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex items-center justify-between group shadow-md hover:border-emerald-500/10">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold">ATAQUE MAIS POSITIVO</span>
              {bestAttack?.team ? (
                <>
                  <h3 className="text-2xl font-black text-white mt-1 uppercase tracking-tight">{bestAttack.team.name}</h3>
                  <p className="text-zinc-400 text-sm mt-1">Sinalizou a rede adversária com maestria.</p>
                </>
              ) : (
                <p className="text-zinc-500 text-sm mt-1">Aguardando resultados de partidas.</p>
              )}
            </div>
            <div className="text-center shrink-0">
              <strong className="text-4xl font-black text-emerald-400 block">{bestAttack ? bestAttack.count : 0}</strong>
              <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest">Gols marcados</span>
            </div>
          </div>

          {/* Best defense */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex items-center justify-between group shadow-md hover:border-emerald-500/10">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold">DEFESA MAIS SÓLIDA</span>
              {bestDefense?.team ? (
                <>
                  <h3 className="text-2xl font-black text-white mt-1 uppercase tracking-tight">{bestDefense.team.name}</h3>
                  <p className="text-zinc-400 text-sm mt-1">Paredão intransponível que sofreu poucos gols.</p>
                </>
              ) : (
                <p className="text-zinc-500 text-sm mt-1">Aguardando resultados de partidas.</p>
              )}
            </div>
            <div className="text-center shrink-0">
              <strong className="text-4xl font-black text-orange-600 block">{bestDefense ? bestDefense.count : 0}</strong>
              <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest">Gols sofridos</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TOP SCORERS */}
      {activeTab === 'scorers' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {scorersList.length === 0 || scorersList.every(s => s.goals === 0) ? (
            <div className="text-center py-16 px-4 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-xl">
              <div className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-4 animate-bounce">
                <Flame className="w-8 h-8 text-orange-400" />
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-wider">A artilharia ainda não começou!</h3>
              <p className="text-sm text-zinc-400 mt-2 max-w-md mx-auto">
                Nenhum atleta balançou as redes adversárias ainda neste campeonato.
              </p>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                Administradores podem lançar os gols dos atletas na aba de <strong>Jogadores / Elencos</strong> selecionando a equipe correspondente.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* PODIUM OF TOP 3 SCORERS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-6">
                {/* 2nd Place */}
                {scorersList[1] && scorersList[1].goals > 0 ? (
                  <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col items-center text-center relative order-2 md:order-1 hover:border-zinc-700/50 transition-all">
                    <div className="absolute top-4 left-4 text-zinc-400 text-xs font-mono font-bold uppercase tracking-wider bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-750">
                      2º Lugar
                    </div>
                    <div className="w-12 h-12 rounded-full bg-zinc-800 border-2 border-zinc-400 flex items-center justify-center font-bold text-lg text-zinc-300 shadow-inner mb-3 mt-4">
                      🥈
                    </div>
                    <h4 className="font-black text-white text-base truncate max-w-full" title={scorersList[1].name}>
                      {scorersList[1].name}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`w-2.5 h-2.5 rounded-full ${scorersList[1].teamColor}`} />
                      <span className="text-xs text-zinc-400 font-bold">{scorersList[1].teamName}</span>
                    </div>
                    <div className="mt-4 bg-zinc-850 px-4 py-2 rounded-xl border border-zinc-800">
                      <span className="text-2xl font-black text-zinc-300 font-mono">{scorersList[1].goals}</span>
                      <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider ml-1">Gols</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-zinc-900/40 border border-dashed border-zinc-850 p-5 rounded-2xl h-44 flex items-center justify-center text-zinc-600 font-mono text-xs uppercase order-2 md:order-1">
                    Vago
                  </div>
                )}

                {/* 1st Place */}
                {scorersList[0] && scorersList[0].goals > 0 ? (
                  <div className="bg-gradient-to-b from-amber-500/10 to-zinc-900 border-2 border-amber-500/30 p-6 rounded-3xl flex flex-col items-center text-center relative order-1 md:order-2 shadow-xl hover:border-amber-500/50 transition-all transform md:-translate-y-2">
                    <div className="absolute top-4 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-widest bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30 animate-pulse">
                      Artilheiro
                    </div>
                    <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center font-bold text-2xl text-amber-300 shadow-lg mb-3 mt-5">
                      👑
                    </div>
                    <h4 className="font-black text-white text-lg truncate max-w-full" title={scorersList[0].name}>
                      {scorersList[0].name}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`w-2.5 h-2.5 rounded-full ${scorersList[0].teamColor}`} />
                      <span className="text-xs text-amber-300 font-black">{scorersList[0].teamName}</span>
                    </div>
                    <div className="mt-4 bg-amber-500/10 px-6 py-2.5 rounded-xl border border-amber-500/20 shadow-md">
                      <span className="text-3xl font-black text-amber-400 font-mono">{scorersList[0].goals}</span>
                      <span className="text-xs text-amber-300/80 font-mono uppercase tracking-wider ml-1">Gols</span>
                    </div>
                  </div>
                ) : null}

                {/* 3rd Place */}
                {scorersList[2] && scorersList[2].goals > 0 ? (
                  <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col items-center text-center relative order-3 hover:border-zinc-700/50 transition-all">
                    <div className="absolute top-4 left-4 text-zinc-400 text-xs font-mono font-bold uppercase tracking-wider bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-750">
                      3º Lugar
                    </div>
                    <div className="w-12 h-12 rounded-full bg-zinc-800 border-2 border-amber-600/50 flex items-center justify-center font-bold text-lg text-amber-600 shadow-inner mb-3 mt-4">
                      🥉
                    </div>
                    <h4 className="font-black text-white text-base truncate max-w-full" title={scorersList[2].name}>
                      {scorersList[2].name}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`w-2.5 h-2.5 rounded-full ${scorersList[2].teamColor}`} />
                      <span className="text-xs text-zinc-400 font-bold">{scorersList[2].teamName}</span>
                    </div>
                    <div className="mt-4 bg-zinc-850 px-4 py-2 rounded-xl border border-zinc-800">
                      <span className="text-2xl font-black text-amber-600/90 font-mono">{scorersList[2].goals}</span>
                      <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider ml-1">Gols</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-zinc-900/40 border border-dashed border-zinc-850 p-5 rounded-2xl h-44 flex items-center justify-center text-zinc-600 font-mono text-xs uppercase order-3">
                    Vago
                  </div>
                )}
              </div>

              {/* COMPLETE STANDINGS TABLE */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
                <div className="px-5 py-4 bg-zinc-950 border-b border-zinc-850 flex items-center gap-2">
                  <Flame className="w-4.5 h-4.5 text-orange-400" />
                  <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400">Classificação Geral de Artilharia</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="bg-zinc-950/60 text-[10px] font-mono tracking-wider text-zinc-500 uppercase border-b border-zinc-850">
                        <th className="py-3 px-5 text-center w-16">Pos</th>
                        <th className="py-3 px-4">Jogador</th>
                        <th className="py-3 px-4">Equipe</th>
                        <th className="py-3 px-4 text-center w-24">Cartões (Am/Vm)</th>
                        <th className="py-3 px-6 text-right w-32">Gols Registrados</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-850 text-sm">
                      {scorersList.filter(p => p.goals > 0).map((player, index) => {
                        let rankBadge = `${index + 1}º`;
                        if (index === 0) rankBadge = '👑 1º';
                        else if (index === 1) rankBadge = '🥈 2º';
                        else if (index === 2) rankBadge = '🥉 3º';

                        return (
                          <tr key={player.id} className="hover:bg-zinc-850/20 transition-colors">
                            <td className="py-3 px-5 text-center font-mono font-bold text-zinc-400">
                              <span className={`inline-block px-2 py-0.5 rounded text-xs ${index < 3 ? 'text-amber-400 font-black' : 'text-zinc-500'}`}>
                                {rankBadge}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-bold text-white">
                              {player.name}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className={`w-3 h-3 rounded-full ${player.teamColor}`} />
                                <span className="text-zinc-300 font-medium">{player.teamName}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="inline-flex items-center gap-1 font-mono text-xs">
                                <span className="text-yellow-400 font-bold bg-yellow-400/5 border border-yellow-400/10 px-1 py-0.5 rounded">
                                  {player.yellowCards + player.doubleYellows * 2}🟨
                                </span>
                                <span className="text-red-500 font-bold bg-red-500/5 border border-red-500/10 px-1 py-0.5 rounded">
                                  {player.redCards + player.doubleYellows}🟥
                                </span>
                              </span>
                            </td>
                            <td className="py-3 px-6 text-right">
                              <span className="text-lg font-black text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-xl shadow-inner">
                                {player.goals} Gols
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'players' && (
        <TeamRosterManager
          tournament={tournament}
          isAdmin={isAdmin}
          onRequestAdmin={onRequestAdmin}
          onUpdateTeams={onUpdateTeams}
        />
      )}
    </div>
  );
}
