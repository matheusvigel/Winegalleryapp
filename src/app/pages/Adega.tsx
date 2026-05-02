import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  Camera, Search, CheckCircle2, X, Wine, Plus, ChevronRight,
  Loader2, Send, Hourglass, FolderOpen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toggleTried as psToggleTried } from '../../lib/pointsSystem';

// ── Types ──────────────────────────────────────────────────────────────────────

interface WineResult {
  id: string;
  name: string;
  photo: string | null;
  type: string;
  wineries: { id: string; name: string } | null;
}

interface CellarEntry {
  id: string;
  intent: 'drank' | 'cellar' | 'wishlist';
  added_at: string;
  // curated
  wine_id: string | null;
  wine_name: string | null;
  winery_name: string | null;
  wine_type: string | null;
  label_photo: string | null;
  // uncurated
  submission_id: string | null;
  // resolved from join
  wine?: {
    id: string;
    name: string;
    photo: string | null;
    type: string;
    wineries: { name: string } | null;
  } | null;
  submission?: {
    wine_name: string;
    winery_name: string | null;
    wine_type: string | null;
    label_photo: string | null;
    status: string;
  } | null;
}

type Step = 'cellar' | 'scan' | 'search' | 'submit';
type Intent = 'drank' | 'cellar' | 'wishlist';
type Tab = 'cellar' | 'drank' | 'wishlist' | 'collections';

const FALLBACK = 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80';

