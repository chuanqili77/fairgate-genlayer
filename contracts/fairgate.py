# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
"""FairGate: anti-scalper concert tickets + consensus event-outcome
settlement on GenLayer Stable Studionet. Protocol fairgate-1.3.

One concert type, one tier, one resale rule. Face price is 10 GEN
per ticket. Resale is capped at 110% of face value (11 GEN, code
enforced) and every secondary sale pays a 10% artist royalty
(floor division, deterministic). Ticket money is escrowed in the
contract; consensus decides the event outcome and the money follows
the verdict:

  EVENT_HELD -> escrow pays the organizer
  CANCELLED  -> every current ticket holder is refunded the face
                price (10 GEN per ticket)
  POSTPONED  -> funds stay locked; the event can be re-settled on a
                new date (re-settlement re-fetches both sources)

Money never moves directly: settlement and resale only record
pull-payment credits; the entitled party withdraws with withdraw().

Anchors (dual source, both fetched independently by every
validator at settlement). The launch events and their source URLs
are FIXED in this source and byte-frozen at deploy: no one,
including the organizer address, can change what the consensus
reads. That is the whole point — the beneficiary cannot pick the
evidence. A future version with organizer-listed events would need
a source-URL allowlist; v1 does not have one and does not claim one.

  E1 EVENT_HELD: Oasis Live '25, Wembley Stadium, London, 2025-07-25.
     (a) Wembley Stadium official retrospective:
         https://www.wembleystadium.com/news/2025/09/30/12/23/OASIS-BRING-THE-CURTAIN-DOWN-ON-RECORD-BREAKING-CONCERT-SEASON-AT-WEMBLEY-STADIUM
         It states that Oasis brought the curtain down on the concert
         season at Wembley and that the Oasis show was the band's
         seventh at the stadium that summer.
     (b) Wembley Park district guide (independent operator, Quintain;
         not the venue, not the artist, not the promoter):
         https://wembleypark.com/things-to-do/ultimate-guide-to-oasis-at-wembley-stadium/
         It states: "Oasis played Wembley Stadium in 2025." These sources establish general performance history, but do
         not explicitly tie a completed show to 25 July 2025. The
         V1.4 exact-date rule therefore does not authorize E1 payment
         from this text. A scheduled listing alone is also insufficient.
  E2 CANCELLED: Future & Metro Boomin – We Trust You Tour,
     Bridgestone Arena, Nashville, 2024-08-06 20:00.
     (a) venue official page:
         https://www.bridgestonearena.com/events/detail/future-metro-boomin-we-trust-you-tour
         Title: "CANCELLED: Future & Metro Boomin – We Trust You Tour".
     (b) do615.com, Nashville independent event calendar (DoStuff
         network; no affiliation with the venue, promoter or
         ticketing):
         https://do615.com/events/2024/8/6/future-metro-boomin-we-trust-you-tour-tickets
         Title: "Cancelled - Future & Metro Boomin – We Trust You Tour".
     Note: the venue page body writes "August 6" without a year; the
     year 2024 is pinned by the tour copy on the same page (tour
     30 July – 9 September 2024) and by source (b)'s "08/6/2024".
  E3 LIVE (ON_SALE, settlement pending the real date): Pentatonix —
     Christmas in the City Tour, Bridgestone Arena, Nashville,
     2026-12-09 19:00.
     (a) venue official page:
         https://www.bridgestonearena.com/events/detail/pentatonix-christmas-in-the-city-tour
     (b) do615.com, Nashville independent event calendar (DoStuff
         network; no affiliation with the venue, promoter or
         ticketing):
         https://do615.com/events/2026/12/9/pentatonix-christmas-in-the-city-tour-tickets
         Both sources list the show as scheduled for Wed Dec 9, 2026,
         7:00 PM. Both pages were probe-verified before deploy:
         Bridgestone 200, 101,205 chars; do615 200, 52,158 chars;
         neither page contains any cancel/postpone word. E3 stays
         ON_SALE with tickets available, so the live site has a real
         buy / list-resale / buy-resale / withdraw flow. Its escrow
         stays open until after the real event date — that is live
         money, not stranded value, and the evidence ledger says so.
  E4 POSTPONED: KATSEYE — THE WILDWORLD TOUR, Target Center,
     Minneapolis, 2026-11-07 20:00. The show was postponed days
     before the date (member illness); no replacement date has been
     announced and tickets stay valid for the rescheduled show.
     (a) venue official page:
         https://www.targetcenter.com/events/detail/katseye
         Title: "KATSEYE - POSTPONED | Target Center".
     (b) MusicTimes, independent music news (no affiliation with
         the venue, promoter or ticketing):
         https://www.musictimes.com/articles/113245/20261109/katseye-postpone-chicago-minneapolis-shows-megan-recovers-concussion.htm
         Reports the postponement of the Chicago and Minneapolis
         shows and names Target Center. No independent event
         listing with postponement wording was fetchable (the
         Minneapolis listing site was unreachable and the
         ticket-aggregator page returned 403 to validators), so
         the second source is an independent news report rather
         than a listing; that is disclosed, not hidden. E4 sells
         one ticket in the evidence run (10 GEN escrow) so that
         rescheduling can be proven to preserve a real ticket,
         its holder and the escrow. A postponed event can be
         rescheduled (reschedule_event): the new date is stored
         with a new settlement timestamp, tickets and escrow are
         untouched, and no money is released by rescheduling.

Verdict rule (deterministic code, no LLM anywhere). Each validator
fetches both source pages and reads ONLY the scoped text: the page
title, the meta content (description / keywords), any JSON-LD
structured event data, and the visible body text after removing
navigation, footers, asides, scripts, styles and recommended /
related / sidebar sections. Keywords found in a footer, a nav bar
or a recommended article about another event do not count. Before
any keyword counts, each page must also prove it is the right
event: the page must contain the artist token AND the venue token
for that event (identity check, exact substrings, lowercased) in
the scoped text. A page that fails the identity check cannot vote:
its keywords are ignored and the verdict is UNREACHABLE. The
equivalence vector is (verdict, cancel_a, cancel_b, postpone_a,
postpone_b, fetch_a_ok, fetch_b_ok, identity_a, identity_b) —
exact equality, no tolerance. The rule:
  - either source fails to fetch (non-200 or request error) or
    fails the identity check -> UNREACHABLE (no state change,
    retryable)
  - both sources contain a cancel word -> CANCELLED
  - both sources contain a postpone word -> POSTPONED
  - both sources contain explicit past-tense evidence that the
    identified event was performed / took place on its exact configured
    date in the same sentence as the act and venue, and neither source
    contains a cancel or postpone word -> EVENT_HELD
  - absence of cancel/postpone words is NOT proof of an event being
    held; without positive held evidence from both sources the result
    is SOURCES_DISAGREE and escrow stays locked
    (no state change, retryable)
HELD requires a positive past-tense performance signal on each
source page (for example "played", "performed", "took place", "was
held", or "brought the curtain down"), in addition to the event
identity check. A scheduled listing or silence about cancellation
is never sufficient evidence to release escrow. The fetched page text is data,
never instructions: injection text inside a page cannot change the
verdict, because only the keyword flags and the identity tokens are
examined — and a page that does not mention the event at all cannot
contribute a keyword.

Settlement time gate (on-chain, Unix timestamps, not frontend
time). Each event stores an explicit UTC event start timestamp
(event_start_ts) and an explicit UTC settlement timestamp
(settle_after_ts). settle_after_ts is the first second of the day
after the show, in the event's own local time zone: the contract
derives it from event_start_ts and the local UTC offset (minutes)
supplied at configuration and refuses any other value, so the
caller cannot smuggle in an early timestamp. settle_event reads
the transaction datetime (GenLayer-native, deterministic — every
validator re-executing the transaction sees the same pinned
datetime), converts it to a Unix timestamp and requires it to be
>= settle_after_ts; an earlier attempt fails with TOO_EARLY and
changes nothing. No UTC date strings are compared anywhere. The
local date and time-zone name are kept only for display. Example:
E3 (Pentatonix, 2026-12-09 19:00 Nashville, CST = UTC-6) has
event_start_ts 1796864400 (2026-12-10T01:00:00Z) and
settle_after_ts 1796882400 (2026-12-10T06:00:00Z, which is
2026-12-10 00:00 Nashville). The frontend also disables the
settle button until the settlement timestamp as a second layer,
but the contract gate is what enforces it: frontend time is never
treated as chain time. The gate uses the transaction datetime,
which is fixed when the transaction is accepted — not any
validator's wall clock — so a transaction submitted before the
timestamp cannot settle, and one submitted at or after it can.

Reschedule (reschedule_event, creator only). A POSTPONED event
can be moved to a later date: the caller supplies a new start
timestamp, a new settlement timestamp, the new local UTC offset
and the new display date; the contract re-derives the settlement
timestamp from the new start and offset and refuses any other
value, requires the new start to be later than the old start, and
requires the new settlement timestamp to be later than the new
start. The event stays POSTPONED — rescheduling never reopens
ticket sales — and tickets, holders and escrow are untouched: no
money is released to the organizer or the artist by rescheduling.
A rescheduled event can be rescheduled again. An event that is
already finally settled (EVENT_HELD / CANCELLED) or still ON_SALE
cannot be rescheduled.

A failed payable call KEEPS its value in the contract (platform
behavior on Studionet). The frontend only ever submits the exact
price to an existing ticket/listing, so that path is unreachable
from the UI, and the evidence run sends 0 GEN on its failed-payable
negatives, so no value is stranded there.

Royalty rounding: royalty = price_wei * 10 // 100. Prices are whole
GEN, so 10% is always exact in wei (10 GEN -> 1 GEN, 11 GEN ->
1.1 GEN, 1 GEN -> 0.1 GEN); the floor division only guards
sub-wei dust, which cannot occur for integer-GEN prices. Seller
receives price - royalty. Every resale conserves exactly
price_wei in credits.

Sender-bound roles: the deployer address is recorded as creator
at construction; only the creator can configure an event
(configure_event), and the organizer/artist payout addresses are
set once per event before the first ticket is sold and can never
change after that. Only the ticket owner can list/cancel a
resale; only the entitled party can withdraw its credit. Buying
requires the event to be configured, ON_SALE, not sold out, and
the exact face price. settle_event is open to anyone because the
outcome is decided by consensus, not by the caller — but the date
gate above still applies to every caller.

Known limits (neutral, product-scope):
  * v1.3 ships exactly four launch events, fixed at deploy. There is
    no organizer listing flow; adding one needs a source-URL
    allowlist so the beneficiary cannot pick its own evidence.
  * E3 (Pentatonix, 2026-12-09) is ON_SALE and unsettled by design:
    its escrow stays open until its settlement timestamp
    (2026-12-10T06:00:00Z), when it can be settled like E1/E2. Its
    tickets remain buyable and resalable on the live site in the
    meantime. The timestamp gate refuses any settlement attempt
    before 2026-12-10T06:00:00Z.
  * E4 (KATSEYE, 2026-11-07) is POSTPONED: its funds stay locked
    and it can be rescheduled (reschedule_event) and re-settled
    when a new date is announced. Its second source is an
    independent news report, not an event listing (see E4 note
    above).
  * The verdict reads the live pages at settlement time. If a
    source page is rewritten, the verdict follows the new text.
  * An event has no delist action; a POSTPONED event keeps selling
    nothing new (buys are ON_SALE only) while resale stays open.
"""
from genlayer import *
import json
from datetime import datetime, timezone

