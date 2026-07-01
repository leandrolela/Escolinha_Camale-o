import React from 'react';
import { Phone, MapPin, Clock, Calendar, Shield, Users, Award, ChevronRight, MessageSquare } from 'lucide-react';

interface LandingPageProps {
  onNavigateToChampionships: () => void;
}

export default function LandingPage({ onNavigateToChampionships }: LandingPageProps) {
  return (
    <div className="bg-zinc-950 text-white min-h-screen">
      {/* SECTION: Hero (Início) */}
      <section id="inicio" className="relative min-h-[85vh] flex items-center justify-center overflow-hidden py-20 px-4">
        {/* Abstract background graphics representing a football pitch overlay */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-orange-400/10 rounded-full blur-[120px]" />

        <div className="relative max-w-5xl mx-auto text-center z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono tracking-widest uppercase mb-6 animate-pulse">
            <Award className="w-4 h-4" />
            <span>Escolinha & Arena Society</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-none text-zinc-100 uppercase">
            Transforme seu <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-500 to-orange-400">
              Talento em Jogo
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto font-medium leading-relaxed">
            Formando atletas com disciplina e paixão. Estrutura profissional de quadra de futebol society de última geração em Carapicuíba.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="https://wa.me/5511984425919?text=Olá!%20Gostaria%20de%20mais%20informações%20sobre%20a%20Escolinha%20Camaleão."
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-orange-500 text-white font-bold text-base tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 hover:scale-[1.03] transition-all duration-200"
            >
              <MessageSquare className="w-5 h-5 fill-current" />
              <span>MATRICULE-SE JÁ</span>
            </a>
            
            <button
              onClick={onNavigateToChampionships}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 font-bold text-base tracking-wide flex items-center justify-center gap-2 hover:bg-zinc-800 shadow-md transition-all duration-200 cursor-pointer"
            >
              <span>VER TORNEIOS</span>
              <ChevronRight className="w-5 h-5 text-emerald-400" />
            </button>
          </div>
        </div>

        {/* Diagonal bottom divisor */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-zinc-900 to-transparent" />
      </section>

      {/* SECTION: Sobre Nós & Escolinha */}
      <section id="sobre" className="py-24 bg-zinc-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-7">
              <span className="text-emerald-500 font-mono text-sm tracking-widest uppercase font-bold">DESENVOLVIMENTO & DISCIPLINA</span>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mt-2 mb-6">
                Sobre Nós e Escolinha Camaleão
              </h2>
              <p className="text-zinc-300 text-base sm:text-lg leading-relaxed mb-6">
                A Escolinha Camaleão foca no desenvolvimento técnico, tático e social de jovens atletas. Nossa metodologia inovadora prepara os alunos para se adaptarem a qualquer desafio dentro e fora das quatro linhas, evoluindo sempre com muito respeito, companheirismo e paixão pelo futebol.
              </p>
              
              {/* Feature items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20 text-emerald-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Treinamento Especializado</h4>
                    <p className="text-zinc-400 text-sm mt-1">Metodologia voltada para evolução individual e coletiva por faixa etária.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20 text-emerald-400">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Valores Sociais</h4>
                    <p className="text-zinc-400 text-sm mt-1">Foco na cidadania, disciplina, trabalho em equipe e integridade esportiva.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats Sidebar card */}
            <div className="lg:col-span-5 bg-zinc-950 p-8 rounded-2xl border border-zinc-800 relative overflow-hidden shadow-xl shadow-black/40">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl" />
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <div className="w-2 h-6 bg-emerald-500 rounded-full" />
                Matrículas Abertas
              </h3>
              
              <ul className="space-y-4">
                <li className="flex justify-between py-2.5 border-b border-zinc-800/60">
                  <span className="text-zinc-400 text-sm">Categoria Sub-7 ao Sub-15</span>
                  <span className="text-emerald-400 text-sm font-semibold">Vagas limitadas</span>
                </li>
                <li className="flex justify-between py-2.5 border-b border-zinc-800/60">
                  <span className="text-zinc-400 text-sm">Períodos de Treino</span>
                  <span className="text-zinc-200 text-sm">Manhã e Tarde</span>
                </li>
                <li className="flex justify-between py-2.5 border-b border-zinc-800/60">
                  <span className="text-zinc-400 text-sm">Frequência Semanal</span>
                  <span className="text-zinc-200 text-sm">2x ou 3x na semana</span>
                </li>
              </ul>

              <a
                href="https://wa.me/5511984425919?text=Olá!%20Gostaria%20de%20saber%20valores%20e%20dias%20disponíveis%20da%20escolinha."
                target="_blank"
                rel="noreferrer"
                className="mt-6 w-full py-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 hover:text-zinc-950 text-emerald-400 font-bold tracking-wide transition-all duration-300 text-center block border border-emerald-500/30"
              >
                AGENDE UMA AULA EXPERIMENTAL
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: Nossa Quadra */}
      <section id="quadra" className="py-24 bg-zinc-950 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-emerald-500 font-mono text-sm tracking-widest uppercase font-bold">ALUGUEL DE QUADRA SOCIETY</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mt-2 text-white">
              Nossa Estrutura Esportiva
            </h2>
            <p className="text-zinc-400 mt-4 text-base sm:text-lg">
              Dispomos de uma moderna quadra de futebol society para locação de alta qualidade. Ideal para peladas de amigos, confrontos, torneios particulares e confraternizações.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pitch Specs Item 1 */}
            <div className="bg-zinc-900/60 backdrop-blur-md p-8 rounded-2xl border border-zinc-800/60 shadow-lg flex flex-col justify-between hover:border-emerald-500/30 transition-all group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mt-6 mb-3">Grama Sintética Premium</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Gramado artificial importado de alta densidade com sistema de amortecimento de impactos para proteger suas articulações e dar mais tração nas jogadas.
                </p>
              </div>
              <div className="mt-6 text-xs font-mono text-emerald-500">Padrão Profissional</div>
            </div>

            {/* Pitch Specs Item 2 */}
            <div className="bg-zinc-900/60 backdrop-blur-md p-8 rounded-2xl border border-zinc-800/60 shadow-lg flex flex-col justify-between hover:border-emerald-500/30 transition-all group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mt-6 mb-3">Iluminação LED de Arena</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Iluminação LED profissional sem sombras e sem pontos cegos, garantindo visibilidade ideal para suas partidas diurnas ou noturnas com o mesmo rendimento.
                </p>
              </div>
              <div className="mt-6 text-xs font-mono text-emerald-500">100% Eficiência</div>
            </div>

            {/* Pitch Specs Item 3 */}
            <div className="bg-zinc-900/60 backdrop-blur-md p-8 rounded-2xl border border-zinc-800/60 shadow-lg flex flex-col justify-between hover:border-emerald-500/30 transition-all group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mt-6 mb-3">Vestiários & Estrutura</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Vestiários completos com chuveiro elétrico, área de confraternização com churrasqueira integrada e bar com bebidas geladas para o seu pós-jogo.
                </p>
              </div>
              <div className="mt-6 text-xs font-mono text-emerald-500">Conforto Completo</div>
            </div>
          </div>

          <div className="mt-12 text-center bg-gradient-to-r from-emerald-950/40 via-emerald-900/10 to-zinc-950 p-6 rounded-2xl border border-emerald-500/10">
            <p className="text-zinc-300 text-sm sm:text-base">
              Gostaria de agendar um horário fixo ou avulso para o seu grupo de futebol? 
              <a 
                href="https://wa.me/5511984425919?text=Olá!%20Gostaria%20de%20consultar%20valores%20e%20horários%20disponíveis%20para%20locar%20a%20quadra." 
                target="_blank" 
                rel="noreferrer" 
                className="text-emerald-400 font-bold hover:underline ml-2 inline-flex items-center gap-1"
              >
                Consultar Horários Disponíveis <Phone className="w-3.5 h-3.5" />
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* SECTION: Localização */}
      <section id="localizacao" className="py-24 bg-zinc-900 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
            
            {/* Info panel */}
            <div className="lg:col-span-5 flex flex-col justify-between">
              <div>
                <span className="text-emerald-500 font-mono text-sm tracking-widest uppercase font-bold">COMO CHEGAR</span>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mt-2 mb-8">
                  Nossa Localização
                </h2>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-zinc-950 flex items-center justify-center shrink-0 border border-zinc-800 text-emerald-400">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white uppercase text-sm font-mono tracking-wider">Endereço</h4>
                      <p className="text-zinc-400 mt-1 text-sm sm:text-base">
                        Rua Santa Dolores, 351 - Vila Silvânia<br />
                        Carapicuíba - SP, 06382-280
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-zinc-950 flex items-center justify-center shrink-0 border border-zinc-800 text-emerald-400">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white uppercase text-sm font-mono tracking-wider">Contato / WhatsApp</h4>
                      <p className="text-zinc-400 mt-1 text-sm sm:text-base">
                        (11) 98442-5919
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-zinc-950 flex items-center justify-center shrink-0 border border-zinc-800 text-emerald-400">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white uppercase text-sm font-mono tracking-wider">Horários de Atendimento</h4>
                      <p className="text-zinc-400 mt-1 text-sm">
                        <strong className="text-zinc-300">Segunda a Sexta:</strong> 18h às 22h<br />
                        <strong className="text-zinc-300">Sábado e Domingo:</strong> 08h às 18h
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 lg:mt-0 pt-6">
                <a
                  href="https://maps.google.com/?q=Rua+Santa+Dolores+351+Carapicuiba"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full sm:w-auto px-6 py-3 rounded-xl bg-zinc-950 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-zinc-950 font-semibold tracking-wide justify-center items-center gap-2 transition-all duration-300"
                >
                  <MapPin className="w-4 h-4" />
                  <span>COMO CHEGAR NO MAPS</span>
                </a>
              </div>
            </div>

            {/* Map Frame */}
            <div className="lg:col-span-7 h-[350px] lg:h-auto min-h-[350px] rounded-2xl overflow-hidden border border-zinc-800 shadow-xl relative">
              <iframe
                title="Localização Arena Camaleão"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.4877771786523!2d-46.8504043!3d-23.5510143!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94cf01548e6ef58b%3A0x633afad741f2ff2b!2sR.%20Santa%20Dolores%2C%20351%20-%20Vila%20Silvania%2C%20Carapicu%C3%ADba%20-%20SP%2C%2006382-280!5e0!3m2!1spt-BR!2sbr!4v1716680000000!5m2!1spt-BR!2sbr"
                className="w-full h-full border-0 absolute inset-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-zinc-950 border-t border-zinc-900 py-12 text-center text-sm text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-emerald-500 flex items-center justify-center font-black text-zinc-950 text-xs">C</div>
            <span className="font-bold text-zinc-300">Escolinha Camaleão</span>
          </div>
          <p>© 2026 Escolinha Camaleão. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
