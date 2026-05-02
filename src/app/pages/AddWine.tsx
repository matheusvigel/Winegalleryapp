import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Camera, Search, PenLine, X, Wine, Plus, Loader2, Send,
  ChevronRight, CheckCircle2, FolderPlus, Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { extractWineLabel } from '../../lib/visionExtract';
import { toggleTried as psToggleTried } from '../../lib/pointsSystem';

// ── Types ──────────────────────────────────────────────────────────────────────

type Step = 'method' | 'scanning' | 'search' | 'manual' | 'intent' | 'collection' | 'done';
type Intent = 'drank' | 'cellar' | 'wishlist';

interface PendingWine {
  source: 'curated' | 'submission';
  wine_id?: string;
  wine_name: string;
  winery_name?: string;
  vintage?: string;
  wine_type?: string;
  region_hint?: string;
  notes?: string;
  label_photo?: string | null;
}

interface SearchResult {
  id: string;
  name: string;
  photo: string | null;
  type: string;
  wineries: { id: string; name: string } | null;
}

interface UserCollection {
  id: string;
  name: string;
  item_count?: number;
}

// ── Design tokens ─────────────────────────────────────────────────────────────

const BG     = '#F5EDE0';
const WINE   = '#6B0035';
const BORDER = 'rgba(139,90,43,0.15)';
const MUTED  = '#7A6855';
const TEXT   = '#1C1209';
const CARD   = '#FFFFFF';

const WINE_TYPES = ['Tinto','Branco','Rosé','Espumante','Fortificado','Laranja','Sobremesa'];

// ── Component ─────────────────────────────────────────────────────────────────