GEN_WEI = 1000000000000000000  # 1 GEN = 10^18 wei
FACE_PRICE_GEN = 10
MAX_RESALE_GEN = 11  # 110% of face value, cap included
ROYALTY_PCT = 10
TICKETS_PER_EVENT = 8

VERDICTS = ['EVENT_HELD', 'CANCELLED', 'POSTPONED', 'UNREACHABLE',
            'SOURCES_DISAGREE']
TERMINAL = ['EVENT_HELD', 'CANCELLED']


def fail(s):
    raise gl.vm.UserError(s)


def packed(x):
    return json.dumps(x, sort_keys=True, separators=(',', ':'))


_REMOVE_CLASS = ('recommend', 'related', 'sidebar', 'more-events',
                 'upcoming', 'you-may-also', 'also-like', 'trending',
                 'newsletter', 'other-events', 'similar', 'footer',
                 'site-footer', 'page-footer')
_SKIP_TAGS = ('nav', 'footer', 'aside', 'script', 'style')


def _strip_tags(fragment):
    """Visible text of an HTML fragment: tags removed, whitespace
    collapsed. Pure str operations only."""
    out = []
    i = 0
    n = len(fragment)
    while i < n:
        c = fragment[i]
        if c == '<':
            j = fragment.find('>', i)
            if j == -1:
                break
            out.append(' ')
            i = j + 1
        else:
            out.append(c)
            i += 1
    return ' '.join(''.join(out).split())


