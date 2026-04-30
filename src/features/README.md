# Feature Structure (MVP Base)

This folder is the target home for the new psychologists MVP features.

- `auth/`: login/session flows and guards
- `user-home/`: user home/feed dashboard
- `professionals/`: professionals list and filters (specialties)
- `professional-profile/`: professional public profile
- `chat/`: chat and conversation flows
- `credits/`: wallet, top-up, promotional credits UI
- `referrals/`: referral flows
- `user-profile/`: profile/settings for end users

Legacy route groups were removed; new development should stay under `app/(public)`, `app/(user)` and `app/(professional)`.
New work should prioritize feature modules here and route wiring in `app/`.

