# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
"""FairGate: anti-scalper concert tickets + consensus event-outcome
settlement on GenLayer Stable Studionet. Protocol fairgate-1.

One concert type, one tier, one resale rule. Face price is 10 GEN
per ticket. Resale is capped at 110% of face value (11 GEN, code
enforced) and every secondary sale pays a 10% artist royalty
(floor division, deterministic). Ticket money is escrowed in the
contract; consensus decides the event outcome and the money follows
the verdict:

  EVENT_HELD -> escrow pays the organizer
  CANCELLED  -> every current ticket holder is refunded in full
  POSTPONED  -> funds stay locked; the event can be re-settled on a
                new date (re-settlement re-fetches both sources)

Money never moves directly: settlement and resale only record
pull-payment credits; the entitled party withdraws with withdraw().

Anchors (dual source, both fetched independently by every
validator at settlement). The two launch events and their source
URLs are FIXED in this source and byte-frozen at deploy: no one,
including the organizer address, can change what the consensus
reads. That is the whole point — the beneficiary cannot pick the
evidence. A future version with organizer-listed events would need
a source-URL allowlist; v1 does not have one and does not claim one.

  E1 EVENT_HELD: Oasis Live '25, Wembley Stadium, London, 2025-07-25.
     (a) venue official page:
         http://www.wembleystadium.com/events/2025/OASIS
     (b) Wembley Park district guide (independent operator, Quintain;
         not the venue, not the artist, not the promoter):
         https://wembleypark.com/things-to-do/ultimate-guide-to-oasis-at-wembley-stadium/
         It states in plain words: "Update: Oasis played Wembley
         Stadium in 2025."
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

Verdict rule (deterministic code, no LLM anywhere). Each validator
fetches both source pages and scans the raw body, lowercased, for
two word sets: cancel words ("cancelled", "canceled") and postpone
words (stems "postpone", "reschedule", which also match "postponed",
"postponement", "rescheduled", "rescheduling"). The equivalence vector is
(verdict, cancel_a, cancel_b, postpone_a, postpone_b, fetch_a_ok,
fetch_b_ok) — exact equality, no tolerance. The rule:
  - either source fails to fetch (non-200 or request error) ->
    UNREACHABLE (no state change, retryable)
  - both sources contain a cancel word -> CANCELLED
  - both sources contain a postpone word -> POSTPONED
  - neither source contains either word -> EVENT_HELD
  - anything else (sources disagree) -> SOURCES_DISAGREE
    (no state change, retryable)
HELD has no explicit "held" word on either source page: the rule
defines HELD as "both sources fetched, neither says cancelled or
postponed". The fetched page text is data, never instructions:
injection text inside a page cannot change the verdict, because
only the four keyword flags are examined.

A failed payable call KEEPS its value in the contract (platform
behavior on Studionet, also observed on LinguaCourt and
CallSettle v1.0). The frontend only ever submits the exact price
to an existing ticket/listing, so that path is unreachable from
the UI, and the evidence run sends 0 GEN on its failed-payable
negatives, so no value is stranded there.

Royalty rounding: royalty = price_wei * 10 // 100. Prices are whole
GEN, so 10% is always exact in wei (10 GEN -> 1 GEN, 11 GEN ->
1.1 GEN, 1 GEN -> 0.1 GEN); the floor division only guards
sub-wei dust, which cannot occur for integer-GEN prices. Seller
receives price - royalty. Every resale conserves exactly
price_wei in credits.

Sender-bound roles: only the ticket owner can list/cancel a
resale; only the entitled party can withdraw its credit; the
organizer/artist payout addresses are set once per event before
the first ticket is sold (configure_event) and can never change
after that; settle_event is open to anyone because the outcome is
decided by consensus, not by the caller. No time gates anywhere
(Studionet has no clock): every transition is an explicit action.
The contract cannot enforce "settle only after the event date";
both launch events already happened (2024/2025), so settlement
timing is not a risk in v1 — see KNOWN_LIMITATIONS in the README.

Known limits (neutral, product-scope):
  * v1 ships exactly two launch events, fixed at deploy. There is
    no organizer listing flow; adding one needs a source-URL
    allowlist so the beneficiary cannot pick its own evidence.
  * The POSTPONED branch is fully implemented (contract, frontend,
    mock tests) but v1 has no on-chain POSTPONED case: no real
    postponed concert with dual fetchable sources was found during
    research (see workdir notes). It activates on the first
    rescheduled launch event.
  * An event has no delist action; a POSTPONED event keeps selling
    nothing new (buys are ON_SALE only) while resale stays open.
"""
from genlayer import *
import json

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


