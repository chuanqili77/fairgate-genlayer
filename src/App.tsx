// FairGate frontend — the box office.
// Poster wall -> seat row -> wallet ticket stubs -> resale board ->
// settlement card -> box office ledger -> evidence.
// Gate 11: every value on this page comes from a latest-final readback.
// Before the first FINALIZED readback, values are dashes and the page
// says UNCONFIRMED; export is disabled. On-chain values (status,
// verdict, ticket state, amounts) are always shown in English; the
// translated text next to them is only a gloss.
import { useCallback, useEffect, useState } from 'react';
import {
  MAX_RESALE_GEN,
  loadDeployment, contractAddress, explorerTx, explorerAddress,
  readAll, readMyCredit,
  savePendingTx, loadPendingTxs, clearPendingTx,
  saveMyTx, loadMyTxs, TxUnknownError,
  waitFinalized, sendWriteOnly,
  injectedProvider, walletKind, connectInjected,
  tempPrivateKey, isTempKeyAcked, ackTempKey,
  temporaryAccount, rotateTemporaryAccount, restoreTemporaryAccount, destroyTemporaryAccount,
  shortAddr, gen, fmtReadbackTime,
} from './chain';
import type { EventRec, TicketRec, Counts, Wallet, PendingTx, MyTx } from './chain';
import { getLang, setLang, t, checkParity } from './i18n';
import type { Lang } from './i18n';

const STATIC_MODE = new URLSearchParams(window.location.search).has('static');

interface EvTx { hash: string; label: string; status: string }

function normalizeEvidence(data: unknown): EvTx[] {
  const arr = Array.isArray(data) ? data : (data as any)?.transactions;
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((x: any) => typeof x?.hash === 'string')
    .map((x: any) => ({
      hash: String(x.hash),
      label: String(x.label ?? x.name ?? x.step ?? '—'),
      status: String(x.status ?? x.result ?? (x.finalized === false ? 'ERROR' : 'FINALIZED')),
    }));
}

function splitPrice(priceGen: number): { seller: string; artist: string } {
  const artist = priceGen / 10;
  const seller = priceGen - artist;
  const fmt = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));
  return { seller: fmt(seller), artist: fmt(artist) };
}

