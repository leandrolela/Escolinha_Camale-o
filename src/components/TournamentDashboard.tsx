import React, { useRef, useState } from 'react';
import { Trophy, Plus, Trash2, Calendar, Users, Settings, Award, Download, Upload, ShieldAlert } from 'lucide-react';
import { Tournament, Team } from '../types';
import GlobalTeamsManager from './GlobalTeamsManager';

interface TournamentDashboardProps {
  tournaments: Tournament[];
  onSelectTournament: (id: string) => void;
  onCreateNewClick: () => void;
  onDeleteTournament: (id: string) => void;
  onImportTournaments: (imported: Tournament[]) => void;
  isAdmin: boolean;
  onRequestAdmin: (callback: () => void) => void;
  globalTeams: Team[];
  onUpdateGlobalTeams: (teams: Team[]) => void;
}

export default function TournamentDashboard({
  tournaments,
  onSelectTournament,
  onCreateNewClick,
  onDeleteTournament,
  onImportTournaments,
  isAdmin,
  onRequestAdmin,
  globalTeams,
  onUpdateGlobalTeams,
}: TournamentDashboardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dashboardTab, setDashboardTab] = useState<'tournaments' | 'global_teams'>('tournaments');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Stats calculation
  const totalTournaments = tournaments.length;
  const activeCount = tournaments.filter(t => t.status === 'active').length;
  const completedCount = tournaments.filter(t => t.status === 'completed').length;
  
  const totalTeamsCount = tournaments.reduce((acc, curr) => acc + curr.teams.length, 0);

  const handleExport = () => {
    if (tournaments.length === 0) {
      alert('Nenhum campeonato para exportar!');
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tournaments, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `camaleao_campeonatos_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportClick = () => {
    onRequestAdmin(() => {
      fileInputRef.current?.click();
    });
  };

  const handleCreateNew = () => {
    onRequestAdmin(() => {
      onCreateNewClick();
    });
  };

  const handleDeleteClick = (id: string, name: string) => {
    onRequestAdmin(() => {
      if (confirm(`Tem certeza de que deseja excluir o campeonato "${name}"? Esta ação não pode ser desfeita.`)) {
        onDeleteTournament(id);
      }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = e.target.files;
    if (!files || files.length === 0) return;

    fileReader.readAsText(files[0], "UTF-8");
    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          // Quick validation
          const isValid = parsed.every(item => item.id && item.name && item.type && Array.isArray(item.teams));
          if (isValid) {
            onImportTournaments(parsed);
            alert('Campeonatos importados com sucesso!');
          } else {
            alert('Formato de arquivo inválido. Certifique-se de que é um backup do Camaleão.');
          }
        } else {
          alert('Formato inválido. O arquivo deve conter uma lista de campeonatos.');
        }
      } catch (err) {
        alert('Erro ao processar o arquivo JSON!');
      }
    };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-white">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 pb-6 border-b border-zinc-800">
        <div>
          <span className="text-xs font-mono text-emerald-400 tracking-widest uppercase">Área Administrativa</span>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight flex items-center gap-3 mt-1">
            <Trophy className="w-8 h-8 text-emerald-400" />
            <span>Gestor de Campeonatos</span>
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Crie, simule e organize torneios locais de pontos corridos ou chaves eliminatórias.
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Export */}
          <button
            onClick={handleExport}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-zinc-800 hover:border-zinc-700 transition-all text-zinc-300"
            title="Salvar backup dos campeonatos"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Exportar Backups</span>
          </button>

          {isAdmin && (
            <>
              {/* Import */}
              <button
                onClick={handleImportClick}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-zinc-800 hover:border-zinc-700 transition-all text-zinc-300"
                title="Importar backup de campeonatos"
              >
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>Importar Backups</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
              />

              {/* New Tournament */}
              <button
                onClick={handleCreateNew}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-orange-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 hover:scale-[1.02] transition-transform cursor-pointer"
              >
                <Plus className="w-5 h-5 stroke-[3px]" />
                <span>Novo Campeonato</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ADMIN LEVEL TAB BAR SELECTOR */}
      {isAdmin && (
        <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-2xl max-w-lg mb-8 shadow-inner">
          <button
            onClick={() => setDashboardTab('tournaments')}
            className={`flex-1 py-3 px-5 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
              dashboardTab === 'tournaments'
                ? 'bg-gradient-to-r from-emerald-500 to-orange-500 text-white shadow-md font-extrabold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Campeonatos</span>
          </button>
          <button
            onClick={() => setDashboardTab('global_teams')}
            className={`flex-1 py-3 px-5 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
              dashboardTab === 'global_teams'
                ? 'bg-gradient-to-r from-emerald-500 to-orange-500 text-white shadow-md font-extrabold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
            }`}
          >
            <Users className="w-4.5 h-4.5" />
            <span>Times / Elencos independentes</span>
          </button>
        </div>
      )}

      {dashboardTab === 'global_teams' && isAdmin ? (
        <div className="animate-fade-in">
          <GlobalTeamsManager 
            globalTeams={globalTeams} 
            onUpdateGlobalTeams={onUpdateGlobalTeams} 
            isAdmin={isAdmin} 
          />
        </div>
      ) : (
        <>
          {/* STATS OVERVIEW CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-10">
            <div className="bg-zinc-900/40 p-4 sm:p-5 rounded-2xl border border-zinc-800/60 shadow-md">
              <span className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase">Campeonatos Totais</span>
              <strong className="text-2xl sm:text-3xl font-black block mt-1 text-white">{totalTournaments}</strong>
            </div>
            <div className="bg-zinc-900/40 p-4 sm:p-5 rounded-2xl border border-zinc-800/60 shadow-md">
              <span className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase">Em Andamento</span>
              <strong className="text-2xl sm:text-3xl font-black block mt-1 text-emerald-400">{activeCount}</strong>
            </div>
            <div className="bg-zinc-900/40 p-4 sm:p-5 rounded-2xl border border-zinc-800/60 shadow-md">
              <span className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase">Encerrados</span>
              <strong className="text-2xl sm:text-3xl font-black block mt-1 text-zinc-400">{completedCount}</strong>
            </div>
            <div className="bg-zinc-900/40 p-4 sm:p-5 rounded-2xl border border-zinc-800/60 shadow-md">
              <span className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase">Equipes Registradas</span>
              <strong className="text-2xl sm:text-3xl font-black block mt-1 text-orange-500">{totalTeamsCount}</strong>
            </div>
          </div>

          {/* TOURNAMENT LIST */}
          {tournaments.length === 0 ? (
            <div className="text-center py-20 px-4 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-3xl max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Nenhum Campeonato Iniciado</h3>
              <p className="text-zinc-500 text-sm max-w-sm mx-auto mb-8">
                {isAdmin
                  ? 'Comece criando o seu primeiro torneio! Escolha entre o formato de pontos corridos clássico ou chaveamento eliminatório de mata-mata.'
                  : 'Nenhum campeonato foi cadastrado no sistema ainda. Acesse a área administrativa para iniciar.'}
              </p>
              {isAdmin ? (
                <button
                  onClick={handleCreateNew}
                  className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm tracking-wide transition-all shadow-md inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 stroke-[3px]" />
                  <span>Criar Primeiro Campeonato</span>
                </button>
              ) : (
                <div className="text-xs text-zinc-500 font-mono">
                  Aguardando cadastro por um administrador
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tournaments.map((tournament) => {
                const dateFormatted = new Date(tournament.createdAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                });
                
                return (
                  <div
                    key={tournament.id}
                    className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-emerald-500/30 transition-all shadow-lg group relative"
                  >
                    <div>
                      {/* Card top banner status */}
                      <div className="flex justify-between items-center mb-4">
                        <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full ${
                          tournament.type === 'league' 
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
                            : 'bg-orange-500/10 text-orange-600 border border-orange-500/20'
                        }`}>
                          {tournament.type === 'league' ? '⚽ Pontos Corridos' : '🏆 Mata-Mata'}
                        </span>
                        
                        <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                          tournament.status === 'completed'
                            ? 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {tournament.status === 'completed' ? 'Finalizado' : 'Em Andamento'}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                        {tournament.name}
                      </h3>

                      <div className="space-y-2 mt-4 text-xs text-zinc-400 border-t border-zinc-900 pt-4">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-zinc-500" />
                          <span>{tournament.teams.length} equipes participantes</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-zinc-500" />
                          <span>Iniciado em {dateFormatted}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer buttons */}
                    <div className="mt-6 pt-4 border-t border-zinc-900/60 flex items-center justify-between gap-3">
                      <button
                        onClick={() => onSelectTournament(tournament.id)}
                        className="flex-1 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-emerald-500/30 hover:bg-zinc-900/60 text-emerald-400 text-xs font-bold transition-all text-center block"
                      >
                        {isAdmin ? 'Gerenciar Torneio' : 'Visualizar Torneio'}
                      </button>

                      {isAdmin && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          {confirmDeleteId === tournament.id ? (
                            <>
                              <button
                                onClick={() => {
                                  onDeleteTournament(tournament.id);
                                  setConfirmDeleteId(null);
                                }}
                                className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold rounded-xl transition-all shadow-md shrink-0"
                              >
                                Confirmar
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-bold rounded-xl transition-all shrink-0"
                              >
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(tournament.id)}
                              className="p-2.5 rounded-xl bg-zinc-950 hover:bg-red-500/10 border border-zinc-800 hover:border-red-500/30 text-zinc-500 hover:text-red-400 transition-all shrink-0"
                              title="Excluir Campeonato"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
