import React, { useState } from 'react';
import { Trophy, Menu, X, Calendar, MapPin, Info, Home, Shield, Lock, Unlock } from 'lucide-react';

interface NavbarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  onNavigateToChampionships: () => void;
  onNavigateToLanding: () => void;
  isChampionshipsActive: boolean;
  isAdmin: boolean;
  onAdminLoginToggle: () => void;
}

export default function Navbar({
  activeSection,
  setActiveSection,
  onNavigateToChampionships,
  onNavigateToLanding,
  isChampionshipsActive,
  isAdmin,
  onAdminLoginToggle,
}: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { id: 'inicio', label: 'Início', icon: Home },
    { id: 'sobre', label: 'Sobre Nós', icon: Info },
    { id: 'quadra', label: 'Quadra', icon: Shield },
    { id: 'localizacao', label: 'Localização', icon: MapPin },
  ];

  const handleNavClick = (id: string) => {
    setIsOpen(false);
    if (isChampionshipsActive) {
      // Go back to landing page and then scroll to section
      onNavigateToLanding();
      setActiveSection(id);
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      setActiveSection(id);
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-zinc-950/95 border-b border-emerald-500/20 shadow-lg backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            onClick={() => handleNavClick('inicio')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-emerald-500/30 overflow-hidden shadow-md shadow-emerald-500/10 group-hover:scale-105 transition-all duration-300 flex items-center justify-center">
              <img 
                src="Escolinha_Camale-o/src/assets/images/Logo.png" 
                alt=" Logo Camaleão"   
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-white tracking-wide group-hover:text-emerald-400 transition-colors">
                Camaleão
              </span>
              <span className="text-[10px] text-emerald-500 font-mono tracking-widest uppercase -mt-1">
                Futebol & Arena
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <ul className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = !isChampionshipsActive && activeSection === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => handleNavClick(item.id)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                        isActive
                          ? 'text-emerald-400 bg-emerald-500/10 border-b border-emerald-400'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="h-6 w-px bg-zinc-800" />

            {/* Admin Lock Toggle */}
            <button
              onClick={onAdminLoginToggle}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all duration-200 ${
                isAdmin
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-zinc-900 border-zinc-850 text-zinc-400 hover:text-white'
              }`}
              title={isAdmin ? "Área Administrativa Ativa - Clique para bloquear" : "Clique para entrar na Área Administrativa"}
            >
              {isAdmin ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>Admin Ativo</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Área Administrativa</span>
                </>
              )}
            </button>

            <div className="h-6 w-px bg-zinc-800" />

            {/* Championship CTA */}
            <button
              onClick={onNavigateToChampionships}
              className={`px-4 py-2 rounded-xl text-sm font-semibold tracking-wide flex items-center gap-2 shadow-lg transition-all duration-300 ${
                isChampionshipsActive
                  ? 'bg-emerald-500 text-zinc-950 shadow-emerald-500/20 hover:bg-emerald-400 scale-105'
                  : 'bg-zinc-900 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-zinc-950 hover:shadow-emerald-500/20'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Campeonatos</span>
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={onNavigateToChampionships}
              className={`p-2 rounded-lg transition-all ${
                isChampionshipsActive
                  ? 'bg-emerald-500 text-zinc-950'
                  : 'bg-zinc-900 text-emerald-400'
              }`}
              title="Campeonatos"
            >
              <Trophy className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden bg-zinc-950 border-b border-emerald-500/10 py-3 px-4 flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = !isChampionshipsActive && activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2.5 transition-all ${
                  isActive
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
          
          <div className="my-2 border-t border-zinc-900" />

          {/* Mobile Admin Lock Toggle */}
          <button
            onClick={() => {
              setIsOpen(false);
              onAdminLoginToggle();
            }}
            className={`w-full py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2.5 transition-all ${
              isAdmin
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
            }`}
          >
            {isAdmin ? (
              <>
                <Unlock className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>Área Administrativa Ativa 🔓</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-zinc-500" />
                <span>Área Administrativa 🔒</span>
              </>
            )}
          </button>
          
          <button
            onClick={() => {
              setIsOpen(false);
              onNavigateToChampionships();
            }}
            className={`w-full py-3 px-4 rounded-xl text-sm font-semibold tracking-wide flex items-center justify-center gap-2.5 transition-all ${
              isChampionshipsActive
                ? 'bg-emerald-500 text-zinc-950'
                : 'bg-zinc-900 text-emerald-400 border border-emerald-500/20'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Campeonatos</span>
          </button>
        </div>
      )}
    </header>
  );
}
