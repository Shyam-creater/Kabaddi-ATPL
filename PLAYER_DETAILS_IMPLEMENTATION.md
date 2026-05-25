# Harsh Patel Player Details Feature - Implementation Guide

## Overview
This implementation adds comprehensive player details to the admin panel for super admins and sub-admins to view detailed statistics about each player.

## What Was Created

### 1. **Backend - Seed Script** (`scoreappback/src/scripts/seed-harsh-patel.js`)
- Creates a sample player: **Harsh Patel** (ATPL_013)
- Email: player12@atpl.com
- Includes cricket statistics and career data
- Creates 2 sample tournaments (2024 and 2023 seasons)
- Creates 2 sample teams (Mumbai Warriors & Delhi Titans)
- Creates 3 sample matches
- Registers player in tournaments

**To run:** 
```bash
cd scoreappback
node src/scripts/seed-harsh-patel.js
```

### 2. **Backend API** (`scoreappback/src/controllers/admin.controller.js`)
New endpoint: `GET /api/admin/players/:id/stats`

**Features:**
- Fetches complete player profile and statistics
- Lists all tournaments the player is registered for
- Groups by sport (Cricket, Football, Kabaddi)
- Displays all teams the player belongs to
- Shows match-by-match performance with scores
- Calculates overall statistics:
  - Total matches played
  - Matches won/lost
  - Total runs & wickets
  - Batting average & strike rate
  - League participation details

**Response Structure:**
```json
{
  "player": { profile data },
  "stats": {
    "totalMatches": 42,
    "totalTournaments": 3,
    "totalTeams": 2,
    "totalLeaguesRegistered": 3,
    "matchesWon": 26,
    "matchesLost": 16,
    "totalRunsScored": 1850,
    "totalWickets": 28,
    "battingAverage": 44.04,
    "strikeRate": 142.31,
    "economyRate": 8.25
  },
  "leagues": {
    "byType": { cricket: [...], football: [...] },
    "total": 3,
    "cricket": 3,
    "football": 0,
    "kabaddi": 0
  },
  "teams": {
    "byType": { cricket: [...] },
    "total": 2,
    "cricket": 2
  },
  "matches": {
    "total": 14,
    "details": [{ match data }],
    "byStatus": { completed: 14, live: 0, upcoming: 0 }
  },
  "registrations": {
    "total": 3,
    "details": [{ registration data }]
  }
}
```

### 3. **Frontend - Admin Service Update** (`admin-panel/src/services/admin.ts`)
New method: `getPlayerDetailedStats(userId: string)`
- Calls the backend API to fetch player statistics

### 4. **Frontend - Player Details Tab Component** (`admin-panel/src/components/PlayerDetailsTab.tsx`)
**Tabs:**
1. **Overview Tab**
   - Quick stats cards (Total Matches, Matches Won, Teams, Leagues)
   - Cricket performance stats (Runs, Wickets, Avg, Strike Rate)
   - Registration summary
   - Sport-wise breakdown

2. **Matches Tab**
   - Match-by-match details
   - Date, venue, opponent
   - Score comparison
   - Win/Loss status

3. **Leagues Tab**
   - All leagues grouped by sport
   - League name, format, year, status

4. **Teams Tab**
   - All teams the player belongs to
   - Team statistics (matches played, wins, points)
   - City location

### 5. **Frontend - Users Page Update** (`admin-panel/src/pages/Users.tsx`)
- Added tab navigation for player profiles
- "Profile Info" tab → Shows basic info & account actions
- "Stats & Details" tab → Shows comprehensive player statistics using PlayerDetailsTab component
- Integrated PlayerDetailsTab component for players

## Setup Instructions

### Prerequisites
1. MongoDB must be running
2. Backend server should be started
3. Admin panel should be running

### Step 1: Start MongoDB
```bash
# Windows - if using MongoDB as a service
net start MongoDB

# Or manually run mongod
mongod
```

### Step 2: Start Backend Server
```bash
cd scoreappback
npm install  # if not already done
npm start
```

### Step 3: Seed Sample Data
```bash
cd scoreappback
node src/scripts/seed-harsh-patel.js
```

Expected output:
```
✅ Connected to MongoDB
✅ Player created: [player_id]
✅ Tournament 1 created
✅ Tournament 2 created
✅ Team 1 created
✅ Team 2 created
✅ Sample matches created
✅ Player registrations created
✅ Seed script completed successfully!
Player ATPL ID: ATPL_013
Player Email: player12@atpl.com
```

