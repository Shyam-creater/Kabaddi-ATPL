# Implementation Plan - Cricket Logic and Scorer Enhancements

This plan outlines the enhancements to align the Match Scorer panel with official cricket logic rules and resolve some underlying state management bugs.

## User Review Required

We identified several gaps in the cricket logic that should be addressed to provide a professional scoring experience:

> [!IMPORTANT]
> **Key Cricket Logic Gaps & Solutions:**
> 1. **Stale Batting/Bowler State on Save:** Currently, when a ball is recorded, the updated batsman and bowler structures are saved to the database using stale React state variables (`strikerName`, `nonStrikerName`, `bowlerName`). Because React state updates are asynchronous, this saves the *old* strike/bowler positions to the database, causing sync issues on refresh.
>    - *Solution:* Use the newly calculated local variables (`nextStriker`, `nextNonStriker`, `nextBowler`) to construct the payload for `updateMatch`.
> 2. **Consecutive Bowler Restriction:** Cricket rules state a bowler cannot bowl two consecutive overs.
>    - *Solution:* Auto-detect the bowler of the previous over from the last ball's commentary and disable them in the bowler selection dropdown for the new over.
> 3. **Maiden Overs Tracking:** Bowlers' maidens are not currently tracked or incremented.
>    - *Solution:* On over completions, look at all commentary entries for the current over. If the bowler conceded 0 runs (excluding byes/legbyes but including wides/no-balls), increment their maiden count by 1.
> 4. **"Yet to Bat" List:** The batting scorecard only lists players who have faced a ball or got out.
>    - *Solution:* Add a "Yet to Bat" list below the batting scorecard containing squad members who haven't batted yet.
> 5. **Robust Innings/Batting Side Auto-Detection:** Auto-detection of batting side on load relies on string-matching the match status. If the status changes, it can fail.
>    - *Solution:* Implement a helper using toss decisions and target runs to determine the batting side, with fallback logic.

---

## Proposed Changes

### 1. admin-panel Frontend Components

#### [MODIFY] [matchService.ts](file:///c:/Users/HAI/Desktop/ATPL-score%20APP/admin-panel/src/services/matchService.ts)
- Add optional typing properties to the `commentary` array items: `bowlerRuns?: number`, `bowler?: string`, and `innings?: string` for type safety.

#### [MODIFY] [MatchScorerFullPage.tsx](file:///c:/Users/HAI/Desktop/ATPL-score%20APP/admin-panel/src/components/MatchScorerFullPage.tsx)
- **`getAutoBattingSide` Helper:** Implement a helper function to inspect `tossWinner`, `tossDecision`, and `target` to correctly determine who is batting, using it to initialize `battingSide`.
- **`calculateEconomy` Helper:** Implement a cleaner helper function to calculate bowler economy rates accurately based on balls bowled rather than raw decimal division.
- **`handleSwitchBattingSide` Reset:** Update the batting side toggle click handler to reset `strikerName`, `nonStrikerName`, and `bowlerName` to prevent picking cross-team active players.
- **Exclude Consecutive Bowler:** Calculate `excludedBowlerName` using a `useMemo` that retrieves the bowler who bowled the last ball of the previous over. Disable this bowler in the selector.
- **Record Commentary Fields:** Inside `handleRecordBall`, compute `bowlerRunsThisBall` (total runs minus byes/legbyes, or 1 for no-ball penalty) and append `bowlerRuns`, `bowler` (bowler's name), and `innings` (current batting side) to the commentary entry.
- **Compute Maiden Overs:** On over completions, filter the commentary for the current over and current innings. If the sum of `bowlerRuns` is 0, increment `bowlerStat.maidens` by 1.
- **Resolve Stale Save Payload:** Rewrite the `nextMatch.currentBatters` and `nextMatch.currentBowler` assignment to use `nextStriker`, `nextNonStriker`, and `nextBowler` instead of stale state values.
- **Add "Yet to Bat" Section:** Create a `yetToBatPlayers` memoized list and render it below the batting scorecard.

---

## Verification Plan

### Automated Build Check
- Run `npm run build` in `admin-panel` to ensure there are no TypeScript compiler or bundle compilation issues.

### Manual Verification
- Mount the scorer view and perform a test match:
  - Verify that switching batting sides resets the active batters and bowler selectors.
  - Verify that a bowler who bowls over 1 cannot be selected for over 2, but can be selected for over 3.
  - Verify that bowls conceding 0 runs off the bat (and only byes/legbyes) record a maiden over for the bowler at the end of the over.
  - Verify that wickets on the 6th ball properly reset the bowler name and prompt for bowler selection while moving the surviving batsman to the striker's end.
  - Verify that players who have not entered the field yet are listed in the "Yet to Bat" section.
