**Product Requirements Document (PRD)**

---

**Product Name (Placeholder):** _Fantasy Film League_\
**Goal:** Build a mobile game that lets users simulate the experience of running a Hollywood-style film production studio using a fictional budget, stylized celebrity names, and gamified movie outcomes.

---

### 1. **Core Gameplay Loop**

**Player Identity**

- Choose a producer name (e.g. "Big Bibi Pictures")
- Pick a genre focus (e.g. Horror, Comedy, Art House, Blockbuster)
- Start with \$1,000,000 in game currency
- **Creating a studio name, logo, and genre focus will deduct from your starting capital**
- **Rebranding your studio (e.g. changing the name, logo, or focus) later in the game will also cost money**

**Game Time vs Real Time**

- One in-game "month" = 1 real day
- One in-game year = 12 days
- 4 seasons per in-game year: Spring, Summer, Fall, Awards (Winter)

**Gameplay Loop:**

1. **Create Studio & Branding**
2. **Choose script from marketplace/ffrom the scripts you've bought**
3. **Hire cast and crew**
4. **Set production and marketing budget**
5. **Release film in chosen season**
6. **Track performance** (box office, reviews, award nominations, individual performance)
7. **Earn or lose money & reputation**
8. **Repeat** (can release as many movies per year as budget allows)

**Production Lifecycle Stages:**

- In Development
- Pre-Production
- In Production (3–5 in-game months)
- Post-Production (editing, VFX, etc.)
- Release
- Legacy View (studio archive)

---

### 2. **Key Game Mechanics**

**A. Budgeting**

- Each actor, director, and crew member has a variable cost
- You can only hire within your budget
- Going over budget requires a loan (with interest)

**B. Script Quality**

- Scripts are rated (★☆☆☆☆ to ★★★★★)
- Higher quality scripts cost more or require experience to unlock
- Genre/script matchups affect box office performance

**C. Crew & Talent**

- Actors, directors, editors, etc. have:
  - Popularity rating
  - Genre match
  - Availability/cooldown (e.g. post-hit actors are more expensive next season)
  - Reputation (based on real-life actor trends or parody data)
- Talent has names like "Timothy Challemouth," "Florence Pewpew," "Ryan Goosewing."
- **Talent is instanced per league/division; players in the same league cannot cast the same actor simultaneously.**
- **Talent values fluctuate based on simulated press, social fanbase, and past performance.**

**D. Film Performance Factors**

- Cast popularity
- Director reputation
- Script quality
- Season release timing (e.g. summer = big blockbuster earnings)
- Studio reputation
- Marketing budget
- Prior flops affect studio trust
- **Individual performance outcomes:** After release, each cast/crew member receives a performance rating based on how well their work was received:
  - Breakout Star → gains popularity, higher cost next time
  - Scene Stealer → strong individual review even in a flop
  - Weak Link → blamed in reviews, slight rep hit
  - Cult Favorite → gains niche fanbase even in limited release
  - Award Nominee → automatically nominated if rating is high enough

**E. Random Industry Events**

- Actor exits project mid-production (requires recasting)
- Crew affair scandal (tabloid fallout or production delay)
- Director goes MIA or falls sick (project delayed or canceled)
- Cast member dies unexpectedly (pause production, new options unlock)
- On-set drama (extra costs or reputation dip)
- Reshoots required (due to poor performance or studio notes)
- Surprise breakout actor boosts film hype mid-production

**F. Reputation System**

- Studios earn or lose Rep Points based on film success
- More Rep = better scripts unlocked, cheaper negotiation deals
- Flops reduce Rep and investor trust
- Rebranding available to start fresh (at a financial cost)

---

### 3. **Player Interactions**

