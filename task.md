# Task List - Cricket Logic & Scorer Enhancements

- `[x]` Update `matchService.ts` type definition for commentary entries
- `[x]` Update `MatchScorerFullPage.tsx`
  - `[x]` Implement robust `getAutoBattingSide` helper
  - `[x]` Implement `calculateEconomy` helper
  - `[x]` Reset active batters/bowler when switching batting team
  - `[x]` Calculate and exclude the consecutive bowler in dropdown
  - `[x]` Record bowlerRuns, bowler name, and innings in commentary
  - `[x]` Implement bowler maiden calculation on over completion
  - `[x]` Fix stale React state save payload for `currentBatters` and `currentBowler`
  - `[x]` Display "Yet to Bat" list below the batting scorecard
- `[x]` Verify changes with `npm run build`

# Task List - Implement visual podium leaderboard on Home Page (`Frontend/app/(tabs)/index.tsx`)
  - `[x]` Add state for `topFootballers` and fetch from `/user/list?sport=Football`
  - `[x]` Update tab switcher to include a Football tab
  - `[x]` Add helper `renderPodiumItem` for 1st, 2nd, 3rd places
  - `[x]` Refactor leaderboard view to render podium and remaining mini-list
  - `[x]` Add styles for podium layout
- `[x]` Implement User Profile Details enhancements (`Frontend/app/profile/view/[userId].tsx`)
  - `[x]` Add state and fetch auction details from `/players`
  - `[x]` Render premium gradient franchise/auction ribbon overlay on profile picture
  - `[x]` Implement horizontal sport tab switcher for users with multiple sports
  - `[x]` Implement `renderFootballStats` with stats grid and season table
  - `[x]` Add visual mini soccer field graphic with position marker
  - `[x]` Polish Kabaddi section (rectangular referee cards and medical clearance card)
  - `[x]` Add styles for switcher, soccer field, fitness shield, and auction overlay
- `[x]` Verify changes compile and build correctly

