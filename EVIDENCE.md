# FairGate V1.5 — reproducible evidence

- Contract: 0x0c1327e107D6DA6f1ec6499b159576c7bAF721EE
- Deployment transaction: [0x8e962c49ad96e71b34cd6d80f4af6f3f4da47473cba59a8a17af0257ccafacd6](https://explorer-studio.genlayer.com/tx/0x8e962c49ad96e71b34cd6d80f4af6f3f4da47473cba59a8a17af0257ccafacd6)
- Canonical source SHA-256: bb3b2798db8e7a2a094d86a64a0ca21a0619e89852f361d816a32fd920e11991 (38397 bytes)
- Network: Stable Studionet, 61999
- Independent live verification: 172 PASS, 0 FAIL
- Latest-final observation: 2026-11-13T01:55:47.670Z

Deployment and successful transaction checks require FINALIZED + MAJORITY_AGREE + leader SUCCESS. Negative calls require finalized majority agreement, the exact leader ERROR and unchanged state. Disagreement attempts are retained separately and are not business passes.

## Mechanism

EVENT_HELD needs positive dated evidence from both independently fetched fixed sources. Silence on cancellation is insufficient. Each validator reproduces the verdict and all fetch, identity, status and held flags. The supported positive records are dated past-performance prose, an original same-day first-night report with retrospective prose, a same-day original weekday-night past-performance report, or measured completed-gig spending paired with the target artist's dated table. Cancellation/postponement signals must concern the target venue. Conflicting or unavailable evidence leaves state unchanged. Deterministic code credits the exact escrow; pull withdrawals pay the entitled address.

## Latest-final state

| Event | Artist | Current date | Status | Escrow GEN | Organizer credited |
|---|---|---|---|---|---|
| E1 | Oasis | 2025-07-25 | EVENT_HELD | 0 | true |
| E2 | Future & Metro Boomin | 2024-08-06 | CANCELLED | 0 | false |
| E3 | Pentatonix | 2026-12-09 | ON_SALE | 30 | false |
| E4 | KATSEYE | 2027-02-20 | POSTPONED | 10 | false |

123 GEN received = 83 GEN withdrawn + 40 GEN contract balance. Escrow: 40 GEN; royalties: 4.3 GEN; resale volume: 43 GEN.

## Transactions

| Label | Observed result | Signing surface | Transaction |
|---|---|---|---|
| neg0-not-creator | error-observed / NOT_CREATOR | SDK scripted regression | [0xb40a0efd1a6e111a5d952012e1073b33632872c72933f05795c78b93caf940d4](https://explorer-studio.genlayer.com/tx/0xb40a0efd1a6e111a5d952012e1073b33632872c72933f05795c78b93caf940d4) |
| neg14-bad-address | error-observed / BAD_ADDRESS | SDK scripted regression | [0x89b718e05d4f728c84934b3a85b0e0bc016982d6cf24f7fc675f9ba26d61db6a](https://explorer-studio.genlayer.com/tx/0x89b718e05d4f728c84934b3a85b0e0bc016982d6cf24f7fc675f9ba26d61db6a) |
| neg15-bad-settle-after | error-observed / BAD_SETTLE_AFTER_TS | SDK scripted regression | [0x8681a4e41069a5f4578e33b6d349334b664f1ffd5b4f7d590c7f4f2005efc548](https://explorer-studio.genlayer.com/tx/0x8681a4e41069a5f4578e33b6d349334b664f1ffd5b4f7d590c7f4f2005efc548) |
| neg16-bad-tz-offset | error-observed / BAD_TZ_OFFSET | SDK scripted regression | [0xeb15c731bc9a4cd24da5966210a3381d684e81204310279dce159c939b52baf6](https://explorer-studio.genlayer.com/tx/0xeb15c731bc9a4cd24da5966210a3381d684e81204310279dce159c939b52baf6) |
| neg12-buy-unconfigured | error-observed / EVENT_NOT_CONFIGURED | SDK scripted regression | [0xf0eedc00beb51e4ca4b9141b30c3efdd88c07f871657d7bf0791e63c7f703079](https://explorer-studio.genlayer.com/tx/0xf0eedc00beb51e4ca4b9141b30c3efdd88c07f871657d7bf0791e63c7f703079) |
| cfg-e1 | ok | SDK scripted regression | [0x97d905ba57a05a8956a423f3c2d3a93cb1d8dc363276ec23a1fa5d9c5e6db6a2](https://explorer-studio.genlayer.com/tx/0x97d905ba57a05a8956a423f3c2d3a93cb1d8dc363276ec23a1fa5d9c5e6db6a2) |
| cfg-e2 | ok | SDK scripted regression | [0x10702fc4590116c23a11f7bd9c226a989eb041c628ca8696ba8054077c2fe281](https://explorer-studio.genlayer.com/tx/0x10702fc4590116c23a11f7bd9c226a989eb041c628ca8696ba8054077c2fe281) |
| cfg-e3 | ok | SDK scripted regression | [0x6b3167ab39b637bedcfd49a712e430e180217c62dfa72e263273b55f791fa95f](https://explorer-studio.genlayer.com/tx/0x6b3167ab39b637bedcfd49a712e430e180217c62dfa72e263273b55f791fa95f) |
| cfg-e4 | ok | SDK scripted regression | [0x852fab21584f9426e4f9031706364e8f7f2e0664b362f7985433dac9184f9eb7](https://explorer-studio.genlayer.com/tx/0x852fab21584f9426e4f9031706364e8f7f2e0664b362f7985433dac9184f9eb7) |
| t1-buy | ok | SDK scripted regression | [0xbb86bea75542ccaa3310ebd110f58df79028228aad47b16eb57782da4875ecdc](https://explorer-studio.genlayer.com/tx/0xbb86bea75542ccaa3310ebd110f58df79028228aad47b16eb57782da4875ecdc) |
| t2-buy | ok | SDK scripted regression | [0x643054d10a1a719de20ea2f31b4c71b3258643b9209d0a789c45868b55da8c60](https://explorer-studio.genlayer.com/tx/0x643054d10a1a719de20ea2f31b4c71b3258643b9209d0a789c45868b55da8c60) |
| t3-buy | ok | SDK scripted regression | [0x8c7c489fe4b31d4c3a1800bc7eced530aeae7627bdf575a5f8309d09ae7bcd7b](https://explorer-studio.genlayer.com/tx/0x8c7c489fe4b31d4c3a1800bc7eced530aeae7627bdf575a5f8309d09ae7bcd7b) |
| t4-buy | ok | SDK scripted regression | [0xbba8227aee85877089a967284e64563163762fe0a0d8e5992cb2d4e1bd4bc63c](https://explorer-studio.genlayer.com/tx/0xbba8227aee85877089a967284e64563163762fe0a0d8e5992cb2d4e1bd4bc63c) |
| t5-buy | ok | SDK scripted regression | [0x44519e3d219934a82538f754f365a4197f08211441662a614451500873914dc9](https://explorer-studio.genlayer.com/tx/0x44519e3d219934a82538f754f365a4197f08211441662a614451500873914dc9) |
| t6-buy | ok | SDK scripted regression | [0x4cb443c40e215e9445249058bf4d78b73c91bcb202327cb1dbbdae119ccbfcd3](https://explorer-studio.genlayer.com/tx/0x4cb443c40e215e9445249058bf4d78b73c91bcb202327cb1dbbdae119ccbfcd3) |
| t7-buy | ok | SDK scripted regression | [0xa87ba9bb83aec366eb36e85737bec420dd5a80a6d38a9ca7c632ecc134c3ae18](https://explorer-studio.genlayer.com/tx/0xa87ba9bb83aec366eb36e85737bec420dd5a80a6d38a9ca7c632ecc134c3ae18) |
| r1-list | ok | SDK scripted regression | [0xd5a5cfbe69eab75f3db43de3e5c6a721749b0c98963321eb28030ec2d7e8dbc8](https://explorer-studio.genlayer.com/tx/0xd5a5cfbe69eab75f3db43de3e5c6a721749b0c98963321eb28030ec2d7e8dbc8) |
| r1-buy | ok | SDK scripted regression | [0xa59ef49b3aff4cb32655f6d69bb34d655d20887170d639882973df5d8cb62a40](https://explorer-studio.genlayer.com/tx/0xa59ef49b3aff4cb32655f6d69bb34d655d20887170d639882973df5d8cb62a40) |
| r2-list | ok | SDK scripted regression | [0xd8f531362f773fceb960895ce6455900be896a8b83bd2589b391052a7e8df362](https://explorer-studio.genlayer.com/tx/0xd8f531362f773fceb960895ce6455900be896a8b83bd2589b391052a7e8df362) |
| r2-buy | ok | SDK scripted regression | [0x69e01c725b4aaafac4ed75d776c45ec991e64ebc7d2d4d0510f066114d36ad93](https://explorer-studio.genlayer.com/tx/0x69e01c725b4aaafac4ed75d776c45ec991e64ebc7d2d4d0510f066114d36ad93) |
| r3-list | ok | SDK scripted regression | [0x4e89aa9fcf5a13c4d5443b3b927efeb8b6a76a77d3e145687390091ab7b84a1f](https://explorer-studio.genlayer.com/tx/0x4e89aa9fcf5a13c4d5443b3b927efeb8b6a76a77d3e145687390091ab7b84a1f) |
| r4-list | ok | SDK scripted regression | [0xa915e874c21dd5550b336d0cfe07efac22d5e6d282f4ad19d1596482e2b81ec0](https://explorer-studio.genlayer.com/tx/0xa915e874c21dd5550b336d0cfe07efac22d5e6d282f4ad19d1596482e2b81ec0) |
| r4-buy | ok | SDK scripted regression | [0x8ba0f550b8b3aa6c99b6fe8e496d07c8564f525f1b2f4371eebad990e3b037f1](https://explorer-studio.genlayer.com/tx/0x8ba0f550b8b3aa6c99b6fe8e496d07c8564f525f1b2f4371eebad990e3b037f1) |
| neg3-stranger-list | error-observed / NOT_TICKET_OWNER | SDK scripted regression | [0x11ed41ed5ef9d4617fe0290ad5b1e7937214c265c9303ac4b15eb26f0bf34f39](https://explorer-studio.genlayer.com/tx/0x11ed41ed5ef9d4617fe0290ad5b1e7937214c265c9303ac4b15eb26f0bf34f39) |
| neg4-over-cap | error-observed / PRICE_CAP | SDK scripted regression | [0xfe790dc27602c369462379a82f00e635a14bf710bb8de9e4cadf7a478eda9f21](https://explorer-studio.genlayer.com/tx/0xfe790dc27602c369462379a82f00e635a14bf710bb8de9e4cadf7a478eda9f21) |
| neg6-list | ok | SDK scripted regression | [0x6a80a77f21c264a7e801a9f5b8fbea08420130b0058d19b0c45c00c01d22e859](https://explorer-studio.genlayer.com/tx/0x6a80a77f21c264a7e801a9f5b8fbea08420130b0058d19b0c45c00c01d22e859) |
| neg6-self-buy | error-observed / SELF_PURCHASE | SDK scripted regression | [0xe56a205af7d8694026f9c379b902afc0f0a11754ed15cd0fcfd2d3946b004d65](https://explorer-studio.genlayer.com/tx/0xe56a205af7d8694026f9c379b902afc0f0a11754ed15cd0fcfd2d3946b004d65) |
| neg6-cancel | ok | SDK scripted regression | [0x8312cc9cf61390b8ab2835af11fa691eb2cabc0ef9aedb64d2b4d27fdf65dfdc](https://explorer-studio.genlayer.com/tx/0x8312cc9cf61390b8ab2835af11fa691eb2cabc0ef9aedb64d2b4d27fdf65dfdc) |
| neg5-not-listed | error-observed / TICKET_NOT_LISTED | SDK scripted regression | [0xa3c0d818f68ffaeec94cd7f4cf2d020562b71f55be5c4732857075dcdc884284](https://explorer-studio.genlayer.com/tx/0xa3c0d818f68ffaeec94cd7f4cf2d020562b71f55be5c4732857075dcdc884284) |
| neg2-wrong-value | error-observed / VALUE_MUST_EQUAL_PRICE | SDK scripted regression | [0x1eac6525dc75a351ee40ba83afa727eefd3f588c4611c50a27783446e3e9cb0a](https://explorer-studio.genlayer.com/tx/0x1eac6525dc75a351ee40ba83afa727eefd3f588c4611c50a27783446e3e9cb0a) |
| neg1-unknown-event | error-observed / EVENT_NOT_FOUND | SDK scripted regression | [0x91c1c2f8e76c277450cbde22ecd21f59abbe47fe6c904d0e930f97158882aa12](https://explorer-studio.genlayer.com/tx/0x91c1c2f8e76c277450cbde22ecd21f59abbe47fe6c904d0e930f97158882aa12) |
| neg13-early-settle-e3 | error-observed / TOO_EARLY | SDK scripted regression | [0x497b7e2a1acf29b121ccf55a4d925e61fde87037b39e79eb4a6a1241f4b9b33a](https://explorer-studio.genlayer.com/tx/0x497b7e2a1acf29b121ccf55a4d925e61fde87037b39e79eb4a6a1241f4b9b33a) |
| s1-settle-e1 | ok | SDK scripted regression | [0xff69bb3abf2a614055c1414aa3a446b5cf8931539aa41b1ef5dde56c45fbe97f](https://explorer-studio.genlayer.com/tx/0xff69bb3abf2a614055c1414aa3a446b5cf8931539aa41b1ef5dde56c45fbe97f) |
| s2-settle-e2 | ok | SDK scripted regression | [0x3b0c4fca922c54592b125ea0f9690f0fb0a53be4e28d92b3c9a737f5371a1031](https://explorer-studio.genlayer.com/tx/0x3b0c4fca922c54592b125ea0f9690f0fb0a53be4e28d92b3c9a737f5371a1031) |
| s3-settle-e4 | ok | SDK scripted regression | [0x67fdca5b94de3ba4ff11ede59503fc9fc6c8a69d3b1fd35a7584b1ae1b000376](https://explorer-studio.genlayer.com/tx/0x67fdca5b94de3ba4ff11ede59503fc9fc6c8a69d3b1fd35a7584b1ae1b000376) |
| neg18-rsch-stranger | error-observed / NOT_CREATOR | SDK scripted regression | [0x1951f0ac469c4e544be815cc887ee42ec3b80cffff103ec063b00d3dc6748be2](https://explorer-studio.genlayer.com/tx/0x1951f0ac469c4e544be815cc887ee42ec3b80cffff103ec063b00d3dc6748be2) |
| neg19-rsch-onsale | error-observed / NOT_POSTPONED | SDK scripted regression | [0x2183b47ddb014e331038d3c01f5752982ed82837cc7ee4835600b2f6a8bdd5b6](https://explorer-studio.genlayer.com/tx/0x2183b47ddb014e331038d3c01f5752982ed82837cc7ee4835600b2f6a8bdd5b6) |
| neg20-rsch-earlier | error-observed / DATE_NOT_LATER | SDK scripted regression | [0x667241f213f75e8c05a88238e87dc6218a15e7a52b02e1b9245d0d1f59fd4e95](https://explorer-studio.genlayer.com/tx/0x667241f213f75e8c05a88238e87dc6218a15e7a52b02e1b9245d0d1f59fd4e95) |
| neg21-rsch-settled-e1 | error-observed / NOT_POSTPONED | SDK scripted regression | [0x4306e58ca0fc068a8099ebd568902b28fe99263a191e91ed1c8e410172a3bc5c](https://explorer-studio.genlayer.com/tx/0x4306e58ca0fc068a8099ebd568902b28fe99263a191e91ed1c8e410172a3bc5c) |
| neg22-rsch-settled-e2 | error-observed / NOT_POSTPONED | SDK scripted regression | [0x70fb16f00866bfea5e9f64602206fc37c0eb3130ab6336cb57506593132366a3](https://explorer-studio.genlayer.com/tx/0x70fb16f00866bfea5e9f64602206fc37c0eb3130ab6336cb57506593132366a3) |
| neg23-rsch-bad-settle | error-observed / BAD_SETTLE_AFTER_TS | SDK scripted regression | [0x272cbed666afb38667f3b2397802f5d28b42500eefbfaa1289489cbeb8e79d9f](https://explorer-studio.genlayer.com/tx/0x272cbed666afb38667f3b2397802f5d28b42500eefbfaa1289489cbeb8e79d9f) |
| rsch1 | ok | SDK scripted regression | [0x40c98798bf0029263433ae33e5f9837c0276f250ceeecfd8d222ee0740582f7a](https://explorer-studio.genlayer.com/tx/0x40c98798bf0029263433ae33e5f9837c0276f250ceeecfd8d222ee0740582f7a) |
| rsch2 | ok | SDK scripted regression | [0x1f10f32f303c816f13acab555d65cce6e9e03093349996d21f88863ab3e02728](https://explorer-studio.genlayer.com/tx/0x1f10f32f303c816f13acab555d65cce6e9e03093349996d21f88863ab3e02728) |
| neg17-settle-after-rsch | error-observed / TOO_EARLY | SDK scripted regression | [0xca5362ba89611a59ab54789f90430aabb4cfeadc19c385b821c049332b3f813e](https://explorer-studio.genlayer.com/tx/0xca5362ba89611a59ab54789f90430aabb4cfeadc19c385b821c049332b3f813e) |
| neg9-double-settle | error-observed / EVENT_ALREADY_SETTLED | SDK scripted regression | [0x71e8ab24477568d40a90799dcb1add9b40c0f15c1b0fe73600f8bf82c84d20a4](https://explorer-studio.genlayer.com/tx/0x71e8ab24477568d40a90799dcb1add9b40c0f15c1b0fe73600f8bf82c84d20a4) |
| neg11-buy-held | error-observed / EVENT_NOT_ON_SALE | SDK scripted regression | [0xa48d1382cfdb489fd0e2e3ee48fdc25ae161c7c43cc2669b34c9a96127adb069](https://explorer-studio.genlayer.com/tx/0xa48d1382cfdb489fd0e2e3ee48fdc25ae161c7c43cc2669b34c9a96127adb069) |
| neg10-list-refunded | error-observed / TICKET_NOT_ACTIVE | SDK scripted regression | [0x72cd524559b0ee38205d4053db836f91c2b429b1a19b68881dc5e827a24c81d7](https://explorer-studio.genlayer.com/tx/0x72cd524559b0ee38205d4053db836f91c2b429b1a19b68881dc5e827a24c81d7) |
| neg7-stranger-withdraw | error-observed / NO_CREDIT | SDK scripted regression | [0xb6670e08a728fc512e367b8649592f78c80691b3b1b898e279137b5e3791196b](https://explorer-studio.genlayer.com/tx/0xb6670e08a728fc512e367b8649592f78c80691b3b1b898e279137b5e3791196b) |
| w-org | ok | SDK scripted regression | [0xd0de1b675b534f2a33622280dca3b7b3a918005236691e5654da4b6dd5d2f845](https://explorer-studio.genlayer.com/tx/0xd0de1b675b534f2a33622280dca3b7b3a918005236691e5654da4b6dd5d2f845) |
| w-art | ok | SDK scripted regression | [0xa5448a6b8cc904ab6be5516725719a1a7fd2f60246e24075bf7e85f387354ea8](https://explorer-studio.genlayer.com/tx/0xa5448a6b8cc904ab6be5516725719a1a7fd2f60246e24075bf7e85f387354ea8) |
| w-b1 | ok | SDK scripted regression | [0xc5c99e58e16f74e1499e8d3cde17be8b4cf577062f8d32585057b3678c9d4709](https://explorer-studio.genlayer.com/tx/0xc5c99e58e16f74e1499e8d3cde17be8b4cf577062f8d32585057b3678c9d4709) |
| w-b2 | ok | SDK scripted regression | [0xc1f31f97f15f55f0a7c031f4d0a638e77922bd977823a3d1a3313cefb60a476c](https://explorer-studio.genlayer.com/tx/0xc1f31f97f15f55f0a7c031f4d0a638e77922bd977823a3d1a3313cefb60a476c) |
| neg8-double-withdraw | error-observed / NO_CREDIT | SDK scripted regression | [0x2ece2c20f4293ffe4af3b21d7f7dc0719645d40263663b7f8de5e55ef5e3b0af](https://explorer-studio.genlayer.com/tx/0x2ece2c20f4293ffe4af3b21d7f7dc0719645d40263663b7f8de5e55ef5e3b0af) |
| b-buy | ok | browser-temporary-account | [0x08ee5e65a08a8e8edf333c6ce4267055af768d28ef7a5fb615796bd54cf76a98](https://explorer-studio.genlayer.com/tx/0x08ee5e65a08a8e8edf333c6ce4267055af768d28ef7a5fb615796bd54cf76a98) |
| b-list | ok | browser-temporary-account | [0x97d0e862042872a129f58a2dd9a4c48a36c7ad9dafe1d3b0450ba656dd0a65ba](https://explorer-studio.genlayer.com/tx/0x97d0e862042872a129f58a2dd9a4c48a36c7ad9dafe1d3b0450ba656dd0a65ba) |
| b-buy-resale | ok | browser-temporary-account | [0x405d777869c98126bd2191f96278e9f9d14396c0d00891190f278749c0137ba9](https://explorer-studio.genlayer.com/tx/0x405d777869c98126bd2191f96278e9f9d14396c0d00891190f278749c0137ba9) |
| b-withdraw-seller | ok | browser-temporary-account | [0x6bdf3255bce0535bf9b0f594573026d8c6c3f6203652a3280e15e63d36780aa4](https://explorer-studio.genlayer.com/tx/0x6bdf3255bce0535bf9b0f594573026d8c6c3f6203652a3280e15e63d36780aa4) |
| b-withdraw-artist | ok | auxiliary-sdk | [0xb69221d16571176750c359eafbca888faf522f3ae5f739ca1d423471f713c607](https://explorer-studio.genlayer.com/tx/0xb69221d16571176750c359eafbca888faf522f3ae5f739ca1d423471f713c607) |

## Evidence scope

The original V1.3 source, expectations and evidence are preserved in evidence/v1.3/. They prove only the old deployment. EXPECTED.md and EXPECTED_V15.md describe the prospective V1.5 run and were published before deployment. Off-chain source preflight is explicitly separate from validator consensus. Full latest-final data is in evidence/readback-v1.5.json; independent output in evidence/verification-v1.5.txt. Local fixture output is in evidence/mock-v1.5.txt, not a claim of live consensus.

The additional workflow records identify their actual signing surface. An auxiliary SDK withdrawal is not described as a browser action.

## Limits

The English extractor is deliberately narrow and can reject genuine events phrased differently. Two publishers can be wrong; agreement is not proof of real-world truth. Source pages may change or be unavailable. E3 is a future event and is not prematurely settled; E4 remains postponed/rescheduled. Their escrow is intentional, not stranded failed-call value. No venue-entry credential or off-chain ticket-delivery guarantee is claimed. Failed-payable negatives send zero value. Archived V1.4 observations retain the failed E1 calls and their unreleased escrow; its receipts never count as V1.5 acceptance. Its archived readback recorded 70 GEN escrow and 32 GEN withdrawable resale credits after the source outage. SOLD_OUT and fabricated-validator rejection are covered by local fixtures; they are not represented as successful live business cases.