export default function AddWine() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep]               = useState<Step>('method');
  const [pending, setPending]         = useState<PendingWine | null>(null);
  const [chosenIntent, setIntent]     = useState<Intent | null>(null);
  const [cellarEntryId, setCellarId]  = useState<string | null>(null);

  // photo / scan
  const fileRef    = useRef<HTMLInputElement>(null);
  const [labelUrl, setLabelUrl]   = useState<string | null>(null);
  const [scanning, setScanning]   = useState(false);

  // search
  const [query, setQuery]         = useState('');
  const [results, setResults]     = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // manual form
  const [form, setForm] = useState({
    wine_name: '', winery_name: '', vintage: '',
    wine_type: 'Tinto', region_hint: '', notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // collections
  const [collections, setCollections]   = useState<UserCollection[]>([]);
  const [selectedCols, setSelectedCols] = useState<Set<string>>(new Set());
  const [newColName, setNewColName]     = useState('');
  const [creatingCol, setCreatingCol]   = useState(false);
  const [savingCols, setSavingCols]     = useState(false);

  // ── Debounced wine search ─────────────────────────────────────────────────

  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current);
    if (query.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    searchRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from('wines')
        .select('id, name, photo, type, wineries(id, name)')
        .or(`name.ilike.%${query.trim()}%`)
        .limit(10);
      setResults((data ?? []) as SearchResult[]);
      setSearching(false);
    }, 280);
  }, [query]);

  useEffect(() => () => { if (searchRef.current) clearTimeout(searchRef.current); }, []);

  // ── Photo capture ─────────────────────────────────────────────────────────

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLabelUrl(URL.createObjectURL(file));
    setStep('scanning');
    setScanning(true);
    try {
      const data = await extractWineLabel(file);
      const q = [data.winery_name, data.wine_name].filter(Boolean).join(' ');
      setQuery(q ?? '');
      setForm(f => ({
        ...f,
        wine_name:   data.wine_name   ?? f.wine_name,
        winery_name: data.winery_name ?? f.winery_name,
        vintage:     data.vintage     ?? f.vintage,
        wine_type:   data.wine_type   ?? f.wine_type,
      }));
    } catch {
      // Fall through — user types manually
    } finally {
      setScanning(false);
      setStep('search');
    }
  };

  // ── Select curated wine ───────────────────────────────────────────────────

  const selectCurated = (wine: SearchResult) => {
    setPending({
      source:      'curated',
      wine_id:     wine.id,
      wine_name:   wine.name,
      winery_name: wine.wineries?.name,
      wine_type:   wine.type,
    });
    setStep('intent');
  };

  // ── Submit manual form ────────────────────────────────────────────────────

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.wine_name.trim()) return;
    setSubmitting(true);
    const { data: sub, error } = await supabase
      .from('wine_submissions')
      .insert({
        submitted_by: user.id,
        wine_name:    form.wine_name,
        winery_name:  form.winery_name || null,
        vintage:      form.vintage ? Number(form.vintage) : null,
        wine_type:    form.wine_type,
        region_hint:  form.region_hint || null,
        notes:        form.notes || null,
        label_photo:  labelUrl,
      })
      .select('id')
      .single();
    if (error || !sub) {
      toast.error('Erro ao salvar. Tente novamente.');
      setSubmitting(false);
      return;
    }
    setPending({
      source:        'submission',
      wine_name:     form.wine_name,
      winery_name:   form.winery_name || undefined,
      vintage:       form.vintage || undefined,
      wine_type:     form.wine_type,
      region_hint:   form.region_hint || undefined,
      notes:         form.notes || undefined,
      label_photo:   labelUrl,
    });
    setSubmitting(false);
    setStep('intent');
  };

  // ── Save intent → user_cellar ─────────────────────────────────────────────

  const handleIntent = async (intent: Intent) => {
    if (!user || !pending) return;
    setIntent(intent);

    const cellarRow: Record<string, unknown> = { user_id: user.id, intent };

    if (pending.source === 'curated' && pending.wine_id) {
      cellarRow.wine_id = pending.wine_id;
    } else {
      // Find the submission we just created (last one for this user with this wine_name)
      const { data: sub } = await supabase
        .from('wine_submissions')
        .select('id')
        .eq('submitted_by', user.id)
        .eq('wine_name', pending.wine_name)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (sub) cellarRow.submission_id = sub.id;
    }

    // Denormalize key fields so they display without a join
    cellarRow.wine_name   = pending.wine_name;
    cellarRow.winery_name = pending.winery_name ?? null;
    cellarRow.wine_type   = pending.wine_type   ?? null;
    cellarRow.label_photo = pending.label_photo ?? null;

    const { data: entry, error } = pending.source === 'curated'
      ? await supabase
          .from('user_cellar')
          .upsert(cellarRow as any, { onConflict: 'user_id,wine_id' })
          .select('id')
          .single()
      : await supabase
          .from('user_cellar')
          .insert(cellarRow)
          .select('id')
          .single();

    if (error) { toast.error('Erro ao salvar.'); return; }
    setCellarId(entry.id);

    if (intent === 'drank' && pending.wine_id) {
      await psToggleTried(user.id, pending.wine_id, 'wine', false);
    }

    // Load user collections for the next step
    const { data: cols } = await supabase
      .from('user_collections')
      .select('id, name, user_collection_items(count)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setCollections((cols ?? []).map((c: any) => ({
      id:         c.id,
      name:       c.name,
      item_count: c.user_collection_items?.[0]?.count ?? 0,
    })));

    setStep('collection');
  };

  // ── Toggle collection membership ─────────────────────────────────────────

  const toggleCollection = (id: string) => {
    setSelectedCols(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Create new collection ─────────────────────────────────────────────────

  const createCollection = async () => {
    if (!user || !newColName.trim()) return;
    setCreatingCol(true);
    const { data, error } = await supabase
      .from('user_collections')
      .insert({ user_id: user.id, name: newColName.trim() })
      .select('id, name')
      .single();
    if (!error && data) {
      setCollections(prev => [{ id: data.id, name: data.name, item_count: 0 }, ...prev]);
      setSelectedCols(prev => new Set(prev).add(data.id));
      setNewColName('');
    }
    setCreatingCol(false);
  };

  // ── Finish — save collection memberships ─────────────────────────────────

  const handleFinish = async () => {
    if (!cellarEntryId || selectedCols.size === 0) {
      finishNavigate();
      return;
    }
    setSavingCols(true);
    const rows = [...selectedCols].map(cid => ({
      collection_id:   cid,
      cellar_entry_id: cellarEntryId,
    }));
    await supabase.from('user_collection_items').upsert(rows, { onConflict: 'collection_id,cellar_entry_id' });
    setSavingCols(false);
    finishNavigate();
  };

  const finishNavigate = () => {
    toast.success('Vinho adicionado!', { description: pending?.wine_name });
    navigate('/adega', { replace: true });
  };

  // ── Back / close ──────────────────────────────────────────────────────────

  const handleBack = () => {
    if (step === 'method')     { navigate(-1); return; }
    if (step === 'scanning')   { setStep('method'); return; }
    if (step === 'search')     { setStep('method'); setQuery(''); setResults([]); return; }
    if (step === 'manual')     { setStep('search'); return; }
    if (step === 'intent')     { setStep(query ? 'search' : 'manual'); return; }
    if (step === 'collection') { setStep('intent'); return; }
    navigate(-1);
  };

  const stepTitle: Record<Step, string> = {
    method:     'Adicionar Vinho',
    scanning:   'Identificando rótulo…',
    search:     'Buscar Vinho',
    manual:     'Preencher manualmente',
    intent:     'Como registrar?',
    collection: 'Adicionar à coleção',
    done:       '',
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ background: BG }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 backdrop-blur-sm"
           style={{ background: 'rgba(245,237,224,0.95)', borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={handleBack}
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(139,90,43,0.08)' }}>
            <X className="w-5 h-5" style={{ color: TEXT }} />
          </button>
          <h1 className="font-bold flex-1 text-base" style={{ fontFamily: '"Fraunces", Georgia, serif', color: TEXT }}>
            {stepTitle[step]}
          </h1>
          {/* Step dots */}
          <div className="flex gap-1.5">
            {(['method','search','intent','collection'] as Step[]).map((s, i) => {
              const steps: Step[] = ['method','scanning','search','manual','intent','collection'];
              const current = steps.indexOf(step);
              const dot     = steps.indexOf(s);
              return (
                <div key={s} className="rounded-full transition-all duration-300"
                     style={{
                       width:  current >= dot ? 16 : 6,
                       height: 6,
                       background: current >= dot ? WINE : 'rgba(139,90,43,0.20)',
                     }} />
              );
            })}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ── METHOD ────────────────────────────────────────────────────── */}
        {step === 'method' && (
          <Slide key="method">
            <p className="text-sm mb-8 text-center" style={{ color: MUTED }}>
              Como você quer adicionar o vinho?
            </p>
            <div className="space-y-3">
              <MethodCard
                icon={<Camera className="w-7 h-7" style={{ color: WINE }} />}
                title="Fotografar rótulo"
                subtitle="Tire uma foto e extraímos os dados automaticamente"
                bg="rgba(107,0,53,0.05)"
                border="rgba(107,0,53,0.20)"
                onClick={() => fileRef.current?.click()}
              />
              <MethodCard
                icon={<Search className="w-7 h-7" style={{ color: '#2D4A3E' }} />}
                title="Buscar pelo nome"
                subtitle="Procure na nossa base de vinhos curados"
                bg="rgba(45,74,62,0.05)"
                border="rgba(45,74,62,0.20)"
                onClick={() => setStep('search')}
              />
              <MethodCard
                icon={<PenLine className="w-7 h-7" style={{ color: '#B8820B' }} />}
                title="Preencher manualmente"
                subtitle="Digite os dados do vinho você mesmo"
                bg="rgba(184,130,11,0.05)"
                border="rgba(184,130,11,0.20)"
                onClick={() => setStep('manual')}
              />
            </div>
            <input ref={fileRef} type="file" accept="image/*" capture="environment"
                   className="hidden" onChange={handleFileChange} />
          </Slide>
        )}

        {/* ── SCANNING ─────────────────────────────────────────────────── */}
        {step === 'scanning' && (
          <Slide key="scanning">
            <div className="flex flex-col items-center justify-center py-20 gap-6">
              {labelUrl && (
                <div className="w-40 h-52 rounded-2xl overflow-hidden shadow-lg">
                  <img src={labelUrl} alt="Rótulo" className="w-full h-full object-cover" />
                </div>
              )}
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: WINE }} />
              <p className="text-sm" style={{ color: MUTED }}>Lendo o rótulo com IA…</p>
            </div>
          </Slide>
        )}

        {/* ── SEARCH ───────────────────────────────────────────────────── */}
        {step === 'search' && (
          <Slide key="search">
            {labelUrl && (
              <div className="relative mb-4 rounded-2xl overflow-hidden h-40">
                <img src={labelUrl} alt="Rótulo" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <button onClick={() => setLabelUrl(null)}
                        className="absolute top-3 right-3 w-7 h-7 bg-black/40 rounded-full flex items-center justify-center">
                  <X className="w-4 h-4 text-white" />
                </button>
                <p className="absolute bottom-3 left-3 text-white text-sm font-semibold">
                  {scanning ? 'Identificando…' : 'Busque o vinho abaixo'}
                </p>
              </div>
            )}

            {/* Search input */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#B0A090' }} />
              <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
                     placeholder="Nome do vinho ou vinícola…"
                     className="w-full pl-10 pr-10 py-3.5 rounded-xl text-sm focus:outline-none"
                     style={{ background: CARD, border: `1px solid ${BORDER}`, color: TEXT }} />
              {searching
                ? <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin" style={{ color: WINE }} />
                : query && <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="w-4 h-4" style={{ color: '#B0A090' }} />
                  </button>
              }
            </div>

            {/* Results */}
            <div className="space-y-2">
              {results.map(wine => (
                <motion.button key={wine.id}
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  onClick={() => selectCurated(wine)}
                  className="w-full flex items-center gap-3 rounded-xl p-3 text-left transition-all"
                  style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: '0 1px 3px rgba(28,18,9,0.05)' }}
                >
                  <div className="flex-shrink-0 rounded-lg overflow-hidden flex items-center justify-center"
                       style={{ width: 48, height: 56, background: 'linear-gradient(135deg, #F8EBF1 0%, #FBF7F2 100%)' }}>
                    {wine.photo
                      ? <img src={wine.photo} alt={wine.name} className="w-full h-full object-contain p-1" />
                      : <Wine className="w-5 h-5" style={{ color: '#9B1B4D' }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: TEXT }}>{wine.name}</p>
                    {wine.wineries && <p className="text-xs truncate" style={{ color: MUTED }}>{wine.wineries.name}</p>}
                    <span className="inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(107,0,53,0.08)', color: WINE }}>{wine.type}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: '#B0A090' }} />
                </motion.button>
              ))}

              {query.length >= 2 && !searching && results.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm mb-4" style={{ color: MUTED }}>Nenhum vinho encontrado.</p>
                  <button
                    onClick={() => { setForm(f => ({ ...f, wine_name: query })); setStep('manual'); }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white mx-auto"
                    style={{ background: WINE }}>
                    <PenLine className="w-4 h-4" /> Preencher manualmente
                  </button>
                </div>
              )}

              {query.length < 2 && (
                <button onClick={() => setStep('manual')}
                        className="w-full py-4 text-sm text-center rounded-xl transition-colors"
                        style={{ color: '#B0A090' }}>
                  Prefere preencher os dados manualmente?
                </button>
              )}
            </div>
          </Slide>
        )}

        {/* ── MANUAL FORM ──────────────────────────────────────────────── */}
        {step === 'manual' && (
          <Slide key="manual">
            <div className="rounded-2xl p-4 mb-5"
                 style={{ background: '#FBF3DC', border: '1px solid rgba(184,130,11,0.25)' }}>
              <p className="text-sm font-semibold" style={{ color: '#7A4F07' }}>✨ Seja o pioneiro!</p>
              <p className="text-xs mt-0.5" style={{ color: '#7A4F07', opacity: 0.85 }}>
                Se você for o primeiro a trazer este vinho, ganhe uma medalha quando ele for aprovado.
              </p>
            </div>

            {labelUrl && (
              <div className="relative h-28 rounded-xl overflow-hidden mb-4">
                <img src={labelUrl} alt="Rótulo" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setLabelUrl(null)}
                        className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center">
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            )}

            {!labelUrl && (
              <button type="button" onClick={() => fileRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-sm mb-4 transition-colors"
                      style={{ border: `2px dashed rgba(139,90,43,0.20)`, color: '#B0A090' }}>
                <Camera className="w-4 h-4" /> Adicionar foto do rótulo (opcional)
              </button>
            )}

            <form onSubmit={handleManualSubmit} className="space-y-3">
              <Field label="Nome do vinho *">
                <input required value={form.wine_name} onChange={e => setForm(f => ({ ...f, wine_name: e.target.value }))}
                       placeholder="Ex: Pinot Noir" className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                       style={{ border: `1px solid ${BORDER}`, background: CARD, color: TEXT }} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Vinícola">
                  <input value={form.winery_name} onChange={e => setForm(f => ({ ...f, winery_name: e.target.value }))}
                         placeholder="Ex: Don Giovanni" className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                         style={{ border: `1px solid ${BORDER}`, background: CARD, color: TEXT }} />
                </Field>
                <Field label="Safra">
                  <input type="number" min={1900} max={new Date().getFullYear()}
                         value={form.vintage} onChange={e => setForm(f => ({ ...f, vintage: e.target.value }))}
                         placeholder="2021" className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                         style={{ border: `1px solid ${BORDER}`, background: CARD, color: TEXT }} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tipo">
                  <select value={form.wine_type} onChange={e => setForm(f => ({ ...f, wine_type: e.target.value }))}
                          className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                          style={{ border: `1px solid ${BORDER}`, background: CARD, color: TEXT }}>
                    {WINE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Região / País">
                  <input value={form.region_hint} onChange={e => setForm(f => ({ ...f, region_hint: e.target.value }))}
                         placeholder="Bordeaux, França" className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                         style={{ border: `1px solid ${BORDER}`, background: CARD, color: TEXT }} />
                </Field>
              </div>
              <Field label="Observações">
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                          rows={2} placeholder="Como você conheceu este vinho?"
                          className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none resize-none"
                          style={{ border: `1px solid ${BORDER}`, background: CARD, color: TEXT }} />
              </Field>
              <button type="submit" disabled={submitting}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white disabled:opacity-60"
                      style={{ background: WINE }}>
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {submitting ? 'Salvando…' : 'Continuar'}
              </button>
            </form>
            <input ref={fileRef} type="file" accept="image/*" capture="environment"
                   className="hidden" onChange={handleFileChange} />
          </Slide>
        )}

        {/* ── INTENT ───────────────────────────────────────────────────── */}
        {step === 'intent' && pending && (
          <Slide key="intent">
            <div className="rounded-2xl p-4 mb-6 flex items-center gap-3"
                 style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              {pending.label_photo
                ? <img src={pending.label_photo} alt="" className="w-12 h-14 rounded-lg object-cover flex-shrink-0" />
                : <div className="w-12 h-14 rounded-lg flex items-center justify-center flex-shrink-0"
                       style={{ background: 'linear-gradient(135deg, #F8EBF1, #FBF7F2)' }}>
                    <Wine className="w-5 h-5" style={{ color: '#9B1B4D' }} />
                  </div>
              }
              <div className="min-w-0">
                <p className="font-bold text-sm truncate" style={{ color: TEXT }}>{pending.wine_name}</p>
                {pending.winery_name && <p className="text-xs truncate" style={{ color: MUTED }}>{pending.winery_name}</p>}
                {pending.source === 'submission' && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: '#FBF3DC', color: '#7A4F07' }}>Em curadoria</span>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <IntentBtn emoji="🍷" title="Já bebi" subtitle="Marcar como experimentado e ganhar pontos"
                         bg="rgba(45,74,62,0.07)" border="rgba(45,74,62,0.25)" tc="#1C3A2E" sc="#2D4A3E"
                         onClick={() => handleIntent('drank')} />
              <IntentBtn emoji="🏠" title="Minha adega" subtitle="Tenho em casa ou estou guardando"
                         bg="rgba(107,0,53,0.06)" border="rgba(107,0,53,0.25)" tc="#3A0020" sc={WINE}
                         onClick={() => handleIntent('cellar')} />
              <IntentBtn emoji="❤️" title="Quero provar" subtitle="Adicionar à minha lista de desejos"
                         bg="rgba(184,130,11,0.07)" border="rgba(184,130,11,0.28)" tc="#4A3200" sc="#7A4F07"
                         onClick={() => handleIntent('wishlist')} />
            </div>
          </Slide>
        )}

        {/* ── COLLECTION ───────────────────────────────────────────────── */}
        {step === 'collection' && (
          <Slide key="collection">
            <p className="text-sm mb-5" style={{ color: MUTED }}>
              Adicione este vinho a uma das suas coleções pessoais (opcional).
            </p>

            {collections.length > 0 && (
              <div className="space-y-2 mb-4">
                {collections.map(col => {
                  const selected = selectedCols.has(col.id);
                  return (
                    <button key={col.id} onClick={() => toggleCollection(col.id)}
                            className="w-full flex items-center gap-3 rounded-xl p-3.5 text-left transition-all"
                            style={{
                              background: selected ? 'rgba(107,0,53,0.06)' : CARD,
                              border: `1.5px solid ${selected ? WINE : BORDER}`,
                            }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                           style={{ background: selected ? WINE : 'rgba(139,90,43,0.08)' }}>
                        {selected
                          ? <Check className="w-4 h-4 text-white" />
                          : <FolderPlus className="w-4 h-4" style={{ color: MUTED }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm" style={{ color: TEXT }}>{col.name}</p>
                        {col.item_count !== undefined && (
                          <p className="text-xs" style={{ color: MUTED }}>{col.item_count} vinho{col.item_count !== 1 ? 's' : ''}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Create new collection inline */}
            <div className="flex gap-2 mb-6">
              <input value={newColName} onChange={e => setNewColName(e.target.value)}
                     placeholder="Nova coleção…"
                     onKeyDown={e => e.key === 'Enter' && createCollection()}
                     className="flex-1 px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                     style={{ background: CARD, border: `1px solid ${BORDER}`, color: TEXT }} />
              <button onClick={createCollection} disabled={!newColName.trim() || creatingCol}
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40"
                      style={{ background: WINE }}>
                {creatingCol ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Plus className="w-4 h-4 text-white" />}
              </button>
            </div>

            <button onClick={handleFinish} disabled={savingCols}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white disabled:opacity-60"
                    style={{ background: WINE }}>
              {savingCols ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              {savingCols ? 'Salvando…' : selectedCols.size > 0 ? 'Adicionar e concluir' : 'Pular e concluir'}
            </button>
          </Slide>
        )}

      </AnimatePresence>
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function Slide({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="max-w-lg mx-auto px-4 py-6"
    >
      {children}
    </motion.div>
  );
}

function MethodCard({
  icon, title, subtitle, bg, border, onClick,
}: {
  icon: React.ReactNode; title: string; subtitle: string;
  bg: string; border: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
            className="w-full flex items-center gap-4 p-5 rounded-2xl text-left transition-all active:scale-[0.98]"
            style={{ background: bg, border: `1.5px solid ${border}` }}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
           style={{ background: 'rgba(255,255,255,0.7)' }}>
        {icon}
      </div>
      <div>
        <p className="font-bold text-sm" style={{ color: TEXT }}>{title}</p>
        <p className="text-xs mt-0.5" style={{ color: MUTED }}>{subtitle}</p>
      </div>
      <ChevronRight className="w-4 h-4 ml-auto flex-shrink-0" style={{ color: '#B0A090' }} />
    </button>
  );
}

function IntentBtn({
  emoji, title, subtitle, bg, border, tc, sc, onClick,
}: {
  emoji: string; title: string; subtitle: string;
  bg: string; border: string; tc: string; sc: string;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick}
            className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all active:scale-[0.98]"
            style={{ background: bg, border: `1.5px solid ${border}` }}>
      <span className="text-3xl">{emoji}</span>
      <div>
        <p className="font-bold text-sm" style={{ color: tc }}>{title}</p>
        <p className="text-xs mt-0.5" style={{ color: sc }}>{subtitle}</p>
      </div>
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: MUTED }}>{label}</label>
      {children}
    </div>
  );
}