- **Fantasy Divisions:** Players are grouped into mini-leagues (10–15 players)
- **Co-productions:** Split costs and earnings with other players
- **Talent Loaning:** Temporarily loan a cast or director for a fee
- **Studio Rankings:** Global and genre-specific leaderboards
- **Guilds:** Join production collectives (e.g. "AfroCinema Elite")
- **Festivals & Awards:** Compete during Awards Season (Best Actor, Best Director, etc.)
  - Players only compete against others in their division
  - Each award category is exclusive to one winner per division
  - Winning unlocks exclusive perks, actor discounts, and badges

---

### 4. **Script Marketplace & Creation**

**Marketplace Scripts**

- Purchaseable scripts with fixed genres and ratings
- Some tied to real-world trends (e.g. "Sad Robot Love Story")

**User-Generated Scripts**

- Write-your-own mode unlocked at Studio Level 5+
- Can include:
  - Title, Genre, Logline, Tags (e.g. "based on true story")
  - Ratings from in-game script readers
- Best-rated player scripts can trend in the marketplace

---

### 5. **Monetization Strategy**

- Cosmetic upgrades (studio logos, poster templates, fancy offices)
- Extra currency packs
- Premium League access
- Time boosts (reduce cooldowns, unlock scripts faster)
- Talent Passes: Access to exclusive fake talent

---

### 6. **Legal Consideration**

- Avoid real names/logos for actors/directors
- Use parody/stylized names that hint at real people
- All characters are "satirical representations"
- Avoid likeness in images or bios; use cartoon-style avatars
- Bios include humorous stats and fake scandals to enhance parody defense

---

### 7. **User Flow (High-Level)**

1. **Onboarding**

   - Welcome screen → Choose studio name & style → Short tutorial

2. **Dashboard**

   - Budget Overview
   - Studio Reputation
   - Movies in Progress (with visible stages: Dev, Pre-Pro, Production, Post, Release)
   - Upcoming Opportunities (scripts, actors, festivals)

3. **Movie Creation Flow**

   - Choose script
   - Cast crew
   - Set production + marketing budget
   - Choose release season
   - Confirm + Launch

4. **Results View**

   - Box office earnings breakdown
   - Fan reactions
   - Critical reviews
   - Awards & nominations
   - News headlines (random events + film reception)
   - **Cast & crew performance reviews (e.g. “Florence Pewpew steals every scene.”)**

5. **Social Interaction**

   - Leaderboards
   - Collab Requests
   - Studio Messages
   - Gossip Tab (rumors, industry events)

---

### 8. **Gameplay Formulas**

**A. Box Office Performance Formula**\
Each film earns a simulated "box office score" using the following weighted components:

```
Box Office Score = (Cast Score × 0.25) + (Director Score × 0.15) + (Script Score × 0.25) + (Season Bonus × 0.10) + (Marketing Score × 0.10) + (Studio Rep Modifier × 0.10) + (Random Events Modifier × 0.05)
```

**B. Converting Score to Box Office Earnings**

```
Box Office Earnings = Box Office Score × Genre Base Multiplier × Season Modifier × Buzz Modifier
```

- **Genre Base Multipliers:**

  - Blockbuster = ×1.5
  - Horror = ×1.2
  - Drama = ×1.0
  - Art House = ×0.8
  - Documentary = ×0.6

- **Season Modifiers:**

  - Summer: +20% for high-budget/genre matches
  - Winter: +25% for prestige dramas
  - Spring/Fall: Neutral or trend-based bonuses

- **Buzz Modifier:**

  - Breakout actor, viral marketing, or scandals can boost (×1.3)
  - Poor test screenings, reshoots, or press drama can reduce (×0.8)

Earnings are rolled out over 3 real days:

- Day 1: Opening weekend (50%)
- Day 2: Mid-run (30%)
- Day 3: Final bump (20%) + word-of-mouth bonus if high critical score

Earnings are displayed in:

- Real-time ticker in the dashboard
- Weekly charts (genre, division, global)
- Studio legacy view

**B. Talent Performance Formula** Each cast/crew member gets a performance outcome:

