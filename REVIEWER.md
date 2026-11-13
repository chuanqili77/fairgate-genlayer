# FairGate V1.5 — technical review

EVENT_HELD needs positive dated evidence from both independently fetched fixed sources. Silence on cancellation is insufficient. Each validator reproduces the verdict and all fetch, identity, status and held flags. The supported positive records are dated past-performance prose, an original same-day first-night report with retrospective prose, a same-day original weekday-night past-performance report, or measured completed-gig spending paired with the target artist's dated table. Cancellation/postponement signals must concern the target venue. Conflicting or unavailable evidence leaves state unchanged. Deterministic code credits the exact escrow; pull withdrawals pay the entitled address.

## Anchors frozen in canonical source

| Event | Source A | Independent source B |
|---|---|---|
| E1 | https://www.radiox.co.uk/artists/oasis/london-wembley-stadium-night-1-setlist-ozzy-osbourne-tribute/ | https://www.independent.co.uk/bulletin/culture/oasis-tribute-ozzy-osbourne-wembley-b2796354.html |
| E2 | https://www.bridgestonearena.com/events/detail/future-metro-boomin-we-trust-you-tour | https://do615.com/events/2024/8/6/future-metro-boomin-we-trust-you-tour-tickets |
| E3 | https://www.bridgestonearena.com/events/detail/pentatonix-christmas-in-the-city-tour | https://do615.com/events/2026/12/9/pentatonix-christmas-in-the-city-tour-tickets |
| E4 | https://www.targetcenter.com/events/detail/katseye | https://www.iheart.com/content/2026-11-06-katseye-postpones-mores-shows-as-megan-skiendiel-recovers-from-concussion/ |

## Reproduce

Run npm test, npm run build, node scripts/byte_parity.mjs and npm run verify. The verifier re-reads deployment and all recorded transactions, binds each to this deployment and compares latest-final event, ticket, credit and aggregate state. Successful settlements must also return the expected verdict; E1 must return held_a=true and held_b=true with successful identified fetches.

Address: 0x0c1327e107D6DA6f1ec6499b159576c7bAF721EE. Deploy: [0x8e962c49ad96e71b34cd6d80f4af6f3f4da47473cba59a8a17af0257ccafacd6](https://explorer-studio.genlayer.com/tx/0x8e962c49ad96e71b34cd6d80f4af6f3f4da47473cba59a8a17af0257ccafacd6). Source: bb3b2798db8e7a2a094d86a64a0ca21a0619e89852f361d816a32fd920e11991. Live verification: 172 PASS, 0 FAIL.

123 GEN received = 83 GEN withdrawn + 40 GEN contract balance. Escrow: 40 GEN; royalties: 4.3 GEN; resale volume: 43 GEN.

## Limits

The English extractor is deliberately narrow and can reject genuine events phrased differently. Two publishers can be wrong; agreement is not proof of real-world truth. Source pages may change or be unavailable. E3 is a future event and is not prematurely settled; E4 remains postponed/rescheduled. Their escrow is intentional, not stranded failed-call value. No venue-entry credential or off-chain ticket-delivery guarantee is claimed. Failed-payable negatives send zero value. Archived V1.4 observations retain the failed E1 calls and their unreleased escrow; its receipts never count as V1.5 acceptance. Its archived readback recorded 70 GEN escrow and 32 GEN withdrawable resale credits after the source outage. SOLD_OUT and fabricated-validator rejection are covered by local fixtures; they are not represented as successful live business cases.
