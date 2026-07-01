import React, { useState } from 'react';
import { Lock, ShieldAlert, X, Eye, EyeOff } from 'lucide-react';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AdminAuthModal({ isOpen, onClose, onSuccess }: AdminAuthModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Admin password check
    if (password === 'Roque@2026') {
      onSuccess();
      setPassword('');
    } else {
      setError('Senha incorreta! Tente novamente.');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-white relative">
        {/* Banner Indicator */}
        <div className="bg-gradient-to-r from-emerald-600 to-orange-500 h-1.5 w-full" />

        {/* Header */}
        <div className="px-5 py-5 flex justify-between items-start">
          <div className="flex gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight text-white">Acesso Restrito</h3>
              <p className="text-zinc-400 text-xs mt-0.5">Autenticação do Administrador</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <p className="text-sm text-zinc-400 leading-relaxed">
            Para realizar ações administrativas (criar novos campeonatos, excluir torneios ou registrar placares), digite a senha abaixo.
          </p>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl font-semibold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold tracking-wider text-zinc-400 uppercase">
              Senha de Administrador
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Insira a senha de acesso..."
                autoFocus
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Default password helper text removed for security/privacy */}
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-zinc-950 hover:bg-zinc-800/50 border border-zinc-800 text-xs text-zinc-400 hover:text-white font-bold rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-orange-500 text-white font-black text-xs uppercase tracking-wider rounded-xl hover:scale-[1.02] transition-transform shadow-md cursor-pointer"
            >
              Liberar Painel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
