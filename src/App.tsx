import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import TournamentDashboard from './components/TournamentDashboard';
import TournamentWizard from './components/TournamentWizard';
import LeagueTournament from './components/LeagueTournament';
import KnockoutTournament from './components/KnockoutTournament';
import AdminAuthModal from './components/AdminAuthModal';
import { Tournament, Match, Team } from './types';

export default function App() {
  const [activeSection, setActiveSection] = useState('inicio');
  const [isChampionshipsActive, setIsChampionshipsActive] = useState(false);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [activeTournamentId, setActiveTournamentId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [globalTeams, setGlobalTeams] = useState<Team[]>([]);

  // Admin access control states
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem('camaleao_admin') === 'true');
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [onAdminSuccessCallback, setOnAdminSuccessCallback] = useState<(() => void) | null>(null);

  const handleAdminSuccess = () => {
    setIsAdmin(true);
    sessionStorage.setItem('camaleao_admin', 'true');
    setIsAdminModalOpen(false);
    if (onAdminSuccessCallback) {
      onAdminSuccessCallback();
      setOnAdminSuccessCallback(null);
    }
  };

  const requestAdminAction = (callback: () => void) => {
    if (isAdmin) {
      callback();
    } else {
      setOnAdminSuccessCallback(() => callback);
      setIsAdminModalOpen(true);
    }
  };

  const handleAdminToggle = () => {
    if (isAdmin) {
      setIsAdmin(false);
      sessionStorage.removeItem('camaleao_admin');
    } else {
      setOnAdminSuccessCallback(null);
      setIsAdminModalOpen(true);
    }
  };

  // Load tournaments and global teams from local storage on startup
  useEffect(() => {
    try {
      const stored = localStorage.getItem('camaleao_tournaments');
      if (stored) {
        setTournaments(JSON.parse(stored));
      }
      const storedGlobal = localStorage.getItem('camaleao_global_teams');
      if (storedGlobal) {
        setGlobalTeams(JSON.parse(storedGlobal));
      }
    } catch (e) {
      console.error('Error loading data from localStorage:', e);
    }
  }, []);

  // Sync tournaments to local storage on changes
  const saveTournaments = (updatedList: Tournament[]) => {
    setTournaments(updatedList);
    try {
      localStorage.setItem('camaleao_tournaments', JSON.stringify(updatedList));
    } catch (e) {
      console.error('Error saving tournaments to localStorage:', e);
    }
  };

  // Sync global teams to local storage on changes
  const saveGlobalTeams = (updatedList: Team[]) => {
    setGlobalTeams(updatedList);
    try {
      localStorage.setItem('camaleao_global_teams', JSON.stringify(updatedList));
    } catch (e) {
      console.error('Error saving global teams to localStorage:', e);
    }
  };

  // Create a new tournament (from Wizard)
  const handleCreateTournament = (newTournament: Tournament) => {
    const updated = [newTournament, ...tournaments];
    saveTournaments(updated);
    setIsCreating(false);
    setActiveTournamentId(newTournament.id); // Go straight into managing it
  };

  // Delete a tournament
  const handleDeleteTournament = (id: string) => {
    const updated = tournaments.filter(t => t.id !== id);
    saveTournaments(updated);
    if (activeTournamentId === id) {
      setActiveTournamentId(null);
    }
  };

  // Update match scores within a tournament
  const handleUpdateMatches = (tournamentId: string, updatedMatches: Match[]) => {
    setTournaments((prev) => {
      const updated = prev.map((t) => {
        if (t.id === tournamentId) {
          return {
            ...t,
            matches: updatedMatches,
          };
        }
        return t;
      });
      try {
        localStorage.setItem('camaleao_tournaments', JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving tournaments to localStorage:', e);
      }
      return updated;
    });
  };

  // Update teams list inside a tournament
  const handleUpdateTeams = (tournamentId: string, updatedTeams: Team[]) => {
    setTournaments((prev) => {
      const updated = prev.map((t) => {
        if (t.id === tournamentId) {
          return {
            ...t,
            teams: updatedTeams,
          };
        }
        return t;
      });
      try {
        localStorage.setItem('camaleao_tournaments', JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving tournaments to localStorage:', e);
      }
      return updated;
    });
  };

  // Update overall tournament status and winner ID (e.g. when completed)
  const handleUpdateStatus = (
    tournamentId: string, 
    status: 'active' | 'completed', 
    winnerId: string | null
  ) => {
    setTournaments((prev) => {
      const updated = prev.map((t) => {
        if (t.id === tournamentId) {
          return {
            ...t,
            status,
            winnerId,
          };
        }
        return t;
      });
      try {
        localStorage.setItem('camaleao_tournaments', JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving tournaments to localStorage:', e);
      }
      return updated;
    });
  };

  // Import external backup
  const handleImportTournaments = (imported: Tournament[]) => {
    // Merge or replace (here we replace to restore identical state, or we can merge on duplicate ID)
    const existingIds = new Set(tournaments.map(t => t.id));
    const filteredImported = imported.filter(t => !existingIds.has(t.id));
    const merged = [...filteredImported, ...tournaments];
    saveTournaments(merged);
  };

  const activeTournament = tournaments.find(t => t.id === activeTournamentId);

  return (
    <div className="bg-zinc-950 min-h-screen text-white flex flex-col selection:bg-emerald-500 selection:text-zinc-950">
      {/* Dynamic Header */}
      <Navbar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        isChampionshipsActive={isChampionshipsActive}
        onNavigateToChampionships={() => {
          setIsChampionshipsActive(true);
          setActiveTournamentId(null);
          setIsCreating(false);
        }}
        onNavigateToLanding={() => setIsChampionshipsActive(false)}
        isAdmin={isAdmin}
        onAdminLoginToggle={handleAdminToggle}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {!isChampionshipsActive ? (
          /* LANDING PAGE VIEW */
          <LandingPage 
            onNavigateToChampionships={() => {
              setIsChampionshipsActive(true);
              setActiveTournamentId(null);
              setIsCreating(false);
            }} 
          />
        ) : (
          /* CHAMPIONSHIPS AREA VIEW */
          <div className="bg-zinc-950 min-h-[calc(100vh-4rem)]">
            {isCreating ? (
              /* WIZARD FORM */
              <div className="py-10 px-4">
                <TournamentWizard
                  onClose={() => setIsCreating(false)}
                  onCreate={handleCreateTournament}
                  globalTeams={globalTeams}
                />
              </div>
            ) : activeTournament ? (
              /* INDIVIDUAL CHAMPIONSHIP MANAGEMENT */
              activeTournament.type === 'league' ? (
                <LeagueTournament
                  tournament={activeTournament}
                  onUpdateMatches={(matches) => handleUpdateMatches(activeTournament.id, matches)}
                  onBack={() => setActiveTournamentId(null)}
                  onUpdateStatus={(status, winnerId) => handleUpdateStatus(activeTournament.id, status, winnerId)}
                  onUpdateTeams={(teams) => handleUpdateTeams(activeTournament.id, teams)}
                  isAdmin={isAdmin}
                  onRequestAdmin={requestAdminAction}
                />
              ) : (
                <KnockoutTournament
                  tournament={activeTournament}
                  onUpdateMatches={(matches) => handleUpdateMatches(activeTournament.id, matches)}
                  onBack={() => setActiveTournamentId(null)}
                  onUpdateStatus={(status, winnerId) => handleUpdateStatus(activeTournament.id, status, winnerId)}
                  onUpdateTeams={(teams) => handleUpdateTeams(activeTournament.id, teams)}
                  isAdmin={isAdmin}
                  onRequestAdmin={requestAdminAction}
                />
              )
            ) : (
              /* TOURNAMENT DASHBOARD LIST */
              <TournamentDashboard
                tournaments={tournaments}
                onSelectTournament={setActiveTournamentId}
                onCreateNewClick={() => setIsCreating(true)}
                onDeleteTournament={handleDeleteTournament}
                onImportTournaments={handleImportTournaments}
                isAdmin={isAdmin}
                onRequestAdmin={requestAdminAction}
                globalTeams={globalTeams}
                onUpdateGlobalTeams={saveGlobalTeams}
              />
            )}
          </div>
        )}
      </main>

      {/* Admin Access Modal */}
      <AdminAuthModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onSuccess={handleAdminSuccess}
      />
    </div>
  );
}
