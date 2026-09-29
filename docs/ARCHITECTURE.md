# JeevanSetu Architecture

## Core flow
Hospital user → React UI → Express REST API → Referral/Facility data → Matching → Socket.IO notification → Referral tracking → Completion/escalation.

## Matching concept
The platform ranks facilities using the project-defined context: capability, availability, urgency and location. A prototype score is currently implemented in `backend/src/server.js`; production clinical logic should be validated with healthcare stakeholders.

## Real-time layer
Socket.IO broadcasts referral creation/update events and can target a facility room when a potential match is found.

## Production layers to add
1. PostgreSQL repository/ORM integration.
2. Verified hospital and staff identity management.
3. Role-based access for coordinators, facility admins and administrators.
4. Full referral state machine and escalation timers.
5. Location/geospatial search.
6. Multilingual UI and low-connectivity handling.
7. Audit trail, monitoring and secure backups.
