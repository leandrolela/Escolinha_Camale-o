import React, { useState } from 'react';
import { Plus, Trash2, ArrowLeft, ArrowRight, Trophy, Users, Settings, Zap } from 'lucide-react';
import { Team, Tournament, TournamentType } from '../types';
import { generateLeagueFixtures, generateKnockoutFixtures } from '../utils/tournamentGenerator';

interface TournamentWizardProps {
  onClose: () => void;
  onCreate: (tournament: Tournament) => void;
  globalTeams: Team[];
}

const BADGE_COLORS = [
  'bg-emerald-600', 'bg-blue-600', 'bg-red-600', 'bg-amber-600', 
  'bg-indigo-600', 'bg-pink-600', 'bg-purple-600', 'bg-orange-600',
  'bg-teal-600', 'bg-rose-600', 'bg-violet-600', 'bg-cyan-600'
];

const SAMPLE_TEAMS = [
  'Camaleão FC 🦎', 'Vila Silvânia ⚽', 'Carapicuíba FC', 'Guerreiros do Asfalto',
  'Bahia de Carapi', 'Real Paulista', 'Atlético Silvânia', 'Barcelona de Osasco',
  'Meninos da Vila', 'Esporte Clube Santa', 'União da Quebrada', 'Os Camaleões Sub-15'
];

