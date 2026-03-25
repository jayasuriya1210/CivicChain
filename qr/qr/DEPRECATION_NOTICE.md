"""
=============================================================================
                      ⚠️  DEPRECATION NOTICE  ⚠️
=============================================================================

This Python-based QR authentication system has been DEPRECATED and replaced
with a modern Node.js/Express implementation with real-time WebSocket support.

MIGRATION COMPLETE:
✅ auth_server.py → qr-auth-server.js (Express server)
✅ QR generation → /qr/routes/qr-routes.js
✅ Booth scanning → /qr/routes/booth-routes.js
✅ Admin verification → /qr/routes/admin-routes.js
✅ Vote casting → /qr/routes/voting-routes.js
✅ Database → MongoDB with Mongoose ORM

NEW FEATURES:
- Real-time Socket.io events
- Admin dashboard with live updates
- QR code scanning with fallback manual input
- Database-backed voting/verification audit trail
- JWT-based security tokens
- RESTful API endpoints

TO START THE NEW SYSTEM:
1. npm install
2. Configure .env file
3. node qr/qr-auth-server.js

See qr/README.md for complete documentation.

=============================================================================
"""
