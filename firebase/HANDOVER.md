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

## CURRENT STATE: App Check ENFORCED + creation OPEN (validated)

- App Check: web app «Vitalia preview» registered with the Fraud Defense (reCAPTCHA Enterprise) provider; Firestore API enforcement ON (console > App Check > APIs). Requests without an App Check token are denied (verified).
- reCAPTCHA Enterprise key «vitalia-demo-preview» created in GCP project vitalia-orders, domain ahmedshaban777-lgtm.github.io, score-based v3. Free tier: 10,000 assessments/month, no credit card. Site key is public (in the HTML); the secret is in the owner's vault entry «Vitalia reCAPTCHA v3 (vitalia-demo-preview)», never here.
- The 3 pages load firebase-app-check-compat.js and activate ReCaptchaEnterpriseProvider in vitalia/firebase-orders.js.
- `firestore.rules` (deployed) = the validated version (identical to firestore.rules.unlocked): anonymous creation allowed but strictly validated + atomically linked; verified 11/11 live tests WITH enforcement on (2026-11-15), plus unverified-client denial.

## Rules gotcha that cost hours

In this environment the `firestore.`-prefixed rules functions (firestore.get/getAfter/exists/existsAfter) fail with "Null value error" - on BOTH the live backend and the local emulator - even for valid hardcoded paths. The unprefixed forms work. Never "fix" the rules by re-adding the prefix.

## Notes

- Firebase console showed «reCAPTCHA Classic is deprecated, use Fraud Defense» - the Fraud Defense provider path was used. GCP ToS already covered it (accepted when the project was created); no new terms, no billing.
- 4 fake orders now exist (V-4059, V-9001, V-9002 x2).

## Fake test data only

3 fake orders exist (V-4059, V-9001, V-9002). No real customer data has ever been entered. Merchant can delete them from the panel (delete button) when done testing.
