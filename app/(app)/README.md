# Legacy Route Group

This group is kept only for backward compatibility while the frontend is being migrated.

- Do not use this group as base for new features.
- New user MVP routes should be added under `app/` route groups backed by `src/features/*` modules.
- Existing screens here can be removed in a later cleanup once no flows depend on them.