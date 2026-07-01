import { Team, Match, Tournament } from '../types';

/**
 * Generates round-robin fixtures (Pontos Corridos) using the Circle Method.
 */
export function generateLeagueFixtures(
  teams: Team[],
  doubleRound: boolean = false,
  tournamentId: string
): Match[] {
  const matches: Match[] = [];
  const n = teams.length;
  
  // If odd number of teams, add a dummy team for "BYE" rounds
  const tempTeams = [...teams];
  const hasBye = n % 2 !== 0;
  if (hasBye) {
    tempTeams.push({ id: 'BYE', name: 'FOLGA', color: 'bg-gray-400' });
  }
  
  const numTeams = tempTeams.length;
  const numRounds = numTeams - 1;
  const matchesPerRound = numTeams / 2;
  
  // Single round robin
  for (let r = 0; r < numRounds; r++) {
    for (let m = 0; m < matchesPerRound; m++) {
      const homeIdx = (r + m) % (numTeams - 1);
      let awayIdx = (numTeams - 1 - m + r) % (numTeams - 1);
      
      // The last team stays in place, others rotate around it
      if (m === 0) {
        awayIdx = numTeams - 1;
      }
      
      const homeTeam = tempTeams[homeIdx];
      const awayTeam = tempTeams[awayIdx];
      
      // Skip matches involving the "BYE" team
      if (homeTeam.id !== 'BYE' && awayTeam.id !== 'BYE') {
        matches.push({
          id: `${tournamentId}-L-r${r + 1}-m${m}`,
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          homeScore: null,
          awayScore: null,
          played: false,
          round: r + 1,
          matchIndex: m,
        });
      }
    }
  }
  
  // Return round (Turno e Returno) - swap home and away
  if (doubleRound) {
    const returnMatches: Match[] = [];
    const roundOffset = numRounds;
    
    matches.forEach((match) => {
      returnMatches.push({
        id: `${match.id}-return`,
        homeTeamId: match.awayTeamId,
        awayTeamId: match.homeTeamId,
        homeScore: null,
        awayScore: null,
        played: false,
        round: match.round + roundOffset,
        matchIndex: match.matchIndex,
      });
    });
    
    return [...matches, ...returnMatches];
  }
  
  return matches;
}

/**
 * Helper to generate group stage matches using standard round robin (Circle Method)
 */
function generateGroupMatches(
  groupTeams: Team[],
  groupChar: 'A' | 'B',
  tournamentId: string
): Match[] {
  const matches: Match[] = [];
  const n = groupTeams.length;
  if (n < 2) return [];

  const tempTeams = [...groupTeams];
  const hasBye = n % 2 !== 0;
  if (hasBye) {
    tempTeams.push({ id: 'BYE', name: 'FOLGA', color: 'bg-zinc-700' });
  }

  const numTeams = tempTeams.length;
  const numRounds = numTeams - 1;
  const matchesPerRound = numTeams / 2;

  for (let r = 0; r < numRounds; r++) {
    for (let m = 0; m < matchesPerRound; m++) {
      const homeIdx = (r + m) % (numTeams - 1);
      let awayIdx = (numTeams - 1 - m + r) % (numTeams - 1);

      if (m === 0) {
        awayIdx = numTeams - 1;
      }

      const homeTeam = tempTeams[homeIdx];
      const awayTeam = tempTeams[awayIdx];

      if (homeTeam.id !== 'BYE' && awayTeam.id !== 'BYE') {
        matches.push({
          id: `${tournamentId}-G${groupChar}-r${r + 1}-m${m}`,
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          homeScore: null,
          awayScore: null,
          played: false,
          round: r + 1,
          matchIndex: m,
          phase: 'group',
          group: groupChar,
        });
      }
    }
  }
  return matches;
}

/**
 * Generates group stage + knockout tournament matches.
 * Divides teams into Group A and Group B, generates group matches, and adds empty Semifinals and Final matches.
 */
export function generateKnockoutFixtures(
  teams: Team[],
  tournamentId: string
): Match[] {
  const n = teams.length;
  
  // Split teams into Group A and Group B
  const groupATeams: Team[] = [];
  const groupBTeams: Team[] = [];

  teams.forEach((team, idx) => {
    if (idx % 2 === 0) {
      groupATeams.push(team);
    } else {
      groupBTeams.push(team);
    }
  });

  const groupAMatches = generateGroupMatches(groupATeams, 'A', tournamentId);
  const groupBMatches = generateGroupMatches(groupBTeams, 'B', tournamentId);

  // Semifinals (Round 0 of knockout stage, phase: 'semifinal')
  const sfMatches: Match[] = [
    {
      id: `${tournamentId}-SF-m0`,
      homeTeamId: '1A', // placeholder string for 1st Group A
      awayTeamId: '2B', // placeholder string for 2nd Group B
      homeScore: null,
      awayScore: null,
      played: false,
      round: 0,
      matchIndex: 0,
      phase: 'semifinal',
      penaltiesHome: null,
      penaltiesAway: null,
    },
    {
      id: `${tournamentId}-SF-m1`,
      homeTeamId: '1B', // placeholder string for 1st Group B
      awayTeamId: '2A', // placeholder string for 2nd Group A
      homeScore: null,
      awayScore: null,
      played: false,
      round: 0,
      matchIndex: 1,
      phase: 'semifinal',
      penaltiesHome: null,
      penaltiesAway: null,
    }
  ];

  // Final (Round 1 of knockout stage, phase: 'final')
  const finalMatch: Match = {
    id: `${tournamentId}-FN-m0`,
    homeTeamId: 'WSF0', // Winner Semifinal 0
    awayTeamId: 'WSF1', // Winner Semifinal 1
    homeScore: null,
    awayScore: null,
    played: false,
    round: 1,
    matchIndex: 0,
    phase: 'final',
    penaltiesHome: null,
    penaltiesAway: null,
  };

  return [...groupAMatches, ...groupBMatches, ...sfMatches, finalMatch];
}

/**
 * Propagates winning team to the next round of a knockout tournament.
 * If match index is k in round r, the winner goes to:
 * - round r + 1
 * - match index floor(k/2)
 * - Home slot if k is even, Away slot if k is odd
 */
export function propagateKnockoutWinner(
  matches: Match[],
  round: number,
  matchIndex: number,
  winnerTeamId: string
): Match[] {
  const nextRound = round + 1;
  const nextMatchIndex = Math.floor(matchIndex / 2);
  const isHome = matchIndex % 2 === 0;
  
  const targetMatchIdSuffix = `-r${nextRound}-m${nextMatchIndex}`;
  
  return matches.map((match) => {
    // If it's the next match, update the home or away team slot
    if (match.round === nextRound && match.matchIndex === nextMatchIndex) {
      return {
        ...match,
        homeTeamId: isHome ? winnerTeamId : match.homeTeamId,
        awayTeamId: !isHome ? winnerTeamId : match.awayTeamId,
        // Reset the match's state if a team changed to prevent stale results
        homeScore: (isHome ? winnerTeamId : match.homeTeamId) !== match.homeTeamId ? null : match.homeScore,
        awayScore: (!isHome ? winnerTeamId : match.awayTeamId) !== match.awayTeamId ? null : match.awayScore,
        played: (isHome ? winnerTeamId : match.homeTeamId) !== match.homeTeamId || (!isHome ? winnerTeamId : match.awayTeamId) !== match.awayTeamId ? false : match.played,
      };
    }
    return match;
  });
}
