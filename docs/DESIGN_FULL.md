# Date Ideas AI - Technical Design Document

**Author:** Anthony  
**Date:** November 14, 2025  
**Status:** Draft  
**Project Type:** Personal Learning Project / Portfolio Piece  
**Version:** 1.0

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Problem Statement](#problem-statement)
3. [Solution Overview](#solution-overview)
4. [System Architecture](#system-architecture)
5. [Data Model](#data-model)
6. [Technology Stack](#technology-stack)
7. [Implementation Plan](#implementation-plan)
8. [Success Metrics](#success-metrics)
9. [Risks & Mitigation](#risks--mitigation)
10. [Future Enhancements](#future-enhancements)

---

## Executive Summary

Date Ideas AI is a conversational assistant that helps couples make decisions about activities by providing intelligent, context-aware recommendations. The system transforms a collection of 165+ Instagram-saved date ideas into an interactive AI-powered experience that understands weather, time constraints, budget, and personal preferences.

**Key Features:**
- Natural language queries ("What should we do this rainy Saturday?")
- Context-aware filtering (weather, time, cost)
- Local LLM processing (privacy-first, cost-free)
- History tracking (favorites, completed dates)
- Event date verification warnings

**Primary Goal:** Build a production-quality RAG (Retrieval-Augmented Generation) application that demonstrates modern AI development practices while creating genuine personal value.

---

## Problem Statement

### The Challenge

After saving 165+ date ideas from Instagram over time, the collection has become difficult to use:

**Pain Points:**
1. **Decision Paralysis** - Too many options, no way to narrow down
2. **Missing Context** - Can't filter by current weather, available time, or budget
3. **Manual Work** - Must manually scroll through all saved posts
4. **Outdated Information** - Events from past years may have changed dates
5. **No Memory** - Can't track what's been done or mark favorites
6. **Inefficient Search** - Instagram's saved posts aren't searchable by these criteria

### User Needs

**Primary User:** Couple (Anthony & Lydia) planning dates in Princeton, NJ area

**Core Questions the System Must Answer:**
- "It's rainy this Saturday afternoon - what should we do?"
- "Quick dinner idea under $50 near Princeton"
- "Outdoor activity for a beautiful fall day"
- "What haven't we done in a while?"
- "Is this fall festival happening this year?"

**Required Capabilities:**
- Understand natural language queries
- Filter by weather conditions
- Consider time and budget constraints
- Track history (favorites, completed)
- Warn about potentially outdated events
- Explain recommendations (not just list them)

---

## Solution Overview

### High-Level Approach

Date Ideas AI uses **RAG (Retrieval-Augmented Generation)** to provide intelligent recommendations:

1. **Structured Data Layer** - All 165 date ideas processed into rich metadata
2. **Smart Pre-Filtering** - Narrow candidates using explicit filters (weather, cost, etc.)
3. **LLM Reasoning** - Local language model analyzes filtered options and generates contextual recommendations
4. **User Interface** - Chat-based interaction with visual recommendation cards

### Why RAG?

Traditional search would require exact keyword matches. RAG allows:
- ✅ Natural language understanding
- ✅ Context-aware reasoning
- ✅ Explanations for recommendations
- ✅ Handling vague queries ("something fun tonight")
- ✅ Learning from conversation history

### Why Local LLM?

Using Ollama (Llama 3.1 8B) instead of cloud APIs provides:
- ✅ Zero ongoing cost (free unlimited queries)
- ✅ Privacy (data never leaves the machine)
- ✅ Speed (2-5 seconds with GPU, acceptable for use case)
- ✅ Offline capability

---

## System Architecture

### Component Overview

The system consists of three main layers: **Data Processing** (offline), **Application Logic** (runtime), and **User Interface** (presentation).

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE LAYER                     │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │   Chat      │  │ Recommendation│  │    Filter Panel     │   │
│  │ Interface   │  │    Cards      │  │  (Categories/View)  │   │
│  └─────────────┘  └──────────────┘  └─────────────────────┘   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION LOGIC LAYER                      │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Query Processing Pipeline                   │  │
│  │                                                          │  │
│  │  1. User Query  →  Parse Intent & Extract Constraints   │  │
│  │  2. Context     →  Gather Weather, Time, User History   │  │
│  │  3. Filter      →  Smart Pre-filtering (Metadata-based) │  │
│  │  4. RAG         →  Send to LLM with Context             │  │
│  │  5. Response    →  Format & Display Recommendations     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │
│  │   State     │  │   Context   │  │   Filter Engine     │   │
│  │ Management  │  │   Builder   │  │  (Metadata Logic)   │   │
│  │(localStorage)│  │             │  │                     │   │
│  └─────────────┘  └─────────────┘  └─────────────────────┘   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                          │
│                                                                 │
│  ┌──────────────┐         ┌─────────────────────────────┐     │
│  │   Ollama     │         │    OpenWeatherMap API       │     │
│  │   (Local)    │         │       (Optional)            │     │
│  │              │         │                             │     │
│  │ Llama 3.1 8B │         │  - Current conditions       │     │
│  │ GPU Accel.   │         │  - Forecast data            │     │
│  │ 2-5 sec      │         │  - Free tier: 1000/day      │     │
│  └──────────────┘         └─────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                              │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                     dates.json                           │  │
│  │              (165 Processed Date Ideas)                  │  │
│  │                                                          │  │
│  │  Each entry contains:                                   │  │
│  │  - Title, Summary, Categories                           │  │
│  │  - Location (city, state, drive time)                   │  │
│  │  - Time (duration, time of day)                         │  │
│  │  - Cost (level, estimate, notes)                        │  │
│  │  - Weather (indoor/outdoor, weather-dependent)          │  │
│  │  - Seasonal (best seasons, event status)                │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Detailed Data Flow

#### 1. User Query Entry
```
User types: "It's rainy this Saturday, what should we do?"
   │
   ├─> Parse query for constraints
   │   - Weather: rainy
   │   - Day: Saturday
   │   - Time: unspecified (flexible)
   │   - Budget: unspecified
   │
   └─> Trigger processing pipeline
```

#### 2. Context Gathering
```
Context Builder assembles:
   │
   ├─> Current Conditions
   │   - Date: Saturday, November 16, 2025
   │   - Weather API: Rain, 52°F
   │   - Time of day: Afternoon
   │
   ├─> User History (from localStorage)
   │   - Favorites: [id1, id3, id7, ...]
   │   - Completed: {id2: "2025-10-15", id5: "2025-09-20", ...}
   │   - Recent views: [id9, id11, ...]
   │
   └─> Location Context
       - Base location: Princeton, NJ
       - Willing to travel: Local (<45 min) preferred
```

#### 3. Smart Pre-Filtering
```
Filter Engine reduces 165 dates to ~30-40 relevant candidates:

   Load all dates (165)
      │
      ├─> Filter: Weather
      │   - Remove: weather.weatherDependent = true AND outdoor = true
      │   - Keep: weather.indoor = true OR weatherDependent = false
      │   Result: ~85 dates
      │
      ├─> Filter: Location (if time constrained)
      │   - If query suggests "quick" or specific time window
      │   - Prefer: location.driveTime = "local"
      │   Result: ~60 dates
      │
      ├─> Filter: Cost (if mentioned)
      │   - If "cheap" or budget mentioned: cost.level = free, $, $$
      │   Result: ~40 dates
      │
      ├─> Filter: Time (if mentioned)
      │   - If "quick": duration = "quick", "1-2 hours"
      │   - If "all day": duration = "full-day", "half-day"
      │   Result: ~30 dates
      │
      └─> Prioritize
          - Boost: isEvent = true AND in current season
          - Boost: Not in completed list
          - Boost: In favorites list
          Final: ~30 ranked candidates
```

#### 4. LLM Processing
```
Build RAG Prompt:
   │
   ├─> System Context
   │   "You are a date planning assistant for a couple in Princeton, NJ.
   │    Provide 3-5 recommendations with reasoning."
   │
   ├─> Current Context
   │   "Today: Saturday, November 16, 2025
   │    Weather: Rain, 52°F
   │    User query: 'It's rainy this Saturday, what should we do?'"
   │
   ├─> Filtered Candidates (30 dates)
   │   For each date:
   │   "• [Title]
   │      [Summary]
   │      Location: [City, State] ([Drive Time])
   │      Duration: [Duration], Cost: [Cost Level]
   │      Indoor: [Yes/No], Weather-Dependent: [Yes/No]
   │      Categories: [List]
   │      [Event Warning if applicable]"
   │
   ├─> User History Context
   │   "User favorites: [Title 1], [Title 2], ...
   │    Recently completed: [Title 3], [Title 4], ..."
   │
   └─> Instructions
       "Recommend 3-5 options that:
        - Fit today's rainy weather
        - Explain WHY each is perfect for today
        - Note any special considerations
        - Prioritize variety across categories"

Send to Ollama API → Get response in 2-5 seconds
```

#### 5. Response Formatting
```
LLM returns recommendations:
   │
   ├─> Parse response
   │   - Extract recommended date IDs
   │   - Extract reasoning for each
   │   - Extract any warnings/notes
   │
   ├─> Enhance with metadata
   │   - Add full date objects
   │   - Include images/links
   │   - Add action buttons (Favorite, Complete, View)
   │
   └─> Display in UI
       - Show as recommendation cards
       - Include LLM's reasoning
       - Show event warnings if applicable
       - Enable user actions
```

### Component Responsibilities

#### Frontend Components

**ChatInterface**
- Handles user text input
- Displays conversation history
- Shows loading states during processing
- Manages conversation context

**RecommendationCard**
- Displays individual date recommendations
- Shows: title, summary, categories, location, cost, duration
- Action buttons: Favorite, Mark Complete, View Details
- Event warnings (if applicable)
- Visual styling with Tailwind

**FilterPanel**
- Category filter buttons
- View toggles (All / Favorites / Incomplete)
- Quick filters (Indoor, Outdoor, Free, Local)
- Active filter indicators

#### Backend Services

**service/ollama.js**
- Connects to local Ollama API (http://localhost:11434)
- Sends formatted prompts
- Handles errors and timeouts
- Returns parsed recommendations

**service/weather.js**
- Fetches weather from OpenWeatherMap
- Caches data (1 hour TTL)
- Parses conditions into actionable filters
- Returns: condition, temp, description

**service/filter.js**
- Implements smart filtering logic
- Combines multiple filter criteria
- Handles edge cases (missing data)
- Returns ranked, filtered candidates

**service/context.js**
- Gathers current context (date, time, weather)
- Loads user history from localStorage
- Parses query for implicit constraints
- Builds complete context object

**service/prompt.js**
- Builds LLM prompts from templates
- Injects context and candidate data
- Formats for optimal LLM understanding
- Handles different query types

#### State Management

**localStorage Schema**
```javascript
{
  "favorites": ["id1", "id3", "id7"],
  "completed": {
    "id2": "2025-10-15T14:30:00Z",
    "id5": "2025-09-20T19:00:00Z"
  },
  "recentViews": ["id9", "id11", "id15"],
  "preferences": {
    "defaultBudget": "$$",
    "preferredCategories": ["food", "outdoor"]
  }
}
```

---

## Data Model

### Core Data Structure

#### Date Object (Complete Schema)

```typescript
interface DateIdea {
  // Identity
  id: string;                    // Unique identifier (Instagram post ID)
  url: string;                   // Original Instagram URL
  caption: string;               // Original Instagram caption
  
  // AI-Extracted Metadata
  ai: {
    // Basic Info
    title: string;               // 20-40 character title
    summary: string;             // 1-2 sentence description
    categories: Category[];      // 1-3 relevant categories
    
    // Location
    location: {
      city: string | null;       // City name
      state: string | null;      // State abbreviation (NJ, NY, PA)
      neighborhood: string | null; // Specific area/neighborhood
      isLocal: boolean;          // Within 30-45 min of Princeton
      driveTime: DriveTime;      // "local" | "day-trip" | "weekend-trip" | "remote"
    };
    
    // Time
    time: {
      duration: Duration;        // "quick" | "1-2 hours" | "2-3 hours" | "half-day" | "full-day" | "evening"
      timeOfDay: TimeOfDay[];    // ["morning", "afternoon", "evening", "night", "any"]
      bestTime: string | null;   // Specific timing notes (e.g., "golden hour", "happy hour")
    };
    
    // Cost
    cost: {
      level: CostLevel;          // "free" | "$" | "$$" | "$$$"
      estimate: string | null;   // Specific price if mentioned (e.g., "$45 per person")
      notes: string | null;      // Additional cost details (e.g., "happy hour pricing")
    };
    
    // Weather
    weather: {
      indoor: boolean;           // Has indoor component
      outdoor: boolean;          // Has outdoor component
      weatherDependent: boolean; // Is significantly affected by weather
    };
    
    // Seasonal
    seasonal: {
      bestSeasons: Season[];     // ["spring", "summer", "fall", "winter"]
      yearRound: boolean;        // Available all year
      dateRange: string | null;  // Specific dates if mentioned (e.g., "Sept 27 - Oct 31")
      isEvent: boolean;          // True for festivals, concerts, temporary activities
      eventNotes: string | null; // Warning about verifying dates
    };
  };
  
  // Processing Metadata
  processedDate: string;         // ISO 8601 timestamp of when processed
}

// Enums
type Category = 
  | "food" 
  | "outdoor" 
  | "cultural" 
  | "active" 
  | "romantic" 
  | "creative" 
  | "nightlife" 
  | "seasonal" 
  | "entertainment" 
  | "educational";

type DriveTime = "local" | "day-trip" | "weekend-trip" | "remote";

type Duration = "quick" | "1-2 hours" | "2-3 hours" | "half-day" | "full-day" | "evening";

type TimeOfDay = "morning" | "afternoon" | "evening" | "night" | "any";

type CostLevel = "free" | "$" | "$$" | "$$$";

type Season = "spring" | "summer" | "fall" | "winter";
```

#### Example Date Objects

**Example 1: Restaurant (Always Available)**
```json
{
  "id": "DQ5M5VKEcw2",
  "url": "https://www.instagram.com/p/DQ5M5VKEcw2/",
  "caption": "SAVE THIS POST for the coziest vegan friendly Mexican bar...",
  "ai": {
    "title": "Lupe's Vegan Mexican Bar",
    "summary": "Cozy vegan-friendly Mexican restaurant in SoHo with $10 happy hour margaritas.",
    "categories": ["food", "nightlife"],
    "location": {
      "city": "New York",
      "state": "NY",
      "neighborhood": "SoHo",
      "isLocal": false,
      "driveTime": "day-trip"
    },
    "time": {
      "duration": "2-3 hours",
      "timeOfDay": ["afternoon", "evening", "night"],
      "bestTime": "Happy hour for $10 margaritas"
    },
    "cost": {
      "level": "$$",
      "estimate": "$10 margaritas during happy hour",
      "notes": "Happy hour pricing available"
    },
    "weather": {
      "indoor": true,
      "outdoor": false,
      "weatherDependent": false
    },
    "seasonal": {
      "bestSeasons": ["spring", "summer", "fall", "winter"],
      "yearRound": true,
      "dateRange": null,
      "isEvent": false,
      "eventNotes": null
    }
  },
  "processedDate": "2025-11-13T16:56:00.248655"
}
```

**Example 2: Seasonal Event**
```json
{
  "id": "DOM7i2QjPfQ",
  "url": "https://www.instagram.com/p/DOM7i2QjPfQ/",
  "caption": "Mountain Creek Fall Fest starts September 27th...",
  "ai": {
    "title": "Mountain Creek Fall Fest",
    "summary": "Fall festival with scenic sky ride and mountain coaster among autumn foliage.",
    "categories": ["outdoor", "seasonal", "active"],
    "location": {
      "city": "Vernon",
      "state": "NJ",
      "neighborhood": null,
      "isLocal": false,
      "driveTime": "day-trip"
    },
    "time": {
      "duration": "half-day",
      "timeOfDay": ["morning", "afternoon"],
      "bestTime": "Fall season for foliage viewing"
    },
    "cost": {
      "level": "$",
      "estimate": "$14.99-$24.99 per person",
      "notes": "Sky Ride $14.99 or adventure package $24.99"
    },
    "weather": {
      "indoor": false,
      "outdoor": true,
      "weatherDependent": true
    },
    "seasonal": {
      "bestSeasons": ["fall"],
      "yearRound": false,
      "dateRange": "September 27th onward",
      "isEvent": true,
      "eventNotes": "Fall Fest is seasonal - verify current year dates before planning"
    }
  },
  "processedDate": "2025-11-13T16:56:22.805687"
}
```

**Example 3: At-Home Activity**
```json
{
  "id": "DQMeXaDjQB9",
  "url": "https://www.instagram.com/p/DQMeXaDjQB9/",
  "caption": "at home coloring sheets that you cut in half...",
  "ai": {
    "title": "At-Home Coloring Date",
    "summary": "Split coloring sheets in half and each person colors their side together.",
    "categories": ["creative", "romantic"],
    "location": {
      "city": "Princeton",
      "state": "NJ",
      "neighborhood": null,
      "isLocal": true,
      "driveTime": "local"
    },
    "time": {
      "duration": "1-2 hours",
      "timeOfDay": ["evening", "night", "any"],
      "bestTime": null
    },
    "cost": {
      "level": "free",
      "estimate": null,
      "notes": "Uses materials you have at home"
    },
    "weather": {
      "indoor": true,
      "outdoor": false,
      "weatherDependent": false
    },
    "seasonal": {
      "bestSeasons": ["spring", "summer", "fall", "winter"],
      "yearRound": true,
      "dateRange": null,
      "isEvent": false,
      "eventNotes": null
    }
  },
  "processedDate": "2025-11-13T16:56:07.409221"
}
```

### User Data Model

Stored in browser's `localStorage`:

```typescript
interface UserData {
  // Favorites
  favorites: string[];           // Array of date IDs
  
  // Completed dates with timestamps
  completed: {
    [dateId: string]: string;    // ISO 8601 timestamp
  };
  
  // Recently viewed (for "show me something new")
  recentViews: string[];         // Last 20 viewed date IDs
  
  // User preferences (future)
  preferences?: {
    defaultBudget?: CostLevel;
    preferredCategories?: Category[];
    maxDriveTime?: DriveTime;
  };
}
```

**Example localStorage data:**
```json
{
  "favorites": [
    "DQ5M5VKEcw2",
    "DOM7i2QjPfQ",
    "DQonBBkkXvP"
  ],
  "completed": {
    "DQMeXaDjQB9": "2025-11-10T19:30:00Z",
    "DOltSAiEQsJ": "2025-10-15T14:00:00Z"
  },
  "recentViews": [
    "DOM7i2QjPfQ",
    "DQ5M5VKEcw2",
    "DQonBBkkXvP"
  ]
}
```

### Context Object Model

Built dynamically for each query:

```typescript
interface QueryContext {
  // Query info
  query: string;                 // Original user query
  timestamp: string;             // When query was made
  
  // Current conditions
  date: {
    dayOfWeek: string;           // "Saturday"
    month: string;               // "November"
    season: Season;              // "fall"
    isWeekend: boolean;
  };
  
  time: {
    timeOfDay: TimeOfDay;        // "afternoon"
    hour: number;                // 14 (2 PM)
  };
  
  // Weather (if available)
  weather?: {
    condition: string;           // "Rain", "Clear", "Cloudy"
    temp: number;                // Temperature in Fahrenheit
    description: string;         // "light rain", "sunny"
  };
  
  // User context
  user: {
    location: string;            // "Princeton, NJ"
    favorites: string[];         // IDs of favorited dates
    completed: string[];         // IDs of completed dates
    recentViews: string[];       // Recently viewed IDs
  };
  
  // Extracted constraints (from query parsing)
  constraints: {
    budget?: CostLevel;
    maxDuration?: Duration;
    categories?: Category[];
    driveTime?: DriveTime;
    indoor?: boolean;
    outdoor?: boolean;
  };
}
```

---

## Technology Stack

### Frontend

**Framework & Build Tool**
- **React 19** - UI framework
- **Vite 7** - Build tool and dev server
- **TypeScript** (optional, can use JavaScript) - Type safety

**Styling**
- **Tailwind CSS 3** - Utility-first CSS framework
- **PostCSS** - CSS processing

**State Management**
- **React Hooks** - useState, useEffect, useContext
- **localStorage API** - Persistent user data
- **No external state library needed** - App is simple enough

**Key Libraries**
- None required initially (keep it lean)
- Possible future additions:
  - `react-markdown` - If displaying formatted LLM responses
  - `date-fns` - Date manipulation if needed

### Backend / Services

**AI/ML**
- **Ollama** - Local LLM runtime
- **Llama 3.1 8B** - Language model
- **Hardware:** NVIDIA GTX 1070 Ti (8GB VRAM)
- **Performance:** 2-5 seconds per query with GPU acceleration

**External APIs**
- **OpenWeatherMap API** (optional)
  - Free tier: 1,000 calls/day
  - 60 calls/minute rate limit
  - Current conditions + 5-day forecast

**API Integration**
- **Fetch API** - Native browser HTTP client
- **No axios needed** - fetch is sufficient

### Data Processing (Offline)

**Language**
- **Python 3.12**

**Libraries**
- `anthropic` - Claude API client
- `openpyxl` - Excel file handling
- Standard library: `json`, `os`, `datetime`

**AI Processing**
- **Claude API** (Anthropic)
- **Model:** claude-sonnet-4-20250514
- **Cost:** ~$0.002 per date idea (~$0.30 for 165 items)

### Development Tools

**IDE**
- **Cursor** - AI-powered code editor
- **VS Code** (backup) - Traditional IDE

**Version Control**
- **Git** - Source control
- **GitHub** - Repository hosting

**Package Management**
- **npm** - Node package manager
- **pip** - Python package manager

### Deployment (Phase 5)

**Hosting Options**
- **Netlify** (recommended) - Free tier, auto-deploy from Git
- **Vercel** - Alternative, similar features
- **GitHub Pages** - Simple static hosting

**Requirements**
- Static site hosting (no server needed)
- Ollama runs locally on user's machine
- Weather API calls from browser

### Development Environment

**Operating System**
- Windows 11

**Hardware Requirements**
- **Minimum:** 8GB RAM, any CPU
- **Recommended:** 16GB RAM, NVIDIA GPU (for faster LLM)
- **Storage:** ~10GB for Ollama + models

**Software Versions**
- Node.js: v20.x or v22.x LTS
- Python: 3.12
- Git: Latest stable
- Ollama: Latest stable

---

## Implementation Plan

### Overview

Development is organized into 5 phases over 3-4 weeks, building from foundation to full features. Each phase has clear deliverables and success criteria.

**Total Estimated Time:** 20-30 hours across 3-4 weeks  
**Approach:** Iterative development with working software at each phase

---

### Phase 1: Foundation & Data Display
**Duration:** 3-5 hours  
**Goal:** Working React app that loads and displays date data

#### Tasks
1. **Project Setup** (30 min)
   - [ ] Create React + Vite project with Cursor
   - [ ] Configure Tailwind CSS
   - [ ] Set up project folder structure
   - [ ] Initialize Git repository
   - [ ] Create initial README

2. **Data Integration** (1 hour)
   - [ ] Copy dates.json to /public/data/
   - [ ] Create data loading service
   - [ ] Implement error handling for missing data
   - [ ] Add loading states

3. **Basic UI** (2 hours)
   - [ ] Create App component structure
   - [ ] Build DateCard component with Tailwind styling
   - [ ] Display list of all dates
   - [ ] Add basic navigation/filtering UI (buttons for categories)

4. **Local Storage** (1 hour)
   - [ ] Implement favorites toggle
   - [ ] Implement completed marking
   - [ ] Persist to localStorage
   - [ ] Load from localStorage on mount

#### Success Criteria
- ✅ App loads and displays all 165 dates
- ✅ Date cards show: title, summary, categories, location, cost
- ✅ Can mark favorites and completed
- ✅ Favorites/completed persist across page refreshes
- ✅ Basic filtering by category works
- ✅ No console errors
- ✅ Responsive on mobile

#### Deliverable
Working single-page app with data display and basic interactions.

---

### Phase 2: UI Components & Polish
**Duration:** 4-6 hours  
**Goal:** Complete, polished user interface

#### Tasks
1. **Chat Interface** (2 hours)
   - [ ] Create ChatInterface component
   - [ ] Text input with submit button
   - [ ] Message history display
   - [ ] Loading state animation
   - [ ] Error state handling

2. **Recommendation Display** (2 hours)
   - [ ] Enhanced DateCard with full metadata display
   - [ ] Event warning banners (for seasonal events)
   - [ ] Action buttons (View, Favorite, Complete)
   - [ ] Category tags with colors
   - [ ] Responsive grid layout

3. **Filter Panel** (1 hour)
   - [ ] Category filter buttons
   - [ ] View toggles (All / Favorites / Incomplete)
   - [ ] Quick filters (Indoor, Outdoor, Free, Local)
   - [ ] Active filter indicators
   - [ ] Clear filters button

4. **UI Polish** (1 hour)
   - [ ] Animations and transitions
   - [ ] Empty states (no results, no favorites)
   - [ ] Loading skeletons
   - [ ] Mobile responsiveness refinement
   - [ ] Dark mode (optional)

#### Success Criteria
- ✅ Clean, professional UI with Tailwind
- ✅ All interactions feel smooth
- ✅ Empty states are helpful
- ✅ Mobile experience is excellent
- ✅ Event warnings display correctly
- ✅ Filtering is intuitive

#### Deliverable
Production-quality UI that feels professional and polished.

---

### Phase 3: RAG Logic & LLM Integration
**Duration:** 5-7 hours  
**Goal:** Working conversational recommendations with Ollama

#### Tasks
1. **Ollama Service** (1 hour)
   - [ ] Create service/ollama.js
   - [ ] Connect to Ollama API (localhost:11434)
   - [ ] Test connection and error handling
   - [ ] Implement retry logic
   - [ ] Handle timeouts gracefully

2. **Filter Service** (2 hours)
   - [ ] Create service/filter.js
   - [ ] Implement weather-based filtering
   - [ ] Implement cost-based filtering
   - [ ] Implement time-based filtering
   - [ ] Implement location-based filtering
   - [ ] Add filter combination logic
   - [ ] Add prioritization/ranking

3. **Context Builder** (1 hour)
   - [ ] Create service/context.js
   - [ ] Parse current date/time
   - [ ] Detect season
   - [ ] Load user history
   - [ ] Extract constraints from query

4. **Prompt Builder** (1 hour)
   - [ ] Create service/prompt.js
   - [ ] Design base prompt template
   - [ ] Inject context dynamically
   - [ ] Format candidate dates for LLM
   - [ ] Handle different query types

5. **Integration** (2 hours)
   - [ ] Wire up query flow
   - [ ] Test end-to-end recommendation
   - [ ] Handle LLM errors
   - [ ] Parse LLM responses
   - [ ] Display recommendations in UI

#### Success Criteria
- ✅ Can ask "What should we do today?" and get recommendations
- ✅ Recommendations are contextually relevant
- ✅ Pre-filtering reduces candidates to <50 dates
- ✅ LLM response time acceptable (2-15 seconds)
- ✅ Recommendations include reasoning
- ✅ Error handling works (Ollama not running, etc.)

#### Deliverable
Working RAG system with natural language queries.

---

### Phase 4: Weather Integration
**Duration:** 2-3 hours  
**Goal:** Weather-aware recommendations

#### Tasks
1. **Weather Service** (1 hour)
   - [ ] Create service/weather.js
   - [ ] Set up OpenWeatherMap API key
   - [ ] Fetch current weather for Princeton, NJ
   - [ ] Implement caching (1 hour TTL)
   - [ ] Parse weather into actionable data

2. **Integration** (1 hour)
   - [ ] Add weather to context builder
   - [ ] Update filter logic to use weather
   - [ ] Include weather in LLM prompts
   - [ ] Display weather in UI (optional)

3. **Testing** (1 hour)
   - [ ] Test on rainy day (or mock)
   - [ ] Test on sunny day
   - [ ] Verify filtering works correctly
   - [ ] Verify LLM mentions weather

#### Success Criteria
- ✅ Weather data fetches successfully
- ✅ Rainy day filters out outdoor weatherDependent activities
- ✅ LLM mentions weather in recommendations
- ✅ Caching prevents excessive API calls
- ✅ Graceful degradation if weather API fails

#### Deliverable
Weather-aware recommendation system.

---

### Phase 5: Polish & Deployment
**Duration:** 3-5 hours  
**Goal:** Production-ready, deployed application

#### Tasks
1. **Error Handling** (1 hour)
   - [ ] Add error boundaries
   - [ ] Improve error messages
   - [ ] Add retry mechanisms
   - [ ] Handle edge cases

2. **Performance** (1 hour)
   - [ ] Optimize bundle size
   - [ ] Lazy load components
   - [ ] Add loading skeletons
   - [ ] Test on slower connections

3. **Mobile Polish** (1 hour)
   - [ ] Test on actual mobile device
   - [ ] Fix any mobile-specific issues
   - [ ] Optimize touch interactions
   - [ ] Test different screen sizes

4. **Documentation** (1 hour)
   - [ ] Update README with setup instructions
   - [ ] Add screenshots
   - [ ] Document API keys needed
   - [ ] Add troubleshooting section

5. **Deployment** (1 hour)
   - [ ] Set up Netlify account
   - [ ] Connect GitHub repository
   - [ ] Configure build settings
   - [ ] Deploy and test
   - [ ] Set up custom domain (optional)

#### Success Criteria
- ✅ No console errors in production
- ✅ Works on mobile and desktop
- ✅ Deployed and accessible via URL
- ✅ README is clear and complete
- ✅ All features work in production

#### Deliverable
Deployed, production-ready application with full documentation.

---

### Optional Future Phases

**Phase 6: Browser Extension** (v2.0)
- One-click add from Instagram
- Background processing queue
- Estimated: 8-10 hours

**Phase 7: Advanced Features** (v2.1)
- Multi-turn conversations
- Learning from feedback
- Partner collaboration
- Estimated: 10-15 hours

**Phase 8: Mobile App** (v3.0)
- Native iOS/Android
- Push notifications
- Location-based suggestions
- Estimated: 40-60 hours

---

## Success Metrics

### Technical Metrics

**Performance**
- [ ] LLM response time: 2-15 seconds (acceptable range)
- [ ] Pre-filtering reduces candidates to <50 dates
- [ ] Page load time: <2 seconds
- [ ] Weather API calls: <10 per day (with caching)

**Reliability**
- [ ] Zero runtime errors in production
- [ ] Graceful degradation if Ollama unavailable
- [ ] Graceful degradation if weather API fails
- [ ] Data persists correctly in localStorage

**Code Quality**
- [ ] Clean, readable code structure
- [ ] Consistent naming conventions
- [ ] Proper error handling throughout
- [ ] Comments on complex logic

### User Experience Metrics

**Relevance**
- [ ] Recommendations match query context (weather, time, etc.)
- [ ] "Why" explanations make logical sense
- [ ] Event warnings appear when appropriate
- [ ] Filters work as expected

**Usability**
- [ ] Natural language queries work well
- [ ] UI is intuitive (no instructions needed)
- [ ] Mobile experience is smooth
- [ ] Loading states are clear

**Features**
- [ ] Can mark favorites and they persist
- [ ] Can mark completed and they persist
- [ ] Can filter by category
- [ ] Can toggle between views (All/Favorites/Incomplete)

### Business/Portfolio Metrics

**Demonstrates Skills**
- [ ] RAG architecture implementation
- [ ] LLM integration (local and API)
- [ ] React/modern frontend development
- [ ] Data processing pipeline (Python + Claude API)
- [ ] API integration (weather)
- [ ] State management (localStorage)
- [ ] Responsive design (Tailwind)

**Professional Quality**
- [ ] Clean Git history
- [ ] Comprehensive README
- [ ] Technical design document
- [ ] Deployed and accessible
- [ ] Works on multiple devices/browsers

**Story for Interviews**
- [ ] Can explain the problem it solves
- [ ] Can explain technical architecture
- [ ] Can discuss trade-offs made
- [ ] Can explain RAG approach
- [ ] Can discuss what would change for scale

---

## Risks & Mitigation

### Technical Risks

#### Risk 1: Ollama Performance Issues
**Risk:** LLM takes too long (15+ seconds), making UX poor  
**Likelihood:** Medium  
**Impact:** High

**Mitigation:**
- Show engaging loading animation with progress indication
- Pre-filter aggressively to reduce context size
- Implement Claude API fallback for "fast mode"
- Consider smaller model (Llama 3.2 3B) for faster responses
- Test on actual hardware early

**Contingency:**
If local LLM is too slow, pivot to Claude API as primary with:
- Cost: ~$0.01-0.02 per query (~$5-10/year with regular use)
- Response time: 2-3 seconds
- Quality: Higher than local LLM

---

#### Risk 2: Weather API Rate Limits
**Risk:** Free tier limits hit, API calls fail  
**Likelihood:** Low  
**Impact:** Medium

**Mitigation:**
- Implement aggressive caching (1 hour TTL)
- Only fetch when user actually queries
- Show cached weather age ("Weather from 30 min ago")
- Make weather feature optional (works without it)

**Contingency:**
If limits are hit:
- Extend cache to 3 hours
- Degrade to manual weather input
- Upgrade to paid tier ($40/month for 100,000 calls)

---

#### Risk 3: LLM Quality Issues
**Risk:** Local LLM gives poor/irrelevant recommendations  
**Likelihood:** Medium  
**Impact:** High

**Mitigation:**
- Strong pre-filtering reduces reliance on LLM
- Test multiple prompt variations
- Have Claude API as fallback option
- Provide user feedback mechanism to improve prompts

**Contingency:**
If recommendations are consistently poor:
- Tighten pre-filtering (rely less on LLM reasoning)
- Switch to Claude API (better quality)
- Use hybrid: pre-filter with local LLM, fallback to Claude for complex queries

---

#### Risk 4: Data Quality Issues
**Risk:** Extracted metadata is inaccurate or incomplete  
**Likelihood:** Low-Medium  
**Impact:** Medium

**Mitigation:**
- Spot-check 20-30 entries during processing
- Refine Claude prompt based on quality check
- Add manual correction capability if needed
- Version the processed data (can reprocess if needed)

**Contingency:**
If metadata is poor:
- Reprocess with improved prompts (~$0.30 cost)
- Add manual corrections to critical entries
- Build correction UI for fixing bad data

---

### User Experience Risks

#### Risk 5: Unclear Value Proposition
**Risk:** Users don't understand why this is better than browsing Instagram  
**Likelihood:** Low  
**Impact:** High

**Mitigation:**
- Clear onboarding message explaining benefits
- Show example queries
- Demonstrate context-awareness immediately
- Provide comparison: "Try searching Instagram for 'rainy day ideas under $50'"

**Contingency:**
If users don't get it:
- Add tutorial/walkthrough
- Provide sample queries as buttons
- Show before/after comparison

---

#### Risk 6: Empty Result Sets
**Risk:** Overly-specific queries return zero results  
**Likelihood:** Medium  
**Impact:** Medium

**Mitigation:**
- Implement progressive relaxation (remove least important filters)
- Show "No exact matches, here are close options..."
- Suggest alternative queries
- Always show at least 3 recommendations

**Contingency:**
If this happens frequently:
- Make filters less strict
- Add "expand search" button
- Show number of matches for each filter

---

### Project Risks

#### Risk 7: Scope Creep
**Risk:** Adding too many features, never finishing  
**Likelihood:** High  
**Impact:** High

**Mitigation:**
- Strict phase boundaries (don't start Phase 2 until Phase 1 complete)
- Clear MVP definition (Phases 1-4 only)
- Document future features but don't build them
- Time-box each phase

**Contingency:**
If scope is expanding:
- Review DESIGN.md and cut back to MVP
- Move features to "Future Enhancements"
- Focus on one complete feature over multiple partial ones

---

#### Risk 8: Tool Learning Curve
**Risk:** Too much time learning Cursor, not enough building  
**Likelihood:** Medium  
**Impact:** Medium

**Mitigation:**
- Use Cursor for implementation, not learning
- Fall back to VS Code if Cursor is slowing down
- Focus on getting things working, not perfect AI usage
- Time-box troubleshooting (15 min max, then move on)

**Contingency:**
If Cursor is blocking progress:
- Switch to VS Code + manual coding
- Use Claude web interface for help
- Return to Cursor later with more experience

---

## Future Enhancements

These features are explicitly **out of scope** for v1.0 but documented for future consideration.

### Phase 6: Browser Extension (v2.0)
**Timeline:** After v1.0 deployed  
**Effort:** 8-10 hours

**Features:**
- Chrome/Firefox extension
- One-click "Add to Date Ideas" button on Instagram
- Queues posts for background processing
- Notification when processing complete

**Value:**
- Eliminates manual URL collection
- Makes adding new ideas effortless
- Better UX than manual process

**Technical:**
- Browser extension manifest
- Content script injection on Instagram
- Communication with processing pipeline
- Queue management

---

### Phase 7: Advanced Features (v2.1)
**Timeline:** After v2.0  
**Effort:** 10-15 hours

**Multi-Turn Conversations**
- "Tell me more about option 2"
- "What else is similar?"
- "Show me cheaper alternatives"
- Maintain conversation context

**Learning & Personalization**
- Track which recommendations were accepted
- Learn preferences over time
- Adjust suggestions based on history
- "You usually like outdoor activities..."

**Collaborative Planning**
- Share recommendations with partner
- Joint voting on options
- "We both like this" feature
- Decision history

**Smart Suggestions**
- Proactive: "It's supposed to be nice this weekend..."
- Anniversary reminders
- Seasonal suggestions
- "You haven't done outdoor activities in a while"

---

### Phase 8: Mobile App (v3.0)
**Timeline:** Long-term (6+ months)  
**Effort:** 40-60 hours

**Native Features:**
- iOS and Android apps
- Push notifications for events
- Location-based suggestions
- Camera integration (photo memories)
- Calendar integration
- Maps integration

**Advanced AI:**
- Voice input
- Image recognition (save from photos)
- Real-time availability checking
- Dynamic pricing updates

---

### Phase 9: Social Features (v3.1)
**Timeline:** Long-term  
**Effort:** 20-30 hours

**Community:**
- Share your date collection with friends
- Discover what others in your area saved
- Collaborative lists ("Best dates in Princeton")
- Reviews and ratings
- Photo sharing

**Discovery:**
- "Trending in your area"
- "Similar couples also liked..."
- Expert-curated collections
- Seasonal highlights

---

### Phase 10: Enterprise Features (Hypothetical)
**For Scaling to Product:**

**Multi-User:**
- User accounts and authentication
- Cloud sync across devices
- Privacy controls
- Data export

**Business Model:**
- Free tier (basic features)
- Premium tier (advanced AI, unlimited queries)
- Affiliate links (restaurants, venues)
- Sponsored recommendations (ethical)

**Infrastructure:**
- Backend API (Node.js/Python)
- Database (PostgreSQL)
- Cloud hosting (AWS/GCP)
- CDN for images
- Analytics

---

## Appendix

### A. Development Environment Setup

**Required Software:**
1. Node.js v20.x or v22.x LTS
2. Git (latest stable)
3. Cursor IDE
4. Ollama (latest stable)
5. Python 3.12 (for data processing)

**Optional Software:**
1. VS Code (backup IDE)
2. Postman (API testing)
3. Git GUI client

**Ollama Setup:**
```bash
# Install Ollama
Download from https://ollama.ai

# Pull Llama model
ollama pull llama3.1:8b

# Test it works
ollama run llama3.1:8b "Hello, world!"

# Check GPU is being used
nvidia-smi
# Should show ollama process using GPU
```

**API Keys Needed:**
1. Claude API key (for data processing)
2. OpenWeatherMap API key (optional, for weather)

---

### B. Repository Structure

```
/date-ideas-ai/
├── README.md                    # Project overview, setup instructions
├── DESIGN.md                    # This document
├── .gitignore                   # Git ignore rules
├── package.json                 # Node dependencies
│
├── /docs/                       # Additional documentation
│   ├── architecture.md          # Detailed architecture diagrams
│   ├── api-spec.md             # API specifications
│   └── deployment.md           # Deployment guide
│
├── /src/                        # Source code
│   ├── /processing/             # Python data processing
│   │   ├── process_urls_enhanced.py
│   │   ├── requirements.txt
│   │   ├── instagram_urls.xlsx
│   │   └── dates.json          # Generated output
│   │
│   └── /web-app/               # React application
│       ├── /public/
│       │   └── /data/
│       │       └── dates.json  # Copy from processing
│       │
│       ├── /src/
│       │   ├── /components/    # React components
│       │   │   ├── ChatInterface.jsx
│       │   │   ├── DateCard.jsx
│       │   │   ├── FilterPanel.jsx
│       │   │   └── RecommendationList.jsx
│       │   │
│       │   ├── /services/      # Business logic
│       │   │   ├── ollama.js
│       │   │   ├── weather.js
│       │   │   ├── filter.js
│       │   │   ├── context.js
│       │   │   └── prompt.js
│       │   │
│       │   ├── /utils/         # Helper functions
│       │   │   ├── storage.js  # localStorage helpers
│       │   │   ├── date.js     # Date manipulation
│       │   │   └── format.js   # String formatting
│       │   │
│       │   ├── /hooks/         # Custom React hooks
│       │   │   ├── useDates.js
│       │   │   ├── useWeather.js
│       │   │   └── useOllama.js
│       │   │
│       │   ├── App.jsx         # Main app component
│       │   ├── main.jsx        # Entry point
│       │   └── index.css       # Global styles (Tailwind)
│       │
│       ├── package.json
│       ├── vite.config.js
│       ├── tailwind.config.js
│       └── postcss.config.js
│
└── /tests/                      # Tests (future)
    ├── /unit/
    └── /integration/
```

---

### C. Cursor AI Prompting Strategy

**For Phase 1 (Foundation):**
```
Prompt: "Set up a React + Vite project with Tailwind CSS. 
Create this folder structure:
- /src/components
- /src/services  
- /src/utils
- /src/hooks

Create App.jsx that:
1. Loads data from /public/data/dates.json
2. Displays loading state while fetching
3. Shows error if fetch fails
4. Displays array of dates in a grid

Use Tailwind for styling."
```

**For Phase 2 (Components):**
```
Prompt: "Create a DateCard component that displays:
- Title (large, bold)
- Summary (smaller text, gray)
- Categories as colored pills
- Location and cost as icons + text
- Favorite and Complete buttons

Use Tailwind. Make it responsive. 
Props: { date, onFavorite, onComplete, isFavorite, isComplete }"
```

**For Phase 3 (RAG Logic):**
```
Prompt: "Create src/services/ollama.js that:
1. Connects to Ollama at localhost:11434
2. Has function: sendQuery(prompt) => Promise<string>
3. Handles errors (timeout, connection refused)
4. Implements 30-second timeout
5. Returns parsed text response

Use fetch API. Include error handling and retry logic."
```

**General Tips:**
- Be specific about file locations
- Specify props/parameters
- Request error handling explicitly
- Ask for Tailwind styling
- Request comments on complex logic
- Break large tasks into smaller prompts

---

### D. Key Design Decisions & Rationale

**Decision 1: Local LLM (Ollama) vs Cloud API**
- **Chosen:** Local LLM (Ollama)
- **Rationale:** 
  - Zero ongoing cost (important for personal project)
  - Privacy (data never leaves machine)
  - Learning opportunity (understanding local AI deployment)
  - Acceptable performance with GPU (2-5 seconds)
- **Trade-off:** Slightly lower quality than Claude API, but 80% as good for free

**Decision 2: React vs Other Frameworks**
- **Chosen:** React
- **Rationale:**
  - Most common in industry (good for portfolio)
  - Already familiar from initial learning
  - Rich ecosystem
  - Works well with Cursor
- **Trade-off:** Could use Vue or Svelte for simpler learning curve

**Decision 3: Tailwind vs Other CSS**
- **Chosen:** Tailwind CSS
- **Rationale:**
  - Rapid development (no writing CSS)
  - Consistent design system
  - Great for prototypes
  - Industry standard
- **Trade-off:** HTML gets verbose, but speeds up development

**Decision 4: localStorage vs Backend**
- **Chosen:** localStorage
- **Rationale:**
  - No backend needed (simpler)
  - Works offline
  - Instant persistence
  - Suitable for personal use
- **Trade-off:** Can't sync across devices, but acceptable for MVP

**Decision 5: Static Site vs Full-Stack App**
- **Chosen:** Static site (Netlify)
- **Rationale:**
  - Free hosting
  - Simple deployment
  - No server maintenance
  - Ollama runs locally anyway
- **Trade-off:** Can't share recommendations, but not needed for v1.0

**Decision 6: Weather API Optional**
- **Chosen:** Make weather optional, not required
- **Rationale:**
  - Core functionality works without it
  - Reduces external dependencies
  - Free tier has limits
  - User can still input weather manually
- **Trade-off:** Slightly less automated

**Decision 7: Pre-filtering Before LLM**
- **Chosen:** Aggressive metadata-based filtering
- **Rationale:**
  - Reduces LLM context (faster responses)
  - Higher quality results (LLM focuses on fewer options)
  - Works even if LLM fails
  - Cheaper (if using API)
- **Trade-off:** More complex filtering logic

**Decision 8: Single-Turn vs Multi-Turn Conversations**
- **Chosen:** Single-turn for v1.0
- **Rationale:**
  - Simpler to implement
  - Covers 80% of use cases
  - Can add multi-turn later
- **Trade-off:** Can't refine recommendations in conversation

---

### E. Testing Strategy

**Manual Testing Checklist**

**Functionality:**
- [ ] Can load app and see all dates
- [ ] Can mark favorites and they persist
- [ ] Can mark completed and they persist
- [ ] Can filter by category
- [ ] Can toggle views (All/Favorites/Incomplete)
- [ ] Can ask natural language query
- [ ] Get relevant recommendations
- [ ] Recommendations include reasoning
- [ ] Event warnings appear when appropriate
- [ ] Weather is considered (if available)

**Edge Cases:**
- [ ] Empty query (show helpful message)
- [ ] Very specific query with no matches (progressive relaxation)
- [ ] Ollama not running (graceful error)
- [ ] Weather API fails (still works)
- [ ] Slow network (loading states)
- [ ] No localStorage (still works)

**Cross-Browser:**
- [ ] Chrome (primary)
- [ ] Firefox
- [ ] Safari
- [ ] Edge

**Devices:**
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (iPad)
- [ ] Mobile (iPhone, Android)

**Automated Testing (Future):**
- Unit tests for services (filter.js, context.js)
- Integration tests for Ollama connection
- E2E tests for user flows (mark favorite, get recommendation)

---

### F. Analytics & Learning

**What to Track (Optional, Future):**
- Which queries are most common
- Which recommendations are accepted
- Average response time
- Filter combinations used
- Favorite categories
- Completion rate by category

**How to Learn:**
- Review localStorage data periodically
- Identify patterns in usage
- Refine prompts based on results
- Adjust filters based on success rate

**Privacy Note:**
- All tracking would be local only
- No data sent to servers
- User controls their own data
- Optional export for analysis

---

### G. Handoff Notes

**For Future Developers / Your Future Self:**

**To Run Locally:**
```bash
# 1. Start Ollama
ollama serve

# 2. Start React app
cd src/web-app
npm install
npm run dev

# 3. Open browser
http://localhost:5173
```

**To Process New Data:**
```bash
cd src/processing
python process_urls_enhanced.py
# Copy dates.json to web-app/public/data/
```

**Common Issues:**
- Ollama not responding → Check if `ollama serve` is running
- Weather not loading → Check API key in .env
- Data not loading → Check dates.json is in /public/data/
- Favorites not persisting → Check localStorage enabled in browser

**Making Changes:**
- UI changes → Modify components in /src/components/
- Filter logic → Modify /src/services/filter.js
- LLM prompts → Modify /src/services/prompt.js
- Styling → Update Tailwind classes in components

---

### H. Glossary

**RAG (Retrieval-Augmented Generation)**
- AI technique that combines retrieval (searching data) with generation (LLM creating text)
- Benefits: More accurate, contextual, and controllable than pure generation

**LLM (Large Language Model)**
- AI model trained on text to understand and generate language
- Examples: Claude, GPT-4, Llama

**Ollama**
- Tool for running LLMs locally on your computer
- Like Docker but for AI models

**Tailwind CSS**
- Utility-first CSS framework
- Instead of writing CSS, use classes like `text-blue-600 font-bold`

**localStorage**
- Browser API for storing data locally
- Persists across sessions
- Limited to ~5-10MB

**Vite**
- Modern build tool for web apps
- Faster than older tools like Webpack
- Hot module replacement (instant updates)

**Context Window**
- Amount of text an LLM can process at once
- Llama 3.1 8B: ~8000 tokens (~6000 words)
- Why pre-filtering matters: reduces context sent to LLM

---

## Conclusion

Date Ideas AI represents a practical application of modern AI techniques (RAG, local LLMs) to solve a real personal problem. The project balances learning goals (understanding AI development workflows) with building something genuinely useful.

**Key Takeaways:**
1. **Architecture First** - Design before implementation
2. **Incremental Development** - Working software at each phase
3. **Trade-offs Matter** - Local LLM vs API, features vs complexity
4. **Professional Practices** - Git, documentation, testing
5. **Learning by Doing** - Using Cursor to implement design

**Next Steps:**
1. Review and refine this design document
2. Create GitHub repository
3. Begin Phase 1 implementation
4. Iterate based on learnings

**Success Definition:**
A deployed, working application that:
- Solves the original problem (making saved posts usable)
- Demonstrates technical skills (RAG, React, AI integration)
- Shows professional practices (Git, docs, clean code)
- Provides portfolio value (interesting story, modern tech)

---

**Document Version:** 1.0  
**Last Updated:** November 14, 2025  
**Status:** Ready for implementation  
**Next Review:** After Phase 1 completion
