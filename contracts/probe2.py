# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
"""FairGate v1.2 probe (NOT the product contract).

Deployed once to answer two questions before the v1.2 product
contract is written:

1. CLOCK: does the GenVM on Studionet expose the transaction
   datetime to a contract (datetime.now(timezone.utc) and
   gl.message_raw['datetime'])? The v1.2 settlement date gate
   depends on this. The clock is deterministic: every validator
   re-executing the transaction sees the same transaction
   datetime, so it can be used for comparisons without breaking
   equivalence.

2. SOURCES: can validators fetch each of the eight anchor URLs
   (the six v1.1 anchors plus the two new KATSEYE postponement
   sources) and do the fetched bodies carry exactly the expected
   keyword signature AND the event identity tokens (artist name
   and venue name)? A source only counts if its identity tokens
   are present: a page that does not even mention the event cannot
   vote on its outcome.

The probe is not part of the evidence pack; only its results
(recorded in the workdir notes) inform the v1.2 rule.
"""
from genlayer import *
import json
from datetime import datetime, timezone


def fail(s):
    raise gl.vm.UserError(s)


def packed(x):
    return json.dumps(x, sort_keys=True, separators=(',', ':'))


def _scan(text, id_a, id_b):
    low = text.lower()
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


class Probe2(gl.Contract):
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
        return 'fairgate-probe-2'
