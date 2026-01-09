# Date Ideas AI - Design Doc

**What:** AI assistant that helps us decide what to do from our 165 saved Instagram date ideas  
**Why:** Decision paralysis with too many options, can't filter by weather/budget/time  
**How:** RAG system with local LLM

---

## The Problem

- 165 saved Instagram posts are impossible to use
- Can't filter by: weather, budget, time available, what we've done
- Events from past years might have wrong dates
- Just scrolling through Instagram saved posts sucks

**What we need:**
- Ask "What should we do this rainy Saturday?" → Get 3-5 good suggestions with reasons
- Track favorites and completed dates
- Warn about outdated events

---

## The Solution (High Level)

```
User asks question
   ↓
Filter dates by context (weather, cost, etc.)
   ↓
Send ~30 relevant dates to Ollama
   ↓
Get 3-5 recommendations with reasoning
```

**Why this approach:**
- Free (local LLM)
- Fast enough (2-5 sec with GPU)
- Private (nothing leaves your machine)
- Actually useful

---

## Architecture (Simple View)

```
┌─────────────────────────────────────┐
│  React App (Frontend)               │
│  - Chat interface                   │
│  - Show recommendations             │
│  - Track favorites/completed        │
└──────────┬──────────────────────────┘
           │
           ├─→ Weather API (optional)
           │
           ├─→ Ollama (local LLM)
           │
           └─→ dates.json (your data)
```

**Flow:**
1. Load 165 dates from JSON
2. User asks question
3. Filter dates (weather, cost, time)
4. Send filtered list to Ollama
5. Display 3-5 recommendations

---

## Data Structure

Each date has:
```json
{
  "title": "Lupe's Vegan Mexican Bar",
  "summary": "Cozy spot with $10 margs",
  "categories": ["food", "nightlife"],
  "location": {
    "city": "New York",
    "driveTime": "day-trip"
  },
  "cost": {
    "level": "$$",
    "estimate": "$10 happy hour"
  },
  "weather": {
    "indoor": true,
    "weatherDependent": false
  },
  "seasonal": {
    "isEvent": false,
    "yearRound": true
  }
}
```

---

## Tech Stack

**Frontend:**
- React + Vite
- Tailwind CSS
- localStorage (favorites/completed)

**AI:**
- Ollama (Llama 3.1 8B)
- Runs locally on your machine
- 2-5 seconds per query

**APIs:**
- OpenWeatherMap (optional, free tier)

---

## Build Plan

### Week 1: Get It Working
**Phase 1 (3-5 hours):** Load data, display dates, mark favorites
**Phase 2 (4-6 hours):** Build nice UI with Tailwind

### Week 2: Add the AI
**Phase 3 (5-7 hours):** Connect Ollama, build filtering, get recommendations working

### Week 3: Polish
**Phase 4 (2-3 hours):** Add weather
**Phase 5 (3-5 hours):** Deploy to Netlify

**Total:** ~20-30 hours over 3-4 weeks

---

## Phase Details

### Phase 1: Foundation (3-5 hours)
**Goal:** Working React app that shows dates

**Build:**
- [ ] React + Vite setup
- [ ] Load dates.json
- [ ] Display date cards
- [ ] Mark favorites (save to localStorage)
- [ ] Mark completed (save to localStorage)

**Success:** Can browse all dates, favorites persist

---

### Phase 2: UI (4-6 hours)
**Goal:** Make it look good

**Build:**
- [ ] Chat interface (text input)
- [ ] Nice date cards with Tailwind
- [ ] Filter buttons (categories)
- [ ] Loading states
- [ ] Mobile responsive

**Success:** Looks professional, works on phone

---

### Phase 3: RAG (5-7 hours)
**Goal:** AI recommendations work

**Build:**
- [ ] Connect to Ollama
- [ ] Build smart filters (weather, cost, time)
- [ ] Create LLM prompts
- [ ] Parse responses
- [ ] Display recommendations

**Success:** Can ask "rainy day ideas" and get good suggestions

---

### Phase 4: Weather (2-3 hours)
**Goal:** Weather-aware filtering

**Build:**
- [ ] Connect to weather API
- [ ] Add to filters
- [ ] Cache data (1 hour)

**Success:** Rainy day queries filter correctly

---

### Phase 5: Deploy (3-5 hours)
**Goal:** Live on internet

**Build:**
- [ ] Fix any bugs
- [ ] Test on mobile
- [ ] Deploy to Netlify
- [ ] Write README

**Success:** Works at a public URL

---

## Key Decisions

**Why local LLM?**
- Free forever
- Private
- Fast enough (2-5 sec)
- vs Claude API: slower but $0 vs ~$10/year

**Why pre-filtering?**
- Makes LLM faster (less to process)
- Better results (LLM focuses on fewer options)
- Works even if LLM fails

**Why localStorage?**
- Simple (no backend needed)
- Works offline
- Fine for personal use
- vs Backend: can't sync devices, but that's okay

---

## Risks

**If Ollama is too slow:**
- Add Claude API as "fast mode"
- Cost: ~$0.01 per query

**If LLM gives bad recommendations:**
- Improve filtering (rely less on AI)
- Better prompts
- Use Claude API

**If weather API hits limits:**
- Cache longer (3 hours)
- Make it optional

---

## Future Ideas (Not v1.0)

- Browser extension (add from Instagram)
- Multi-turn conversations
- Mobile app
- Share with friends

**For now:** Just build the core MVP

---

## Success Metrics

**Technical:**
- Response time < 15 seconds
- No crashes
- Works on mobile

**User Experience:**
- Recommendations make sense
- Actually helps us decide
- Easy to use

**Portfolio:**
- Demonstrates RAG
- Shows modern tech
- Clean code
- Deployed and working

---

## File Structure

```
/date-ideas-ai/
├── README.md
├── DESIGN.md (this file)
│
└── /web-app/
    ├── /src/
    │   ├── /components/
    │   │   ├── ChatInterface.jsx
    │   │   ├── DateCard.jsx
    │   │   └── FilterPanel.jsx
    │   │
    │   ├── /services/
    │   │   ├── ollama.js
    │   │   ├── weather.js
    │   │   ├── filter.js
    │   │   └── prompt.js
    │   │
    │   └── App.jsx
    │
    └── /public/
        └── /data/
            └── dates.json
```

---

## Using Cursor to Build

**Phase 1 Prompt:**
```
Create a React app that:
1. Loads dates from /public/data/dates.json
2. Displays them as cards (title, summary, categories)
3. Has Favorite and Complete buttons
4. Saves to localStorage
Use Tailwind for styling.
```

**Phase 3 Prompt:**
```
Create service/ollama.js that:
1. Connects to localhost:11434
2. Function: sendQuery(prompt) returns recommendations
3. Handles timeouts and errors
```

Break big tasks into small, specific prompts!

---

## Next Steps

1. ✅ Design doc done
2. ⏭️ Create GitHub repo
3. ⏭️ Start Phase 1 with Cursor
4. ⏭️ Build and learn!

---

**Remember:** Done is better than perfect. Get Phase 1 working, then iterate!