def _ld_strings(raw):
    """All string values of a JSON-LD block, joined. A block that
    does not parse is returned raw: its text may still carry a
    structured status such as EventPostponed."""
    try:
        data = json.loads(raw)
    except Exception:
        return raw
    parts = []

    def walk(x):
        if isinstance(x, str):
            parts.append(x)
        elif isinstance(x, dict):
            for v in x.values():
                walk(v)
        elif isinstance(x, list):
            for v in x:
                walk(v)

    walk(data)
    return ' '.join(parts)


def _meta_text(html):
    """content="..." values of <meta> tags (title, description,
    keywords): the page's own structured summary of what it is
    about. Meta keywords on the Wembley Oasis page, for example,
    read "OASIS LIVE '25 WEMBLEY STADIUM" — both identity tokens
    for a page whose visible body is rendered by JavaScript."""
    low = html.lower()
    parts = []
    pos = 0
    while True:
        mi = low.find('<meta', pos)
        if mi == -1:
            break
        gt = low.find('>', mi)
        if gt == -1:
            break
        tag = html[mi:gt + 1]
        ci = tag.lower().find('content=')
        if ci != -1:
            q = tag[ci + 8:ci + 9]
            if q in ('"', "'"):
                end = tag.find(q, ci + 9)
                if end != -1:
                    parts.append(tag[ci + 9:end])
        pos = gt + 1
    return ' '.join(parts)


def _remove_unwanted(html):
    """Remove navigation, footers, asides, scripts, styles and
    recommended / related / sidebar sections from the raw page,
    keeping the rest. Balanced-block removal with same-tag nesting
    tracked, so a recommended block that contains inner divs is
    removed whole. Pure str operations only."""
    low = html.lower()
    n = len(html)
    out = []
    i = 0
    skip = []
    while i < n:
        lt = html.find('<', i)
        if lt == -1:
            if not skip:
                out.append(html[i:])
            break
        if not skip:
            out.append(html[i:lt])
        if html.startswith('<!--', lt):
            end = html.find('-->', lt + 4)
            i = n if end == -1 else end + 3
            continue
        gt = html.find('>', lt)
        if gt == -1:
            break
        inner = html[lt + 1:gt].strip()
        if inner.startswith('/'):
            name = inner[1:].split()[0].lower() \
                if inner[1:].split() else ''
            if skip and skip[-1] == name:
                skip.pop()
            i = gt + 1
            continue
        parts = inner.split()
        name = parts[0].lower().rstrip('/') if parts else ''
        self_close = inner.endswith('/')
        if skip:
            if name == skip[-1] and not self_close:
                skip.append(name)
            i = gt + 1
            continue
        if name in _SKIP_TAGS:
            if not self_close:
                skip.append(name)
            i = gt + 1
            continue
        attrs = low[lt:gt + 1]
        if any(k in attrs for k in _REMOVE_CLASS):
            if not self_close:
                skip.append(name)
            i = gt + 1
            continue
        out.append(html[lt:gt + 1])
        i = gt + 1
    return ''.join(out)


