import React, { useState, useMemo } from 'react';
import { Trophy, ArrowLeft, RotateCcw, Calendar, Users, Award, ChevronRight, X, Play, ShieldAlert, ListOrdered, Flame } from 'lucide-react';
import { Tournament, Match, Team } from '../types';
import TeamRosterManager from './TeamRosterManager';

interface KnockoutTournamentProps {
  tournament: Tournament;
  onUpdateMatches: (matches: Match[]) => void;
  onBack: () => void;
  onUpdateStatus: (status: 'active' | 'completed', winnerId: string | null) => void;
  onUpdateTeams: (updatedTeams: Team[]) => void;
  isAdmin: boolean;
  onRequestAdmin: (callback: () => void) => void;
}

interface GroupStandingRow {
  teamId: string;
  name: string;
  color: string;
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export default function KnockoutTournament({
  tournament,
  onUpdateMatches,
  onBack,
  onUpdateStatus,
  onUpdateTeams,
  isAdmin,
  onRequestAdmin,
}: KnockoutTournamentProps) {
  const [activeTab, setActiveTab] = useState<'groups' | 'bracket' | 'scorers' | 'players'>('groups');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  
  // Modal score entry form state
  const [scoreHome, setScoreHome] = useState('');
  const [scoreAway, setScoreAway] = useState('');
  const [penHome, setPenHome] = useState('');
  const [penAway, setPenAway] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [matchTime, setMatchTime] = useState('');
  const [modalError, setModalError] = useState('');

  // Teams lookup dictionary
  const teamsMap = useMemo(() => {
    const map: Record<string, Team> = {};
    tournament.teams.forEach(t => { map[t.id] = t; });
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

  // Split teams into Group A and Group B
  // Group A gets even indices, Group B gets odd indices (matching the generation function)
  const groupTeamsMap = useMemo(() => {
    const aTeams: Team[] = [];
    const bTeams: Team[] = [];
    tournament.teams.forEach((team, idx) => {
      if (idx % 2 === 0) {
        aTeams.push(team);
      } else {
        bTeams.push(team);
      }
    });
    return { A: aTeams, B: bTeams };
  }, [tournament.teams]);

  // Compute standings for Group A and Group B
  const groupStandings = useMemo(() => {
    const initialStanding = (teams: Team[]): GroupStandingRow[] => {
      return teams.map(t => ({
        teamId: t.id,
        name: t.name,
        color: t.color,
        points: 0,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
      }));
    };

    const standings = {
      A: initialStanding(groupTeamsMap.A),
      B: initialStanding(groupTeamsMap.B),
    };

    tournament.matches.forEach(match => {
      if (match.phase !== 'group' || !match.played || match.homeScore === null || match.awayScore === null) return;
      
      const grp = match.group === 'A' ? 'A' : 'B';
      const list = standings[grp];
      
      const homeStats = list.find(s => s.teamId === match.homeTeamId);
      const awayStats = list.find(s => s.teamId === match.awayTeamId);
      
      if (homeStats && awayStats) {
        homeStats.played += 1;
        awayStats.played += 1;
        homeStats.goalsFor += match.homeScore;
        homeStats.goalsAgainst += match.awayScore;
        awayStats.goalsFor += match.awayScore;
        awayStats.goalsAgainst += match.homeScore;
        
        if (match.homeScore > match.awayScore) {
          homeStats.wins += 1;
          homeStats.points += 3;
          awayStats.losses += 1;
        } else if (match.homeScore < match.awayScore) {
          awayStats.wins += 1;
          awayStats.points += 3;
          homeStats.losses += 1;
        } else {
          homeStats.draws += 1;
          homeStats.points += 1;
          awayStats.draws += 1;
          awayStats.points += 1;
        }
        
        homeStats.goalDifference = homeStats.goalsFor - homeStats.goalsAgainst;
        awayStats.goalDifference = awayStats.goalsFor - awayStats.goalsAgainst;
      }
    });

    const sortFn = (a: GroupStandingRow, b: GroupStandingRow) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.name.localeCompare(b.name);
    };

    standings.A.sort(sortFn);
    standings.B.sort(sortFn);

    return standings;
  }, [tournament.matches, groupTeamsMap]);

  // Check if all group stage matches have been played
  const isGroupStageFinished = useMemo(() => {
    const groupMatches = tournament.matches.filter(m => m.phase === 'group');
    if (groupMatches.length === 0) return false;
    return groupMatches.every(m => m.played);
  }, [tournament.matches]);

  // Dynamically resolve matchups for Semifinals and Finals based on standings and match results
  const resolvedMatches = useMemo(() => {
    const topA1 = groupStandings.A[0]?.teamId || '';
    const topA2 = groupStandings.A[1]?.teamId || '';
    const topB1 = groupStandings.B[0]?.teamId || '';
    const topB2 = groupStandings.B[1]?.teamId || '';

    const sf0 = tournament.matches.find(m => m.phase === 'semifinal' && m.matchIndex === 0);
    const sf1 = tournament.matches.find(m => m.phase === 'semifinal' && m.matchIndex === 1);

    const getWinnerOfMatch = (match: Match | undefined) => {
      if (!match || !match.played || match.homeScore === null || match.awayScore === null) return '';
      if (match.homeScore > match.awayScore) return match.homeTeamId;
      if (match.awayScore > match.homeScore) return match.awayTeamId;
      if (match.penaltiesHome !== null && match.penaltiesAway !== null) {
        return match.penaltiesHome > match.penaltiesAway ? match.homeTeamId : match.awayTeamId;
      }
      return '';
    };

    const winSF0 = sf0 ? getWinnerOfMatch(sf0) : '';
    const winSF1 = sf1 ? getWinnerOfMatch(sf1) : '';

    return tournament.matches.map(match => {
      let homeId = match.homeTeamId;
      let awayId = match.awayTeamId;

      if (match.phase === 'semifinal') {
        if (isGroupStageFinished) {
          if (match.matchIndex === 0) {
            homeId = topA1;
            awayId = topB2;
          } else if (match.matchIndex === 1) {
            homeId = topB1;
            awayId = topA2;
          }
        } else {
          homeId = match.matchIndex === 0 ? '1A' : '1B';
          awayId = match.matchIndex === 0 ? '2B' : '2A';
        }
      } else if (match.phase === 'final') {
        const sf0Played = sf0?.played;
        const sf1Played = sf1?.played;
        if (sf0Played && sf1Played) {
          homeId = winSF0;
          awayId = winSF1;
        } else {
          homeId = 'WSF0';
          awayId = 'WSF1';
        }
      }

      return {
        ...match,
        homeTeamId: homeId,
        awayTeamId: awayId,
      };
    });
  }, [tournament.matches, groupStandings, isGroupStageFinished]);

  // Helper names and colors for placeholder keys
  const getTeamName = (teamId: string) => {
    if (teamsMap[teamId]) {
      return teamsMap[teamId].name;
    }
    if (teamId === '1A') return '1º colocado Grupo A';
    if (teamId === '2A') return '2º colocado Grupo A';
    if (teamId === '1B') return '1º colocado Grupo B';
    if (teamId === '2B') return '2º colocado Grupo B';
    if (teamId === 'WSF0') return 'Vencedor Semifinal 1';
    if (teamId === 'WSF1') return 'Vencedor Semifinal 2';
    return 'A definir';
  };

  const getTeamColorClass = (teamId: string) => {
    if (teamsMap[teamId]) {
      return teamsMap[teamId].color;
    }
    return 'bg-zinc-800';
  };

  // Check if a match is selectable/playable
  const isMatchPlayable = (match: Match) => {
    if (match.phase === 'group') return true;
    if (match.phase === 'semifinal') return isGroupStageFinished;
    if (match.phase === 'final') {
      const sfMatches = resolvedMatches.filter(m => m.phase === 'semifinal');
      return sfMatches.length > 0 && sfMatches.every(m => m.played);
    }
    return false;
  };

  // Open score entry / view modal
  const handleOpenMatchModal = (match: Match) => {
    if (!isMatchPlayable(match)) return;

    setSelectedMatch(match);
    setScoreHome(match.homeScore !== null ? String(match.homeScore) : '');
    setScoreAway(match.awayScore !== null ? String(match.awayScore) : '');
    setPenHome(match.penaltiesHome !== null ? String(match.penaltiesHome) : '');
    setPenAway(match.penaltiesAway !== null ? String(match.penaltiesAway) : '');
    setMatchDate(match.date || '');
    setMatchTime(match.time || '');
    setModalError('');
  };

  // Close score entry modal
  const handleCloseModal = () => {
    setSelectedMatch(null);
    setScoreHome('');
    setScoreAway('');
    setPenHome('');
    setPenAway('');
    setMatchDate('');
    setMatchTime('');
    setModalError('');
  };

  // Save the match score or schedule
  const handleSaveScore = () => {
    if (!selectedMatch) return;
    setModalError('');

    let sHome: number | null = null;
    let sAway: number | null = null;
    let pHome: number | null = null;
    let pAway: number | null = null;
    let winnerTeamId = '';
    let played = selectedMatch.played;

    // If either score is entered, we require both
    if (scoreHome !== '' || scoreAway !== '') {
      if (scoreHome === '' || scoreAway === '') {
        setModalError('Por favor, informe o placar de ambos os times para registrar o resultado!');
        return;
      }

      sHome = parseInt(scoreHome);
      sAway = parseInt(scoreAway);
      played = true;

      const isKnockoutMatch = selectedMatch.phase === 'semifinal' || selectedMatch.phase === 'final';

      if (sHome === sAway) {
        if (isKnockoutMatch) {
          if (penHome === '' || penAway === '') {
            setModalError('Partidas eliminatórias não podem terminar empatadas! Informe o resultado da decisão por pênaltis.');
            return;
          }

          pHome = parseInt(penHome);
          pAway = parseInt(penAway);

          if (pHome === pAway) {
            setModalError('A decisão por pênaltis precisa ter um vencedor! Os gols não podem ser iguais.');
            return;
          }

          winnerTeamId = pHome > pAway ? selectedMatch.homeTeamId : selectedMatch.awayTeamId;
        }
      } else {
        winnerTeamId = sHome > sAway ? selectedMatch.homeTeamId : selectedMatch.awayTeamId;
      }
    } else {
      // If no score is typed, but game was previously played, and they cleared scores:
      played = false;
    }

    // Update matches in state
    const updatedMatches = tournament.matches.map(m => {
      if (m.id === selectedMatch.id) {
        return {
          ...m,
          homeTeamId: selectedMatch.homeTeamId,
          awayTeamId: selectedMatch.awayTeamId,
          homeScore: sHome,
          awayScore: sAway,
          penaltiesHome: pHome,
          penaltiesAway: pAway,
          played,
          date: matchDate || undefined,
          time: matchTime || undefined
        };
      }
      return m;
    });

    onUpdateMatches(updatedMatches);

    // If it was the final match and was played, complete tournament
    if (selectedMatch.phase === 'final' && played) {
      onUpdateStatus('completed', winnerTeamId);
    } else {
      onUpdateStatus('active', null);
    }

    handleCloseModal();
  };

  // Reset entire tournament
  const resetBracket = () => {
    onRequestAdmin(() => {
      if (confirm('Deseja zerar todos os jogos e chaves deste campeonato? Todos os placares serão limpos.')) {
        const resetMatches = tournament.matches.map(m => {
          if (m.phase === 'group') {
            return {
              ...m,
              homeScore: null,
              awayScore: null,
              played: false
            };
          } else {
            return {
              ...m,
              homeTeamId: m.phase === 'semifinal' ? (m.matchIndex === 0 ? '1A' : '1B') : 'WSF0',
              awayTeamId: m.phase === 'semifinal' ? (m.matchIndex === 0 ? '2B' : '2A') : 'WSF1',
              homeScore: null,
              awayScore: null,
              penaltiesHome: null,
              penaltiesAway: null,
              played: false
            };
          }
        });
        onUpdateMatches(resetMatches);
        onUpdateStatus('active', null);
        handleCloseModal();
      }
    });
  };

  // Find champion details
  const championTeam = useMemo(() => {
    if (tournament.status === 'completed' && tournament.winnerId) {
      return teamsMap[tournament.winnerId];
    }
    return null;
  }, [tournament, teamsMap]);

  // Group Matches List (Group phase only)
  const groupMatchesList = useMemo(() => {
    return resolvedMatches.filter(m => m.phase === 'group');
  }, [resolvedMatches]);

  // Knockout Matches List
  const sfMatchesList = useMemo(() => {
    return resolvedMatches.filter(m => m.phase === 'semifinal');
  }, [resolvedMatches]);

  const finalMatch = useMemo(() => {
    return resolvedMatches.find(m => m.phase === 'final');
  }, [resolvedMatches]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white relative">
      
      {/* HEADER BANNER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 pb-6 border-b border-zinc-800">
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
              <span className="text-[10px] font-mono text-emerald-400 tracking-wider uppercase font-bold">Fase de Grupos & Mata-Mata</span>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white line-clamp-1">{tournament.name}</h1>
            </div>
          </div>
        </div>

        <button
          onClick={resetBracket}
          className="px-4 py-2 bg-zinc-900 hover:bg-red-500/10 border border-zinc-800 hover:border-red-500/30 text-zinc-400 hover:text-red-400 text-xs font-bold rounded-xl transition-all flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Zerar Torneio</span>
        </button>
      </div>

      {/* Read-only notification banner */}
      {!isAdmin && (
        <div className="mb-8 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-500 shrink-0" />
            <span className="text-xs text-zinc-400 leading-relaxed">
              Você está visualizando as tabelas e confrontos. Para registrar resultados e gerenciar atletas, faça login na <strong>Área Administrativa</strong>.
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

      {/* CHAMPION BANNER CELEBRATION */}
      {tournament.status === 'completed' && championTeam && (
        <div className="bg-gradient-to-r from-emerald-50 via-white to-orange-50 border-2 border-emerald-500/40 p-6 sm:p-8 rounded-2xl text-center mb-10 shadow-xl relative overflow-hidden animate-fade-in">
          <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-orange-400/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-yellow-500/20 animate-bounce">
            <Trophy className="w-9 h-9 text-zinc-900" />
          </div>
          <span className="text-[10px] font-mono tracking-widest text-orange-600 uppercase font-bold">TORNEIO CONCLUÍDO</span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 uppercase mt-1">
            {championTeam.name} é o Campeão! 🏆
          </h2>
          <p className="text-zinc-500 text-sm max-w-sm mx-auto mt-2">
            Superou todos os adversários nos grupos e no mata-mata e conquistou a glória na Arena Camaleão!
          </p>
        </div>
      )}

      {/* SUB-TABS NAVIGATION */}
      <div className="flex border-b border-zinc-800 mb-8 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('groups')}
          className={`px-5 py-3 text-sm font-bold tracking-wide uppercase flex items-center gap-2 border-b-2 transition-all shrink-0 ${
            activeTab === 'groups'
              ? 'text-emerald-400 border-emerald-400 bg-emerald-500/5'
              : 'text-zinc-400 border-transparent hover:text-white'
          }`}
        >
          <ListOrdered className="w-4.5 h-4.5" />
          <span>Fase de Grupos (A e B)</span>
        </button>
        <button
          onClick={() => setActiveTab('bracket')}
          className={`px-5 py-3 text-sm font-bold tracking-wide uppercase flex items-center gap-2 border-b-2 transition-all shrink-0 ${
            activeTab === 'bracket'
              ? 'text-emerald-400 border-emerald-400 bg-emerald-500/5'
              : 'text-zinc-400 border-transparent hover:text-white'
          }`}
        >
          <Award className="w-4.5 h-4.5" />
          <span>Fase Final (Mata-Mata)</span>
        </button>
        <button
          onClick={() => setActiveTab('scorers')}
          className={`px-5 py-3 text-sm font-bold tracking-wide uppercase flex items-center gap-2 border-b-2 transition-all shrink-0 ${
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
          className={`px-5 py-3 text-sm font-bold tracking-wide uppercase flex items-center gap-2 border-b-2 transition-all shrink-0 ${
            activeTab === 'players'
              ? 'text-emerald-400 border-emerald-400 bg-emerald-500/5'
              : 'text-zinc-400 border-transparent hover:text-white'
          }`}
        >
          <Users className="w-4.5 h-4.5" />
          <span>Jogadores / Elencos</span>
        </button>
      </div>

      {/* TAB CONTENTS */}
      {activeTab === 'groups' && (
        <div className="space-y-12">
          
          {/* TABLES GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* GROUP A STANDINGS */}
            <div className="bg-zinc-950/50 border border-zinc-800 p-5 rounded-2xl shadow-xl space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded bg-emerald-500/10 flex items-center justify-center font-bold text-xs text-emerald-400 border border-emerald-500/20">A</div>
                  <h3 className="font-extrabold uppercase tracking-tight text-white">Grupo A</h3>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">Top 2 avançam às Semifinais</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="text-zinc-500 border-b border-zinc-900 pb-2">
                      <th className="py-2 font-bold w-12 text-center">POS</th>
                      <th className="py-2 text-zinc-300 font-sans font-bold text-left">TIME</th>
                      <th className="py-2 text-center font-bold w-10 text-white">P</th>
                      <th className="py-2 text-center w-8">J</th>
                      <th className="py-2 text-center w-8">V</th>
                      <th className="py-2 text-center w-8">E</th>
                      <th className="py-2 text-center w-8">D</th>
                      <th className="py-2 text-center w-10 hidden sm:table-cell">GP</th>
                      <th className="py-2 text-center w-10 hidden sm:table-cell">GC</th>
                      <th className="py-2 text-center w-10 text-emerald-400">SG</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/60">
                    {groupStandings.A.map((row, idx) => {
                      const isTop2 = idx < 2;
                      return (
                        <tr key={row.teamId} className={`hover:bg-zinc-900/30 transition-colors ${isTop2 ? 'bg-emerald-950/5' : ''}`}>
                          <td className="py-3 text-center">
                            <span className={`inline-flex w-5 h-5 rounded-full items-center justify-center font-bold text-[10px] ${
                              idx === 0 ? 'bg-emerald-500 text-zinc-950' : 
                              idx === 1 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 
                              'bg-zinc-900 text-zinc-400'
                            }`}>
                              {idx + 1}
                            </span>
                          </td>
                          <td className="py-3 font-sans font-bold text-zinc-100">
                            <div className="flex items-center gap-2">
                              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${row.color}`} />
                              <span className="truncate max-w-[120px] sm:max-w-none">{row.name}</span>
                              {isTop2 && <span className="text-[8px] px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono hidden sm:inline">SF</span>}
                            </div>
                          </td>
                          <td className="py-3 text-center text-white font-black text-sm">{row.points}</td>
                          <td className="py-3 text-center text-zinc-300">{row.played}</td>
                          <td className="py-3 text-center text-zinc-400">{row.wins}</td>
                          <td className="py-3 text-center text-zinc-400">{row.draws}</td>
                          <td className="py-3 text-center text-zinc-400">{row.losses}</td>
                          <td className="py-3 text-center text-zinc-500 hidden sm:table-cell">{row.goalsFor}</td>
                          <td className="py-3 text-center text-zinc-500 hidden sm:table-cell">{row.goalsAgainst}</td>
                          <td className={`py-3 text-center font-bold ${row.goalDifference > 0 ? 'text-emerald-400' : row.goalDifference < 0 ? 'text-red-400' : 'text-zinc-500'}`}>
                            {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* GROUP B STANDINGS */}
            <div className="bg-zinc-950/50 border border-zinc-800 p-5 rounded-2xl shadow-xl space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded bg-emerald-500/10 flex items-center justify-center font-bold text-xs text-emerald-400 border border-emerald-500/20">B</div>
                  <h3 className="font-extrabold uppercase tracking-tight text-white">Grupo B</h3>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">Top 2 avançam às Semifinais</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="text-zinc-500 border-b border-zinc-900 pb-2">
                      <th className="py-2 font-bold w-12 text-center">POS</th>
                      <th className="py-2 text-zinc-300 font-sans font-bold text-left">TIME</th>
                      <th className="py-2 text-center font-bold w-10 text-white">P</th>
                      <th className="py-2 text-center w-8">J</th>
                      <th className="py-2 text-center w-8">V</th>
                      <th className="py-2 text-center w-8">E</th>
                      <th className="py-2 text-center w-8">D</th>
                      <th className="py-2 text-center w-10 hidden sm:table-cell">GP</th>
                      <th className="py-2 text-center w-10 hidden sm:table-cell">GC</th>
                      <th className="py-2 text-center w-10 text-emerald-400">SG</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/60">
                    {groupStandings.B.map((row, idx) => {
                      const isTop2 = idx < 2;
                      return (
                        <tr key={row.teamId} className={`hover:bg-zinc-900/30 transition-colors ${isTop2 ? 'bg-emerald-950/5' : ''}`}>
                          <td className="py-3 text-center">
                            <span className={`inline-flex w-5 h-5 rounded-full items-center justify-center font-bold text-[10px] ${
                              idx === 0 ? 'bg-emerald-500 text-zinc-950' : 
                              idx === 1 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 
                              'bg-zinc-900 text-zinc-400'
                            }`}>
                              {idx + 1}
                            </span>
                          </td>
                          <td className="py-3 font-sans font-bold text-zinc-100">
                            <div className="flex items-center gap-2">
                              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${row.color}`} />
                              <span className="truncate max-w-[120px] sm:max-w-none">{row.name}</span>
                              {isTop2 && <span className="text-[8px] px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono hidden sm:inline">SF</span>}
                            </div>
                          </td>
                          <td className="py-3 text-center text-white font-black text-sm">{row.points}</td>
                          <td className="py-3 text-center text-zinc-300">{row.played}</td>
                          <td className="py-3 text-center text-zinc-400">{row.wins}</td>
                          <td className="py-3 text-center text-zinc-400">{row.draws}</td>
                          <td className="py-3 text-center text-zinc-400">{row.losses}</td>
                          <td className="py-3 text-center text-zinc-500 hidden sm:table-cell">{row.goalsFor}</td>
                          <td className="py-3 text-center text-zinc-500 hidden sm:table-cell">{row.goalsAgainst}</td>
                          <td className={`py-3 text-center font-bold ${row.goalDifference > 0 ? 'text-emerald-400' : row.goalDifference < 0 ? 'text-red-400' : 'text-zinc-500'}`}>
                            {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* GROUP MATCHES */}
          <div className="bg-zinc-950/30 border border-zinc-800/80 p-6 rounded-2xl shadow-md space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-lg font-extrabold uppercase tracking-tight text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-400" />
                  <span>Calendário de Jogos (Fase de Grupos)</span>
                </h3>
                <p className="text-xs text-zinc-500 mt-1">Selecione uma partida para preencher ou atualizar o placar oficial.</p>
              </div>
              <div className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800 px-3.5 py-1.5 rounded-xl text-xs font-mono">
                <span className="text-zinc-400">Progresso dos Grupos:</span>
                <span className="text-emerald-400 font-bold">
                  {resolvedMatches.filter(m => m.phase === 'group' && m.played).length} / {groupMatchesList.length} finalizados
                </span>
              </div>
            </div>

            {/* Matches grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {groupMatchesList.map((match) => {
                const homeTeam = teamsMap[match.homeTeamId];
                const awayTeam = teamsMap[match.awayTeamId];
                
                const isHomeWinner = match.played && (match.homeScore ?? 0) > (match.awayScore ?? 0);
                const isAwayWinner = match.played && (match.awayScore ?? 0) > (match.homeScore ?? 0);
                const isDraw = match.played && match.homeScore === match.awayScore;

                return (
                  <div
                    key={match.id}
                    onClick={() => handleOpenMatchModal(match)}
                    className="bg-zinc-900/60 border border-zinc-800 hover:border-emerald-500/30 rounded-xl overflow-hidden cursor-pointer hover:scale-[1.01] transition-all duration-200 shadow-sm flex flex-col justify-between"
                  >
                    {/* Top tag */}
                    <div className="px-3.5 py-2 bg-zinc-950/80 border-b border-zinc-900 flex justify-between items-center text-[10px] font-mono uppercase font-bold text-zinc-500">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Grupo {match.group}
                      </span>
                      {match.played ? (
                        <span className="text-emerald-400">Finalizado</span>
                      ) : match.date ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-emerald-400" />
                          {match.date.split('-').reverse().join('/')} {match.time || ''}
                        </span>
                      ) : (
                        <span className="text-zinc-600">Agendado</span>
                      )}
                    </div>

                    {/* Match stats */}
                    <div className="p-4 space-y-3">
                      {/* Home team */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 truncate">
                          <div className={`w-3 h-3 rounded-full shrink-0 ${homeTeam?.color || 'bg-zinc-700'}`} />
                          <span className={`text-sm font-semibold truncate text-zinc-100 ${isHomeWinner ? 'text-emerald-400 font-black' : ''}`}>
                            {homeTeam?.name || 'Time A'}
                          </span>
                        </div>
                        {match.played && (
                          <span className={`text-sm font-black font-mono px-2 py-0.5 rounded bg-zinc-950/50 ${isHomeWinner ? 'text-emerald-400' : 'text-zinc-500'}`}>
                            {match.homeScore}
                          </span>
                        )}
                      </div>

                      {/* Away team */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 truncate">
                          <div className={`w-3 h-3 rounded-full shrink-0 ${awayTeam?.color || 'bg-zinc-700'}`} />
                          <span className={`text-sm font-semibold truncate text-zinc-100 ${isAwayWinner ? 'text-emerald-400 font-black' : ''}`}>
                            {awayTeam?.name || 'Time B'}
                          </span>
                        </div>
                        {match.played && (
                          <span className={`text-sm font-black font-mono px-2 py-0.5 rounded bg-zinc-950/50 ${isAwayWinner ? 'text-emerald-400' : 'text-zinc-500'}`}>
                            {match.awayScore}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom prompt */}
                    {!match.played && (
                      <div className="py-1.5 bg-zinc-950/40 text-center text-[9px] text-zinc-500 font-bold tracking-wider uppercase border-t border-zinc-900/60 hover:text-emerald-400 transition-colors">
                        Lançar Resultado
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {activeTab === 'bracket' && (
        <div className="space-y-10">
          
          {/* BANNER REVEALING GROUP STAGE PROGRESS */}
          {!isGroupStageFinished && (
            <div className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-4 shadow-lg max-w-4xl mx-auto">
              <ShieldAlert className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-white uppercase text-sm tracking-wide">Fase Eliminatória Bloqueada</h4>
                <p className="text-zinc-300 text-xs mt-1 leading-relaxed">
                  As Semifinais e Grande Final do torneio serão liberadas automaticamente assim que <strong>todos os jogos da fase de grupos (A e B)</strong> forem disputados e finalizados no sistema.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden max-w-xs border border-zinc-800">
                    <div 
                      className="bg-amber-500 h-full transition-all duration-300" 
                      style={{ width: `${(resolvedMatches.filter(m => m.phase === 'group' && m.played).length / groupMatchesList.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-amber-500 font-bold">
                    {resolvedMatches.filter(m => m.phase === 'group' && m.played).length} de {groupMatchesList.length} jogos concluídos
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* BRACKET VIEW CONTAINER */}
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              
              {/* SEMIFINALS COLUMN */}
              <div className="space-y-6">
                <div className="pb-2 border-b border-zinc-800 flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded bg-emerald-500/10 flex items-center justify-center font-bold text-xs text-emerald-400 border border-emerald-500/20">SF</div>
                  <h3 className="font-black uppercase text-sm tracking-widest text-zinc-300">Semifinais (Jogo Único)</h3>
                </div>

                <div className="space-y-4">
                  {sfMatchesList.map((match, idx) => {
                    const isPlayable = isMatchPlayable(match);
                    const homeTeamName = getTeamName(match.homeTeamId);
                    const awayTeamName = getTeamName(match.awayTeamId);

                    const isHomeWinner = match.played && (
                      (match.homeScore ?? 0) > (match.awayScore ?? 0) || 
                      (match.penaltiesHome !== null && (match.penaltiesHome ?? 0) > (match.penaltiesAway ?? 0))
                    );

                    const isAwayWinner = match.played && (
                      (match.awayScore ?? 0) > (match.homeScore ?? 0) || 
                      (match.penaltiesAway !== null && (match.penaltiesAway ?? 0) > (match.penaltiesHome ?? 0))
                    );

                    return (
                      <div
                        key={match.id}
                        onClick={() => isPlayable && handleOpenMatchModal(match)}
                        className={`bg-zinc-900/80 border rounded-xl overflow-hidden shadow-md transition-all ${
                          isPlayable 
                            ? 'border-zinc-800 hover:border-emerald-500/30 cursor-pointer hover:scale-[1.01]' 
                            : 'border-zinc-950 opacity-40 cursor-not-allowed'
                        }`}
                      >
                        <div className="px-3.5 py-1.5 bg-zinc-950 border-b border-zinc-900 flex justify-between items-center text-[9px] font-mono font-bold text-zinc-500 uppercase">
                          <span>Semifinal {idx + 1}</span>
                          {match.played ? (
                            <span className="text-emerald-400">Finalizado</span>
                          ) : match.date ? (
                            <span className="text-emerald-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-emerald-400" />
                              {match.date.split('-').reverse().join('/')} {match.time || ''}
                            </span>
                          ) : isPlayable ? (
                            <span className="text-zinc-400">Liberado</span>
                          ) : (
                            <span className="text-zinc-600">Aguardando Grupos</span>
                          )}
                        </div>

                        <div className="p-4 space-y-3">
                          {/* Home Row */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 truncate">
                              <div className={`w-3 h-3 rounded-full shrink-0 ${getTeamColorClass(match.homeTeamId)}`} />
                              <span className={`text-sm font-bold truncate text-zinc-100 ${isHomeWinner ? 'text-emerald-400 font-black' : ''}`}>
                                {homeTeamName}
                              </span>
                            </div>
                            {match.played && (
                              <div className="flex items-center gap-1.5">
                                <span className={`text-sm font-black font-mono px-1.5 py-0.5 rounded bg-zinc-950/60 ${isHomeWinner ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                  {match.homeScore}
                                </span>
                                {match.penaltiesHome !== null && (
                                  <span className="text-[10px] text-amber-500 font-semibold">({match.penaltiesHome})</span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Away Row */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 truncate">
                              <div className={`w-3 h-3 rounded-full shrink-0 ${getTeamColorClass(match.awayTeamId)}`} />
                              <span className={`text-sm font-bold truncate text-zinc-100 ${isAwayWinner ? 'text-emerald-400 font-black' : ''}`}>
                                {awayTeamName}
                              </span>
                            </div>
                            {match.played && (
                              <div className="flex items-center gap-1.5">
                                <span className={`text-sm font-black font-mono px-1.5 py-0.5 rounded bg-zinc-950/60 ${isAwayWinner ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                  {match.awayScore}
                                </span>
                                {match.penaltiesAway !== null && (
                                  <span className="text-[10px] text-amber-500 font-semibold">({match.penaltiesAway})</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {isPlayable && !match.played && (
                          <div className="py-1.5 bg-emerald-500/5 text-center text-[9px] text-emerald-400 font-bold tracking-wider uppercase border-t border-emerald-500/10">
                            Registrar Placar
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* GRANDE FINAL COLUMN */}
              <div className="space-y-6">
                <div className="pb-2 border-b border-zinc-800 flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded bg-amber-500/10 flex items-center justify-center font-bold text-xs text-amber-400 border border-amber-500/20">FN</div>
                  <h3 className="font-black uppercase text-sm tracking-widest text-zinc-300">Grande Final (Jogo Único)</h3>
                </div>

                {finalMatch && (() => {
                  const isPlayable = isMatchPlayable(finalMatch);
                  const homeTeamName = getTeamName(finalMatch.homeTeamId);
                  const awayTeamName = getTeamName(finalMatch.awayTeamId);

                  const isHomeWinner = finalMatch.played && (
                    (finalMatch.homeScore ?? 0) > (finalMatch.awayScore ?? 0) || 
                    (finalMatch.penaltiesHome !== null && (finalMatch.penaltiesHome ?? 0) > (finalMatch.penaltiesAway ?? 0))
                  );

                  const isAwayWinner = finalMatch.played && (
                    (finalMatch.awayScore ?? 0) > (finalMatch.homeScore ?? 0) || 
                    (finalMatch.penaltiesAway !== null && (finalMatch.penaltiesAway ?? 0) > (finalMatch.penaltiesHome ?? 0))
                  );

                  return (
                    <div
                      onClick={() => isPlayable && handleOpenMatchModal(finalMatch)}
                      className={`bg-zinc-900 border-2 rounded-2xl overflow-hidden shadow-xl transition-all relative ${
                        isPlayable 
                          ? 'border-amber-500/30 hover:border-amber-500/55 cursor-pointer hover:scale-[1.01]' 
                          : 'border-zinc-950 opacity-40 cursor-not-allowed'
                      }`}
                    >
                      <div className="px-4 py-2 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-b border-zinc-900 flex justify-between items-center text-[10px] font-mono font-bold text-amber-400 uppercase">
                        <span className="flex items-center gap-1.5">
                          <Trophy className="w-3.5 h-3.5 text-amber-400" />
                          CONFRONTO DO TÍTULO
                        </span>
                        {finalMatch.played ? (
                          <span className="text-amber-400">Campeão Definido</span>
                        ) : finalMatch.date ? (
                          <span className="text-amber-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-amber-400" />
                            {finalMatch.date.split('-').reverse().join('/')} {finalMatch.time || ''}
                          </span>
                        ) : isPlayable ? (
                          <span className="text-amber-500">Liberado</span>
                        ) : (
                          <span className="text-zinc-600">Aguardando Semifinais</span>
                        )}
                      </div>

                      <div className="p-5 space-y-4">
                        {/* Home Row */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 truncate">
                            <div className={`w-3.5 h-3.5 rounded-full shrink-0 ${getTeamColorClass(finalMatch.homeTeamId)}`} />
                            <span className={`text-base font-extrabold truncate text-zinc-100 ${isHomeWinner ? 'text-amber-400 font-black' : ''}`}>
                              {homeTeamName}
                            </span>
                          </div>
                          {finalMatch.played && (
                            <div className="flex items-center gap-1.5">
                              <span className={`text-base font-black font-mono px-2 py-0.5 rounded bg-zinc-950/60 ${isHomeWinner ? 'text-amber-400' : 'text-zinc-500'}`}>
                                {finalMatch.homeScore}
                              </span>
                              {finalMatch.penaltiesHome !== null && (
                                <span className="text-xs text-amber-500 font-semibold">({finalMatch.penaltiesHome})</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Away Row */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 truncate">
                            <div className={`w-3.5 h-3.5 rounded-full shrink-0 ${getTeamColorClass(finalMatch.awayTeamId)}`} />
                            <span className={`text-base font-extrabold truncate text-zinc-100 ${isAwayWinner ? 'text-amber-400 font-black' : ''}`}>
                              {awayTeamName}
                            </span>
                          </div>
                          {finalMatch.played && (
                            <div className="flex items-center gap-1.5">
                              <span className={`text-base font-black font-mono px-2 py-0.5 rounded bg-zinc-950/60 ${isAwayWinner ? 'text-amber-400' : 'text-zinc-500'}`}>
                                {finalMatch.awayScore}
                              </span>
                              {finalMatch.penaltiesAway !== null && (
                                <span className="text-xs text-amber-500 font-semibold">({finalMatch.penaltiesAway})</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {isPlayable && !finalMatch.played && (
                        <div className="py-2.5 bg-amber-500/5 text-center text-[10px] text-amber-400 font-extrabold tracking-wider uppercase border-t border-amber-500/10">
                          Registrar Placar da Final 🏆
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

            </div>
          </div>

        </div>
      )}

      {/* TAB 3: TOP SCORERS */}
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

      {/* SCOREBOARD EDIT MODAL */}
      {selectedMatch && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-white">
            
            {/* Modal Header */}
            <div className="px-5 py-4 bg-zinc-950 border-b border-zinc-800 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase font-bold">
                  {selectedMatch.phase === 'final' ? 'DECISÃO DO TÍTULO 🏆' : 'DETALHES DO CONFRONTO ⚔️'}
                </span>
                <h3 className="text-lg font-bold text-white uppercase -mt-0.5">
                  {isAdmin ? 'Lançar Resultado / Agendar' : 'Resultado da Partida'}
                </h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {modalError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg font-medium">
                  {modalError}
                </div>
              )}

              {/* DATE & TIME CALENDAR BLOCK */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span>Calendário de Jogos (Agenda)</span>
                </div>
                {isAdmin ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-zinc-500 font-bold block mb-1">DATA DO JOGO</label>
                      <input
                        type="date"
                        value={matchDate}
                        onChange={(e) => setMatchDate(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 font-bold block mb-1">HORÁRIO</label>
                      <input
                        type="time"
                        value={matchTime}
                        onChange={(e) => setMatchTime(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-xs font-semibold text-zinc-300 bg-zinc-900 px-3 py-2.5 rounded-lg border border-zinc-800/40">
                    {matchDate ? `${matchDate.split('-').reverse().join('/')} às ${matchTime || 'Sem horário definido'}` : 'Partida ainda sem data agendada'}
                  </div>
                )}
              </div>

              {/* Match Score Fields */}
              <div className="grid grid-cols-12 gap-3 items-center">
                
                {/* Home */}
                <div className="col-span-5 text-center">
                  <div className={`w-8 h-8 rounded-lg ${getTeamColorClass(selectedMatch.homeTeamId)} flex items-center justify-center font-bold text-xs text-white mx-auto mb-2`}>
                    H
                  </div>
                  <strong className="text-sm font-bold block truncate mb-1">{getTeamName(selectedMatch.homeTeamId)}</strong>
                  {isAdmin ? (
                    <input
                      type="text"
                      placeholder="-"
                      value={scoreHome}
                      onChange={(e) => setScoreHome(e.target.value.replace(/\D/g, ''))}
                      className="w-16 h-12 text-center bg-zinc-950 border border-zinc-800 rounded-xl font-black text-xl text-white focus:outline-none focus:border-emerald-500"
                    />
                  ) : (
                    <div className="w-16 h-12 flex items-center justify-center bg-zinc-950 border border-zinc-850 rounded-xl font-black text-xl text-white mx-auto">
                      {selectedMatch.homeScore !== null ? selectedMatch.homeScore : '-'}
                    </div>
                  )}
                </div>

                {/* X separator */}
                <div className="col-span-2 text-center text-zinc-600 font-bold text-sm">
                  VS
                </div>

                {/* Away */}
                <div className="col-span-5 text-center">
                  <div className={`w-8 h-8 rounded-lg ${getTeamColorClass(selectedMatch.awayTeamId)} flex items-center justify-center font-bold text-xs text-white mx-auto mb-2`}>
                    A
                  </div>
                  <strong className="text-sm font-bold block truncate mb-1">{getTeamName(selectedMatch.awayTeamId)}</strong>
                  {isAdmin ? (
                    <input
                      type="text"
                      placeholder="-"
                      value={scoreAway}
                      onChange={(e) => setScoreAway(e.target.value.replace(/\D/g, ''))}
                      className="w-16 h-12 text-center bg-zinc-950 border border-zinc-800 rounded-xl font-black text-xl text-white focus:outline-none focus:border-emerald-500"
                    />
                  ) : (
                    <div className="w-16 h-12 flex items-center justify-center bg-zinc-950 border border-zinc-850 rounded-xl font-black text-xl text-white mx-auto">
                      {selectedMatch.awayScore !== null ? selectedMatch.awayScore : '-'}
                    </div>
                  )}
                </div>

              </div>

              {/* PENALTIES BLOCK (IF DRAW AND ELIMINATORY) */}
              {((isAdmin && scoreHome !== '' && scoreAway !== '' && scoreHome === scoreAway) || (!isAdmin && selectedMatch.played && selectedMatch.homeScore === selectedMatch.awayScore)) && 
               (selectedMatch.phase === 'semifinal' || selectedMatch.phase === 'final') && (
                <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3 animate-fade-in">
                  <div className="text-center">
                    <span className="text-[10px] font-mono tracking-wider text-amber-500 font-bold uppercase">DECISÃO NOS PÊNALTIS</span>
                    <p className="text-zinc-500 text-[10px] -mt-0.5">Empate regulamentar! Decisão por pênaltis convertidos.</p>
                  </div>

                  <div className="flex items-center justify-center gap-4">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-zinc-500 mb-1">Gols</span>
                      {isAdmin ? (
                        <input
                          type="text"
                          placeholder="0"
                          value={penHome}
                          onChange={(e) => setPenHome(e.target.value.replace(/\D/g, ''))}
                          className="w-12 h-10 text-center bg-zinc-900 border border-zinc-800 rounded-lg text-amber-400 font-black focus:outline-none focus:border-amber-500"
                        />
                      ) : (
                        <div className="w-12 h-10 flex items-center justify-center bg-zinc-900 border border-zinc-850 rounded-lg text-amber-400 font-black">
                          {selectedMatch.penaltiesHome ?? 0}
                        </div>
                      )}
                    </div>
                    
                    <span className="text-zinc-700 font-mono text-xs mt-4">x</span>

                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-zinc-500 mb-1">Gols</span>
                      {isAdmin ? (
                        <input
                          type="text"
                          placeholder="0"
                          value={penAway}
                          onChange={(e) => setPenAway(e.target.value.replace(/\D/g, ''))}
                          className="w-12 h-10 text-center bg-zinc-900 border border-zinc-800 rounded-lg text-amber-400 font-black focus:outline-none focus:border-amber-500"
                        />
                      ) : (
                        <div className="w-12 h-10 flex items-center justify-center bg-zinc-900 border border-zinc-850 rounded-lg text-amber-400 font-black">
                          {selectedMatch.penaltiesAway ?? 0}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-4 bg-zinc-950 border-t border-zinc-800 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 bg-zinc-900 text-xs text-zinc-400 font-bold hover:text-white rounded-lg transition-colors"
              >
                {isAdmin ? 'Voltar' : 'Fechar'}
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={handleSaveScore}
                  className="px-5 py-2 bg-emerald-500 text-xs text-zinc-950 font-extrabold rounded-lg hover:bg-emerald-400 transition-all flex items-center gap-1.5"
                >
                  <span>Confirmar Resultado</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
