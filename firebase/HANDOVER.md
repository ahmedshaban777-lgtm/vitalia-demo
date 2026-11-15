# Vitalia test environment - Firebase handover (no secrets)

Everything here belongs to the client's own Google account (Vitalia6000@gmail.com). Spark free plan, no billing, no card.

## What exists

- Firebase project: `vitalia-orders`
- Firestore: `(default)` database, Native mode, region `me-west1` (Tel Aviv) - region choice pending client decision (alternatives: me-central1 Doha, me-central2 Dammam, africa-south1 Johannesburg, europe-west1/3). Changing region = delete + recreate the DB (~15 min, loses only fake test orders). DO NOT do it without client approval.
- Auth: Email/Password. One merchant user (credentials in the owner's vault entry «Vitalia Firebase merchant» - never stored here).
- Collections:
  - `orders/{id}` - private full order (PII). Create + merchant-only read/update(status)/delete.
  - `order_status/{id}` - public minimal status doc (code, createdAt, items, total, status only). Same doc id as its order. Public single-doc GET by unguessable id, no listing.

## Pages (GitHub Pages preview only; production Lovable site untouched)

- Store: https://ahmedshaban777-lgtm.github.io/vitalia-demo/order-prep-preview/index.html
- Customer tracking: .../orders.html?track=<docId>
- Merchant panel: .../merchant.html (email+password sign-in)

## CURRENT STATE: order creation is LOCKED

`firestore.rules` (deployed) denies all creates. Reason: anonymous creation must not stay publicly open until App Check abuse mitigation is enforced.

To re-enable creation AFTER App Check is enforced:
1. Copy `firebase/firestore.rules.unlocked` over `firebase/firestore.rules`.
2. Publish in Firebase console: Firestore > Rules tab > paste > Publish.
The unlocked rules were verified with 11/11 live tests (valid atomic linked create + 10 negative/abuse cases) on 2026-11-15.

## Rules gotcha that cost hours

In this environment the `firestore.`-prefixed rules functions (firestore.get/getAfter/exists/existsAfter) fail with "Null value error" - on BOTH the live backend and the local emulator - even for valid hardcoded paths. The unprefixed forms work. Never "fix" the rules by re-adding the prefix.

## App Check (pending decision)

Free on Spark via reCAPTCHA provider (10k verifications/month free), but registering a reCAPTCHA key requires accepting reCAPTCHA account terms - not done, needs owner/client approval. After that: register the web app in App Check, add the App Check SDK + site key to the three pages, then enable Firestore enforcement in console > App Check > APIs > Cloud Firestore.

## Fake test data only

3 fake orders exist (V-4059, V-9001, V-9002). No real customer data has ever been entered. Merchant can delete them from the panel (delete button) when done testing.