export default function TournamentWizard({ onClose, onCreate, globalTeams }: TournamentWizardProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [type, setType] = useState<TournamentType>('league');
  
  // Rules
  const [doubleRound, setDoubleRound] = useState(false);
  const [knockoutSize, setKnockoutSize] = useState<number>(8);
  
  // Teams
  const [teamInput, setTeamInput] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [error, setError] = useState('');

  const addTeam = (teamName: string) => {
    const trimmed = teamName.trim();
    if (!trimmed) return;
    
    if (teams.some(t => t.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('Já existe um time com este nome!');
      return;
    }
    
    setError('');
    const newTeam: Team = {
      id: `team-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: trimmed,
      color: BADGE_COLORS[teams.length % BADGE_COLORS.length]
    };
    
    setTeams([...teams, newTeam]);
    setTeamInput('');
  };

  const removeTeam = (id: string) => {
    setTeams(teams.filter(t => t.id !== id));
  };

  const fillSampleTeams = () => {
    setError('');
    let limit = type === 'knockout' ? knockoutSize : 8;
    const samples = [...SAMPLE_TEAMS].slice(0, limit);
    
    const sampleTeams: Team[] = samples.map((name, index) => ({
      id: `team-sample-${index}`,
      name,
      color: BADGE_COLORS[index % BADGE_COLORS.length]
    }));
    
    setTeams(sampleTeams);
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!name.trim()) {
        setError('Por favor, informe o nome do campeonato!');
        return;
      }
      setError('');
      setStep(2);
    } else if (step === 2) {
      setError('');
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = () => {
    setError('');
    
    if (type === 'knockout') {
      if (teams.length !== knockoutSize) {
        setError(`Para a disputa de grupos e mata-mata com ${knockoutSize} times, você precisa selecionar exatamente ${knockoutSize} equipes! Atualmente: ${teams.length}`);
        return;
      }
    } else {
      if (teams.length < 3) {
        setError('Adicione pelo menos 3 equipes para o campeonato de pontos corridos!');
        return;
      }
    }

    const tournamentId = `tor-${Date.now()}`;
    let matches = [];

    if (type === 'league') {
      matches = generateLeagueFixtures(teams, doubleRound, tournamentId);
    } else {
      matches = generateKnockoutFixtures(teams, tournamentId);
    }

    const newTournament: Tournament = {
      id: tournamentId,
      name: name.trim(),
      type,
      teams,
      matches,
      status: 'active',
      winnerId: null,
      createdAt: new Date().toISOString(),
      rules: type === 'league' ? {
        victoryPoints: 3,
        drawPoints: 1,
        defeatPoints: 0
      } : undefined
    };

    onCreate(newTournament);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 sm:p-8 max-w-2xl mx-auto my-4 text-white">
      {/* Header Wizard */}
      <div className="flex justify-between items-center pb-6 border-b border-zinc-800 mb-8">
        <div>
          <span className="text-xs font-mono text-emerald-400 tracking-widest uppercase">Passo {step} de 3</span>
          <h2 className="text-2xl font-black uppercase flex items-center gap-2 mt-1">
            <Trophy className="w-6 h-6 text-emerald-400" />
            <span>Criar Campeonato</span>
          </h2>
        </div>
        <button 
          onClick={onClose}
          className="text-zinc-500 hover:text-white transition-colors text-sm font-semibold hover:bg-zinc-800 px-3 py-1.5 rounded-lg"
        >
          Cancelar
        </button>
      </div>

      {/* STEP INDICATORS */}
      <div className="flex items-center gap-2 mb-8">
        <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-emerald-500' : 'bg-zinc-800'}`} />
        <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-emerald-500' : 'bg-zinc-800'}`} />
        <div className={`h-2 flex-1 rounded-full ${step >= 3 ? 'bg-emerald-500' : 'bg-zinc-800'}`} />
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm mb-6 flex items-start gap-2">
          <span className="font-bold">Atenção:</span>
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: Basic Info */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-zinc-300">Nome do Campeonato</label>
            <input
              type="text"
              placeholder="Ex: Copa Camaleão 2026, Brasileirão de Carapi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors text-base"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-zinc-300">Formato de Disputa</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Type 1: Pontos Corridos */}
              <button
                type="button"
                onClick={() => setType('league')}
                className={`p-5 rounded-xl border text-left flex flex-col justify-between transition-all duration-200 ${
                  type === 'league'
                    ? 'border-emerald-500 bg-emerald-500/5 text-white'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                  <Settings className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">Pontos Corridos</h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    Todos jogam contra todos. Quem somar mais pontos ao fim de todas as rodadas é o grande campeão.
                  </p>
                </div>
              </button>

              {/* Type 2: Knockout */}
              <button
                type="button"
                onClick={() => setType('knockout')}
                className={`p-5 rounded-xl border text-left flex flex-col justify-between transition-all duration-200 ${
                  type === 'knockout'
                    ? 'border-emerald-500 bg-emerald-500/5 text-white'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                  <Trophy className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">Grupos A e B + Mata-Mata</h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    Fase de grupos (Grupo A e Grupo B) em pontos corridos de turno único, com os 2 melhores de cada grupo classificando-se para as Semifinais e Final de mata-mata.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Format Rules */}
      {step === 2 && (
        <div className="space-y-6">
          {type === 'league' ? (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white mb-2">Configurações de Pontos Corridos</h3>
              
              <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm">Turno e Returno</h4>
                    <p className="text-xs text-zinc-500">Cada time joga duas vezes contra cada adversário (casa e fora)</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDoubleRound(!doubleRound)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      doubleRound ? 'bg-emerald-500' : 'bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        doubleRound ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="h-px bg-zinc-900" />

                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                    <span className="text-zinc-500 block">Vitória</span>
                    <strong className="text-emerald-400 text-lg">3 pts</strong>
                  </div>
                  <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                    <span className="text-zinc-500 block">Empate</span>
                    <strong className="text-amber-400 text-lg">1 pt</strong>
                  </div>
                  <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                    <span className="text-zinc-500 block">Derrota</span>
                    <strong className="text-red-400 text-lg">0 pts</strong>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white mb-2">Quantidade Total de Equipes</h3>
              <p className="text-xs text-zinc-400">
                Selecione a quantidade de equipes participantes. Elas serão divididas igualmente entre o Grupo A e o Grupo B.
              </p>
              
              <div className="grid grid-cols-5 gap-3">
                {([4, 6, 8, 10, 12, 16] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setKnockoutSize(size)}
                    className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                      knockoutSize === size
                        ? 'border-emerald-500 bg-emerald-500/10 text-white font-bold'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <strong className="text-xl">{size}</strong>
                    <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-500">
                      {size / 2} por Grupo
                    </span>
                  </button>
                ))}
              </div>

              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-400 space-y-2">
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold text-zinc-300 block mb-1">Estrutura do Torneio</span>
                    As equipes do Grupo A jogam entre si e as do Grupo B jogam entre si (pontos corridos, turno único). Os <strong>2 melhores de cada grupo</strong> avançam às Semifinais.
                  </div>
                </div>
                <div className="h-px bg-zinc-900" />
                <div className="flex items-start gap-3">
                  <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <span className="font-bold text-zinc-300 block mb-1">Fase Eliminatória (Mata-Mata)</span>
                    <ul className="list-disc pl-4 space-y-1 mt-1 text-zinc-400">
                      <li>Semifinal 1: 1º Grupo A contra 2º Grupo B</li>
                      <li>Semifinal 2: 1º Grupo B contra 2º Grupo A</li>
                      <li>Final: Vencedor Semifinal 1 contra Vencedor Semifinal 2</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 3: Teams Registration */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-white">Selecionar Times do Banco Global</h3>
              <p className="text-xs text-zinc-500">
                {type === 'knockout' 
                  ? `Selecione exatamente ${knockoutSize} equipes (${teams.length}/${knockoutSize})` 
                  : `Selecione as equipes concorrentes (mínimo de 3. Selecionados: ${teams.length})`}
              </p>
            </div>

            {/* Quick generator */}
            <button
              type="button"
              onClick={fillSampleTeams}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Preencher com Exemplos</span>
            </button>
          </div>

          {/* Grid Selection of Global Teams */}
          <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-4 space-y-3">
            <span className="text-[10px] font-mono font-bold tracking-wider text-zinc-400 uppercase">
              Selecione os clubes participantes:
            </span>
            {globalTeams.length === 0 ? (
              <div className="text-center py-6 text-xs text-zinc-500">
                Nenhum time cadastrado no banco independente de times. Cadastre-os no painel principal ou clique em "Preencher com Exemplos" para começar.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-56 overflow-y-auto pr-1">
                {globalTeams.map((gt) => {
                  const isSelected = teams.some(t => t.id === gt.id);
                  const playerCount = gt.players?.length || 0;
                  return (
                    <button
                      key={gt.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setTeams(teams.filter(t => t.id !== gt.id));
                        } else {
                          if (type === 'knockout' && teams.length >= knockoutSize) {
                            setError(`Mata-mata de ${knockoutSize} times já está cheio!`);
                            return;
                          }
                          setError('');
                          setTeams([...teams, gt]);
                        }
                      }}
                      className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between h-20 ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-md font-bold'
                          : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate w-full">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${gt.color}`} />
                        <span className="text-xs font-bold truncate uppercase">{gt.name}</span>
                      </div>
                      <span className="text-[9px] font-mono text-zinc-500">
                        {playerCount} Atletas inscritos
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick-add fallback input if needed */}
          <div className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl space-y-3">
            <span className="text-[10px] font-mono font-bold tracking-wider text-zinc-400 uppercase block">
              Ou digite o nome de uma equipe temporária:
            </span>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addTeam(teamInput);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                placeholder="Ex: Camaleão Sub-20 ⚽"
                value={teamInput}
                onChange={(e) => setTeamInput(e.target.value)}
                className="flex-1 px-3 py-2 bg-zinc-905 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 text-xs focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-emerald-400 text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar</span>
              </button>
            </form>
          </div>

          {/* Display current participating list */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 flex justify-between text-[10px] font-mono font-bold text-zinc-400 uppercase">
              <span>Equipes Escaladas no Torneio ({teams.length})</span>
              {type === 'knockout' && <span>Faltam {knockoutSize - teams.length}</span>}
            </div>
            
            {teams.length === 0 ? (
              <div className="p-6 text-center text-zinc-600 text-xs">
                Selecione as equipes acima para este campeonato.
              </div>
            ) : (
              <ul className="divide-y divide-zinc-900 max-h-40 overflow-y-auto">
                {teams.map((t, idx) => (
                  <li key={t.id} className="px-4 py-2.5 flex items-center justify-between text-xs hover:bg-zinc-900/30 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-5 h-5 rounded ${t.color} flex items-center justify-center font-bold text-[9px] text-white shadow-sm`}>
                        {idx + 1}
                      </div>
                      <span className="font-semibold text-zinc-200">{t.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTeam(t.id)}
                      className="p-1 text-zinc-500 hover:text-red-400 rounded transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* FOOTER ACTIONS */}
      <div className="flex justify-between items-center pt-8 border-t border-zinc-800 mt-8">
        {step > 1 ? (
          <button
            type="button"
            onClick={handlePrevStep}
            className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold flex items-center gap-1.5 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>
        ) : (
          <div />
        )}

        {step < 3 ? (
          <button
            type="button"
            onClick={handleNextStep}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 transition-colors text-sm ml-auto cursor-pointer"
          >
            <span>Avançar</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-orange-500 text-white font-extrabold tracking-wide shadow-lg shadow-emerald-500/15 hover:scale-[1.02] transition-transform ml-auto text-sm cursor-pointer"
          >
            CRIAR TORNEIO 🏆
          </button>
        )}
      </div>
    </div>
  );
}