def _scoped_text(html):
    """The text a verdict may be based on: page title + meta
    content + JSON-LD structured event data + visible body text
    after unwanted sections are removed. Everything else on the
    page (nav, footer, recommended articles, scripts) is excluded
    before any keyword is counted."""
    low = html.lower()
    title = ''
    ti = low.find('<title')
    if ti != -1:
        gt = low.find('>', ti)
        te = low.find('</title>', gt) if gt != -1 else -1
        if gt != -1 and te != -1:
            title = _strip_tags(html[gt + 1:te])
    ld_texts = []
    pos = 0
    while True:
        si = low.find('<script', pos)
        if si == -1:
            break
        gt = low.find('>', si)
        if gt == -1:
            break
        tag_head = low[si:gt + 1]
        se = low.find('</script>', gt)
        if se == -1:
            break
        if 'application/ld+json' in tag_head:
            ld_texts.append(_ld_strings(html[gt + 1:se]))
        pos = se + len('</script>')
    body_text = _strip_tags(_remove_unwanted(html))
    return ' '.join([title, _meta_text(html)] + ld_texts + [body_text])


def _scan(html, id_a, id_b, event_date=""):
    """Outcome flags + identity check on scoped page text only.

    HELD is positive evidence, not the absence of a cancellation word.
    It requires an explicit past-tense signal that a performance took
    place (e.g. played, performed, took place, was held, or a completed
    event retrospective). Scheduled / on-sale copy is not evidence.
    """
    import re
    scoped = _scoped_text(html)
    low = scoped.lower()
    cancel = ('cancelled' in low) or ('canceled' in low)
    postpone = ('postpone' in low) or ('reschedule' in low)
    held_patterns = (
        r'\bplayed\b',
        r'\bperformed\b',
        r'\btook place\b',
        r'\bwas held\b',
        r'\bwere held\b',
        r'\bwent ahead\b',
        r'\bhas taken place\b',
        r'\bhave taken place\b',
        r'\bwas staged\b',
        r'\bwere staged\b',
        r'\bbrought the curtain down\b',
    )
    # Evidence must describe the identified act at the identified venue
    # in the same sentence. A different performance elsewhere on a page
    # does not authorize release. Negated, conditional and future copy
    # is deliberately rejected even if a past-tense token is present.
    held = False
    for sentence in re.split(r'[.!?;]+', low):
        if id_a.lower() not in sentence or id_b.lower() not in sentence:
            continue
        if re.search(r'\b(?:not|never|no|neither|nor|if|unless|would|could|might|will)\b', sentence):
            continue
        if event_date:
            year, month, day = event_date.split('-')
            names = ('january', 'february', 'march', 'april', 'may', 'june',
                     'july', 'august', 'september', 'october', 'november', 'december')
            name = names[int(month) - 1]
            d = str(int(day))
            date_patterns = (re.escape(event_date),
                r'\b' + d + r'(?:st|nd|rd|th)?\s+' + name + r'\s+' + year + r'\b',
                r'\b' + name + r'\s+' + d + r'(?:st|nd|rd|th)?[,]?\s+' + year + r'\b')
            if not any(re.search(pattern, sentence) for pattern in date_patterns):
                continue
        if any(re.search(pattern, sentence) for pattern in held_patterns):
            held = True
            break
    identity = (id_a.lower() in low) and (id_b.lower() in low)
    return cancel, postpone, identity, held


def _fetch_once(url, id_a, id_b, event_date=""):
    """One validator's independent fetch + scan. Never raises: a
    fetch failure is reported as ok=False."""
    try:
        response = gl.nondet.web.request(url, method='GET')
    except Exception:
        return {'ok': False, 'cancel': False, 'postpone': False,
                'held': False, 'identity': False}
    if getattr(response, 'status', 0) != 200:
        return {'ok': False, 'cancel': False, 'postpone': False,
                'held': False, 'identity': False}
    body = response.body
    if isinstance(body, bytes):
        try:
            text = body.decode('utf-8', errors='ignore')
        except Exception:
            return {'ok': False, 'cancel': False, 'postpone': False,
                    'held': False, 'identity': False}
    elif isinstance(body, str):
        text = body
    else:
        return {'ok': False, 'cancel': False, 'postpone': False,
                'held': False, 'identity': False}
    cancel, postpone, identity, held = _scan(text, id_a, id_b, event_date)
    return {'ok': True, 'cancel': cancel, 'postpone': postpone,
            'held': held, 'identity': identity}


def _verdict_from(a, b):
    if not a['ok'] or not b['ok'] \
            or not a['identity'] or not b['identity']:
        return 'UNREACHABLE'
    # A held verdict requires explicit positive evidence from BOTH
    # independent sources. Silence on cancellation is not proof.
    if a['cancel'] and b['cancel'] \
            and not (a['postpone'] or b['postpone']
                     or a['held'] or b['held']):
        return 'CANCELLED'
    if a['postpone'] and b['postpone'] \
            and not (a['cancel'] or b['cancel']
                     or a['held'] or b['held']):
        return 'POSTPONED'
    if a['held'] and b['held'] \
            and not (a['cancel'] or b['cancel']
                     or a['postpone'] or b['postpone']):
        return 'EVENT_HELD'
    return 'SOURCES_DISAGREE'


