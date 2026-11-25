# FairGate v2 — independent concert box offices

The accepted v1.5 baseline is commit [`6a81d5be523ea813ded7d1660707bc9f988e1c83`](https://github.com/chuanqili77/fairgate-genlayer/tree/6a81d5be523ea813ded7d1660707bc9f988e1c83) and Stable Studionet deployment `0x0c1327e107D6DA6f1ec6499b159576c7bAF721EE`. [Open the legacy desk](https://chuanqili77.github.io/fairgate-genlayer/?legacy=1) to inspect older tickets and withdraw existing v1.5 credits. The v2 deployment has its own state. Balances, tickets and permissions do not migrate.

## What changed

- `create_event` lets the signing organizer open a box office, with the artist royalty recipient, venue, local start time and two published evidence references recorded on-chain.
- Event metadata and evidence sources bind when the event opens. Sources must use different approved hostnames and expected public paths. The current policy supports six specific publishers, and it does not authenticate organizer affiliation or editorial independence. The same published event can appear in multiple organizer listings.
- The contract restricts rescheduling of postponed events to their organizer. Rescheduling is contract-only in this release; the recorded v2 transactions demonstrate a rejected cross-organizer edit, not a successful reschedule. Purchases, ticket ownership and escrow remain scoped to their event. Cancellation enumerates only that event’s indexed tickets.
- Validators still independently fetch both sources. Positive matching evidence is required to credit held-event escrow to the organizer. Matching cancellation evidence credits the current holders. An unavailable source or disagreement keeps escrow unchanged.
- The concert desk loads real event records into a selectable line-up. The ticket tilts with pointer movement and flips to show the selected event’s stored verdict, organizer and escrow. The same event drives the box office and source controls. Dedicated views handle resale, owned tickets, organizer registration, ledger and transaction evidence.

## Reproduction

```sh
npm ci
npm test
npx tsc --noEmit
npm run build
npm run check-clean
uv tool run --from genvm-linter==0.11.0 genvm-lint check contracts/fairgate_v2.py
```

Use the Stable Studionet endpoint at `https://studio.genlayer.com/api`, chain 61999. The historic concert entries are retrospective testnet cases, separate from real-world admissions or retail offers.

- [V2 deployment](evidence/deployment-v2.json)
- [Official GenVM lint output](evidence/v2-lint.txt)
- [Initial failed constructor attempt](evidence/v2-deployment-attempts.json)

## Browser acceptance

A Chromium check at 1440 px and 390 px exercised the event list, ticket flip and organizer navigation without horizontal overflow. The browser also created the KATSEYE retrospective listing using the temporary test-wallet path, with a real signed transaction and a latest-final event readback. The separate settlement script signs from SDK test accounts. The screenshots and browser receipt identify the surfaces exercised.

- [Desktop interaction](evidence/v2-desktop.jpg)
- [Narrow-screen interaction](evidence/v2-mobile.jpg)
- [Browser organizer receipt](evidence/v2-browser.json)

## Review on-chain behavior

- [Event 1 · confirmed held](https://explorer-studio.genlayer.com/tx/0x63dbd38102ce91b72411c7211ec6183cb902bb921b9737042fac7e99880d2c47)
- [Event 2 · confirmed cancelled](https://explorer-studio.genlayer.com/tx/0x04fd4479b49d0d50cae49e9526ed2a294320843651de70aafc34123fba46e6e8)
- [Cross-organizer edit · expected rejection](https://explorer-studio.genlayer.com/tx/0x96506dc83b98ba64eb83eea2cdf25d22b99c646f690f2408d005ee49aa71d346)

The deployment is limited to 32 events and eight tickets per event, with six approved publishers. The source matcher recognizes bounded textual evidence forms. Buyers can inspect the organizer, event labels and frozen links before paying. Publication changes or ambiguity can delay settlement. The pending Pentatonix case preserves the earliest settlement boundary from its configured local show date.

The latest-final acceptance snapshot contains **4 events, 6 primary tickets, 1 completed resale and 4 withdrawals**. The ledger reconciles **71 GEN received = 51 GEN withdrawn + 20 GEN in active event escrow**. The cancelled event marked both tickets refunded to the current holders, including the buyer of the resold ticket. The unrelated event retained its 20 GEN escrow throughout.

- [Transaction manifest](evidence/v2-transactions.json)
- [Latest-final state and ledger](evidence/v2-readback.json)
- [Organizer browser creation](evidence/v2-browser-creation.jpg)

Run `node scripts/verify_v2.mjs` to confirm source parity and re-read the recorded receipts and the two terminal events without broadcasting. The archived ledger describes the recorded acceptance state. Later legitimate purchases can increase the live balances.