def _scan(text):
    """Keyword flags on one fetched page body (lowercased).

    Cancel words are the two past-tense spellings ("cancelled",
    "canceled") — the forms real cancellation notices use. Postpone
    words are the stems ("postpone", "reschedule"), which also match
    "postponed", "postponement", "rescheduled", "rescheduling".
    The bare stem "cancel" is deliberately NOT a keyword: it appears
    in boilerplate ("cancellation policy") and would false-positive.
    """
    low = text.lower()
    cancel = ('cancelled' in low) or ('canceled' in low)
    postpone = ('postpone' in low) or ('reschedule' in low)
    return cancel, postpone


def _fetch_once(url):
    """One validator's independent fetch + scan. Never raises: a
    fetch failure is reported as ok=False."""
    try:
        response = gl.nondet.web.request(url, method='GET')
    except Exception:
        return {'ok': False, 'cancel': False, 'postpone': False}
    if getattr(response, 'status', 0) != 200:
        return {'ok': False, 'cancel': False, 'postpone': False}
    body = response.body
    if isinstance(body, bytes):
        try:
            text = body.decode('utf-8', errors='ignore')
        except Exception:
            return {'ok': False, 'cancel': False, 'postpone': False}
    elif isinstance(body, str):
        text = body
    else:
        return {'ok': False, 'cancel': False, 'postpone': False}
    cancel, postpone = _scan(text)
    return {'ok': True, 'cancel': cancel, 'postpone': postpone}


def _verdict_from(a, b):
    if not a['ok'] or not b['ok']:
        return 'UNREACHABLE'
    if a['cancel'] and b['cancel']:
        return 'CANCELLED'
    if a['postpone'] and b['postpone']:
        return 'POSTPONED'
    if not a['cancel'] and not b['cancel'] \
            and not a['postpone'] and not b['postpone']:
        return 'EVENT_HELD'
    return 'SOURCES_DISAGREE'


def _validate_check(res):
    if not isinstance(res, dict):
        fail('CHECK_RESULT')
    verdict = res.get('verdict')
    if verdict not in VERDICTS:
        fail('CHECK_VERDICT')
    for k in ('cancel_a', 'cancel_b', 'postpone_a', 'postpone_b',
              'fetch_a_ok', 'fetch_b_ok'):
        if not isinstance(res.get(k), bool):
            fail('CHECK_FLAG')
    ca, cb = res['cancel_a'], res['cancel_b']
    pa, pb = res['postpone_a'], res['postpone_b']
    fa, fb = res['fetch_a_ok'], res['fetch_b_ok']
    if verdict == 'CANCELLED' and not (ca and cb):
        fail('CHECK_CANCELLED')
    if verdict == 'POSTPONED' and not (pa and pb):
        fail('CHECK_POSTPONED')
    if verdict == 'EVENT_HELD' and (ca or cb or pa or pb or not fa or not fb):
        fail('CHECK_HELD')
    if verdict == 'UNREACHABLE' and (fa and fb):
        fail('CHECK_UNREACHABLE')
    if verdict == 'SOURCES_DISAGREE' and (not fa or not fb):
        fail('CHECK_DISAGREE')
    return res


