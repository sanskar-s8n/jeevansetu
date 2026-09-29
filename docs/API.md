# JeevanSetu API

GET `/api/health` — service health.
GET `/api/facilities` — list available facilities.
GET `/api/facilities/:id` — facility details.
POST `/api/referrals` — create referral.
GET `/api/referrals` — list referrals.
GET `/api/referrals/:id` — referral details.
PATCH `/api/referrals/:id/status` — update referral status.
POST `/api/auth/demo-login` — prototype login token.

Socket.IO events:
- `facility:join`
- `referral:created`
- `referral:match`
- `referral:updated`