```
Performance Score = (Base Talent Stat × 0.4) + (Script Compatibility × 0.2) + (Director Synergy × 0.2) + (Studio Rep × 0.1) + (Random Factor × 0.1)
```

**C. Awards Nomination Formula** Top films in each league qualify based on cumulative score:

```
Nomination Score = Box Office Score + Performance Avg + Critical Buzz + Fanbase Growth
```

**D. Reputation Adjustment Formula**

```
New Rep = Old Rep + (Success Bonus − Failure Penalty) ± Publicity Modifier
```

**E. Studio Profit Calculation**

```
Profit = Box Office Earnings − Total Production Cost
```

---

### 9. **Character Generator Rules**

**A. Character Traits**

- Each character is created with:
  - Name (satirical, culturally diverse)
  - Age and birthday
  - Role (Actor, Director, Cinematographer, Composer, Editor, etc.)
  - Popularity score (0–100 scale)
  - Reputation level (e.g. Rising Star, Fan Favorite, Hit-or-Miss, Industry Legend)
  - Genre affinity (1–3 best-fit genres)
  - Star power rating (used in casting)
  - Personality quirks (e.g. "Method Actor," "Unreliable on Set")
  - Scandal history (optional)
  - Special tags (e.g. "Box Office Poison," "Critics’ Darling")

**B. Industry Lifecycle System**

- Characters enter and exit the game based on simulated time:
  - New characters are "discovered" every 3 in-game months
  - Breakout characters from user films are promoted and reused across leagues
  - Veteran talent may **retire** or **die** unexpectedly, triggering press events every 5 in-game months
  - Characters can be removed due to scandal, burnout, or creative hiatus
  - On their birthday, characters age up by a year
  - Recalculates buzz scores based on last movie performance or event mentions

**D. League-Scoped Pools**

- Characters are scoped to divisions/leagues for fairness:
  - Each player competes in a league with its own talent pool
  - If a breakout star is discovered in one league, that star might appear in others next season
  - Talent availability resets seasonally per league

**E. Tools for Players**

- Talent search filters (e.g. "Genre: Comedy," "Rising Stars Only")
- Track actors from past projects in a "Studio Rolodex"
- Sort by "Fan Buzz," "Availability," or "Performance Trend"
- Notifications for talent retirement, comebacks, or press scandals

---

### 10. **AI Use Cases**

The app integrates AI to create a dynamic, immersive world that mimics the unpredictability of the real film industry. These are the key AI-powered features:

**1. Character Generation**

- AI generates all actors, directors, and crew using prompt-based procedural creation.
- Each character includes:
  - Name (satirical/culturally adapted)
  - Role, personality quirks, genre preferences, and performance tags
  - Press-friendly traits (e.g., "Critics' Darling")
- Characters evolve with performance history, scandals, or awards.

**2. Script Review & Buzz Prediction**

- When users select or submit a script, AI returns:
  - A buzz rating (0–100)
  - Predicted audience appeal
  - Suggestions on genre fit or required star power
- Used to help guide casting and marketing decisions.

**3. Performance Review Simulation**

- After a film releases, AI generates:
  - Fan and critic reactions
  - Awards commentary
  - Actor-specific praise or critique (e.g., "Breakout role," "Scene stealer")
- Text is randomized using contextual film data and personality tags.

**4. Dynamic Gossip & Scandal Feed**

- AI generates weekly headlines and entertainment news:
  - “Bibi’s Studio rumored to split after flop sequel”
  - “Challemouth skipped wrap party — again!”
- These add flavor to the season and affect buzz.

**5. Newsroom Generator for Seasons**

- End-of-season content is summarized via AI:
  - Studio of the Year
  - Worst Box Office Flop
  - Rising Star
- Designed for social sharing and in-game reflection.

---

### 11. **Next Steps**

- Build low-fidelity wireframes
- Finalize game economy balancing
- Design seasonal event templates
- Build backend data structure for talent lifecycle simulation
