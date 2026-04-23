import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { Camera, Search, CheckCircle2, X, Wine, Plus, ChevronRight, Loader2, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toggleTried as psToggleTried } from '../../lib/pointsSystem';

// ── Types ─────────────────────────────────────────────────────────────────────

interface WineResult {
  id: string;
  name: string;
  photo: string | null;
  type: string;
  wineries: { id: string; name: string } | null;
}

interface TriedWine {
  item_id: string;
  name: string;
  photo: string | null;
  type: string;
  winery_name: string | null;
}

type Step   = 'diary' | 'scan' | 'search' | 'submit';
type Intent = 'drank' | 'cellar' | 'wishlist';

const API4AI_KEY = 'a4a-jvt4CzeTq66M5YzcKePQ40Za7xTUawbD';
const API4AI_URL = 'https://demo.api4ai.cloud/wine-rec/v1/results';

const FALLBACK = 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80';

// ── Component ────────────────────────────────────────────────────────────────

export default function WineDiary() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep]           = useState<Step>('diary');
  const [triedWines, setTriedWines] = useState<TriedWine[]>([]);
  const [loading, setLoading]     = useState(true);

  // Check-in / search state
  const [query, setQuery]           = useState('');
  const [results, setResults]       = useState<WineResult[]>([]);
  const [searching, setSearching]   = useState(false);
  const [checkedIn, setCheckedIn]   = useState<string | null>(null);
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Intent picker
  const [pendingWine, setPendingWine] = useState<WineResult | null>(null);

  // Label photo + scanner
  const [labelPhoto, setLabelPhoto] = useState<string | null>(null);
  const [scanning, setScanning]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Submit new wine form
  const [submitForm, setSubmitForm] = useState({
    wine_name: '', winery_name: '', vintage: '', wine_type: 'Tinto', region_hint: '', notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadDiary();
  }, [user]);

  const loadDiary = async () => {
    if (!user) return;
    setLoading(true);

    // Get all item_ids the user marked as tried
    const { data: progress } = await supabase
      .from('user_progress')
      .select('item_id')
      .eq('user_id', user.id)
      .eq('completed', true)
      .eq('item_type', 'wine');

    const ids = (progress ?? []).map((p: any) => p.item_id as string);
    if (ids.length === 0) { setTriedWines([]); setLoading(false); return; }

    const { data: wines } = await supabase
      .from('wines')
      .select('id, name, photo, type, wineries(id, name)')
      .in('id', ids)
      .order('name');

    setTriedWines((wines ?? []).map((w: any) => ({
      item_id:     w.id,
      name:        w.name,
      photo:       w.photo,
      type:        w.type,
      winery_name: w.wineries?.name ?? null,
    })));
    setLoading(false);
  };

  // Debounced wine search
  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current);
    if (query.trim().length < 2) { setResults([]); return; }

    setSearching(true);
    searchRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from('wines')
        .select('id, name, photo, type, wineries(id, name)')
        .ilike('name', `%${query.trim()}%`)
        .limit(8);
      setResults((data ?? []) as WineResult[]);
      setSearching(false);
    }, 300);
  }, [query]);

  useEffect(() => () => { if (searchRef.current) clearTimeout(searchRef.current); }, []);

  // Opens intent picker instead of immediately checking in
  const handleCheckIn = (wine: WineResult) => {
    setPendingWine(wine);
  };

  const handleIntentSelect = async (intent: Intent) => {
    if (!user || !pendingWine) return;
    setCheckedIn(pendingWine.id);
    setPendingWine(null);

    // Persist intent to user_cellar
    await supabase.from('user_cellar').upsert(
      { user_id: user.id, wine_id: pendingWine.id, intent },
      { onConflict: 'user_id,wine_id' },
    );

    if (intent === 'drank') {
      await psToggleTried(user.id, pendingWine.id, 'wine', false);
      toast.success('Vinho registrado! 🍷', { description: `${pendingWine.name} adicionado ao diário.` });
    } else if (intent === 'cellar') {
      toast.success('Adicionado à sua adega! 🏠', { description: pendingWine.name });
    } else {
      toast.success('Adicionado à wishlist! ❤️', { description: pendingWine.name });
    }

    setTimeout(() => {
      setStep('diary');
      setQuery('');
      setResults([]);
      setCheckedIn(null);
      loadDiary();
    }, 800);
  };

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setLabelPhoto(url);
    setStep('search');
    setScanning(true);

    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(API4AI_URL, {
        method: 'POST',
        headers: { 'api-key': API4AI_KEY },
        body: formData,
      });
      const data = await res.json();
      // Parse wine name from API4AI response
      const entity  = data?.results?.[0]?.entities?.[0];
      const classes = entity?.classes ?? {};
      const detected = classes.wine_name ?? classes.name ?? classes.label ?? '';
      if (detected) setQuery(detected);
    } catch {
      // Silently fall back — user can type the name manually
    } finally {
      setScanning(false);
    }
  };

  const handleSubmitNewWine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !submitForm.wine_name.trim()) return;
    setSubmitting(true);

    const { error } = await supabase.from('wine_submissions').insert({
      submitted_by: user.id,
      wine_name:    submitForm.wine_name,
      winery_name:  submitForm.winery_name || null,
      vintage:      submitForm.vintage ? Number(submitForm.vintage) : null,
      wine_type:    submitForm.wine_type,
      region_hint:  submitForm.region_hint || null,
      notes:        submitForm.notes || null,
      label_photo:  labelPhoto,
    });

    if (error) {
      toast.error('Erro ao enviar. Tente novamente.');
    } else {
      toast.success('Enviado para curadoria! 🎉', {
        description: 'Quando aprovado você receberá uma notificação.',
      });
      setStep('diary');
      setSubmitForm({ wine_name: '', winery_name: '', vintage: '', wine_type: 'Tinto', region_hint: '', notes: '' });
      setLabelPhoto(null);
    }
    setSubmitting(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50 flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-5xl mb-4">🍷</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Meu Diário de Vinhos</h2>
          <p className="text-gray-500 mb-6">Faça login para registrar os vinhos que você provou.</p>
          <Link to="/login" className="px-6 py-3 bg-purple-700 text-white rounded-xl font-semibold hover:bg-purple-600 transition-colors">
            Entrar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          {step === 'diary' ? (
            <>
              <button onClick={() => navigate(-1)} className="w-9 h-9 hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors">
                <X className="w-5 h-5 text-gray-700" />
              </button>
              <h1 className="font-bold text-gray-900">Meu Diário de Vinhos</h1>
              <button
                onClick={() => setStep('scan')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-700 text-white rounded-xl text-sm font-semibold hover:bg-purple-600 transition-colors"
              >
                <Plus className="w-4 h-4" /> Registrar
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { setStep('diary'); setQuery(''); setResults([]); setLabelPhoto(null); }} className="w-9 h-9 hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors">
                <X className="w-5 h-5 text-gray-700" />
              </button>
              <h1 className="font-bold text-gray-900">
                {step === 'scan' ? 'Registrar Vinho' : step === 'search' ? 'Buscar Vinho' : 'Enviar para Curadoria'}
              </h1>
              <div className="w-9" />
            </>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ── DIARY ───────────────────────────────────────────────────────── */}
        {step === 'diary' && (
          <motion.div
            key="diary"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-lg mx-auto px-4 py-6"
          >
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
              </div>
            ) : triedWines.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🍷</div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Diário vazio</h2>
                <p className="text-gray-500 mb-6 max-w-xs mx-auto">
                  Comece registrando os vinhos que você provou. Escaneie o rótulo ou busque pelo nome.
                </p>
                <button
                  onClick={() => setStep('scan')}
                  className="flex items-center gap-2 px-6 py-3 bg-purple-700 text-white rounded-xl font-semibold hover:bg-purple-600 transition-colors mx-auto"
                >
                  <Plus className="w-5 h-5" /> Registrar meu primeiro vinho
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-4">{triedWines.length} vinho{triedWines.length !== 1 ? 's' : ''} provado{triedWines.length !== 1 ? 's' : ''}</p>
                <div className="space-y-3">
                  {triedWines.map((w, i) => (
                    <motion.div
                      key={w.item_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.03 * i }}
                    >
                      <Link to={`/wine/${w.item_id}`} className="flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                        <div className="w-14 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50 flex-shrink-0">
                          {w.photo ? (
                            <img src={w.photo} alt={w.name} className="w-full h-full object-contain p-1" onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Wine className="w-6 h-6 text-purple-300" /></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{w.name}</p>
                          {w.winery_name && <p className="text-xs text-gray-500 truncate">{w.winery_name}</p>}
                          <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">{w.type}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <CheckCircle2 className="w-5 h-5 text-green-500 fill-green-100" />
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* ── SCAN / START ─────────────────────────────────────────────────── */}
        {step === 'scan' && (
          <motion.div
            key="scan"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-lg mx-auto px-4 py-8"
          >
            <p className="text-center text-gray-500 mb-8 max-w-xs mx-auto">
              Fotografe o rótulo para identificar o vinho, ou busque pelo nome diretamente.
            </p>

            <div className="space-y-4">
              {/* Camera capture */}
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl border-2 border-dashed border-purple-300 bg-purple-50 text-purple-700 font-semibold text-base hover:bg-purple-100 transition-colors"
              >
                <Camera className="w-6 h-6" />
                Fotografar rótulo
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoCapture}
              />

              {/* Text search */}
              <button
                onClick={() => setStep('search')}
                className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl border-2 border-gray-200 bg-white text-gray-700 font-semibold text-base hover:bg-gray-50 transition-colors"
              >
                <Search className="w-6 h-6" />
                Buscar pelo nome
              </button>

              {/* Submit new */}
              <button
                onClick={() => setStep('submit')}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-sm text-gray-500 hover:text-purple-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Vinho não está na base? Enviar para curadoria
              </button>
            </div>
          </motion.div>
        )}

        {/* ── SEARCH ───────────────────────────────────────────────────────── */}
        {step === 'search' && (
          <motion.div
            key="search"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-lg mx-auto px-4 py-6"
          >
            {/* Label photo preview */}
            {labelPhoto && (
              <div className="relative mb-4 rounded-2xl overflow-hidden h-48 bg-gray-100">
                <img src={labelPhoto} alt="Rótulo" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <p className="absolute bottom-3 left-3 text-white text-sm font-semibold">Busque o vinho abaixo</p>
                <button
                  onClick={() => setLabelPhoto(null)}
                  className="absolute top-3 right-3 w-7 h-7 bg-black/40 rounded-full flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            )}

            {/* Scanning banner */}
            {scanning && (
              <div className="flex items-center gap-2 mb-4 px-4 py-3 bg-purple-50 border border-purple-200 rounded-xl text-sm text-purple-700">
                <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                Identificando rótulo…
              </div>
            )}

            {/* Search input */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={scanning ? 'Aguarde a identificação…' : 'Nome do vinho…'}
                className="w-full pl-10 pr-10 py-3.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
              />
              {searching && !scanning && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500 animate-spin" />}
              {query && !searching && !scanning && (
                <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* Results */}
            <div className="space-y-2">
              {results.map(wine => (
                <motion.button
                  key={wine.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => handleCheckIn(wine)}
                  disabled={checkedIn === wine.id}
                  className="w-full flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:border-purple-300 hover:shadow-md transition-all text-left disabled:opacity-60"
                >
                  <div className="w-12 h-14 rounded-lg overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50 flex-shrink-0">
                    {wine.photo ? (
                      <img src={wine.photo} alt={wine.name} className="w-full h-full object-contain p-1" onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Wine className="w-5 h-5 text-purple-300" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{wine.name}</p>
                    {wine.wineries && <p className="text-xs text-gray-500 truncate">{wine.wineries.name}</p>}
                    <span className="inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">{wine.type}</span>
                  </div>
                  {checkedIn === wine.id ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Plus className="w-4 h-4 text-purple-700" />
                    </div>
                  )}
                </motion.button>
              ))}

              {query.length >= 2 && !searching && results.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm mb-4">Nenhum vinho encontrado com esse nome.</p>
                  <button
                    onClick={() => { setStep('submit'); setSubmitForm(f => ({ ...f, wine_name: query })); }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-purple-700 text-white rounded-xl text-sm font-semibold hover:bg-purple-600 transition-colors mx-auto"
                  >
                    <Send className="w-4 h-4" /> Enviar para curadoria
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── SUBMIT FOR CURATION ──────────────────────────────────────────── */}
        {step === 'submit' && (
          <motion.div
            key="submit"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-lg mx-auto px-4 py-6"
          >
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
              <p className="text-sm text-amber-800 font-medium">✨ Seja o pioneiro!</p>
              <p className="text-xs text-amber-700 mt-1">
                Se você for o primeiro a trazer este vinho, ganhe uma medalha especial quando ele for aprovado pela curadoria.
              </p>
            </div>

            <form onSubmit={handleSubmitNewWine} className="space-y-4">
              {/* Label photo preview */}
              {labelPhoto ? (
                <div className="relative h-32 rounded-xl overflow-hidden">
                  <img src={labelPhoto} alt="Rótulo" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setLabelPhoto(null)} className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center">
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()} className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-purple-300 hover:text-purple-600 transition-colors">
                  <Camera className="w-4 h-4" /> Adicionar foto do rótulo (opcional)
                </button>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do vinho *</label>
                <input
                  required
                  value={submitForm.wine_name}
                  onChange={e => setSubmitForm(f => ({ ...f, wine_name: e.target.value }))}
                  placeholder="Ex: Château Pétrus"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vinícola</label>
                  <input
                    value={submitForm.winery_name}
                    onChange={e => setSubmitForm(f => ({ ...f, winery_name: e.target.value }))}
                    placeholder="Château Pétrus"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Safra (ano)</label>
                  <input
                    type="number" min={1900} max={new Date().getFullYear()}
                    value={submitForm.vintage}
                    onChange={e => setSubmitForm(f => ({ ...f, vintage: e.target.value }))}
                    placeholder="2020"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={submitForm.wine_type}
                    onChange={e => setSubmitForm(f => ({ ...f, wine_type: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    {['Tinto','Branco','Rosé','Espumante','Fortificado','Laranja','Sobremesa'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Região / País</label>
                  <input
                    value={submitForm.region_hint}
                    onChange={e => setSubmitForm(f => ({ ...f, region_hint: e.target.value }))}
                    placeholder="Bordeaux, França"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações (opcional)</label>
                <textarea
                  value={submitForm.notes}
                  onChange={e => setSubmitForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  placeholder="Como foi a experiência? Onde você encontrou?"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-purple-700 text-white rounded-xl font-semibold hover:bg-purple-600 transition-colors disabled:opacity-60"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {submitting ? 'Enviando…' : 'Enviar para curadoria'}
              </button>
            </form>
          </motion.div>
        )}

      </AnimatePresence>

      {/* ── Intent picker overlay ───────────────────────────────────────── */}
      <AnimatePresence>
        {pendingWine && (
          <motion.div
            key="intent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end"
            onClick={() => setPendingWine(null)}
          >
            <motion.div
              initial={{ y: 320 }}
              animate={{ y: 0 }}
              exit={{ y: 320 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="w-full max-w-lg mx-auto bg-white rounded-t-3xl p-6 pb-10"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Como registrar</p>
              <p className="text-base font-bold text-gray-900 mb-5 leading-tight">{pendingWine.name}</p>

              <div className="space-y-3">
                <button
                  onClick={() => handleIntentSelect('drank')}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-green-200 bg-green-50 hover:border-green-400 transition-colors text-left"
                >
                  <span className="text-3xl">🍷</span>
                  <div>
                    <p className="font-bold text-green-900">Já bebi</p>
                    <p className="text-xs text-green-700 mt-0.5">Marcar como experimentado e ganhar pontos</p>
                  </div>
                </button>
                <button
                  onClick={() => handleIntentSelect('cellar')}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-purple-200 bg-purple-50 hover:border-purple-400 transition-colors text-left"
                >
                  <span className="text-3xl">🏠</span>
                  <div>
                    <p className="font-bold text-purple-900">Minha adega</p>
                    <p className="text-xs text-purple-700 mt-0.5">Tenho em casa ou estou guardando</p>
                  </div>
                </button>
                <button
                  onClick={() => handleIntentSelect('wishlist')}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-pink-200 bg-pink-50 hover:border-pink-400 transition-colors text-left"
                >
                  <span className="text-3xl">❤️</span>
                  <div>
                    <p className="font-bold text-pink-900">Quero provar</p>
                    <p className="text-xs text-pink-700 mt-0.5">Adicionar à minha lista de desejos</p>
                  </div>
                </button>
              </div>

              <button
                onClick={() => setPendingWine(null)}
                className="w-full mt-4 py-3 text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                Cancelar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
