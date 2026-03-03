import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Wine, ChevronRight, Check } from 'lucide-react';

type WinePreference = 'tinto' | 'branco' | 'rose' | 'espumante' | 'sobremesa';
type ExperienceLevel = 'iniciante' | 'intermediario' | 'especialista';

interface OnboardingData {
  completed: boolean;
  preferences: WinePreference[];
  level: ExperienceLevel;
}

const WINE_OPTIONS: { id: WinePreference; label: string; emoji: string; description: string }[] = [
  { id: 'tinto', label: 'Vinho Tinto', emoji: '🍷', description: 'Cabernet, Merlot, Pinot Noir' },
  { id: 'branco', label: 'Vinho Branco', emoji: '🥂', description: 'Chardonnay, Sauvignon Blanc' },
  { id: 'rose', label: 'Rosé', emoji: '🌸', description: 'Leve, frutado e refrescante' },
  { id: 'espumante', label: 'Espumante', emoji: '✨', description: 'Champagne, Prosecco, Cava' },
  { id: 'sobremesa', label: 'Vinho de Sobremesa', emoji: '🍯', description: 'Porto, Sauternes, Moscato' },
];

const LEVEL_OPTIONS: { id: ExperienceLevel; label: string; emoji: string; description: string }[] = [
  {
    id: 'iniciante',
    label: 'Iniciante',
    emoji: '🌱',
    description: 'Estou começando a explorar o universo dos vinhos',
  },
  {
    id: 'intermediario',
    label: 'Intermediário',
    emoji: '🍇',
    description: 'Já conheço algumas regiões e uvas, quero me aprofundar',
  },
  {
    id: 'especialista',
    label: 'Especialista',
    emoji: '🏆',
    description: 'Sou um apreciador experiente e busco raridades',
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [preferences, setPreferences] = useState<WinePreference[]>([]);
  const [level, setLevel] = useState<ExperienceLevel | null>(null);

  const totalSteps = 3;

  const togglePreference = (pref: WinePreference) => {
    setPreferences((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  };

  const handleFinish = () => {
    const data: OnboardingData = {
      completed: true,
      preferences,
      level: level || 'iniciante',
    };
    localStorage.setItem('wine-gallery-onboarding', JSON.stringify(data));
    navigate('/');
  };

  const canAdvance = () => {
    if (step === 1) return preferences.length > 0;
    if (step === 2) return level !== null;
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-900 to-red-950 flex flex-col">
      {/* Progress bar */}
      {step > 0 && (
        <div className="px-6 pt-6">
          <div className="max-w-sm mx-auto">
            <div className="flex gap-2">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    i < step ? 'bg-white' : 'bg-white/25'
                  }`}
                />
              ))}
            </div>
            <p className="text-white/50 text-xs mt-2">
              Passo {step} de {totalSteps}
            </p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.35 }}
                className="text-center"
              >
                <div className="w-28 h-28 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-8">
                  <Wine size={56} className="text-white" />
                </div>
                <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
                  Bem-vindo ao<br />Wine Gallery
                </h1>
                <p className="text-red-200 text-base leading-relaxed mb-10">
                  Descubra e explore as melhores regiões, uvas e rótulos do mundo do vinho.
                  Registre suas experiências e construa sua jornada vinícola.
                </p>
                <button
                  onClick={() => setStep(1)}
                  className="w-full h-12 bg-white text-red-900 font-bold rounded-xl text-base flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
                >
                  Começar <ChevronRight size={20} />
                </button>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.35 }}
              >
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Quais estilos você prefere?
                  </h2>
                  <p className="text-red-200 text-sm">
                    Selecione todos que te interessam
                  </p>
                </div>

                <div className="space-y-3 mb-8">
                  {WINE_OPTIONS.map((option) => {
                    const selected = preferences.includes(option.id);
                    return (
                      <button
                        key={option.id}
                        onClick={() => togglePreference(option.id)}
                        className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl border-2 transition-all ${
                          selected
                            ? 'bg-white border-white text-neutral-900'
                            : 'bg-white/5 border-white/20 text-white'
                        }`}
                      >
                        <span className="text-2xl">{option.emoji}</span>
                        <div className="flex-1 text-left">
                          <div className={`font-semibold text-sm ${selected ? 'text-neutral-900' : 'text-white'}`}>
                            {option.label}
                          </div>
                          <div className={`text-xs mt-0.5 ${selected ? 'text-neutral-500' : 'text-red-200'}`}>
                            {option.description}
                          </div>
                        </div>
                        {selected && (
                          <div className="w-6 h-6 bg-red-900 rounded-full flex items-center justify-center flex-shrink-0">
                            <Check size={14} className="text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setStep(2)}
                  disabled={!canAdvance()}
                  className="w-full h-12 bg-white text-red-900 font-bold rounded-xl text-base flex items-center justify-center gap-2 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continuar <ChevronRight size={20} />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.35 }}
              >
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Qual é o seu nível?
                  </h2>
                  <p className="text-red-200 text-sm">
                    Vamos personalizar sua experiência
                  </p>
                </div>

                <div className="space-y-3 mb-8">
                  {LEVEL_OPTIONS.map((option) => {
                    const selected = level === option.id;
                    return (
                      <button
                        key={option.id}
                        onClick={() => setLevel(option.id)}
                        className={`w-full flex items-center gap-4 px-4 py-5 rounded-xl border-2 transition-all ${
                          selected
                            ? 'bg-white border-white text-neutral-900'
                            : 'bg-white/5 border-white/20 text-white'
                        }`}
                      >
                        <span className="text-3xl">{option.emoji}</span>
                        <div className="flex-1 text-left">
                          <div className={`font-bold text-base ${selected ? 'text-neutral-900' : 'text-white'}`}>
                            {option.label}
                          </div>
                          <div className={`text-xs mt-1 leading-relaxed ${selected ? 'text-neutral-500' : 'text-red-200'}`}>
                            {option.description}
                          </div>
                        </div>
                        {selected && (
                          <div className="w-6 h-6 bg-red-900 rounded-full flex items-center justify-center flex-shrink-0">
                            <Check size={14} className="text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={handleFinish}
                  disabled={!canAdvance()}
                  className="w-full h-12 bg-white text-red-900 font-bold rounded-xl text-base flex items-center justify-center gap-2 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Começar a explorar <ChevronRight size={20} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-8">
        <p className="text-red-300 text-xs">Beba com moderação</p>
      </div>
    </div>
  );
}
