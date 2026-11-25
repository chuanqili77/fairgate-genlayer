import { useState } from 'react';
import type { PointerEvent } from 'react';
import { gen, shortAddr } from './chain';
import type { EventRec } from './chain';

export default function Stage({ events, selected, select, lang, onEvidence }: {
  events: EventRec[]; selected?: EventRec; select: (id: number) => void; lang: string; onEvidence: () => void;
}) {
  const [flipped, flip] = useState(false);
  const zh = lang === 'zh';
  function aim(event: PointerEvent<HTMLButtonElement>) {
    if (event.pointerType === 'touch' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const bounds = (event.currentTarget.parentElement ?? event.currentTarget).getBoundingClientRect();
    event.currentTarget.style.setProperty('--pitch', (0.5 - (event.clientY - bounds.top) / bounds.height) * 16 + 'deg');
    event.currentTarget.style.setProperty('--yaw', ((event.clientX - bounds.left) / bounds.width - 0.5) * 25 + 'deg');
  }
  return <div className="stage-layout">
    <nav className="event-track" aria-label={zh ? '活动曲目' : 'Event tracks'}>
      {events.map(event => <button key={event.event_id} type="button" aria-pressed={selected?.event_id === event.event_id}
        onClick={() => { select(event.event_id); flip(false); }}>
        <span className="track-id">{String(event.event_id).padStart(2,'0')}</span>
        <span><strong>{event.artist}</strong><small>{event.date_iso} · {event.city}</small></span>
        <span className="track-state" title={event.status} />
      </button>)}
    </nav>
    {selected && <>
      <div className="ticket-stage">
        <button className={'ticket-model' + (flipped ? ' ticket-flipped' : '')} type="button" aria-pressed={flipped}
          aria-label={zh ? '翻转票券看结算状态' : 'Flip ticket to inspect settlement'} onClick={() => flip(value => !value)}
          onPointerMove={aim} onPointerLeave={event => {
            event.currentTarget.style.removeProperty('--pitch'); event.currentTarget.style.removeProperty('--yaw');
          }}>
          <span className="ticket-face">
            <span className="ticket-content">
              <span className="ticket-eyebrow">FAIRGATE / STUDIONET</span>
              <strong>{selected.artist}</strong>
              <span>{selected.venue} · {selected.city}</span>
              <span>{selected.date_iso} / {selected.face_price_gen} GEN</span>
            </span>
            <span className="ticket-tear"><span>#{String(selected.event_id).padStart(2,'0')}</span><span className="ticket-bars" aria-hidden="true" /></span>
          </span>
          <span className="ticket-face ticket-reverse">
            <span className="ticket-content">
              <span className="ticket-eyebrow">{zh ? '链上结算回执' : 'SETTLEMENT RECORD'}</span>
              <strong>{selected.verdict || selected.status}</strong>
              <span>{zh ? '主办方' : 'Organizer'} · {shortAddr(selected.organizer)}</span>
              <span>{zh ? '托管' : 'Escrow'} · {gen(selected.escrowed_wei)} GEN</span>
            </span>
            <span className="ticket-tear"><span>61999</span><span className="ticket-bars" aria-hidden="true" /></span>
          </span>
        </button>
        <p className="flip-note">{zh ? '移动指针倾斜 · 点击翻面' : 'Tilt with your pointer · click to flip'}</p>
      </div>
      <aside className="stage-meter">
        <span>{zh ? '票务与托管' : 'BOX OFFICE / ESCROW'}</span>
        <strong>{gen(selected.escrowed_wei)} <small>GEN</small></strong>
        <meter min="0" max={selected.tickets_total} value={selected.tickets_sold}
          aria-label={zh ? '已售票数' : 'Tickets sold'} />
        <p>{selected.tickets_sold} / {selected.tickets_total} {zh ? '已售' : 'sold'}</p>
        <div>{selected.verdict || selected.status}</div>
        <button className="btn btn-ghost btn-small" type="button" onClick={onEvidence}>{zh ? "查看结算依据" : "Inspect settlement"}</button>
      </aside>
    </>}
  </div>;
}
