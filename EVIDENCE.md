# FairGate V1.4 observations

Deployment and source identity are recorded in [evidence/deployment.json](evidence/deployment.json). The current [transaction manifest](evidence/transactions.json) is incomplete: 32 scripted steps have their expected outcomes, followed by two unsuccessful E1 settlement attempts. Raw finalized receipts are retained in evidence/receipts/.

Both E1 attempts were FINALIZED + MAJORITY_AGREE + leader SUCCESS, but returned changed=false and UNREACHABLE. These are fail-closed observations, not successful EVENT_HELD settlements:

- 0x0d3922bd01b6bb92d313843acc55da98c5c2f44a01cc9ec5fb3a3968684d13e5
- 0xa9fb4c10b554a0c6f5a4b74481bd68a7c946332ff32d357a045167bd08b719db

An independent no-escrow diagnostic contract, 0x224004a3d05bf08bB688006B6E4dC1AB17DcC056, probed the exact frozen Lloyds URL in transaction 0xaa778d113d5fd127f7c218805661b651076ae759146498e5e2d6f6b345166444. The finalized, agreed successful result reported HTTP 200, 24,064 characters and an error-page scoped text of 392 characters containing Error 1007. Both identity and held flags were false. Ordinary local fetching did not reproduce that error; local availability does not establish validator availability.

No E1 organizer payout or complete V1.4 conservation/withdrawal loop is asserted. The prospective EXPECTED.md is retained without changing failed expectations into passes. The initial V1.4 source, manifest and expectations are also preserved in evidence/v1.4-first/.

Historical V1.3 re-verification: 97 PASS, 0 FAIL; 53 scripted and five historical browser transactions. Latest-final ledger was 123 GEN received = 83 withdrawn + 40 escrow/balance. The old source and log are in evidence/v1.3/. This does not validate the old release policy or any V1.4 payout.

Local regression coverage: 156 named Python checks, exhaustive 5120 verdict/flag combinations, and 10 Node transaction-outcome assertions. Fixtures are not chain evidence. TypeScript checking, Python syntax, build and repository hygiene were checked independently from live settlement.