### Step 4: Start Admin Panel
```bash
cd admin-panel
npm install  # if not already done
npm run dev
```

### Step 5: Access the Feature
1. Login as Super Admin or Sub-Admin
2. Go to Users section
3. Search for "Harsh Patel" or "player12@atpl.com"
4. Click "View Vault" button
5. See two tabs:
   - **Profile Info**: Basic user details
   - **Stats & Details**: Comprehensive player statistics

## Player Details Display

### For Harsh Patel (ATPL_013):

**Overview:**
- ✅ Total Matches: 42
- ✅ Matches Won: 26
- ✅ Teams: 2 (Mumbai Warriors, Delhi Titans)
- ✅ Leagues: 3 (ATPL T20 League 2024, ATPL T20 League 2023, ATPL Champions Cup 2024)

**Cricket Stats:**
- Total Runs: 1,850
- Total Wickets: 28
- Batting Average: 44.04
- Strike Rate: 142.31
- Half Centuries: 6

**Leagues Registered:**
- ATPL T20 League 2024 (14 matches, 625 runs)
- ATPL T20 League 2023 (16 matches, 720 runs)
- ATPL T20 Champions Cup 2024 (12 matches, 505 runs)

**Teams:**
- Mumbai Warriors (26 matches, 16 wins, 33 points)
- Delhi Titans (16 matches, 10 wins, 20 points)

**Registrations:** 3 tournaments (All APPROVED)

## Database Schema Updates

### User Model
Already has `playerProfile.cricket` field with:
- Basic info (name, role, batting/bowling style)
- Career summary (matches, runs, wickets, averages)
- Format-wise stats (T20, ODI, etc.)
- League history
- Achievements

### New Collections Created (via seed)
- CricketTournament (2 documents)
- CricketTeam (2 documents)
- CricketMatch (3+ documents)
- PlayerRegistration (3 documents)

## API Routes

### New Admin Routes
```
GET /api/admin/players/:id/stats
- Authorization: admin, super_admin
- Returns: Detailed player statistics and career info
```

### Updated Routes
```
GET /api/admin/users
- Returns: List of users with full profile data
```

## Frontend Routes
```
/users - User Registry Page with enhanced player details modal
```

## Customization

### To Add More Sample Players:
1. Modify `seed-harsh-patel.js` or create new seed script
2. Update player details in the script
3. Run: `node src/scripts/seed-harsh-patel.js`

### To Add More Sports:
PlayerDetailsTab component supports:
- Cricket ✅
- Football ✅
- Kabaddi ✅

Data structure automatically handles all three sports.

### To Extend Match Statistics:
Edit the `PlayerDetailsTab.tsx` MatchRow component to show:
- Bowling figures
- Batting details
- Individual performance metrics

## Testing Checklist

- [ ] MongoDB is running
- [ ] Backend server is running
- [ ] Seed script executed successfully
- [ ] Admin panel is accessible
- [ ] Can login as Super Admin/Sub-Admin
- [ ] Can search for "Harsh Patel"
- [ ] Can view player profile
- [ ] Can switch between "Profile Info" and "Stats & Details" tabs
- [ ] Overview tab shows all stats
- [ ] Matches tab displays match history
- [ ] Leagues tab lists all tournaments
- [ ] Teams tab shows team details
- [ ] All data loads without errors

## Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED
```
**Solution:** Start MongoDB service
```bash
net start MongoDB  # Windows
# or manually run mongod
```

### Script Not Running
```
node: command not found
```
**Solution:** Install Node.js from nodejs.org

### Seed Data Not Showing
1. Check MongoDB connection
2. Verify backend is running
3. Check admin panel network requests (DevTools → Network)
4. Check browser console for errors

### Styles Not Loading
Clear browser cache and rebuild admin panel:
```bash
cd admin-panel
npm run dev
```

## Future Enhancements

1. **Add Football & Kabaddi Details**
   - Extend seed script with football/kabaddi tournaments
   - Populate player profiles for other sports

2. **Real-time Updates**
   - WebSocket integration for live match updates
   - Auto-refresh player stats during matches

3. **Export Features**
   - PDF player report generation
   - CSV export of match statistics

4. **Advanced Analytics**
   - Performance trends over time
   - Head-to-head statistics
   - Performance vs specific opponents

5. **Comparisons**
   - Compare two players side-by-side
   - Season performance comparison
   - Team performance analysis

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review browser console for errors
3. Check MongoDB logs
4. Verify all services are running
5. Check network requests in DevTools