const TABS: { key: Tab; label: string; emoji: string }[] = [
  { key: 'cellar',      label: 'Adega',      emoji: '🏠' },
  { key: 'drank',       label: 'Bebidos',    emoji: '🍷' },
  { key: 'wishlist',    label: 'Wishlist',   emoji: '❤️' },
  { key: 'collections', label: 'Coleções',   emoji: '📚' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function entryName(e: CellarEntry) {
  return e.wine?.name ?? e.wine_name ?? e.submission?.wine_name ?? '—';
}
function entryWinery(e: CellarEntry) {
  return e.wine?.wineries?.name ?? e.winery_name ?? e.submission?.winery_name ?? null;
}
function entryType(e: CellarEntry) {
  return e.wine?.type ?? e.wine_type ?? e.submission?.wine_type ?? null;
}
function entryPhoto(e: CellarEntry) {
  return e.wine?.photo ?? e.label_photo ?? e.submission?.label_photo ?? null;
}
function entryCurated(e: CellarEntry) {
  return !!e.wine_id;
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function Adega() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [step, setStep]         = useState<Step>('cellar');
  const [tab, setTab]           = useState<Tab>('cellar');
  const [entries, setEntries]   = useState<CellarEntry[]>([]);
  const [loading, setLoading]   = useState(true);

  // Collections tab
  const [collections, setCollections]   = useState<{ id: string; name: string; count: number }[]>([]);
  const [colsLoading, setColsLoading]   = useState(false);

  // Search state
  const [query, setQuery]         = useState('');
  const [results, setResults]     = useState<WineResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [checkedIn, setCheckedIn] = useState<string | null>(null);
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Intent picker
  const [pendingWine, setPendingWine] = useState<WineResult | null>(null);

  // Label photo + scanner
  const [labelPhoto, setLabelPhoto] = useState<string | null>(null);
  const [scanning, setScanning]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Submit form
  const [submitForm, setSubmitForm] = useState({
    wine_name: '', winery_name: '', vintage: '', wine_type: 'Tinto', region_hint: '', notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) loadCellar();
  }, [user]);

  useEffect(() => {
    if (user && tab === 'collections') loadCollections();
  }, [user, tab]);

  const loadCollections = async () => {
    if (!user) return;
    setColsLoading(true);
    const { data } = await supabase
      .from('user_collections')
      .select('id, name, user_collection_items(count)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setCollections((data ?? []).map((c: any) => ({
      id:    c.id,
      name:  c.name,
      count: c.user_collection_items?.[0]?.count ?? 0,
    })));
    setColsLoading(false);
  };

  const loadCellar = async () => {
    if (!user) return;
    setLoading(true);

    const { data } = await supabase
      .from('user_cellar')
      .select(`
        id, intent, added_at,
        wine_id, wine_name, winery_name, wine_type, label_photo, submission_id,
        wine:wines(id, name, photo, type, wineries(name)),
        submission:wine_submissions(wine_name, winery_name, wine_type, label_photo, status)
      `)
      .eq('user_id', user.id)
      .order('added_at', { ascending: false });

    setEntries((data ?? []) as unknown as CellarEntry[]);
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

  const handleCheckIn = (wine: WineResult) => setPendingWine(wine);

  const handleIntentSelect = async (intent: Intent) => {
    if (!user || !pendingWine) return;
    setCheckedIn(pendingWine.id);
    setPendingWine(null);

    await supabase.from('user_cellar').upsert(
      { user_id: user.id, wine_id: pendingWine.id, intent },
      { onConflict: 'user_id,wine_id' },
    );

    if (intent === 'drank') {
      await psToggleTried(user.id, pendingWine.id, 'wine', false);
      toast.success('Vinho registrado!', { description: `${pendingWine.name} adicionado aos bebidos.` });
    } else if (intent === 'cellar') {
      toast.success('Adicionado à sua adega!', { description: pendingWine.name });
    } else {
      toast.success('Adicionado à wishlist!', { description: pendingWine.name });
    }

    setTimeout(() => {
      setStep('cellar');
      setQuery('');
      setResults([]);
      setCheckedIn(null);
      loadCellar();
    }, 800);
  };

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLabelPhoto(URL.createObjectURL(file));
    setStep('search');
    setScanning(true);

    if (!ANTHROPIC_KEY) {
      toast.error('Chave da API não configurada', {
        description: 'Adicione VITE_ANTHROPIC_KEY no arquivo .env',
      });
      setScanning(false);
      return;
    }

    try {
      // Convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const mediaType = (file.type || 'image/jpeg') as
        'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 150,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mediaType, data: base64 },
              },
              {
                type: 'text',
                text: 'This is a wine bottle label. Extract the wine information and respond with ONLY a JSON object (no explanation, no markdown): {"wine_name":"...","winery_name":"...","vintage":"...","wine_type":"..."}\nIf a field is not visible, use null. wine_type should be one of: Tinto, Branco, Rosé, Espumante, Fortificado, Laranja, Sobremesa.',
              },
            ],
          }],
        }),
      });

      const json = await res.json();
      const text = json?.content?.[0]?.text?.trim() ?? '';

      // Parse JSON from response
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        const detected = [parsed.winery_name, parsed.wine_name].filter(Boolean).join(' ');
        if (detected) setQuery(detected);

        // Pre-fill submission form with extracted data
        setSubmitForm(f => ({
          ...f,
          wine_name:   parsed.wine_name   ?? f.wine_name,
          winery_name: parsed.winery_name ?? f.winery_name,
          vintage:     parsed.vintage     ?? f.vintage,
          wine_type:   parsed.wine_type   ?? f.wine_type,
        }));
      }
    } catch {
      // fall through — user types manually
    } finally {
      setScanning(false);
    }
  };

  const handleSubmitNewWine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !submitForm.wine_name.trim()) return;
    setSubmitting(true);

    const { data: sub, error } = await supabase
      .from('wine_submissions')
      .insert({
        submitted_by: user.id,
        wine_name:    submitForm.wine_name,
        winery_name:  submitForm.winery_name || null,
        vintage:      submitForm.vintage ? Number(submitForm.vintage) : null,
        wine_type:    submitForm.wine_type,
        region_hint:  submitForm.region_hint || null,
        notes:        submitForm.notes || null,
        label_photo:  labelPhoto,
      })
      .select('id')
      .single();

    if (error || !sub) {
      toast.error('Erro ao enviar. Tente novamente.');
    } else {
      // Also add to user_cellar as wishlist pending
      await supabase.from('user_cellar').insert({
        user_id:       user.id,
        submission_id: sub.id,
        wine_name:     submitForm.wine_name,
        winery_name:   submitForm.winery_name || null,
        wine_type:     submitForm.wine_type,
        label_photo:   labelPhoto,
        intent:        'wishlist',
      });

      toast.success('Enviado para curadoria!', {
        description: 'Quando aprovado você receberá uma notificação.',
      });
      setStep('cellar');
      setSubmitForm({ wine_name: '', winery_name: '', vintage: '', wine_type: 'Tinto', region_hint: '', notes: '' });
      setLabelPhoto(null);
      loadCellar();
    }
    setSubmitting(false);
  };

  const resetTocellar = () => {
    setStep('cellar');
    setQuery('');
    setResults([]);
    setLabelPhoto(null);
  };

  const tabEntries = entries.filter(e =>
    tab === 'cellar'   ? e.intent === 'cellar'   :
    tab === 'drank'    ? e.intent === 'drank'    :
    tab === 'wishlist' ? e.intent === 'wishlist' :
    false,
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#F5EDE0' }}>
        <div className="text-center">
          <div className="text-5xl mb-4">🍷</div>
          <h2 className="text-xl font-bold mb-2" style={{ fontFamily: '"Fraunces", Georgia, serif', color: '#1C1209' }}>
            Minha Adega
          </h2>
          <p className="mb-6" style={{ color: '#7A6855' }}>Faça login para organizar os seus vinhos.</p>
          <Link
            to="/login"
            className="px-6 py-3 rounded-xl font-semibold text-white"
            style={{ background: '#6B0035' }}
          >
            Entrar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#F5EDE0' }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-40 backdrop-blur-sm"
        style={{ background: 'rgba(245,237,224,0.95)', borderBottom: '1px solid rgba(139,90,43,0.12)' }}
      >
        <div className="max-w-lg mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            {step === 'cellar' ? (
              <>
                <h1
                  className="font-bold text-lg"
                  style={{ fontFamily: '"Fraunces", Georgia, serif', color: '#1C1209' }}
                >
                  Minha Adega
                </h1>
                <button
                  onClick={() => navigate('/add-wine')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: '#6B0035' }}
                >
                  <Plus className="w-4 h-4" /> Adicionar
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={resetTocellar}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                  style={{ background: 'rgba(139,90,43,0.08)' }}
                >
                  <X className="w-5 h-5" style={{ color: '#1C1209' }} />
                </button>
                <h1
                  className="font-bold"
                  style={{ fontFamily: '"Fraunces", Georgia, serif', color: '#1C1209' }}
                >
                  {step === 'scan'   ? 'Adicionar Vinho'
                 : step === 'search' ? 'Buscar Vinho'
                 :                    'Enviar para Curadoria'}
                </h1>
                <div className="w-9" />
              </>
            )}
          </div>

          {/* Tabs (only on main cellar view) */}
          {step === 'cellar' && (
            <div className="flex gap-1 pb-2">
              {TABS.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
                  style={{
                    background: tab === t.key ? '#6B0035' : 'rgba(139,90,43,0.08)',
                    color:      tab === t.key ? '#fff'    : '#7A6855',
                  }}
                >
                  <span>{t.emoji}</span>
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ── MAIN CELLAR VIEW ─────────────────────────────────────────────── */}
        {step === 'cellar' && (
          <motion.div
            key="cellar"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-lg mx-auto px-4 py-5"
          >
            {tab === 'collections' ? (
              /* ── Collections tab ───────────────────────────────────────── */
              colsLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-7 h-7 animate-spin" style={{ color: '#6B0035' }} />
                </div>
              ) : collections.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <div className="text-5xl mb-4">📚</div>
                  <h2 className="text-lg font-bold mb-2"
                      style={{ fontFamily: '"Fraunces", Georgia, serif', color: '#1C1209' }}>
                    Nenhuma coleção ainda
                  </h2>
                  <p className="text-sm mb-6 max-w-xs mx-auto" style={{ color: '#7A6855' }}>
                    Adicione um vinho e crie sua primeira coleção personalizada.
                  </p>
                  <button onClick={() => navigate('/add-wine')}
                          className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white mx-auto"
                          style={{ background: '#6B0035' }}>
                    <Plus className="w-5 h-5" /> Adicionar vinho
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-xs font-medium mb-3" style={{ color: '#B0A090' }}>
                    {collections.length} {collections.length === 1 ? 'coleção' : 'coleções'}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {collections.map(col => (
                      <button key={col.id}
                              className="flex flex-col items-start p-4 rounded-2xl text-left transition-all active:scale-[0.97]"
                              style={{ background: '#fff', border: '1px solid rgba(139,90,43,0.12)', boxShadow: '0 1px 4px rgba(28,18,9,0.05)' }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                             style={{ background: 'rgba(107,0,53,0.08)' }}>
                          <FolderOpen className="w-5 h-5" style={{ color: '#6B0035' }} />
                        </div>
                        <p className="font-bold text-sm leading-tight mb-1" style={{ color: '#1C1209' }}>{col.name}</p>
                        <p className="text-xs" style={{ color: '#B0A090' }}>
                          {col.count} {col.count === 1 ? 'vinho' : 'vinhos'}
                        </p>
                      </button>
                    ))}
                  </div>
                </>
              )
            ) : loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-7 h-7 animate-spin" style={{ color: '#6B0035' }} />
              </div>
            ) : tabEntries.length === 0 ? (
              <EmptyState tab={tab} onAdd={() => navigate('/add-wine')} />
            ) : (
              <>
                <p className="text-xs font-medium mb-3" style={{ color: '#B0A090' }}>
                  {tabEntries.length} {tabEntries.length === 1 ? 'vinho' : 'vinhos'}
                </p>
                <div className="space-y-3">
                  {tabEntries.map((entry, i) => (
                    <EntryCard key={entry.id} entry={entry} index={i} />
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* ── SCAN / START ──────────────────────────────────────────────────── */}
        {step === 'scan' && (
          <motion.div
            key="scan"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-lg mx-auto px-4 py-8"
          >
            <p className="text-center text-sm mb-8 max-w-xs mx-auto" style={{ color: '#7A6855' }}>
              Fotografe o rótulo para identificar o vinho, ou busque pelo nome diretamente.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-semibold text-base transition-colors"
                style={{
                  border: '2px dashed rgba(107,0,53,0.35)',
                  background: 'rgba(107,0,53,0.05)',
                  color: '#6B0035',
                }}
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

              <button
                onClick={() => setStep('search')}
                className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-semibold text-base transition-colors"
                style={{
                  border: '1px solid rgba(139,90,43,0.18)',
                  background: '#fff',
                  color: '#1C1209',
                }}
              >
                <Search className="w-6 h-6" />
                Buscar pelo nome
              </button>

              <button
                onClick={() => setStep('submit')}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-sm transition-colors"
                style={{ color: '#B0A090' }}
              >
                <Plus className="w-4 h-4" />
                Vinho não está na base? Enviar para curadoria
              </button>
            </div>
          </motion.div>
        )}

        {/* ── SEARCH ────────────────────────────────────────────────────────── */}
        {step === 'search' && (
          <motion.div
            key="search"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-lg mx-auto px-4 py-5"
          >
            {labelPhoto && (
              <div className="relative mb-4 rounded-2xl overflow-hidden h-44">
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

            {scanning && (
              <div
                className="flex items-center gap-2 mb-4 px-4 py-3 rounded-xl text-sm"
                style={{ background: 'rgba(107,0,53,0.06)', border: '1px solid rgba(107,0,53,0.15)', color: '#6B0035' }}
              >
                <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                Identificando rótulo…
              </div>
            )}

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#B0A090' }} />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={scanning ? 'Aguarde a identificação…' : 'Nome do vinho…'}
                className="w-full pl-10 pr-10 py-3.5 rounded-xl text-sm focus:outline-none"
                style={{
                  background: '#fff',
                  border: '1px solid rgba(139,90,43,0.18)',
                  color: '#1C1209',
                }}
              />
              {searching && !scanning && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin" style={{ color: '#6B0035' }} />
              )}
              {query && !searching && !scanning && (
                <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4" style={{ color: '#B0A090' }} />
                </button>
              )}
            </div>

            <div className="space-y-2">
              {results.map(wine => (
                <motion.button
                  key={wine.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => handleCheckIn(wine)}
                  disabled={checkedIn === wine.id}
                  className="w-full flex items-center gap-3 rounded-xl p-3 text-left transition-all disabled:opacity-60"
                  style={{
                    background: '#fff',
                    border: '1px solid rgba(139,90,43,0.12)',
                    boxShadow: '0 1px 3px rgba(28,18,9,0.05)',
                  }}
                >
                  <div
                    className="flex-shrink-0 rounded-lg overflow-hidden flex items-center justify-center"
                    style={{ width: 48, height: 56, background: 'linear-gradient(135deg, #F8EBF1 0%, #FBF7F2 100%)' }}
                  >
                    {wine.photo ? (
                      <img src={wine.photo} alt={wine.name} className="w-full h-full object-contain p-1" onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }} />
                    ) : (
                      <Wine className="w-5 h-5" style={{ color: '#9B1B4D' }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: '#1C1209' }}>{wine.name}</p>
                    {wine.wineries && <p className="text-xs truncate" style={{ color: '#7A6855' }}>{wine.wineries.name}</p>}
                    <span
                      className="inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(107,0,53,0.08)', color: '#6B0035' }}
                    >
                      {wine.type}
                    </span>
                  </div>
                  {checkedIn === wine.id ? (
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-green-500" />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(107,0,53,0.08)' }}
                    >
                      <Plus className="w-4 h-4" style={{ color: '#6B0035' }} />
                    </div>
                  )}
                </motion.button>
              ))}

              {query.length >= 2 && !searching && results.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm mb-4" style={{ color: '#7A6855' }}>Nenhum vinho encontrado com esse nome.</p>
                  <button
                    onClick={() => { setStep('submit'); setSubmitForm(f => ({ ...f, wine_name: query })); }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white mx-auto"
                    style={{ background: '#6B0035' }}
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
            className="max-w-lg mx-auto px-4 py-5"
          >
            <div
              className="rounded-2xl p-4 mb-5"
              style={{ background: '#FBF3DC', border: '1px solid rgba(184,130,11,0.25)' }}
            >
              <p className="text-sm font-semibold" style={{ color: '#7A4F07' }}>✨ Seja o pioneiro!</p>
              <p className="text-xs mt-1" style={{ color: '#7A4F07', opacity: 0.8 }}>
                Se você for o primeiro a trazer este vinho, ganhe uma medalha especial quando ele for aprovado.
              </p>
            </div>

            <form onSubmit={handleSubmitNewWine} className="space-y-4">
              {labelPhoto ? (
                <div className="relative h-32 rounded-xl overflow-hidden">
                  <img src={labelPhoto} alt="Rótulo" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setLabelPhoto(null)} className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center">
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-sm transition-colors"
                  style={{
                    border: '2px dashed rgba(139,90,43,0.20)',
                    color: '#B0A090',
                  }}
                >
                  <Camera className="w-4 h-4" /> Adicionar foto do rótulo (opcional)
                </button>
              )}

              <FormField label="Nome do vinho *">
                <input
                  required
                  value={submitForm.wine_name}
                  onChange={e => setSubmitForm(f => ({ ...f, wine_name: e.target.value }))}
                  placeholder="Ex: Château Pétrus"
                  className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                  style={{ border: '1px solid rgba(139,90,43,0.18)', background: '#fff', color: '#1C1209' }}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Vinícola">
                  <input
                    value={submitForm.winery_name}
                    onChange={e => setSubmitForm(f => ({ ...f, winery_name: e.target.value }))}
                    placeholder="Château Pétrus"
                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                    style={{ border: '1px solid rgba(139,90,43,0.18)', background: '#fff', color: '#1C1209' }}
                  />
                </FormField>
                <FormField label="Safra (ano)">
                  <input
                    type="number" min={1900} max={new Date().getFullYear()}
                    value={submitForm.vintage}
                    onChange={e => setSubmitForm(f => ({ ...f, vintage: e.target.value }))}
                    placeholder="2020"
                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                    style={{ border: '1px solid rgba(139,90,43,0.18)', background: '#fff', color: '#1C1209' }}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Tipo">
                  <select
                    value={submitForm.wine_type}
                    onChange={e => setSubmitForm(f => ({ ...f, wine_type: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                    style={{ border: '1px solid rgba(139,90,43,0.18)', background: '#fff', color: '#1C1209' }}
                  >
                    {['Tinto','Branco','Rosé','Espumante','Fortificado','Laranja','Sobremesa'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Região / País">
                  <input
                    value={submitForm.region_hint}
                    onChange={e => setSubmitForm(f => ({ ...f, region_hint: e.target.value }))}
                    placeholder="Bordeaux, França"
                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                    style={{ border: '1px solid rgba(139,90,43,0.18)', background: '#fff', color: '#1C1209' }}
                  />
                </FormField>
              </div>

              <FormField label="Observações (opcional)">
                <textarea
                  value={submitForm.notes}
                  onChange={e => setSubmitForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  placeholder="Como foi a experiência? Onde você encontrou?"
                  className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none resize-none"
                  style={{ border: '1px solid rgba(139,90,43,0.18)', background: '#fff', color: '#1C1209' }}
                />
              </FormField>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white transition-opacity disabled:opacity-60"
                style={{ background: '#6B0035' }}
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {submitting ? 'Enviando…' : 'Enviar para curadoria'}
              </button>
            </form>
          </motion.div>
        )}

      </AnimatePresence>

      {/* ── Intent picker overlay ────────────────────────────────────────── */}
      <AnimatePresence>
        {pendingWine && (
          <motion.div
            key="intent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end"
            style={{ background: 'rgba(28,18,9,0.55)' }}
            onClick={() => setPendingWine(null)}
          >
            <motion.div
              initial={{ y: 340 }}
              animate={{ y: 0 }}
              exit={{ y: 340 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="w-full max-w-lg mx-auto rounded-t-3xl p-6 pb-10"
              style={{ background: '#FBF7F2' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'rgba(139,90,43,0.20)' }} />
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#B0A090' }}>Como registrar</p>
              <p className="text-base font-bold mb-5 leading-tight" style={{ fontFamily: '"Fraunces", Georgia, serif', color: '#1C1209' }}>
                {pendingWine.name}
              </p>

              <div className="space-y-3">
                <IntentButton
                  emoji="🍷"
                  title="Já bebi"
                  subtitle="Marcar como experimentado e ganhar pontos"
                  bg="rgba(45,74,62,0.07)"
                  border="rgba(45,74,62,0.25)"
                  titleColor="#1C3A2E"
                  subtitleColor="#2D4A3E"
                  onClick={() => handleIntentSelect('drank')}
                />
                <IntentButton
                  emoji="🏠"
                  title="Minha adega"
                  subtitle="Tenho em casa ou estou guardando"
                  bg="rgba(107,0,53,0.06)"
                  border="rgba(107,0,53,0.25)"
                  titleColor="#3A0020"
                  subtitleColor="#6B0035"
                  onClick={() => handleIntentSelect('cellar')}
                />
                <IntentButton
                  emoji="❤️"
                  title="Quero provar"
                  subtitle="Adicionar à minha lista de desejos"
                  bg="rgba(184,130,11,0.07)"
                  border="rgba(184,130,11,0.28)"
                  titleColor="#4A3200"
                  subtitleColor="#7A4F07"
                  onClick={() => handleIntentSelect('wishlist')}
                />
              </div>

              <button
                onClick={() => setPendingWine(null)}
                className="w-full mt-4 py-3 text-sm transition-colors"
                style={{ color: '#B0A090' }}
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

// ── Sub-components ─────────────────────────────────────────────────────────────

function EntryCard({ entry, index }: { entry: CellarEntry; index: number }) {
  const name    = entryName(entry);
  const winery  = entryWinery(entry);
  const type    = entryType(entry);
  const photo   = entryPhoto(entry);
  const curated = entryCurated(entry);
  const isPending = !curated && entry.submission?.status === 'pending';

  const card = (
    <div
      className="flex items-center gap-3 rounded-2xl p-3 transition-shadow"
      style={{
        background: '#fff',
        border: '1px solid rgba(139,90,43,0.12)',
        boxShadow: '0 1px 4px rgba(28,18,9,0.05)',
      }}
    >
      <div
        className="flex-shrink-0 rounded-xl overflow-hidden flex items-center justify-center"
        style={{ width: 52, height: 60, background: 'linear-gradient(135deg, #F8EBF1 0%, #FBF7F2 100%)' }}
      >
        {photo ? (
          <img
            src={photo}
            alt={name}
            className="w-full h-full object-contain p-1"
            onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }}
          />
        ) : (
          <Wine className="w-6 h-6" style={{ color: '#9B1B4D' }} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate" style={{ color: '#1C1209' }}>{name}</p>
        {winery && <p className="text-xs truncate" style={{ color: '#7A6855' }}>{winery}</p>}
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {type && (
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(107,0,53,0.08)', color: '#6B0035' }}
            >
              {type}
            </span>
          )}
          {!curated && (
            <span
              className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: '#FBF3DC', color: '#7A4F07', border: '1px solid rgba(184,130,11,0.20)' }}
            >
              {isPending ? <><Hourglass className="w-2.5 h-2.5" /> Em curadoria</> : 'Sem curadoria'}
            </span>
          )}
        </div>
      </div>

      {curated ? (
        <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: '#B0A090' }} />
      ) : (
        <div className="w-4 flex-shrink-0" />
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.03 * index }}
    >
      {curated && entry.wine_id ? (
        <Link to={`/wine/${entry.wine_id}`} className="block hover:shadow-md transition-shadow rounded-2xl">
          {card}
        </Link>
      ) : (
        card
      )}
    </motion.div>
  );
}

function EmptyState({ tab, onAdd }: { tab: Tab; onAdd: () => void }) {
  const msgs: Record<Tab, { emoji: string; title: string; body: string; cta: string }> = {
    cellar:   { emoji: '🏠', title: 'Adega vazia',         body: 'Adicione vinhos que você tem em casa ou está guardando.', cta: 'Adicionar vinho' },
    drank:    { emoji: '🍷', title: 'Nenhum vinho bebido', body: 'Comece registrando os vinhos que você já provou.',         cta: 'Registrar vinho' },
    wishlist: { emoji: '❤️', title: 'Wishlist vazia',      body: 'Salve vinhos que você quer provar em breve.',              cta: 'Buscar vinhos' },
  };
  const m = msgs[tab];
  return (
    <div className="text-center py-16 px-4">
      <div className="text-5xl mb-4">{m.emoji}</div>
      <h2 className="text-lg font-bold mb-2" style={{ fontFamily: '"Fraunces", Georgia, serif', color: '#1C1209' }}>{m.title}</h2>
      <p className="text-sm mb-6 max-w-xs mx-auto" style={{ color: '#7A6855' }}>{m.body}</p>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white mx-auto"
        style={{ background: '#6B0035' }}
      >
        <Plus className="w-5 h-5" /> {m.cta}
      </button>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#7A6855' }}>{label}</label>
      {children}
    </div>
  );
}

function IntentButton({
  emoji, title, subtitle, bg, border, titleColor, subtitleColor, onClick,
}: {
  emoji: string; title: string; subtitle: string;
  bg: string; border: string; titleColor: string; subtitleColor: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all"
      style={{ background: bg, border: `1.5px solid ${border}` }}
    >
      <span className="text-3xl">{emoji}</span>
      <div>
        <p className="font-bold text-sm" style={{ color: titleColor }}>{title}</p>
        <p className="text-xs mt-0.5" style={{ color: subtitleColor }}>{subtitle}</p>
      </div>
    </button>
  );
}
