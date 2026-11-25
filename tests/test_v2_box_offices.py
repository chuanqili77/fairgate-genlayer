"""Local regression for organizer permissions and event-scoped refunds."""
import json
from pathlib import Path
from types import SimpleNamespace
import unittest


class UserError(Exception):
    pass


class BoxOffices(unittest.TestCase):
    def setUp(self):
        write = lambda fn: fn
        self.message = SimpleNamespace(sender_address='0x' + '1' * 40, value=10**19)
        gl = SimpleNamespace(Contract=object, message=self.message,
                             vm=SimpleNamespace(UserError=UserError),
                             evm=SimpleNamespace(contract_interface=lambda cls: cls),
                             public=SimpleNamespace(write=SimpleNamespace(payable=write), view=write))
        class Write:
            payable = staticmethod(write)
            def __call__(self, fn): return fn
        gl.public.write = Write()
        self.ns = dict(gl=gl, TreeMap=dict, u256=int, u32=int)
        source = (Path(__file__).parents[1] / 'contracts/fairgate_v2.py').read_text()
        exec(compile(source.replace('from genlayer import *', ''), 'fairgate_v2.py', 'exec'), self.ns)
        self.app = self.ns['FairGate']()
        self.app.event_tickets = {}
        self.app.balance = 0
        self.sources = ('https://www.radiox.co.uk/artists/sample', 'https://www.independent.co.uk/bulletin/culture/sample')

    def create(self, signer, sources=None):
        self.message.sender_address = signer
        return json.loads(self.app.create_event('Act', 'Venue', 'City', '0x' + 'e'*40, 1720000000, -360, *(sources or self.sources)))

    def test_owner_and_source_boundaries(self):
        event = self.create('0x' + '1'*40)
        self.assertEqual(event['organizer'], self.message.sender_address)
        self.assertEqual(event['date_iso'], '2024-07-03')
        with self.assertRaisesRegex(UserError, 'SOURCE_HOSTS_MUST_DIFFER'):
            self.create('0x' + '2'*40, [self.sources[0], self.sources[0]])
        with self.assertRaisesRegex(UserError, 'SOURCE_NOT_APPROVED'):
            self.create('0x' + '2'*40, ['https://www.radiox.co.uk.example.org/artists/sample', self.sources[1]])
        with self.assertRaisesRegex(UserError, 'NOT_ORGANIZER'):
            self.app.reschedule_event(1, 0, 0, 0, '', '', '')
        self.assertEqual(json.loads(self.app.get_counts())['event_count'], 1)

    def test_cancellation_credits_only_selected_event(self):
        self.create('0x' + '1'*40)
        self.create('0x' + '2'*40)
        self.message.sender_address = '0x' + '3'*40
        self.app.buy_ticket(1)
        self.app.buy_ticket(2)
        self.app.buy_ticket(1)
        self.ns['_run_check'] = lambda *_: {'verdict': 'CANCELLED'}
        self.app.settle_event(1)
        self.assertEqual(self.app._credit(self.message.sender_address), 20 * 10**18)
        self.assertEqual(json.loads(self.app.get_ticket(2))['status'], 'ACTIVE')
        self.assertEqual(json.loads(self.app.get_event(2))['escrowed_wei'], 10 * 10**18)
        with self.assertRaisesRegex(UserError, 'EVENT_ALREADY_SETTLED'):
            self.app.settle_event(1)


if __name__ == '__main__':
    unittest.main()