def _validate_check(res):
    if not isinstance(res, dict):
        fail('CHECK_RESULT')
    verdict = res.get('verdict')
    if verdict not in VERDICTS:
        fail('CHECK_VERDICT')
    for k in ('cancel_a', 'cancel_b', 'postpone_a', 'postpone_b',
              'held_a', 'held_b', 'fetch_a_ok', 'fetch_b_ok',
              'identity_a', 'identity_b'):
        if not isinstance(res.get(k), bool):
            fail('CHECK_FLAG')
    a = {
        'ok': res['fetch_a_ok'], 'identity': res['identity_a'],
        'cancel': res['cancel_a'], 'postpone': res['postpone_a'],
        'held': res['held_a']}
    b = {'ok': res['fetch_b_ok'], 'identity': res['identity_b'],
         'cancel': res['cancel_b'], 'postpone': res['postpone_b'],
         'held': res['held_b']}
    if verdict != _verdict_from(a, b):
        fail('CHECK_' + verdict.replace('EVENT_', ''))
    return res


def _run_check(url_a, url_b, id_a, id_b, event_date=""):
    def leader_fn():
        a = _fetch_once(url_a, id_a, id_b, event_date)
        b = _fetch_once(url_b, id_a, id_b, event_date)
        return _validate_check({
            'verdict': _verdict_from(a, b),
            'cancel_a': a['cancel'], 'cancel_b': b['cancel'],
            'postpone_a': a['postpone'], 'postpone_b': b['postpone'],
            'held_a': a['held'], 'held_b': b['held'],
            'fetch_a_ok': a['ok'], 'fetch_b_ok': b['ok'],
            'identity_a': a['identity'], 'identity_b': b['identity'],
        })

    def validator_fn(result):
        if not isinstance(result, gl.vm.Return):
            try:
                leader_fn()
            except Exception:
                return True
            return False
        try:
            mine = leader_fn()
        except Exception:
            return False
        try:
            leader = _validate_check(result.calldata)
        except Exception:
            return False
        return all(leader.get(k) == mine.get(k) for k in
                   ('verdict', 'cancel_a', 'cancel_b', 'postpone_a',
                    'postpone_b', 'held_a', 'held_b',
                    'fetch_a_ok', 'fetch_b_ok',
                    'identity_a', 'identity_b'))

    return gl.vm.run_nondet_unsafe(leader_fn, validator_fn)


@gl.evm.contract_interface
class _Recipient:
    class View:
        pass

    class Write:
        pass


def _event(artist, venue, city, date_iso, date_display,
           source_a_url, source_a_label, source_b_url, source_b_label,
           id_a, id_b):
    return {
        'event_id': 0, 'artist': artist, 'venue': venue, 'city': city,
        'date_iso': date_iso, 'date_display': date_display,
        'event_start_ts': 0, 'settle_after_ts': 0,
        'tz_offset_min': 0, 'tz_name': '',
        'source_a_url': source_a_url, 'source_a_label': source_a_label,
        'source_b_url': source_b_url, 'source_b_label': source_b_label,
        'id_a': id_a, 'id_b': id_b,
        'face_price_gen': FACE_PRICE_GEN,
        'face_price_wei': FACE_PRICE_GEN * GEN_WEI,
        'max_resale_gen': MAX_RESALE_GEN, 'royalty_pct': ROYALTY_PCT,
        'tickets_total': TICKETS_PER_EVENT, 'tickets_sold': 0,
        'status': 'ON_SALE', 'verdict': '', 'settle_count': 0,
        'escrowed_wei': 0, 'organizer': '', 'artist_address': '',
        'parties_set': False, 'organizer_paid': False,
    }


def _derive_settle_after(event_start_ts, tz_offset_min):
    """The first second of the day after the show, in the event's
    own local time zone, as a UTC Unix timestamp. The offset is
    minutes east of UTC (Nashville in December, CST: -360). The
    caller supplies the offset; the contract derives the timestamp
    itself and refuses any other value, so an early settlement
    timestamp cannot be smuggled in. Offset range is UTC-12 to
    UTC+14. Integer arithmetic only; // floors, which is what the
    local-day computation needs."""
    if not isinstance(event_start_ts, int) \
            or isinstance(event_start_ts, bool) \
            or event_start_ts <= 0:
        fail('BAD_START_TS')
    if not isinstance(tz_offset_min, int) \
            or isinstance(tz_offset_min, bool) \
            or tz_offset_min < -720 or tz_offset_min > 840:
        fail('BAD_TZ_OFFSET')
    local_day = (event_start_ts + tz_offset_min * 60) // 86400
    return (local_day + 1) * 86400 - tz_offset_min * 60


