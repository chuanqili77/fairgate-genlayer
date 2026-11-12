# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
"""FairGate v1.3 probe (NOT the product contract).

Deployed once to answer two questions before the v1.3 product
contract is written:

1. CLOCK: does datetime.now(timezone.utc).timestamp() work in the
   GenVM, returning the same Unix timestamp every validator sees
   for a transaction? The v1.3 settlement time gate compares that
   timestamp against settle_after_ts. The v1.2 probe proved
   datetime.now() works; this probe proves .timestamp() on it.

2. SOURCES: with the NEW scoped extractor (title + meta + JSON-LD
   + body minus nav/footer/aside/recommended), do validators
   fetching the eight anchor URLs still report exactly the
   expected keyword signature AND the event identity tokens?
   A source only counts if its identity tokens are present in the
   scoped text: a page that does not even mention the event cannot
   vote on its outcome.

The probe is not part of the evidence pack; only its results
(recorded separately) inform the v1.3 rule.
"""
from genlayer import *
import json
from datetime import datetime, timezone


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


def _scan(html, id_a, id_b):
    """Keyword flags + identity check on the SCOPED page text
    (lowercased), never on the raw body.

    Cancel words are the two past-tense spellings ("cancelled",
    "canceled") — the forms real cancellation notices use. Postpone
    words are the stems ("postpone", "reschedule"), which also match
    "postponed", "postponement", "rescheduled", "rescheduling".
    The bare stem "cancel" is deliberately NOT a keyword: it appears
    in boilerplate ("cancellation policy") and would false-positive.
    Identity requires the artist token AND the venue token for the
    event to appear in the scoped text: a page that does not mention
    the event cannot vote on its outcome, however many keywords it
    happens to contain.
    """
    scoped = _scoped_text(html)
    low = scoped.lower()
    cancel = ('cancelled' in low) or ('canceled' in low)
    postpone = ('postpone' in low) or ('reschedule' in low)
    identity = (id_a.lower() in low) and (id_b.lower() in low)
    return cancel, postpone, identity


def _probe_once(url, id_a, id_b):
    try:
        response = gl.nondet.web.request(url, method='GET')
    except Exception:
        return {'ok': False, 'status': 0, 'len': 0,
                'cancel': False, 'postpone': False, 'identity': False}
    status = getattr(response, 'status', 0)
    body = response.body
    if isinstance(body, bytes):
        try:
            text = body.decode('utf-8', errors='ignore')
        except Exception:
            text = ''
    elif isinstance(body, str):
        text = body
    else:
        text = ''
    cancel, postpone, identity = _scan(text, id_a, id_b)
    return {'ok': status == 200, 'status': int(status),
            'len': len(text), 'cancel': cancel,
            'postpone': postpone, 'identity': identity}


def _validate(res):
    if not isinstance(res, dict):
        fail('PROBE_RESULT')
    for k in ('ok', 'cancel', 'postpone', 'identity'):
        if not isinstance(res.get(k), bool):
            fail('PROBE_BOOL')
    if not isinstance(res.get('status'), int) \
            or not isinstance(res.get('len'), int):
        fail('PROBE_INT')
    return res


def _run_probe(url, id_a, id_b):
    def leader_fn():
        return _validate(_probe_once(url, id_a, id_b))

    def validator_fn(result):
        if not isinstance(result, gl.vm.Return):
            try:
                leader_fn()
            except Exception:
                return True
            return False
        try:
            mine = _validate(_probe_once(url, id_a, id_b))
        except Exception:
            return False
        leader = result.calldata
        if not isinstance(leader, dict):
            return False
        return all(leader.get(k) == mine.get(k) for k in
                   ('ok', 'status', 'len', 'cancel', 'postpone',
                    'identity'))

    return gl.vm.run_nondet_unsafe(leader_fn, validator_fn)


class Probe3(gl.Contract):
    results: TreeMap[str, str]
    clocks: TreeMap[str, str]
    next_id: u32
    next_clock_id: u32

    def __init__(self):
        self.results = TreeMap()
        self.clocks = TreeMap()
        self.next_id = u32(1)
        self.next_clock_id = u32(1)

    @gl.public.write
    def clock(self) -> str:
        now = datetime.now(timezone.utc)
        try:
            msg_dt = str(gl.message_raw['datetime'])
        except Exception:
            msg_dt = ''
        rec = {'id': int(self.next_clock_id),
               'now_iso': now.isoformat(),
               'today': now.date().isoformat(),
               'unix': int(now.timestamp()),
               'msg_datetime': msg_dt}
        self.clocks[str(int(self.next_clock_id))] = packed(rec)
        self.next_clock_id = u32(int(self.next_clock_id) + 1)
        return packed(rec)

    @gl.public.write
    def probe_url(self, url: str, id_a: str, id_b: str) -> str:
        if not isinstance(url, str) or not 8 <= len(url.strip()) <= 512:
            fail('URL_LENGTH')
        url = url.strip()
        if not url.startswith('http://') and not url.startswith('https://'):
            fail('URL_SCHEME')
        res = _run_probe(url, id_a, id_b)
        rid = int(self.next_id)
        self.next_id = u32(rid + 1)
        rec = {'id': rid, 'url': url, 'id_a': id_a, 'id_b': id_b,
               **res}
        self.results[str(rid)] = packed(rec)
        return packed(rec)

    @gl.public.view
    def get_result(self, rid: int) -> str:
        return self.results.get(str(rid), '')

    @gl.public.view
    def get_all_results(self) -> str:
        out = []
        for i in range(1, int(self.next_id)):
            raw = self.results.get(str(i), '')
            if raw:
                out.append(json.loads(raw))
        return packed(out)

    @gl.public.view
    def get_clock(self, rid: int) -> str:
        return self.clocks.get(str(rid), '')

    @gl.public.view
    def get_protocol(self) -> str:
        return 'fairgate-probe-3'
