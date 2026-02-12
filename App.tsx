
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Position, Fragment, SoulNPC } from './types';
import { getVidaNovaMessage } from './services/geminiService';
import { Sparkles, ArrowRight, RefreshCw, Quote, Users, Heart, BookOpen, CheckCircle2 } from 'lucide-react';

const WORLD_WIDTH = 3500;
const PLAYER_SIZE = 40;
const VIDA_NOVA_POS: Position = { x: 2000, y: 350 };
const PORTAL_ETERNIDADE_POS: Position = { x: 3300, y: 350 };

const LIGHT_DATA = [
  { name: "Perdão", verse: "Efésios 4:32: 'Sede uns para com os outros benignos, misericordiosos, perdoando-vos uns aos outros...'" },
  { name: "Amor", verse: "1 Coríntios 13:4: 'O amor é sofredor, é benigno; o amor não é invejoso; o amor não trata com leviandade...'" },
  { name: "Arrependimento", verse: "Atos 3:19: 'Arrependei-vos, pois, e convertei-vos, para que sejam apagados os vossos pecados...'" },
  { name: "Fé", verse: "Hebreus 11:1: 'Ora, a fé é o firme fundamento das coisas que se esperam, e a prova das coisas que se não veem.'" },
  { name: "Gratidão", verse: "1 Tessalonicenses 5:18: 'Em tudo dai graças, porque esta é a vontade de Deus em Cristo Jesus para convosco.'" },
  { name: "Esperança", verse: "Romanos 15:13: 'O Deus de esperança vos encha de todo o gozo e paz em crença...'" },
  { name: "Humildade", verse: "Tiago 4:10: 'Humilhai-vos perante o Senhor, e ele vos exaltará.'" },
  { name: "Coragem", verse: "Josué 1:9: 'Não to mandei eu? Esforça-te, e tem bom ânimo; não temas, nem te espantes...'" }
];

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [playerPosition, setPlayerPosition] = useState<Position>({ x: 100, y: 350 });
  const [fragments, setFragments] = useState<Fragment[]>([]);
  const [souls, setSouls] = useState<SoulNPC[]>([]);
  const [collectedCount, setCollectedCount] = useState(0);
  const [savedSoulsCount, setSavedSoulsCount] = useState(0);
  const [activeVerse, setActiveVerse] = useState<string | null>(null);
  const [message, setMessage] = useState("Renuncie a si mesmo...");
  const [loadingMessage, setLoadingMessage] = useState(false);
  
  const gameLoopRef = useRef<number>();
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  const initGame = useCallback(() => {
    const newFragments: Fragment[] = LIGHT_DATA.map((data, i) => ({
      id: `f-${i}`,
      x: 300 + i * 200 + (Math.random() * 40),
      y: 150 + Math.random() * 400,
      name: data.name,
      verse: data.verse,
      collected: false
    }));
    
    const newSouls: SoulNPC[] = Array.from({ length: 5 }, (_, i) => ({
      id: `soul-${i}`,
      x: 2300 + i * 200 + (Math.random() * 50),
      y: 200 + Math.random() * 300,
      saved: false
    }));

    setFragments(newFragments);
    setSouls(newSouls);
    setPlayerPosition({ x: 100, y: 350 });
    setCollectedCount(0);
    setSavedSoulsCount(0);
    setGameState(GameState.PLAYING);
    setMessage("Negue-se a si mesmo e siga a luz.");
  }, []);

  const handleKeyDown = (e: KeyboardEvent) => { keysPressed.current[e.key] = true; };
  const handleKeyUp = (e: KeyboardEvent) => { keysPressed.current[e.key] = false; };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const update = useCallback(() => {
    if (gameState !== GameState.PLAYING && gameState !== GameState.EVANGELIZING) return;

    setPlayerPosition(prev => {
      let newX = prev.x;
      let newY = prev.y;
      const speed = gameState === GameState.EVANGELIZING ? 8 : (3 + (collectedCount * 0.6));

      if (keysPressed.current['ArrowRight'] || keysPressed.current['d']) newX += speed;
      if (keysPressed.current['ArrowLeft'] || keysPressed.current['a']) newX -= speed;
      if (keysPressed.current['ArrowUp'] || keysPressed.current['w']) newY -= speed;
      if (keysPressed.current['ArrowDown'] || keysPressed.current['s']) newY += speed;

      newX = Math.max(0, Math.min(newX, WORLD_WIDTH - PLAYER_SIZE));
      newY = Math.max(50, Math.min(newY, window.innerHeight - 150));

      return { x: newX, y: newY };
    });

    if (gameState === GameState.PLAYING) {
      setFragments(prev => {
        let changed = false;
        const next = prev.map(f => {
          if (!f.collected) {
            const dist = Math.sqrt(Math.pow(playerPosition.x - f.x, 2) + Math.pow(playerPosition.y - f.y, 2));
            if (dist < 40) {
              changed = true;
              setActiveVerse(f.verse);
              setTimeout(() => setActiveVerse(null), 3000);
              return { ...f, collected: true };
            }
          }
          return f;
        });
        if (changed) setCollectedCount(c => c + 1);
        return next;
      });

      const distToVida = Math.sqrt(Math.pow(playerPosition.x - VIDA_NOVA_POS.x, 2) + Math.pow(playerPosition.y - VIDA_NOVA_POS.y, 2));
      if (distToVida < 80 && collectedCount >= 8) {
        triggerConversation();
      }
    }

    if (gameState === GameState.EVANGELIZING) {
      setSouls(prev => {
        let changed = false;
        const next = prev.map(s => {
          if (!s.saved) {
            const dist = Math.sqrt(Math.pow(playerPosition.x - s.x, 2) + Math.pow(playerPosition.y - s.y, 2));
            if (dist < 50) {
              changed = true;
              return { ...s, saved: true };
            }
          }
          return s;
        });
        if (changed) setSavedSoulsCount(c => c + 1);
        return next;
      });

      const distToPortal = Math.sqrt(Math.pow(playerPosition.x - PORTAL_ETERNIDADE_POS.x, 2) + Math.pow(playerPosition.y - PORTAL_ETERNIDADE_POS.y, 2));
      if (distToPortal < 100 && savedSoulsCount >= 5) {
        setGameState(GameState.WON);
      }
    }

    gameLoopRef.current = requestAnimationFrame(update);
  }, [gameState, playerPosition, collectedCount, savedSoulsCount]);

  useEffect(() => {
    if (gameState === GameState.PLAYING || gameState === GameState.EVANGELIZING) {
      gameLoopRef.current = requestAnimationFrame(update);
    }
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, update]);

  const triggerConversation = async () => {
    setGameState(GameState.CONVERSATION);
    setLoadingMessage(true);
    const msg = await getVidaNovaMessage(collectedCount);
    setMessage(msg);
    setLoadingMessage(false);
  };

  const startEvangelizing = () => {
    setGameState(GameState.EVANGELIZING);
    setActiveVerse("Marcos 16:15: 'Ide por todo o mundo, pregai o evangelho a toda criatura.'");
    setTimeout(() => setActiveVerse(null), 5000);
    setMessage("Agora compartilhe a luz que você recebeu.");
  };

  const resetGame = () => {
    window.location.reload();
  };

  const burdenCount = gameState === GameState.EVANGELIZING ? 0 : Math.max(0, 5 - collectedCount);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950 text-slate-200">
      
      {/* Background Ambience */}
      <div className={`absolute inset-0 transition-colors duration-[3000ms] ${gameState === GameState.EVANGELIZING ? 'bg-blue-900/10' : 'bg-slate-950'}`} />

      {/* Start Screen */}
      {gameState === GameState.START && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 p-6 text-center animate-fade-in">
          <div className="mb-8 p-6 rounded-full bg-blue-900/20 border border-blue-500/30 animate-pulse">
            <Quote size={48} className="text-blue-400" />
          </div>
          <h1 className="text-6xl md:text-8xl font-serif mb-6 text-white tracking-tighter drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">Vida Nova</h1>
          
          <div className="max-w-2xl bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 mb-10">
            <p className="text-xl md:text-2xl text-blue-200 italic leading-relaxed mb-4">
              "Se alguém quiser vir após mim, renuncie-se a si mesmo, tome sobre si a sua cruz, e siga-me."
            </p>
            <p className="text-blue-400 font-bold tracking-widest uppercase text-sm">— Mateus 16:24</p>
          </div>

          <button onClick={initGame} className="group flex items-center gap-4 bg-white text-slate-950 px-12 py-5 rounded-full font-black text-xl hover:scale-105 transition-all shadow-2xl">
            Iniciar Jornada <ArrowRight />
          </button>
          
          <div className="absolute bottom-10 text-slate-500 font-bold tracking-[0.4em] text-xs uppercase">
            Criado por Paulo Silva
          </div>
        </div>
      )}

      {/* Game World Rendering */}
      <div 
        className="absolute inset-0 transition-transform duration-500 ease-out"
        style={{ transform: `translateX(${-Math.min(playerPosition.x - window.innerWidth / 2, WORLD_WIDTH - window.innerWidth)}px)` }}
      >
        <div className="absolute bottom-0 w-[3500px] h-48 bg-gradient-to-t from-blue-900/20 to-transparent border-t border-blue-500/10" />
        
        {gameState === GameState.PLAYING && fragments.map(f => !f.collected && (
          <div key={f.id} className="absolute flex flex-col items-center" style={{ left: f.x, top: f.y }}>
            <div className="w-10 h-10 bg-white rounded-full animate-pulse shadow-[0_0_30px_#fff]">
               <div className="w-16 h-16 bg-white/10 rounded-full animate-ping absolute -left-3 -top-3" />
            </div>
            <span className="mt-4 text-[10px] font-black text-blue-300 uppercase tracking-widest">{f.name}</span>
          </div>
        ))}

        {gameState === GameState.EVANGELIZING && souls.map(s => (
          <div key={s.id} className="absolute flex flex-col items-center transition-all duration-1000" style={{ left: s.x, top: s.y, opacity: s.saved ? 1 : 0.4 }}>
            <div className={`w-12 h-16 rounded-full blur-md transition-all duration-1000 ${s.saved ? 'bg-white shadow-[0_0_50px_white]' : 'bg-slate-700'}`} />
            <span className={`mt-4 text-[10px] font-bold uppercase transition-colors ${s.saved ? 'text-white' : 'text-slate-500'}`}>
              {s.saved ? "Alcançada" : "Sede de Luz"}
            </span>
          </div>
        ))}

        <div className={`absolute flex flex-col items-center transition-all duration-1000 ${collectedCount >= 8 ? 'opacity-100' : 'opacity-10 translate-y-20'}`} style={{ left: VIDA_NOVA_POS.x, top: VIDA_NOVA_POS.y }}>
          <div className="w-24 h-40 bg-gradient-to-b from-white via-cyan-300 to-blue-600 rounded-full blur-[2px] shadow-[0_0_80px_rgba(255,255,255,0.6)] animate-pulse" />
          <span className="mt-8 text-white font-serif text-4xl tracking-[0.2em] uppercase">Vida Nova</span>
        </div>

        {gameState === GameState.EVANGELIZING && (
          <div className={`absolute flex flex-col items-center transition-all duration-1000 ${savedSoulsCount >= 5 ? 'opacity-100' : 'opacity-20'}`} style={{ left: PORTAL_ETERNIDADE_POS.x, top: PORTAL_ETERNIDADE_POS.y }}>
             <div className="w-40 h-64 bg-gradient-to-t from-yellow-600 via-white to-yellow-200 rounded-t-full blur-sm shadow-[0_0_100px_gold] animate-pulse" />
             <span className="mt-8 text-yellow-400 font-serif text-3xl tracking-[0.4em] uppercase font-bold">Vida Eterna</span>
          </div>
        )}

        <div className="absolute w-12 h-16 flex items-center justify-center transition-all duration-75" style={{ left: playerPosition.x, top: playerPosition.y }}>
          {burdenCount > 0 && Array.from({ length: burdenCount }).map((_, i) => (
            <div key={`b-${i}`} className="absolute w-5 h-5 bg-slate-900 border border-slate-700 shadow-2xl" style={{ transform: `rotate(${i * (360 / burdenCount)}deg) translateY(-35px) rotate(${Date.now() / 20}deg)` }} />
          ))}
          <div className={`w-full h-full border-2 rounded-xl relative overflow-hidden transition-all duration-1000 ${gameState === GameState.EVANGELIZING ? 'bg-white border-white scale-125' : 'bg-white/10 border-white/40'}`} style={{ boxShadow: `0 0 ${gameState === GameState.EVANGELIZING ? 60 : collectedCount * 15}px rgba(255,255,255,0.8)` }}>
             <div className="absolute inset-0 bg-white opacity-40 animate-pulse" />
          </div>
        </div>
      </div>

      {activeVerse && (
        <div className="absolute inset-x-0 top-1/4 z-40 flex justify-center pointer-events-none animate-in fade-in slide-in-from-bottom-10 duration-1000">
           <div className="max-w-xl bg-slate-950/90 backdrop-blur-2xl p-10 rounded-[3rem] border-2 border-blue-500/50 shadow-[0_0_80px_rgba(59,130,246,0.3)] text-center mx-6">
              <Quote className="text-blue-400 mx-auto mb-6" size={40} />
              <p className="text-3xl text-white italic font-serif leading-tight">{activeVerse}</p>
           </div>
        </div>
      )}

      {/* Victory - Final Portal */}
      {gameState === GameState.WON && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-white text-slate-950 text-center p-8 animate-fade-in overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-yellow-50 to-white -z-10" />
          <Sparkles size={100} className="text-yellow-600 mb-8 animate-pulse" />
          <h1 className="text-7xl md:text-9xl font-serif mb-10 text-yellow-700 tracking-tighter">Vida Eterna</h1>
          
          <div className="max-w-4xl bg-white p-12 rounded-[4rem] border-4 border-yellow-200 shadow-2xl mb-12 transform hover:scale-[1.01] transition-transform">
            <Quote className="text-yellow-500 mb-6 mx-auto" size={48} />
            <p className="text-3xl md:text-5xl text-slate-900 italic leading-snug mb-8 font-serif">
              "E Deus limpará de seus olhos toda a lágrima; e não haverá mais morte, nem pranto, nem clamor, nem dor; porque já as primeiras coisas são passadas."
            </p>
            <p className="text-yellow-600 font-black tracking-[0.5em] uppercase text-xl">— Apocalipse 21:4</p>
          </div>

          <button onClick={() => setGameState(GameState.EPILOGUE)} className="bg-slate-950 text-white px-16 py-8 rounded-full font-black text-3xl hover:scale-110 transition-all shadow-2xl flex items-center gap-4">
            Prosseguir <ArrowRight />
          </button>
        </div>
      )}

      {/* Epilogue - Final Summary Message and Reset Option */}
      {gameState === GameState.EPILOGUE && (
        <div className="absolute inset-0 z-[110] flex flex-col items-center justify-center bg-white text-slate-950 text-center p-8 animate-fade-in">
          <div className="mb-12 p-8 rounded-full bg-cyan-50 border-2 border-cyan-100 shadow-lg">
            <CheckCircle2 size={72} className="text-cyan-600" />
          </div>
          
          <div className="max-w-4xl space-y-12">
            <h2 className="text-5xl md:text-7xl font-serif text-slate-900 leading-tight">Uma Jornada com Propósito</h2>
            
            <div className="p-12 bg-slate-50 rounded-[4rem] border border-slate-100 shadow-inner relative">
               <Quote className="absolute top-6 left-8 text-slate-200" size={60} />
              <p className="text-2xl md:text-4xl text-slate-700 font-light leading-relaxed italic relative z-10">
                "Temos uma jornada na terra, e após completar a jornada com fidelidade em Cristo, teremos vida nova eterna. Nossa missão enquanto aqui é evangelizar, compartilhando a luz que recebemos."
              </p>
            </div>

            <div className="pt-10 flex flex-col items-center gap-10">
              <div className="flex flex-col items-center">
                <span className="text-slate-300 font-black uppercase tracking-[1em] text-xs mb-4">Conclusão</span>
                <h3 className="text-4xl md:text-5xl font-serif text-slate-400">FIM DE JOGO</h3>
              </div>
              
              <button 
                onClick={resetGame} 
                className="group flex items-center gap-6 bg-slate-950 text-white px-16 py-8 rounded-full font-black text-3xl hover:bg-slate-800 hover:scale-105 transition-all shadow-[0_20px_50px_rgba(0,0,0,0.2)]"
              >
                Começar Novo Jogo <RefreshCw className="group-hover:rotate-180 transition-transform duration-700" />
              </button>

              <div className="w-64 h-px bg-slate-200 mt-6" />
              <p className="text-slate-400 font-black uppercase tracking-[0.6em] text-sm">
                CRIADO POR PAULO SILVA
              </p>
            </div>
          </div>
        </div>
      )}

      {/* UI Hud for playing states */}
      {(gameState === GameState.PLAYING || gameState === GameState.EVANGELIZING) && (
        <div className="absolute top-0 left-0 w-full p-8 pointer-events-none flex justify-between items-start">
          <div className="flex flex-col gap-4">
            <div className="bg-slate-950/90 backdrop-blur-xl px-8 py-4 rounded-3xl border border-white/10 shadow-2xl pointer-events-auto flex items-center gap-6">
              <div className="flex flex-col">
                 <span className="text-[10px] text-blue-400 uppercase font-black tracking-widest">Renúncia</span>
                 <span className="text-2xl font-mono font-bold text-white">{collectedCount}/8</span>
              </div>
              <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                 <div className="h-full bg-white transition-all duration-1000" style={{ width: `${(collectedCount / 8) * 100}%` }} />
              </div>
            </div>

            {gameState === GameState.EVANGELIZING && (
              <div className="bg-white/10 backdrop-blur-xl px-8 py-4 rounded-3xl border border-white/30 shadow-2xl pointer-events-auto flex items-center gap-6 animate-in slide-in-from-left duration-1000">
                <div className="flex flex-col">
                   <span className="text-[10px] text-yellow-400 uppercase font-black tracking-widest">Almas Alcançadas</span>
                   <span className="text-2xl font-mono font-bold text-white">{savedSoulsCount}/5</span>
                </div>
                <Users size={24} className="text-yellow-400" />
              </div>
            )}
          </div>
          <div className="text-right">
             <div className="bg-slate-950/50 px-4 py-2 rounded-full border border-white/5 pointer-events-auto">
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">PAULO SILVA • CRIADOR</span>
             </div>
          </div>
        </div>
      )}

      {/* Phase Transition UI */}
      {gameState === GameState.CONVERSATION && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-slate-950/95 backdrop-blur-3xl p-6">
          <div className="max-w-2xl w-full p-12 bg-white/5 rounded-[4rem] border border-white/10 text-center animate-in zoom-in">
            <div className="mb-8 inline-block p-4 rounded-full bg-white/10 text-white animate-bounce">
              <Sparkles size={48} />
            </div>
            <h2 className="text-6xl font-serif text-white mb-8">Nova Criatura</h2>
            <div className="min-h-[120px] flex items-center justify-center mb-10">
              {loadingMessage ? <RefreshCw className="animate-spin text-white" size={48} /> : 
              <p className="text-3xl text-white italic leading-relaxed font-light">"{message}"</p>}
            </div>
            <button onClick={startEvangelizing} className="w-full bg-white text-slate-950 py-7 rounded-[2rem] font-black text-3xl hover:bg-blue-50 transition-all flex items-center justify-center gap-4 shadow-[0_0_50px_rgba(255,255,255,0.3)]">
              Assumir Missão <Heart fill="currentColor" />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in { 0% { opacity: 0; transform: scale(1.05); } 100% { opacity: 1; transform: scale(1); } }
        .animate-fade-in { animation: fade-in 3s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
      `}</style>
    </div>
  );
};

export default App;
