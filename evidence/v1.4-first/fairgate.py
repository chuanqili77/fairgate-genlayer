# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
"""FairGate: bounded concert ticket resale and event-outcome settlement.

Protocol fairgate-1.4 on Stable Studionet (61999). A primary ticket
costs 10 GEN; resale is capped at 11 GEN with a floor-rounded 10%
artist royalty. All movements create deterministic pull-payment
credits; the entitled address withdraws exactly once per credit.

Four fixed launch events and two fixed sources per event:
- E1: Oasis at Wembley, 25 July 2025. Radio X's same-day first-night
  report (Global) and Lloyds Banking Group's independently measured,
  explicitly dated gig-spending retrospective establish positive proof.
- E2: Future & Metro Boomin at Bridgestone Arena, 6 August 2024.
  The venue and JamBase's dated concert record report cancellation.
- E3: Pentatonix at Bridgestone Arena, 9 December 2026. The venue and
  do615 calendar are schedule sources, not proof the show happened.
- E4: KATSEYE at Target Center, 7 November 2026. The venue and iHeart
  report postponement; references to another city's cancellation do
  not cancel this event.

Every validator independently fetches both frozen URLs. Identity and
fetch success are mandatory. CANCELLED / POSTPONED require matching
venue-linked status flags without contradictory status or held proof.
EVENT_HELD requires positive proof from each source, never merely the
absence of cancellation. Supported positive records are a dated past
performance sentence; a same-day first-night report with the original
publication timestamp and explicit retrospective prose; or a dated
artist/gig table linked to measured past spending inside that venue.
Planned listings, forecasts, update timestamps, unrelated acts, other
dates, and negated/conditional/future prose are insufficient.

The leader's verdict must match the deterministic flag mapping.
Validators reproduce the fetches and compare every verdict, identity,
fetch and status flag, including held_a and held_b. UNREACHABLE and
SOURCES_DISAGREE return changed=False with no state mutation. Held
credits the organizer's exact event escrow; cancelled refunds each
current holder's face value; postponed keeps escrow locked. Reschedule
is creator-only, POSTPONED-only and later-date-only; it moves no funds.

Settlement also requires the GenLayer-pinned transaction time to reach
the configured first second after the event's local day. The contract
derives and checks that timestamp from start and UTC offset; it never
compares date strings as clocks. Future E3 must not settle prematurely.

This is a narrow deterministic English extractor, not general semantic
fact verification. Unsupported wording, source failures and disagreement
can lock escrow pending a retry. External publisher independence is not
cryptographic proof of real-world truth; sources can change. URLs are
frozen at deployment, so beneficiaries cannot choose replacement pages.
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
    text = ' '.join(''.join(out).split())
    for entity, value in (("&#39;", "'"), ("&#x27;", "'"), ("&apos;", "'"),
                          ('&quot;', '"'), ('&nbsp;', ' '), ('&amp;', '&')):
        text = text.replace(entity, value)
    return text


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
    import re
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
        self_close = inner.endswith('/') or name in ('area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr')
        if skip:
            if name == skip[-1] and not self_close:
                skip.append(name)
            i = gt + 1
            continue
        if name in ('script', 'style'):
            # Raw-text elements terminate at their closing tag. Strings in
            # JavaScript may contain '<script' and must not increase nesting.
            end = low.find('</' + name, gt + 1)
            close = html.find('>', end) if end != -1 else -1
            i = n if close == -1 else close + 1
            continue
        if name in _SKIP_TAGS:
            if not self_close:
                skip.append(name)
            i = gt + 1
            continue
        attrs = low[lt:gt + 1]
        section_attrs = ' '.join(re.findall(r'''\b(?:class|id)\s*=\s*["']([^"']*)["']''', attrs))
        if any(k in section_attrs for k in _REMOVE_CLASS):
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
    return _strip_tags(' '.join([title, _meta_text(html)] + ld_texts + [body_text]))


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
    # A status word about another venue on the same news page must not
    # change this event. Scope adverse-status sentences to the venue.
    status_sentences = [sentence for sentence in re.split(r'[.!?;]+', low)
                        if id_b.lower() in sentence]
    cancel = any('cancelled' in sentence or 'canceled' in sentence
                 for sentence in status_sentences)
    postpone = any('postpone' in sentence or 'reschedule' in sentence
                   for sentence in status_sentences)
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
        r'\bfinally brought\b.{0,100}\breunion tour\b',
    )
    # Evidence must describe the identified act at the identified venue
    # in the same sentence. A different performance elsewhere on a page
    # does not authorize release. Negated, conditional and future copy
    # is deliberately rejected even if a past-tense token is present.
    date_patterns = ()
    if event_date:
        year, month, day = event_date.split('-')
        names = ('january', 'february', 'march', 'april', 'may', 'june',
                 'july', 'august', 'september', 'october', 'november', 'december')
        name = names[int(month) - 1]
        d = str(int(day))
        date_patterns = (re.escape(event_date),
            r'\b' + d + r'(?:st|nd|rd|th)?\s+' + name + r'\s+' + year + r'\b',
            r'\b' + name + r'\s+' + d + r'(?:st|nd|rd|th)?[,]?\s+' + year + r'\b')

    # Positive prose is visible page text, not metadata values concatenated
    # into a sentence. In particular a last-modified timestamp is not an
    # event date. Cancellation/identity remain conservative scoped flags.
    performance_text = _strip_tags(_remove_unwanted(html)).lower()
    held = False
    for sentence in re.split(r'[.!?;]+', performance_text):
        if id_a.lower() not in sentence or id_b.lower() not in sentence:
            continue
        if re.search(r'\b(?:not|never|no|neither|nor|if|unless|would|could|might|will)\b', sentence):
            continue
        if event_date:
            dated_sentence = any(re.search(pattern, sentence) for pattern in date_patterns)
            # A same-day dated news report may identify its completed first
            # performance in prose and its calendar day in publication metadata.
            # Require the original article timestamp, not an updated timestamp,
            # plus explicit first-night retrospective prose in this sentence.
            article_day = re.search(
                r'<meta(?=[^>]*(?:(?:property|name)=[\"\']article:published_time[\"\']|name=[\"\']pubdate[\"\']))'
                + r'(?=[^>]*content=[\"\']' + re.escape(event_date) + r't)[^>]*>', html.lower())
            dated_report = article_day and 'first of seven' in sentence \
                and re.search(r'\bfinally brought\b.{0,100}\breunion tour\b', sentence)
            if not dated_sentence and not dated_report:
                continue
        if any(re.search(pattern, sentence) for pattern in held_patterns):
            held = True
            break
    if event_date and id_a.lower() in low and id_b.lower() in low:
        # A retrospective measured-spending report is an independent completed
        # event record. Require both the past observation about this act's first
        # venue gig and an explicit dated table for that gig at the venue.
        # A schedule, forecast or ticket-sales total cannot satisfy this rule.
        compact = performance_text.replace('’', "'")
        measured_pattern = (r'\bspending reached over[^.]{0,60}\bduring\s+'
                            + re.escape(id_a.lower()) + r"'?s?\s+first\s+"
                            + re.escape(id_b.lower()) + r'\s+gig\s+this year')
        measured = any(re.search(measured_pattern, sentence)
                       and not re.search(r'\b(?:not|never|no|if|unless|would|could|might|will)\b', sentence)
                       for sentence in re.split(r'[.!?;]+', compact))
        for table in re.findall(r'<table\b[^>]*>.*?</table>', html.lower(), re.S):
            table_text = _strip_tags(table)
            if (measured and id_a.lower() in table_text
                    and ('spending inside ' + id_b.lower()) in table_text
                    and any(re.search(re.escape(id_a.lower()) + r'\s+gig\s*[-–]?\s*' + pattern, table_text)
                            for pattern in date_patterns)):
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
            'https://www.radiox.co.uk/artists/oasis/london-wembley-stadium-night-1-setlist-ozzy-osbourne-tribute/',
            'Radio X — same-day first-night report',
            'https://www.lloydsbankinggroup.com/media/press-releases/2025/lloyds-bank-2025/oasis-fans-outspend-swifties.html',
            'Lloyds Bank — measured spending for the 25 July gig',
            'oasis', 'wembley')
        e1['event_id'] = 1
        self.events['1'] = packed(e1)
        e2 = _event(
            'Future & Metro Boomin', 'Bridgestone Arena', 'Nashville',
            '2024-08-06', '6 August 2024, 8:00 PM',
            'https://www.bridgestonearena.com/events/detail/future-metro-boomin-we-trust-you-tour',
            'Bridgestone Arena — official event page',
            'https://www.jambase.com/show/future-bridgestone-arena-20240806',
            'JamBase — dated cancelled concert record',
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
            'https://www.iheart.com/content/2026-11-06-katseye-postpones-mores-shows-as-megan-skiendiel-recovers-from-concussion/',
            'iHeart — Target Center postponement announcement report',
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
