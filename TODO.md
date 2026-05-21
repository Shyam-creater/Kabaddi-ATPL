# TODO

- [x] Confirm approach for dummy league insertion in `scoreappback/src/scripts/seed_admins.js` (separate vs modify existing).

- [ ] Patch `seed_admins.js` to insert dummy league/teams/players/matches after `pendingThUser` block and before `Seeding successfully completed!`.
- [ ] Ensure dummy teams include players with valid `position` and required schema fields.
- [ ] Ensure match documents include required `title`, `teamA/teamB` (name+code+logo), `tournamentId`, `teamAId/teamBId`.
- [x] Run a syntax check / build verification for updated scripts/pages.

- [ ] (Optional) Run the seeding script to verify DB insertion.