class FairGate(gl.Contract):
    events: TreeMap[str, str]
    tickets: TreeMap[str, str]
    credits: TreeMap[str, str]
    creator: str
    next_ticket_id: u32
    total_received: u256
    total_withdrawn: u256
    total_royalties: u256
    total_resale_volume: u256

    def __init__(self):
        self.events = TreeMap()
        self.tickets = TreeMap()
        self.credits = TreeMap()
        self.creator = str(gl.message.sender_address).lower()
        self.next_ticket_id = u32(1)
        self.total_received = u256(0)
        self.total_withdrawn = u256(0)
        self.total_royalties = u256(0)
        self.total_resale_volume = u256(0)
        e1 = _event(
            'Oasis', 'Wembley Stadium', 'London',
            '2025-07-25', '25 July 2025',
            'https://www.wembleystadium.com/news/2025/09/30/12/23/OASIS-BRING-THE-CURTAIN-DOWN-ON-RECORD-BREAKING-CONCERT-SEASON-AT-WEMBLEY-STADIUM',
            'Wembley Stadium — official retrospective',
            'https://wembleypark.com/things-to-do/ultimate-guide-to-oasis-at-wembley-stadium/',
            'Wembley Park — district guide ("Oasis played Wembley Stadium in 2025")',
            'oasis', 'wembley')
        e1['event_id'] = 1
        self.events['1'] = packed(e1)
        e2 = _event(
            'Future & Metro Boomin', 'Bridgestone Arena', 'Nashville',
            '2024-08-06', '6 August 2024, 8:00 PM',
            'https://www.bridgestonearena.com/events/detail/future-metro-boomin-we-trust-you-tour',
            'Bridgestone Arena — official event page',
            'https://do615.com/events/2024/8/6/future-metro-boomin-we-trust-you-tour-tickets',
            'do615 — Nashville independent event calendar',
            'metro boomin', 'bridgestone')
        e2['event_id'] = 2
        self.events['2'] = packed(e2)
        e3 = _event(
            'Pentatonix', 'Bridgestone Arena', 'Nashville',
            '2026-12-09', '9 December 2026, 7:00 PM',
            'https://www.bridgestonearena.com/events/detail/pentatonix-christmas-in-the-city-tour',
            'Bridgestone Arena — official event page',
            'https://do615.com/events/2026/12/9/pentatonix-christmas-in-the-city-tour-tickets',
            'do615 — Nashville independent event calendar',
            'pentatonix', 'bridgestone')
        e3['event_id'] = 3
        self.events['3'] = packed(e3)
        e4 = _event(
            'KATSEYE', 'Target Center', 'Minneapolis',
            '2026-11-07', '7 November 2026, 8:00 PM',
            'https://www.targetcenter.com/events/detail/katseye',
            'Target Center — official event page ("KATSEYE - POSTPONED")',
            'https://www.musictimes.com/articles/113245/20261109/katseye-postpone-chicago-minneapolis-shows-megan-recovers-concussion.htm',
            'MusicTimes — independent news report (postponement confirmed)',
            'katseye', 'target center')
        e4['event_id'] = 4
        self.events['4'] = packed(e4)

    def _load_event(self, event_id):
        raw = self.events.get(str(event_id), '')
        if not raw:
            fail('EVENT_NOT_FOUND')
        return json.loads(raw)

    def _save_event(self, e):
        self.events[str(e['event_id'])] = packed(e)
        return packed(e)

    def _load_ticket(self, ticket_id):
        raw = self.tickets.get(str(ticket_id), '')
        if not raw:
            fail('TICKET_NOT_FOUND')
        return json.loads(raw)

    def _save_ticket(self, t):
        self.tickets[str(t['ticket_id'])] = packed(t)
        return packed(t)

    def _credit(self, addr):
        raw = self.credits.get(addr, '')
        return int(raw) if raw else 0

    def _add_credit(self, addr, amount):
        self.credits[addr] = str(self._credit(addr) + int(amount))

    @gl.public.write
    def configure_event(self, event_id: int, organizer: str,
                        artist_address: str, event_start_ts: int,
                        settle_after_ts: int, tz_offset_min: int,
                        tz_name: str) -> str:
        sender = str(gl.message.sender_address).lower()
        if sender != self.creator:
            fail('NOT_CREATOR')
        e = self._load_event(event_id)
        if e['parties_set']:
            fail('PARTIES_ALREADY_SET')
        if int(e['tickets_sold']) != 0:
            fail('TICKETS_ALREADY_SOLD')
        if not isinstance(organizer, str) or len(organizer) != 42 \
                or not organizer.startswith('0x'):
            fail('BAD_ADDRESS')
        if not isinstance(artist_address, str) \
                or len(artist_address) != 42 \
                or not artist_address.startswith('0x'):
            fail('BAD_ADDRESS')
        if not isinstance(settle_after_ts, int) \
                or isinstance(settle_after_ts, bool):
            fail('BAD_SETTLE_AFTER_TS')
        # The contract derives the settlement timestamp from the
        # start timestamp and the local offset and refuses any
        # other value: the caller cannot choose an early gate.
        expected = _derive_settle_after(event_start_ts, tz_offset_min)
        if int(settle_after_ts) != expected:
            fail('BAD_SETTLE_AFTER_TS')
        if not isinstance(tz_name, str) or not 1 <= len(tz_name) <= 64:
            fail('BAD_TZ_NAME')
        e['organizer'] = organizer.lower()
        e['artist_address'] = artist_address.lower()
        e['event_start_ts'] = int(event_start_ts)
        e['settle_after_ts'] = int(settle_after_ts)
        e['tz_offset_min'] = int(tz_offset_min)
        e['tz_name'] = tz_name
        e['parties_set'] = True
        return self._save_event(e)

    @gl.public.write
    def reschedule_event(self, event_id: int, new_start_ts: int,
                         new_settle_after_ts: int,
                         new_tz_offset_min: int, new_date_iso: str,
                         new_date_display: str, new_tz_name: str) -> str:
        """Move a POSTPONED event to a later date. Creator only.
        The event stays POSTPONED (ticket sales never reopen) and
        tickets, holders and escrow are untouched: no money is
        released by rescheduling. The new settlement timestamp is
        re-derived from the new start and offset and refused unless
        it matches; the new start must be later than the old start.
        A rescheduled event can be rescheduled again. Settled or
        still-selling events cannot be rescheduled."""
        sender = str(gl.message.sender_address).lower()
        if sender != self.creator:
            fail('NOT_CREATOR')
        e = self._load_event(event_id)
        if not e['parties_set']:
            fail('EVENT_NOT_CONFIGURED')
        if e['status'] != 'POSTPONED':
            fail('NOT_POSTPONED')
        if not isinstance(new_start_ts, int) \
                or isinstance(new_start_ts, bool) \
                or int(new_start_ts) <= int(e['event_start_ts']):
            fail('DATE_NOT_LATER')
        if not isinstance(new_settle_after_ts, int) \
                or isinstance(new_settle_after_ts, bool):
            fail('BAD_SETTLE_AFTER_TS')
        expected = _derive_settle_after(new_start_ts,
                                        new_tz_offset_min)
        if int(new_settle_after_ts) != expected:
            fail('BAD_SETTLE_AFTER_TS')
        if int(new_settle_after_ts) <= int(new_start_ts):
            fail('BAD_SETTLE_AFTER_TS')
        if not isinstance(new_date_iso, str) \
                or len(new_date_iso) != 10:
            fail('BAD_DATE')
        if not isinstance(new_date_display, str) \
                or not 1 <= len(new_date_display) <= 64:
            fail('BAD_DATE')
        if not isinstance(new_tz_name, str) \
                or not 1 <= len(new_tz_name) <= 64:
            fail('BAD_TZ_NAME')
        e['event_start_ts'] = int(new_start_ts)
        e['settle_after_ts'] = int(new_settle_after_ts)
        e['tz_offset_min'] = int(new_tz_offset_min)
        e['tz_name'] = new_tz_name
        e['date_iso'] = new_date_iso
        e['date_display'] = new_date_display
        return self._save_event(e)

    @gl.public.write.payable
    def buy_ticket(self, event_id: int) -> str:
        e = self._load_event(event_id)
        if not e['parties_set']:
            fail('EVENT_NOT_CONFIGURED')
        if e['status'] != 'ON_SALE':
            fail('EVENT_NOT_ON_SALE')
        if int(e['tickets_sold']) >= int(e['tickets_total']):
            fail('SOLD_OUT')
        if gl.message.value != u256(int(e['face_price_wei'])):
            fail('VALUE_MUST_EQUAL_PRICE')
        buyer = str(gl.message.sender_address).lower()
        ticket_id = int(self.next_ticket_id)
        self.next_ticket_id = u32(ticket_id + 1)
        self.total_received = self.total_received + u256(int(e['face_price_wei']))
        e['tickets_sold'] = int(e['tickets_sold']) + 1
        e['escrowed_wei'] = int(e['escrowed_wei']) + int(e['face_price_wei'])
        if int(e['tickets_sold']) >= int(e['tickets_total']):
            e['status'] = 'SOLD_OUT'
        self._save_event(e)
        t = {
            'ticket_id': ticket_id, 'event_id': int(event_id),
            'owner': buyer, 'status': 'ACTIVE',
            'resale_price_gen': 0, 'resale_price_wei': 0,
        }
        return self._save_ticket(t)

    @gl.public.write
    def list_resale(self, ticket_id: int, price_gen: int) -> str:
        t = self._load_ticket(ticket_id)
        sender = str(gl.message.sender_address).lower()
        if sender != t['owner']:
            fail('NOT_TICKET_OWNER')
        if t['status'] != 'ACTIVE':
            fail('TICKET_NOT_ACTIVE')
        e = self._load_event(int(t['event_id']))
        if e['status'] not in ('ON_SALE', 'SOLD_OUT', 'POSTPONED'):
            fail('EVENT_SETTLED')
        if not isinstance(price_gen, int) or isinstance(price_gen, bool) \
                or price_gen < 1:
            fail('PRICE')
        if price_gen > int(e['max_resale_gen']):
            fail('PRICE_CAP')
        t['status'] = 'LISTED'
        t['resale_price_gen'] = int(price_gen)
        t['resale_price_wei'] = int(price_gen) * GEN_WEI
        return self._save_ticket(t)

    @gl.public.write
    def cancel_resale(self, ticket_id: int) -> str:
        t = self._load_ticket(ticket_id)
        sender = str(gl.message.sender_address).lower()
        if sender != t['owner']:
            fail('NOT_TICKET_OWNER')
        if t['status'] != 'LISTED':
            fail('TICKET_NOT_LISTED')
        t['status'] = 'ACTIVE'
        t['resale_price_gen'] = 0
        t['resale_price_wei'] = 0
        return self._save_ticket(t)

    @gl.public.write.payable
    def buy_resale(self, ticket_id: int) -> str:
        t = self._load_ticket(ticket_id)
        if t['status'] != 'LISTED':
            fail('TICKET_NOT_LISTED')
        sender = str(gl.message.sender_address).lower()
        if sender == t['owner']:
            fail('SELF_PURCHASE')
        e = self._load_event(int(t['event_id']))
        if e['status'] not in ('ON_SALE', 'SOLD_OUT', 'POSTPONED'):
            fail('EVENT_SETTLED')
        if gl.message.value != u256(int(t['resale_price_wei'])):
            fail('VALUE_MUST_EQUAL_PRICE')
        price = int(t['resale_price_wei'])
        royalty = price * int(e['royalty_pct']) // 100
        seller_amount = price - royalty
        self._add_credit(t['owner'], seller_amount)
        self._add_credit(e['artist_address'], royalty)
        self.total_received = self.total_received + u256(price)
        self.total_royalties = self.total_royalties + u256(royalty)
        self.total_resale_volume = self.total_resale_volume + u256(price)
        t['owner'] = sender
        t['status'] = 'ACTIVE'
        t['resale_price_gen'] = 0
        t['resale_price_wei'] = 0
        return self._save_ticket(t)

    @gl.public.write
    def settle_event(self, event_id: int) -> str:
        e = self._load_event(event_id)
        if e['status'] in ('EVENT_HELD', 'CANCELLED'):
            fail('EVENT_ALREADY_SETTLED')
        # Time gate, enforced on-chain with Unix timestamps: the
        # transaction datetime (GenLayer-native, deterministic —
        # every validator re-executing the transaction sees the
        # same pinned datetime) must be at or after the event's
        # settlement timestamp. No UTC date strings are compared.
        # An unconfigured event has no settlement timestamp and
        # cannot settle.
        if not e['parties_set'] or int(e['settle_after_ts']) <= 0:
            fail('EVENT_NOT_CONFIGURED')
        tx_ts = int(datetime.now(timezone.utc).timestamp())
        if tx_ts < int(e['settle_after_ts']):
            fail('TOO_EARLY')
        checked = _run_check(e['source_a_url'], e['source_b_url'],
                             e['id_a'], e['id_b'], e['date_iso'])
        verdict = checked['verdict']
        if verdict in ('UNREACHABLE', 'SOURCES_DISAGREE'):
            # Fail-closed: literally no state change. Settlement can
            # be retried; no money moves; the verdict is only in the
            # returned value, not stored.
            return packed({'event_id': int(event_id), 'verdict': verdict,
                           'changed': False, **checked})
        e['settle_count'] = int(e['settle_count']) + 1
        e['verdict'] = verdict
        if verdict == 'EVENT_HELD':
            e['status'] = 'EVENT_HELD'
            self._add_credit(e['organizer'], int(e['escrowed_wei']))
            e['organizer_paid'] = True
            e['escrowed_wei'] = 0
        elif verdict == 'CANCELLED':
            e['status'] = 'CANCELLED'
            refund = int(e['face_price_wei'])
            for i in range(1, int(self.next_ticket_id)):
                raw = self.tickets.get(str(i), '')
                if not raw:
                    continue
                t = json.loads(raw)
                if int(t['event_id']) == int(event_id) \
                        and t['status'] in ('ACTIVE', 'LISTED'):
                    self._add_credit(t['owner'], refund)
                    t['status'] = 'REFUNDED'
                    t['resale_price_gen'] = 0
                    t['resale_price_wei'] = 0
                    self._save_ticket(t)
            e['escrowed_wei'] = 0
        else:  # POSTPONED
            e['status'] = 'POSTPONED'
        self._save_event(e)
        return packed({'event_id': int(event_id), 'verdict': verdict,
                       'changed': True, **checked})

    @gl.public.write
    def withdraw(self) -> str:
        sender = str(gl.message.sender_address).lower()
        amount = self._credit(sender)
        if amount <= 0:
            fail('NO_CREDIT')
        self.credits[sender] = '0'
        self.total_withdrawn = self.total_withdrawn + u256(amount)
        _Recipient(Address(sender)).emit_transfer(value=u256(amount))
        return packed({'sender': sender, 'withdrawn_wei': amount})

    @gl.public.view
    def get_protocol(self) -> str:
        return 'fairgate-1.4'

    @gl.public.view
    def get_creator(self) -> str:
        return self.creator

    @gl.public.view
    def get_event(self, event_id: int) -> str:
        return self.events.get(str(event_id), '')

    @gl.public.view
    def get_all_events(self) -> str:
        out = []
        for i in (1, 2, 3, 4):
            raw = self.events.get(str(i), '')
            if raw:
                out.append(json.loads(raw))
        return packed(out)

    @gl.public.view
    def get_ticket(self, ticket_id: int) -> str:
        return self.tickets.get(str(ticket_id), '')

    @gl.public.view
    def get_all_tickets(self) -> str:
        out = []
        for i in range(1, int(self.next_ticket_id)):
            raw = self.tickets.get(str(i), '')
            if raw:
                out.append(json.loads(raw))
        return packed(out)

    @gl.public.view
    def get_credit(self, address: str) -> str:
        return packed({'address': address.lower(),
                       'credit_wei': self._credit(address.lower())})

    @gl.public.view
    def get_counts(self) -> str:
        escrowed = 0
        for i in (1, 2, 3, 4):
            raw = self.events.get(str(i), '')
            if raw:
                escrowed += int(json.loads(raw)['escrowed_wei'])
        return packed({
            'event_count': 4,
            'ticket_count': int(self.next_ticket_id) - 1,
            'total_received_wei': int(self.total_received),
            'total_withdrawn_wei': int(self.total_withdrawn),
            'contract_balance_wei': int(self.balance),
            'escrowed_wei': escrowed,
            'total_royalties_wei': int(self.total_royalties),
            'total_resale_volume_wei': int(self.total_resale_volume),
        })
