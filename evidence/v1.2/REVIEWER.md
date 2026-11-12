# FairGate — Reviewer pack

## Claim

FairGate sells concert tickets as on-chain stubs with a hard resale
cap (11 GEN on a 10 GEN face price) and a 10% artist royalty, and
settles escrowed ticket money by consensus on whether the show was
held, cancelled or postponed. Four real concerts, fixed in the
contract: Oasis Live '25 at Wembley (HELD), Future & Metro Boomin
at Bridgestone Arena, Nashville (CANCELLED), KATSEYE at Target
Center, Minneapolis (POSTPONED), and Pentatonix at Bridgestone
Arena, Nashville, 9 Dec 2026 (ON_SALE — live, unsettled).

## Contract

- Address: [0x38b0aE26d0C6DE7F5C8418368a2dc10f4d843E5E](https://explorer-studio.genlayer.com/address/0x38b0aE26d0C6DE7F5C8418368a2dc10f4d843E5E)
- Deploy tx: [0xb022a4db…](https://explorer-studio.genlayer.com/tx/0xb022a4db01dd729942e7e9c7ba87c304373129869dd7500732bbb6fe259382f6)
- Source SHA-256: `51a4059beb9e72be889b6096577581d7947ed71f903b9b2faf236a43a6c414df`
- Byte parity: `node scripts/byte_parity.mjs` (deployed code == repo source)

## Fastest re-check (5 minutes)

1. `node scripts/byte_parity.mjs` — deployed code matches `contracts/fairgate.py`.
2. `node scripts/verify_evidence.mjs` — re-reads every evidence transaction live and re-checks the final readback against EXPECTED.md.
3. Open the live site and wait for the FINALIZED readback: the three settled posters show their verdicts, the Pentatonix poster shows ON_SALE with tickets to buy, and the ledger shows 92 GEN in, 72 GEN out, 20 GEN live E3 escrow.

## Anchors (the verdict reads these pages)

| Event | Source A (venue official) | Source B (independent) |
|-------|---------------------------|------------------------|
| Oasis Live '25, Wembley, 25 Jul 2025 | http://www.wembleystadium.com/events/2025/OASIS | https://wembleypark.com/things-to-do/ultimate-guide-to-oasis-at-wembley-stadium/ |
| Future & Metro Boomin, Bridgestone Arena, 6 Aug 2024 | https://www.bridgestonearena.com/events/detail/future-metro-boomin-we-trust-you-tour | https://do615.com/events/2024/8/6/future-metro-boomin-we-trust-you-tour-tickets |
| KATSEYE, Target Center, 7 Nov 2026 | https://www.targetcenter.com/events/detail/katseye | https://www.musictimes.com/articles/113245/20261109/katseye-postpone-chicago-minneapolis-shows-megan-recovers-concussion.htm |
| Pentatonix, Bridgestone Arena, 9 Dec 2026 | https://www.bridgestonearena.com/events/detail/pentatonix-christmas-in-the-city-tour | https://do615.com/events/2026/12/9/pentatonix-christmas-in-the-city-tour-tickets |

Verdict rule (deterministic, no LLM): each source must first
confirm it is the right event (artist + venue named on the page);
then both sources fetched, neither contains
"cancelled"/"canceled"/"postpone"/"reschedule" → EVENT_HELD.
Both contain a cancel word → CANCELLED. Both contain a postpone word
→ POSTPONED. A fetch failure, a failed identity check, or
disagreement settles nothing. Settlement is also refused on-chain
before the day after the event date (transaction datetime gate):
an early attempt fails with TOO_EARLY.

## Evidence transactions

| # | Step | Transaction |
|---|------|-------------|
| 1 | neg0-not-creator | [0xee1180bc…](https://explorer-studio.genlayer.com/tx/0xee1180bc71385e68f6f770b84830655dbe2a3082d260edafe19012bb4409b8b2) |
| 2 | neg14-bad-address | [0xbdb22861…](https://explorer-studio.genlayer.com/tx/0xbdb22861d142f31d24baca5829600c7c9fd46455f482e291bc73b57ecb15befc) |
| 3 | neg12-buy-unconfigured | [0x0de2889f…](https://explorer-studio.genlayer.com/tx/0x0de2889f6b46382b6ee7bc5f74cf7e3b88297d52bec0381092e7caf153184bcd) |
| 4 | cfg-e1 | [0x162752bb…](https://explorer-studio.genlayer.com/tx/0x162752bb035bc225ee4ce354ebec5969c8819bae2b23bf85111229b1c95612a6) |
| 5 | cfg-e2 | [0xff88a5a7…](https://explorer-studio.genlayer.com/tx/0xff88a5a724726c3e0ddb562e811f7c87ab7b1ef5a73c82afa6332bf8bd2a4513) |
| 6 | cfg-e3 | [0xc6177fce…](https://explorer-studio.genlayer.com/tx/0xc6177fce75493a0a3760b41f3124e117b48b8aa1076d7ffa3231fb4b312892de) |
| 7 | cfg-e4 | [0x552e1cba…](https://explorer-studio.genlayer.com/tx/0x552e1cba57a1bd761603f3b3e0fe9859e1874ce50dbe6f3c00cfbfdd411dad94) |
| 8 | t1-buy | [0xceaa56b3…](https://explorer-studio.genlayer.com/tx/0xceaa56b3bc9994a2b5d5e847d84c8f17038c3c6d405d80809551190802a1b741) |
| 9 | t2-buy | [0x54618ca0…](https://explorer-studio.genlayer.com/tx/0x54618ca0b9afee723b27aa71d14c31c4f3662a41751a85b36c6c477f66af2666) |
| 10 | t3-buy | [0x8a05db78…](https://explorer-studio.genlayer.com/tx/0x8a05db7881e83833199a7dc0b99d5f8f2bcedf145609f913e01f3532df12004e) |
| 11 | t4-buy | [0x9a9a29d8…](https://explorer-studio.genlayer.com/tx/0x9a9a29d862d00c280b56085ef10f9ba551ecb3233b33f7218208755ead58650f) |
| 12 | t5-buy | [0x8af7fb6b…](https://explorer-studio.genlayer.com/tx/0x8af7fb6b87a5ac47b18fbbc18c764ddf1bac4e5e52f0700f1a7bc331122f3e80) |
| 13 | t6-buy | [0x96d7dd05…](https://explorer-studio.genlayer.com/tx/0x96d7dd05d09d9d84c430c06de70dd52bf83e7d0cc6a8a4a73ad6c6dc8a2066bd) |
| 14 | r1-list | [0xf59e9906…](https://explorer-studio.genlayer.com/tx/0xf59e99064cbca1e3f574d2d149cd5800b5d514513bee8742a6bd284a2ab66e90) |
| 15 | r1-buy | [0x111fdcae…](https://explorer-studio.genlayer.com/tx/0x111fdcae1eb7e9ca02829a3b6047145397f67a7788a5a050ee9d6849b4b9c376) |
| 16 | r2-list | [0x408cb005…](https://explorer-studio.genlayer.com/tx/0x408cb0058c23400acebbc125a5497e3d46914b651e400ece871a8acc9bdcc10d) |
| 17 | r2-buy | [0xb29ee443…](https://explorer-studio.genlayer.com/tx/0xb29ee443e1d4fe162fc20b080d170e665fd1d5749bdd71c4ded18481e59bf44d) |
| 18 | r3-list | [0x78fa5f23…](https://explorer-studio.genlayer.com/tx/0x78fa5f23a971191fddf7762e23becf22a15870d1a5077673e7fa7178aefc0bb1) |
| 19 | r4-list | [0x5d0e4078…](https://explorer-studio.genlayer.com/tx/0x5d0e40780cd455e48cf57d81a0d6cab29b1d9f836915bcb9113b76816247537e) |
| 20 | r4-buy | [0xb32300e5…](https://explorer-studio.genlayer.com/tx/0xb32300e51ac6eb7698d831ab382cec4ec33b53cb917377b2bc9b4dd4d8412fff) |
| 21 | neg3-stranger-list | [0x67026184…](https://explorer-studio.genlayer.com/tx/0x6702618414b6d36ebd95d010ac2fce82dee67f06eeaa4a3bfc3885a0f840324b) |
| 22 | neg4-over-cap | [0xc80233e5…](https://explorer-studio.genlayer.com/tx/0xc80233e5fa7ffa53373dfbb7f30c98770fbde7e5ec1a64ef7e29966fe12f2a4b) |
| 23 | neg6-list | [0xc1ef0930…](https://explorer-studio.genlayer.com/tx/0xc1ef09308222d03a32aa5a3d1fc8f001c9ddc624fab4840c9fc2ced24e6a3177) |
| 24 | neg6-self-buy | [0x8ad67763…](https://explorer-studio.genlayer.com/tx/0x8ad67763c05adfd860c9637ef12fa8142240b017acba4c7f3de7fd17a7b23e9e) |
| 25 | neg6-cancel | [0x0bcc3161…](https://explorer-studio.genlayer.com/tx/0x0bcc3161ad9a1bbe31c07830d803391ac4fe3a84838a921c05f5395ec89bc595) |
| 26 | neg5-not-listed | [0x5f9dc81f…](https://explorer-studio.genlayer.com/tx/0x5f9dc81f5a04ba18cd2e8b75e001176438ed47fb49596f3b0e5ba6c7c74a82c9) |
| 27 | neg2-wrong-value | [0x0fd0d285…](https://explorer-studio.genlayer.com/tx/0x0fd0d2851c65f8be75516615592e5bbae05fde941e396635ae96bec99ba2e1a8) |
| 28 | neg1-unknown-event | [0x7ab02c82…](https://explorer-studio.genlayer.com/tx/0x7ab02c82645d265414fd4f8b3852bf6b7dfa370a26278144063e429fc6b22938) |
| 29 | neg13-early-settle-e3 | [0x20f2bb1a…](https://explorer-studio.genlayer.com/tx/0x20f2bb1ab9c5c8ac9db2364cf20d84096ceefa4c5dfbc9c66e6bd5cadf20f6b8) |
| 30 | s1-settle-e1 | [0x75cd8d29…](https://explorer-studio.genlayer.com/tx/0x75cd8d2962c6d5e4024e0763c133190eba1a82a7cbba17f0a57e5e3da04578d8) |
| 31 | s2-settle-e2 | [0x2ec52ad0…](https://explorer-studio.genlayer.com/tx/0x2ec52ad0227a90cf85f748c41b9fe84b2d92f90c4ec236380991676de1a9aec0) |
| 32 | s3-settle-e4 | [0xe8bc2e61…](https://explorer-studio.genlayer.com/tx/0xe8bc2e6180eff1153d9b57b9e27cbd15138b86113afb1b47084af581f2d5dd23) |
| 33 | s3b-resettle-e4 | [0x92959238…](https://explorer-studio.genlayer.com/tx/0x929592387154185c68b658d75f7e64737c6f17ac390ddc341609f14ed1256c29) |
| 34 | neg9-double-settle | [0x31d44a71…](https://explorer-studio.genlayer.com/tx/0x31d44a71987fa75fbd0238bc41ef3a2ae72882ff5a0ff13cbbced80dcdb15134) |
| 35 | neg11-buy-held | [0x89522f2c…](https://explorer-studio.genlayer.com/tx/0x89522f2cf5461740ad9f5b7d15b4fee714d28ed2834ddba6ef72750101f1eb56) |
| 36 | neg10-list-refunded | [0xdfd839b9…](https://explorer-studio.genlayer.com/tx/0xdfd839b93984b6f9b65297c7383e3301713c98fb7fb23d3512b7b8e416e4544c) |
| 37 | neg7-stranger-withdraw | [0x3dd4205c…](https://explorer-studio.genlayer.com/tx/0x3dd4205ca8eae1eaa177f0cbd1ad7e6cb5a1d3a70fe80b1b3b16322a7a1376d2) |
| 38 | w-org | [0x5e138ea5…](https://explorer-studio.genlayer.com/tx/0x5e138ea5e7d93987f87cfd03a7abac8dca3bfef366867b7ee8a47b2cd8b95f2c) |
| 39 | w-art | [0x1c7cf496…](https://explorer-studio.genlayer.com/tx/0x1c7cf4967ca893f2f40ddc671d53f20afe45cb8f050f78190ed6408f975ff9a1) |
| 40 | w-b1 | [0xea99a0d5…](https://explorer-studio.genlayer.com/tx/0xea99a0d57f63b4b6a95a49fbdada7b6df624db63924a4b4407b33d4932dd2a3e) |
| 41 | w-b2 | [0xa8e1eb5f…](https://explorer-studio.genlayer.com/tx/0xa8e1eb5f2c4fea8d078c7c367832b0e43ecc1dafcd95464ff6875d2b45f29e79) |
| 42 | neg8-double-withdraw | [0x1a3b56d8…](https://explorer-studio.genlayer.com/tx/0x1a3b56d826df7fce2d40b91aedea27cf67ce916a5340d0d1a1fd9f2333e12910) |

## Adversarial cases

See EVIDENCE.md: 15 negatives, all with exact on-chain error codes
(incl. NOT_CREATOR on configure, TOO_EARLY on early settlement,
PRICE_CAP at 12 GEN, SELF_PURCHASE, EVENT_ALREADY_SETTLED,
TICKET_NOT_ACTIVE, NO_CREDIT on double withdrawal). Failed payables
were sent with 0 GEN; the 20 GEN contract balance is exactly E3's
live ticket escrow, not stranded value.

## What this project does not prove

- E3 (Pentatonix, 9 Dec 2026) is not settled in this run; its verdict
  will be decided after the real date. An early settlement attempt
  is refused on-chain (TOO_EARLY) and the settle button stays
  disabled until the day after the show.
- The verdict reads the live pages at settlement time; if a source
  page is rewritten, the verdict follows the new text.
- The on-chain ticket is a payment and settlement record, not a
  venue entry credential.
