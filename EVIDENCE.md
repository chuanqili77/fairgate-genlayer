# FairGate evidence scope

The current canonical source is fairgate-1.4 and has not been deployed. Its source hash is recorded in evidence/source-status.json. No V1.4 transaction, consensus result, or finalized payout is asserted.

The V1.3 contract is 0x8883831222208CcbAf34DAcb8ac08f167edA6c6C, deployed by 0xaaf1e0d5764a083372676cc667eb89bc8ddefa8cd624a80866ab597841e7ef3b. Its original source, expectations, evidence, reviewer notes and transaction manifests are preserved in evidence/v1.3/. Those historical transactions concern the old release rule and cannot validate the corrected positive-evidence rule.

Local validation: npm test executes 140 named checks, including the actual contract state machine and an exhaustive 5120 verdict/boolean-evidence combinations. Fixtures test independent leader/validator fetching, rejection of forged EVENT_HELD, unchanged escrow/tickets/credits for unavailable or contradictory sources, authorized organizer withdrawal and repeat-withdrawal rejection. Mock fixtures are not live consensus.

The revised E1 official retrospective URL is historical, but its text describes the last Wembley show of the season. The second source says Oasis played Wembley in 2025 and separately lists planned dates. These statements do not explicitly bind a completed performance to 25 July 2025. The corrected dated rule must fail closed until both fixed sources supply sufficient evidence; no successful E1 release is claimed.

The default verifier refuses current-source verification while the deployment manifest still describes old code. The explicit --historical-v13 mode audits old receipts and old state only. New sales and settlement in the revised frontend require fairgate-1.4; existing withdrawals remain available on the historical deployment.

## Historical V1.3 re-verification

Read-only independent verification on 2026-11-13 (Asia/Shanghai): 97 PASS, 0 FAIL, covering 53 scripted and 5 historical browser transactions. Archived canonical source matches the deployed code byte-for-byte. Latest-final ledger is 123 GEN received = 83 GEN withdrawn + 40 GEN balance/escrow (E3 30 GEN, E4 10 GEN). No new transaction was sent. This historical execution result does not establish correctness of the old release policy or prove any V1.4 behavior. Log: evidence/v1.3/verification-2026-11-13.txt.