export default function App() {
  const [lang, setLangState] = useState<Lang>(getLang());
  const [deployment, setDeployment] = useState<{ contract_address: string; deploy_tx: string; source_sha256: string } | null>(null);
  const [events, setEvents] = useState<EventRec[]>([]);
  const [tickets, setTickets] = useState<TicketRec[]>([]);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [readback, setReadback] = useState<'loading' | 'ok' | 'failed'>('loading');
  const [readbackAt, setReadbackAt] = useState('');
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [myCreditWei, setMyCreditWei] = useState<number | null>(null);
  const [pending, setPending] = useState<PendingTx[]>(loadPendingTxs());
  const [myTxs, setMyTxs] = useState<MyTx[]>(loadMyTxs());
  const [evidenceTxs, setEvidenceTxs] = useState<EvTx[] | null>(null);
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [err, setErr] = useState('');
  const [notice, setNotice] = useState('');
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [resalePrice, setResalePrice] = useState<Record<number, string>>({});
  const [restoreKey, setRestoreKey] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showDisconnect, setShowDisconnect] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const tr = useCallback((k: string) => t(lang, k), [lang]);
  const finalized = readback === 'ok';

  const refresh = useCallback(async () => {
    try {
      const r = await readAll();
      // The contract reports a held event as EVENT_HELD; the UI's status
      // vocabulary is HELD. Normalize once here so every status check,
      // stamp and gloss below agrees — an unmapped status would leave the
      // buy button enabled on a settled event and print a raw i18n key.
      setEvents(r.events.map((e) => ({ ...e, status: e.status === 'EVENT_HELD' ? 'HELD' : e.status })));
      setTickets(r.tickets);
      setCounts(r.counts);
      setReadback(r.is_finalized_readback ? 'ok' : 'failed');
      setReadbackAt(r.at);
      return true;
    } catch {
      setReadback('failed');
      return false;
    }
  }, []);

  const refreshCredit = useCallback(async (w: Wallet | null) => {
    if (!w) { setMyCreditWei(null); return; }
    try { setMyCreditWei(await readMyCredit(w.address)); } catch { setMyCreditWei(null); }
  }, []);

  useEffect(() => {
    const p = checkParity();
    if (p.missing.length || p.extra.length) console.warn('i18n parity', p);
    loadDeployment().then(setDeployment).catch((e) => setErr(String(e?.message || e)));
    refresh();
    fetch('./transactions.json', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setEvidenceTxs(normalizeEvidence(d)); })
      .catch(() => { /* evidence file not published yet */ });
  }, [refresh]);

  useEffect(() => { refreshCredit(wallet); }, [wallet, refreshCredit, readback]);

  const switchLang = (l: Lang) => { setLang(l); setLangState(l); };

  async function doWrite(label: string, key: string, fn: string, args: unknown[], value: bigint, payable: boolean) {
    setErr(''); setNotice('');
    if (!wallet) { setErr(tr('app.connectFirst')); return; }
    if (payable && wallet.mode === 'temporary' && !isTempKeyAcked()) {
      setPendingAction(() => () => doWrite(label, key, fn, args, value, payable));
      setShowKeyModal(true);
      return;
    }
    setBusy((b) => ({ ...b, [key]: true }));
    try {
      const hash = await sendWriteOnly(wallet, fn, args as never[], value);
      savePendingTx(hash, label);
      saveMyTx(hash, label);
      setPending(loadPendingTxs());
      setMyTxs(loadMyTxs());
      setNotice(tr('app.txSent') + ': ' + hash);
      try {
        await waitFinalized(hash);
        clearPendingTx(hash);
        setPending(loadPendingTxs());
        await refresh();
        await refreshCredit(wallet);
        setNotice(tr('app.done') + ': ' + hash);
      } catch (e) {
        if (e instanceof TxUnknownError) {
          setNotice(tr('app.txUnknown') + ': ' + hash);
        } else { throw e; }
      }
    } catch (e: unknown) {
      setErr(tr('app.error') + ': ' + String((e as Error)?.message || e));
    } finally {
      setBusy((b) => ({ ...b, [key]: false }));
    }
  }

  const connectWallet = async () => {
    setErr('');
    try {
      if (!injectedProvider()) { setErr(tr('app.noWallet')); return; }
      setWallet(await connectInjected());
    } catch (e: unknown) {
      setErr(tr('app.error') + ': ' + String((e as Error)?.message || e));
    }
  };

  const useTempAccount = async () => {
    setErr('');
    try { setWallet(await temporaryAccount()); } catch (e: unknown) {
      setErr(tr('app.error') + ': ' + String((e as Error)?.message || e));
    }
  };

  const disconnect = () => {
    if (wallet?.mode === 'temporary') destroyTemporaryAccount();
    setWallet(null);
    setMyCreditWei(null);
    setShowDisconnect(false);
  };

  const exportReceipts = () => {
    if (!finalized) return;
    const payload = {
      contract: contractAddress(),
      readback_at: readbackAt,
      finalized: true,
      events, tickets, counts,
      my_credit_wei: myCreditWei,
      my_transactions: myTxs,
      evidence_transactions: evidenceTxs,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'fairgate-receipts.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const myTickets = wallet ? tickets.filter((tk) => tk.owner.toLowerCase() === wallet.address.toLowerCase()) : [];
  const listings = tickets.filter((tk) => tk.status === 'LISTED');
  const dash = (v: string | number | null | undefined) => (finalized && v !== null && v !== undefined ? String(v) : '—');

  const stampClass = (v: string) =>
    v === 'EVENT_HELD' ? 'stamp-held' : v === 'CANCELLED' ? 'stamp-cancelled' : v === 'POSTPONED' ? 'stamp-postponed' : 'stamp-neutral';

  const verdictOutcome = (ev: EventRec) => {
    if (ev.verdict === 'EVENT_HELD') return tr('app.organizerPaid') + ' · ' + gen(ev.escrowed_wei) + ' GEN';
    if (ev.verdict === 'CANCELLED') return tr('app.refundsPaid');
    if (ev.verdict === 'POSTPONED') return tr('app.fundsHeld');
    if (ev.verdict === 'UNREACHABLE' || ev.verdict === 'SOURCES_DISAGREE') return tr('app.noSettlement');
    return '';
  };

  return (
    <div className={STATIC_MODE ? 'fg no-motion' : 'fg'}>
      <header className="marquee">
        <div className="marquee-top">
          <div>
            <h1>FAIRGATE</h1>
            <p className="tagline">{tr('app.tagline')}</p>
          </div>
          <div className="header-actions">
            <div className="lang-toggle" role="group" aria-label="Language">
              <button className={lang === 'en' ? 'active' : ''} onClick={() => switchLang('en')}>EN</button>
              <button className={lang === 'zh' ? 'active' : ''} onClick={() => switchLang('zh')}>中文</button>
            </div>
            {wallet ? (
              <button className="btn btn-ghost" onClick={() => setShowDisconnect(true)}>
                {shortAddr(wallet.address)} · {tr('app.disconnect')}
              </button>
            ) : (
              <button className="btn btn-primary" onClick={connectWallet}>{tr('app.connect')}</button>
            )}
          </div>
        </div>
        <div className="readback-strip">
          <span className={'pill ' + (readback === 'ok' ? 'pill-ok' : readback === 'failed' ? 'pill-bad' : 'pill-wait')}>
            {readback === 'ok' ? tr('app.readbackFinalized') : readback === 'failed' ? tr('app.readbackFailed') : tr('app.readbackUnconfirmed')}
          </span>
          {readback === 'ok' && <span className="mono small">{tr('app.readbackTime')}: {fmtReadbackTime(readbackAt)}</span>}
          {readback === 'failed' && <button className="btn btn-small" onClick={refresh}>{tr('app.retryReadback')}</button>}
          {readback === 'ok' && <button className="btn btn-small" onClick={async () => { await refresh(); await refreshCredit(wallet); }}>{tr('app.refresh')}</button>}
          {wallet && <span className="mono small">{wallet.mode === 'temporary' ? 'TEMP · ' : walletKind() + ' · '}{shortAddr(wallet.address)}</span>}
        </div>
        <p className="intro">{tr('app.intro')}</p>
        {err && <p className="alert alert-err" role="alert">{err}</p>}
        {notice && <p className="alert alert-ok">{notice}</p>}
        {!wallet && (
          <>
            <p className="temp-row">
              <button className="btn btn-ghost" onClick={useTempAccount}>{tr('app.tempAccount')}</button>
              <span className="small dim">{tr('app.tempNote')}</span>
            </p>
            <p className="temp-row">
              <input
                type="password"
                value={restoreKey}
                onChange={(e) => setRestoreKey(e.target.value)}
                placeholder={tr('app.restorePlaceholder')}
                aria-label={tr('app.restorePlaceholder')}
                autoComplete="off"
              />
              <button
                className="btn btn-ghost"
                disabled={!restoreKey.trim()}
                onClick={async () => {
                  setErr('');
                  try { setWallet(await restoreTemporaryAccount(restoreKey)); setRestoreKey(''); }
                  catch { setErr(tr('app.restoreBadKey')); }
                }}
              >{tr('app.restoreBtn')}</button>
            </p>
          </>
        )}
      </header>

      <main>
        <section aria-labelledby="posters-h">
          <h2 id="posters-h">{tr('app.postersTitle')}</h2>
          <p className="section-sub">{tr('app.postersSub')}</p>
          <div className="poster-wall">
            {events.map((ev) => {
              const soldOut = ev.tickets_sold >= ev.tickets_total;
              const settled = ev.status === 'HELD' || ev.status === 'CANCELLED' || ev.status === 'POSTPONED';
              // No clock on Studionet: the contract cannot refuse an early
              // settle, and the keyword rule would return EVENT_HELD before
              // the show. The UI disables settle until after the event date.
              const future = ev.date_iso > new Date().toISOString().slice(0, 10);
              const band = ev.event_id === 1 ? 'band-oasis' : 'band-future';
              return (
                <article className="poster" key={ev.event_id}>
                  <div className={'poster-band ' + band}>
                    <div className="poster-artist">{ev.artist}</div>
                    <div className="poster-venue">{ev.venue} · {ev.city}</div>
                    <div className="poster-date mono">{ev.date_display}</div>
                    <div className={'status-stamp ' + (ev.status === 'HELD' ? 'stamp-held' : ev.status === 'CANCELLED' ? 'stamp-cancelled' : ev.status === 'POSTPONED' ? 'stamp-postponed' : 'stamp-neutral')}>
                      {ev.status}
                    </div>
                    <div className="status-gloss small">{tr('app.status_' + ev.status)}</div>
                  </div>
                  <div className="poster-body">
                    <div className="seat-row" aria-label={ev.tickets_sold + ' / ' + ev.tickets_total}>
                      {Array.from({ length: ev.tickets_total }, (_, i) => (
                        <span key={i} className={'seat ' + (i < ev.tickets_sold ? 'seat-taken' : 'seat-free')} title={i < ev.tickets_sold ? 'sold' : 'free'} />
                      ))}
                      <span className="small">{dash(ev.tickets_total - ev.tickets_sold)} {tr('app.seatsLeft')}</span>
                    </div>
                    <div className="price-line">
                      <span>{tr('app.facePrice')}: <strong>{dash(ev.face_price_gen)} GEN</strong></span>
                      <span className="small dim">cap {dash(ev.max_resale_gen)} GEN · royalty {dash(ev.royalty_pct)}%</span>
                    </div>
                    <button
                      className="btn btn-primary btn-block"
                      disabled={!finalized || soldOut || settled || !!busy['buy-' + ev.event_id]}
                      onClick={() => doWrite('buy_ticket event ' + ev.event_id, 'buy-' + ev.event_id, 'buy_ticket', [ev.event_id], BigInt(ev.face_price_wei), true)}
                    >
                      {busy['buy-' + ev.event_id] ? tr('app.buying') : soldOut ? tr('app.seatsSoldOut') : tr('app.buyTicket')}
                    </button>
                    <button className="btn btn-ghost btn-block" onClick={() => setExpanded((e) => ({ ...e, [ev.event_id]: !e[ev.event_id] }))}>
                      {tr('app.sourcesTitle')} {expanded[ev.event_id] ? '▴' : '▾'}
                    </button>
                    {expanded[ev.event_id] && (
                      <div className="settle-box">
                        <p className="small"><strong>{tr('app.sourceA')}:</strong> <a href={ev.source_a_url} target="_blank" rel="noreferrer">{ev.source_a_label}</a></p>
                        <p className="small"><strong>{tr('app.sourceB')}:</strong> <a href={ev.source_b_url} target="_blank" rel="noreferrer">{ev.source_b_label}</a></p>
                        <p className="small dim">{tr('app.verdictRule')}</p>
                        <button
                          className="btn btn-warn btn-block"
                          disabled={!finalized || settled || future || !!busy['settle-' + ev.event_id]}
                          onClick={() => doWrite('settle_event ' + ev.event_id, 'settle-' + ev.event_id, 'settle_event', [ev.event_id], 0n, false)}
                        >
                          {busy['settle-' + ev.event_id] ? tr('app.settling') : tr('app.settle')}
                        </button>
                        <p className="small dim">{future ? tr('app.settleFuture') : tr('app.settleNote')}</p>
                        {ev.verdict && ev.verdict !== 'NOT_SETTLED' ? (
                          <div className="verdict-block">
                            <div className={'stamp ' + stampClass(ev.verdict)}>{ev.verdict}</div>
                            <div className="small">{tr('app.verdict_' + ev.verdict)}</div>
                            <div className="small"><strong>{verdictOutcome(ev)}</strong></div>
                          </div>
                        ) : (
                          <p className="small dim">{tr('app.verdict_NOT_SETTLED')}</p>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
            {events.length === 0 && <p className="dim">{tr('app.readbackUnconfirmed')}</p>}
          </div>
        </section>

        <section aria-labelledby="stubs-h">
          <h2 id="stubs-h">{tr('app.stubsTitle')}</h2>
          <p className="section-sub">{tr('app.stubsSub')}</p>
          {!wallet && <p className="dim">{tr('app.connectToSeeStubs')}</p>}
          {wallet && (
            <div className="credit-row">
              <span>{tr('app.creditIs')}: <strong className="mono">{myCreditWei === null ? '—' : gen(myCreditWei) + ' GEN'}</strong></span>
              <button
                className="btn btn-primary"
                disabled={!finalized || !myCreditWei || myCreditWei <= 0 || !!busy.withdraw}
                onClick={() => doWrite('withdraw', 'withdraw', 'withdraw', [], 0n, false)}
              >
                {busy.withdraw ? tr('app.withdrawing') : tr('app.withdrawCredit')}
              </button>
              {myCreditWei === 0 && <span className="small dim">{tr('app.noCredit')}</span>}
            </div>
          )}
          <div className="stub-rack">
            {wallet && myTickets.length === 0 && <p className="dim">{tr('app.noStubs')}</p>}
            {myTickets.map((tk) => {
              const ev = events.find((e) => e.event_id === tk.event_id);
              const price = resalePrice[tk.ticket_id] ?? String(MAX_RESALE_GEN);
              const split = splitPrice(Number(price) || 0);
              return (
                <article className="stub" key={tk.ticket_id}>
                  <div className="stub-left">
                    <div className="stub-event">{ev?.artist ?? ('Event ' + tk.event_id)}</div>
                    <div className="stub-meta mono small">{tr('app.stubTicket')} #{tk.ticket_id} · {ev?.date_display ?? ''}</div>
                    <div className="stub-meta mono small">{tr('app.stubOwner')}: {shortAddr(tk.owner)}</div>
                  </div>
                  <div className="stub-perf" aria-hidden="true" />
                  <div className="stub-right">
                    <span className={'pill ' + (tk.status === 'ACTIVE' ? 'pill-ok' : tk.status === 'LISTED' ? 'pill-wait' : tk.status === 'REFUNDED' ? 'pill-bad' : 'pill-neutral')}>{tk.status}</span>
                    <span className="small">{tr('app.stubStatus_' + tk.status)}</span>
                    {tk.status === 'LISTED' && <span className="mono small">{gen(tk.resale_price_wei)} GEN</span>}
                    {tk.status === 'ACTIVE' && (
                      <div className="resale-form">
                        <label className="small">{tr('app.resalePrice')}
                          <input
                            type="number" min={1} max={MAX_RESALE_GEN} step={1} value={price}
                            onChange={(e) => setResalePrice((r) => ({ ...r, [tk.ticket_id]: e.target.value }))}
                          />
                        </label>
                        <span className="small dim">{tr('app.capNote')}</span>
                        <span className="small mono">{tr('app.sellerGets')} {split.seller} GEN · {tr('app.artistGets')} {split.artist} GEN</span>
                        <button
                          className="btn btn-primary"
                          disabled={!finalized || !!busy['list-' + tk.ticket_id]}
                          onClick={() => {
                            const p = Number(price);
                            if (!Number.isInteger(p) || p < 1 || p > MAX_RESALE_GEN) { setErr(tr('app.priceMustBe')); return; }
                            doWrite('list_resale ticket ' + tk.ticket_id + ' @' + p, 'list-' + tk.ticket_id, 'list_resale', [tk.ticket_id, p], 0n, false);
                          }}
                        >
                          {busy['list-' + tk.ticket_id] ? tr('app.listing') : tr('app.listButton')}
                        </button>
                      </div>
                    )}
                    {tk.status === 'LISTED' && (
                      <button
                        className="btn btn-ghost"
                        disabled={!finalized || !!busy['cancel-' + tk.ticket_id]}
                        onClick={() => doWrite('cancel_resale ticket ' + tk.ticket_id, 'cancel-' + tk.ticket_id, 'cancel_resale', [tk.ticket_id], 0n, false)}
                      >
                        {busy['cancel-' + tk.ticket_id] ? tr('app.cancelling') : tr('app.cancelListing')}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="market-h">
          <h2 id="market-h">{tr('app.marketTitle')}</h2>
          <p className="section-sub">{tr('app.marketSub')}</p>
          {listings.length === 0 && <p className="dim">{tr('app.noListings')}</p>}
          <div className="market-board">
            {listings.map((tk) => {
              const ev = events.find((e) => e.event_id === tk.event_id);
              const p = Number(gen(tk.resale_price_wei));
              const split = splitPrice(p);
              const mine = wallet && tk.owner.toLowerCase() === wallet.address.toLowerCase();
              return (
                <div className="market-row" key={tk.ticket_id}>
                  <span className="mono"><strong>#{tk.ticket_id}</strong> {ev?.artist ?? ''}</span>
                  <span className="mono"><strong>{gen(tk.resale_price_wei)} GEN</strong></span>
                  <span className="small">{tr('app.sellerGets')} {split.seller} · {tr('app.artistGets')} {split.artist}</span>
                  <span className="mono small">{shortAddr(tk.owner)}</span>
                  <button
                    className="btn btn-primary"
                    disabled={!finalized || !!mine || !!busy['buyresale-' + tk.ticket_id]}
                    onClick={() => doWrite('buy_resale ticket ' + tk.ticket_id, 'buyresale-' + tk.ticket_id, 'buy_resale', [tk.ticket_id], BigInt(tk.resale_price_wei), true)}
                  >
                    {busy['buyresale-' + tk.ticket_id] ? tr('app.buyingResale') : tr('app.buyResale')}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="ledger-h">
          <h2 id="ledger-h">{tr('app.ledgerTitle')}</h2>
          <div className="ledger-grid">
            <div className="ledger-tile"><span>{tr('app.received')}</span><strong className="mono">{counts ? dash(gen(counts.total_received_wei)) : '—'} GEN</strong></div>
            <div className="ledger-tile"><span>{tr('app.withdrawn')}</span><strong className="mono">{counts ? dash(gen(counts.total_withdrawn_wei)) : '—'} GEN</strong></div>
            <div className="ledger-tile"><span>{tr('app.balance')}</span><strong className="mono">{counts ? dash(gen(counts.contract_balance_wei)) : '—'} GEN</strong></div>
            <div className="ledger-tile"><span>{tr('app.escrowed')}</span><strong className="mono">{counts ? dash(gen(counts.escrowed_wei)) : '—'} GEN</strong></div>
            <div className="ledger-tile"><span>{tr('app.royalties')}</span><strong className="mono">{counts ? dash(gen(counts.total_royalties_wei)) : '—'} GEN</strong></div>
            <div className="ledger-tile"><span>{tr('app.resaleVolume')}</span><strong className="mono">{counts ? dash(gen(counts.total_resale_volume_wei)) : '—'} GEN</strong></div>
            <div className="ledger-tile"><span>{tr('app.eventsCount')}</span><strong className="mono">{counts ? dash(counts.event_count) : '—'}</strong></div>
            <div className="ledger-tile"><span>{tr('app.ticketsCount')}</span><strong className="mono">{counts ? dash(counts.ticket_count) : '—'}</strong></div>
          </div>
        </section>

        <section aria-labelledby="how-h">
          <h2 id="how-h">{tr('app.howTitle')}</h2>
          <ol className="how-list">
            <li>{tr('app.how1')}</li>
            <li>{tr('app.how2')}</li>
            <li>{tr('app.how3')}</li>
            <li>{tr('app.how4')}</li>
          </ol>
        </section>

        <section aria-labelledby="evidence-h">
          <h2 id="evidence-h">{tr('app.evidenceTitle')}</h2>
          <p className="section-sub">{tr('app.evidenceSub')}</p>
          <h3>{tr('app.machineView')}</h3>
          {finalized ? (
            <pre className="machine-view">{JSON.stringify({ contract: deployment?.contract_address, readback_at: readbackAt, finalized: true, events, tickets, counts, my_credit_wei: myCreditWei }, null, 2)}</pre>
          ) : (
            <pre className="machine-view">{tr('app.readbackUnconfirmed')}</pre>
          )}
          <div className="evidence-actions">
            <button className="btn btn-primary" disabled={!finalized} onClick={exportReceipts}>{tr('app.exportJson')}</button>
            {!finalized && <span className="small dim">{tr('app.exportDisabled')}</span>}
          </div>
          <h3>{tr('app.evidenceFile')}</h3>
          {evidenceTxs === null ? (
            <p className="dim">{tr('app.noEvidenceYet')}</p>
          ) : (
            <table className="tx-table">
              <thead><tr><th>{tr('app.txLabel')}</th><th>{tr('app.txHash')}</th><th>{tr('app.txStatus')}</th></tr></thead>
              <tbody>
                {evidenceTxs.map((tx) => (
                  <tr key={tx.hash}>
                    <td>{tx.label}</td>
                    <td className="mono"><a href={explorerTx(tx.hash)} target="_blank" rel="noreferrer">{shortAddr(tx.hash)}</a></td>
                    <td>{tx.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {pending.length > 0 && (
            <div>
              <h3>{tr('app.pendingNote')}</h3>
              <ul>
                {pending.map((p) => (
                  <li key={p.hash} className="mono small">{p.label} — <a href={explorerTx(p.hash)} target="_blank" rel="noreferrer">{shortAddr(p.hash)}</a> · {tr('app.txUnknown')}</li>
                ))}
              </ul>
            </div>
          )}
          {myTxs.length > 0 && (
            <div>
              <h3>{tr('app.myTxTitle')}</h3>
              <ul>
                {myTxs.map((m) => (
                  <li key={m.hash} className="mono small">{m.label} — <a href={explorerTx(m.hash)} target="_blank" rel="noreferrer">{shortAddr(m.hash)}</a></li>
                ))}
              </ul>
            </div>
          )}
          <p className="small mono">
            {tr('app.contract')}: {deployment ? <a href={explorerAddress(deployment.contract_address)} target="_blank" rel="noreferrer">{deployment.contract_address}</a> : '—'}<br />
            {tr('app.sourceSha')}: {deployment?.source_sha256 ?? '—'}<br />
            {tr('app.network')}: GenLayer Stable Studionet · 61999
          </p>
        </section>
      </main>

      <footer>
        <p className="small dim">{tr('app.footerNote')}</p>
      </footer>

      {showKeyModal && wallet?.mode === 'temporary' && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={tr('app.keyBackupTitle')}>
          <div className="modal">
            <h3>{tr('app.keyBackupTitle')}</h3>
            <p>{tr('app.keyBackupBody')}</p>
            <p className="mono key-box">{tempPrivateKey() ?? '—'}</p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => { try { navigator.clipboard.writeText(tempPrivateKey() ?? ''); setNotice(tr('app.copied')); } catch { /* ignore */ } }}>{tr('app.copyKey')}</button>
              <button className="btn btn-primary" onClick={() => { ackTempKey(); setShowKeyModal(false); const a = pendingAction; setPendingAction(null); a?.(); }}>{tr('app.keyBackupAck')}</button>
              <button className="btn btn-ghost" onClick={() => setShowKeyModal(false)}>{tr('app.cancel')}</button>
            </div>
          </div>
        </div>
      )}

      {showDisconnect && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={tr('app.disconnectTitle')}>
          <div className="modal">
            <h3>{tr('app.disconnectTitle')}</h3>
            <p>{tr('app.disconnectBody')}</p>
            {wallet?.mode === 'temporary' && (
              <>
                <p className="small dim">{tr('app.disconnectKeyNote')}</p>
                <p className="mono key-box">{tempPrivateKey() ?? '—'}</p>
                <div className="modal-actions">
                  <button className="btn btn-ghost" onClick={() => { try { navigator.clipboard.writeText(tempPrivateKey() ?? ''); setNotice(tr('app.copied')); } catch { /* ignore */ } }}>{tr('app.copyKey')}</button>
                </div>
              </>
            )}
            <div className="modal-actions">
              <button className="btn btn-warn" onClick={disconnect}>{tr('app.disconnectConfirm')}</button>
              <button className="btn btn-ghost" onClick={() => setShowDisconnect(false)}>{tr('app.cancel')}</button>
            </div>
            {wallet?.mode === 'temporary' && (
              <button className="btn btn-ghost" onClick={async () => { setWallet(await rotateTemporaryAccount()); setShowDisconnect(false); }}>{tr('app.rotateAccount')}</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