def _run_check(url_a, url_b):
    def leader_fn():
        a = _fetch_once(url_a)
        b = _fetch_once(url_b)
        return _validate_check({
            'verdict': _verdict_from(a, b),
            'cancel_a': a['cancel'], 'cancel_b': b['cancel'],
            'postpone_a': a['postpone'], 'postpone_b': b['postpone'],
            'fetch_a_ok': a['ok'], 'fetch_b_ok': b['ok'],
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
        leader = result.calldata
        if not isinstance(leader, dict):
            return False
        return all(leader.get(k) == mine.get(k) for k in
                   ('verdict', 'cancel_a', 'cancel_b', 'postpone_a',
                    'postpone_b', 'fetch_a_ok', 'fetch_b_ok'))

    return gl.vm.run_nondet_unsafe(leader_fn, validator_fn)


@gl.evm.contract_interface
class _Recipient:
    class View:
        pass

    class Write:
        pass


def _event(artist, venue, city, date_iso, date_display,
           source_a_url, source_a_label, source_b_url, source_b_label):
    return {
        'event_id': 0, 'artist': artist, 'venue': venue, 'city': city,
        'date_iso': date_iso, 'date_display': date_display,
        'source_a_url': source_a_url, 'source_a_label': source_a_label,
        'source_b_url': source_b_url, 'source_b_label': source_b_label,
        'face_price_gen': FACE_PRICE_GEN,
        'face_price_wei': FACE_PRICE_GEN * GEN_WEI,
        'max_resale_gen': MAX_RESALE_GEN, 'royalty_pct': ROYALTY_PCT,
        'tickets_total': TICKETS_PER_EVENT, 'tickets_sold': 0,
        'status': 'ON_SALE', 'verdict': '', 'settle_count': 0,
        'escrowed_wei': 0, 'organizer': '', 'artist_address': '',
        'parties_set': False, 'organizer_paid': False,
    }


class FairGate(gl.Contract):
    events: TreeMap[str, str]
    tickets: TreeMap[str, str]
    credits: TreeMap[str, str]
    next_ticket_id: u32
    total_received: u256
    total_withdrawn: u256
    total_royalties: u256
    total_resale_volume: u256

    def __init__(self):
        self.events = TreeMap()
        self.tickets = TreeMap()
        self.credits = TreeMap()
        self.next_ticket_id = u32(1)
        self.total_received = u256(0)
        self.total_withdrawn = u256(0)
        self.total_royalties = u256(0)
        self.total_resale_volume = u256(0)
        e1 = _event(
            'Oasis', 'Wembley Stadium', 'London',
            '2025-07-25', '25 July 2025',
            'http://www.wembleystadium.com/events/2025/OASIS',
            'Wembley Stadium — official event page',
            'https://wembleypark.com/things-to-do/ultimate-guide-to-oasis-at-wembley-stadium/',
            'Wembley Park — district guide ("Oasis played Wembley Stadium in 2025")')
        e1['event_id'] = 1
        self.events['1'] = packed(e1)
        e2 = _event(
            'Future & Metro Boomin', 'Bridgestone Arena', 'Nashville',
            '2024-08-06', '6 August 2024, 8:00 PM',
            'https://www.bridgestonearena.com/events/detail/future-metro-boomin-we-trust-you-tour',
            'Bridgestone Arena — official event page',
            'https://do615.com/events/2024/8/6/future-metro-boomin-we-trust-you-tour-tickets',
            'do615 — Nashville independent event calendar')
        e2['event_id'] = 2
        self.events['2'] = packed(e2)

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
                        artist_address: str) -> str:
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
        e['organizer'] = organizer.lower()
        e['artist_address'] = artist_address.lower()
        e['parties_set'] = True
        return self._save_event(e)

    @gl.public.write.payable
    def buy_ticket(self, event_id: int) -> str:
        e = self._load_event(event_id)
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
        checked = _run_check(e['source_a_url'], e['source_b_url'])
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
        return 'fairgate-1'

    @gl.public.view
    def get_event(self, event_id: int) -> str:
        return self.events.get(str(event_id), '')

    @gl.public.view
    def get_all_events(self) -> str:
        out = []
        for i in (1, 2):
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
        for i in (1, 2):
            raw = self.events.get(str(i), '')
            if raw:
                escrowed += int(json.loads(raw)['escrowed_wei'])
        return packed({
            'event_count': 2,
            'ticket_count': int(self.next_ticket_id) - 1,
            'total_received_wei': int(self.total_received),
            'total_withdrawn_wei': int(self.total_withdrawn),
            'contract_balance_wei': int(self.balance),
            'escrowed_wei': escrowed,
            'total_royalties_wei': int(self.total_royalties),
            'total_resale_volume_wei': int(self.total_resale_volume),
        })
