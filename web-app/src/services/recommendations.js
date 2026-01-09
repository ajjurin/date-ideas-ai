import { getCurrentWeather } from './weather'

export async function getRecommendations(query, allDates) {

    try {
     // get current weather
     const weather = await getCurrentWeather()
     console.log('Weather:', weather)
     
        // Get current date/time context
      const now = new Date()
      const dateContext = {
        date: now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        month: now.toLocaleDateString('en-US', { month: 'long' }),
        season: getSeason(now.getMonth()),
        isWeekend: now.getDay() === 0 || now.getDay() === 6,
        time: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        weather: weather
      }
      
      console.log('Date context:', dateContext)
      
      const queryLower = query.toLowerCase()
      let filteredDates = [...allDates]
      
      // 1. CATEGORY-BASED FILTERING (Intent matching)
      const categoryKeywords = {
        'food': ['food', 'restaurant', 'dinner', 'lunch', 'breakfast', 'brunch', 'eat', 'cuisine', 'meal', 'dining'],
        'outdoor': ['outdoor', 'outside', 'hike', 'park', 'nature', 'walk', 'trail', 'fresh air'],
        'romantic': ['romantic', 'date night', 'couple', 'anniversary', 'special', 'intimate'],
        'active': ['active', 'exercise', 'sport', 'physical', 'workout', 'adventure', 'energetic'],
        'creative': ['creative', 'art', 'craft', 'make', 'create', 'diy', 'paint', 'draw', 'pottery'],
        'cultural': ['museum', 'art', 'cultural', 'history', 'exhibit', 'gallery', 'theater'],
        'nightlife': ['night', 'bar', 'drinks', 'cocktail', 'evening', 'nightlife', 'club'],
        'entertainment': ['show', 'movie', 'theater', 'performance', 'concert', 'entertainment', 'comedy'],
        'educational': ['learn', 'class', 'workshop', 'educational', 'lesson', 'tutorial']
      }
      
      // Find matching categories from query
      const matchedCategories = []
      for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(keyword => queryLower.includes(keyword))) {
          matchedCategories.push(category)
        }
      }
      
      // If we found matching categories, prioritize them
      if (matchedCategories.length > 0) {
        const categoryMatches = filteredDates.filter(date => 
          date.ai.categories.some(cat => matchedCategories.includes(cat))
        )
        
        // Use category matches if we found enough, otherwise keep all
        if (categoryMatches.length >= 10) {
          filteredDates = categoryMatches
        }
      }
      
      // 2. WEATHER-BASED FILTERING
      const isBadWeather = ['rain', 'rainy', 'cold', 'snow', 'bad weather', 'indoor', 'inside'].some(
        word => queryLower.includes(word)
      )
      if (isBadWeather) {
        filteredDates = filteredDates.filter(date => 
          date.ai.weather.indoor === true || 
          date.ai.weather.weatherDependent === false
        )
      }
      
      const isGoodWeather = ['sunny', 'nice weather', 'beautiful day', 'outdoor', 'outside'].some(
        word => queryLower.includes(word)
      )
      if (isGoodWeather && !isBadWeather) {
        filteredDates = filteredDates.filter(date => 
          date.ai.weather.outdoor === true
        )
      }
      
      // 3. BUDGET-BASED FILTERING
      if (queryLower.includes('cheap') || queryLower.includes('free') || queryLower.includes('budget') || queryLower.includes('inexpensive')) {
        filteredDates = filteredDates.filter(date => 
          date.ai.cost.level === 'free' || date.ai.cost.level === '$'
        )
      }
      
      if (queryLower.includes('expensive') || queryLower.includes('fancy') || queryLower.includes('splurge') || queryLower.includes('upscale')) {
        filteredDates = filteredDates.filter(date => 
          date.ai.cost.level === '$$' || date.ai.cost.level === '$$$'
        )
      }
      
      // 4. LOCATION-BASED FILTERING
      if (queryLower.includes('local') || queryLower.includes('nearby') || queryLower.includes('close')) {
        filteredDates = filteredDates.filter(date => 
          date.ai.location.driveTime === 'local'
        )
      }
      
      if (queryLower.includes('day trip') || queryLower.includes('drive') || queryLower.includes('away')) {
        filteredDates = filteredDates.filter(date => 
          date.ai.location.driveTime === 'day-trip' || 
          date.ai.location.driveTime === 'local'
        )
      }
      
      // 5. LOCATION EXCLUSIONS
      const locationExclusions = []
      const cities = ['nyc', 'new york', 'philadelphia', 'philly', 'boston', 'dc', 'baltimore']
  
      for (const city of cities) {
        if (
          queryLower.includes(`no ${city}`) || 
          queryLower.includes(`not ${city}`) ||
          queryLower.includes(`avoid ${city}`) ||
          queryLower.includes(`skip ${city}`) ||
          queryLower.includes(`except ${city}`)
        ) {
          locationExclusions.push(city)
        }
      }
  
      // Filter out excluded cities
      if (locationExclusions.length > 0) {
        filteredDates = filteredDates.filter(date => {
          const cityLower = date.ai.location.city?.toLowerCase() || ''
          return !locationExclusions.some(excluded => cityLower.includes(excluded))
        })
        console.log('Excluding cities:', locationExclusions)
      }
      
      // 6. DURATION FILTERING
      if (queryLower.includes('quick') || queryLower.includes('short') || queryLower.includes('fast')) {
        filteredDates = filteredDates.filter(date => 
          date.ai.time.duration === 'quick' || 
          date.ai.time.duration === '1-2 hours'
        )
      }
      
      if (queryLower.includes('all day') || queryLower.includes('full day') || queryLower.includes('long')) {
        filteredDates = filteredDates.filter(date => 
          date.ai.time.duration === 'full-day' || 
          date.ai.time.duration === 'half-day'
        )
      }
      
      // 7. SEASONAL FILTERING - filter out off-season events
      if (dateContext.season) {
        filteredDates = filteredDates.filter(date => {
          // Keep non-events
          if (!date.ai.seasonal?.isEvent) return true
          
          // Keep year-round events
          if (date.ai.seasonal?.yearRound) return true
          
          // Keep events that match current season
          if (date.ai.seasonal?.bestSeasons?.includes(dateContext.season)) return true
          
          // Filter out off-season events
          return false
        })
      }
      
      // 8. SHUFFLE with proper randomization AND avoid recent repeats
      // Get recently recommended IDs from localStorage
      const recentlyRecommended = JSON.parse(localStorage.getItem('recentRecommendations') || '[]')
  
      // Separate into fresh dates (not recently shown) and recent ones
      const freshDates = filteredDates.filter(d => !recentlyRecommended.includes(d.id))
      const recentDates = filteredDates.filter(d => recentlyRecommended.includes(d.id))
  
      console.log(`Fresh dates: ${freshDates.length}, Recent dates: ${recentDates.length}`)
  
      // Shuffle both groups properly with Fisher-Yates
      const shuffledFresh = fisherYatesShuffle(freshDates)
      const shuffledRecent = fisherYatesShuffle(recentDates)
  
      // Combine: prioritize fresh dates first, then add recent if needed
      const combined = [...shuffledFresh, ...shuffledRecent]
      const datesToSend = combined.slice(0, 15)
  
      // Track these recommendations for next time
      const recommendedIds = datesToSend.map(d => d.id)
      const updatedRecent = [...new Set([...recommendedIds, ...recentlyRecommended])].slice(0, 30) // Keep last 30
      localStorage.setItem('recentRecommendations', JSON.stringify(updatedRecent))
      
      // Log filtering results for debugging
      console.log(`Filtered: ${allDates.length} → ${filteredDates.length} → sending ${datesToSend.length} to AI (${shuffledFresh.slice(0, 15).length} fresh)`)
      if (matchedCategories.length > 0) {
        console.log('Matched categories:', matchedCategories)
      }
      
      // Build prompt for Claude with date context
      const prompt = `You are a helpful date planning assistant.
      CRITICAL: You MUST respond with valid JSON only. No conversational text before or after the JSON.
  
  CURRENT CONTEXT:
  - Weather: ${dateContext.weather.condition} (${dateContext.weather.temp}°F), ${dateContext.weather.description}
  - Today is: ${dateContext.date}
  - Season: ${dateContext.season}
  - ${dateContext.isWeekend ? 'Weekend' : 'Weekday'}
  - Current time: ${dateContext.time}
  - Location: Princeton, NJ area
  
  User query: "${query}"
  
  Here are ${datesToSend.length} relevant date ideas:
  
  ${datesToSend.map((date, i) => `${i+1}. [ID: ${date.id}] ${date.ai.title}
     ${date.ai.summary}
     Location: ${date.ai.location.city}, ${date.ai.location.state}
     Cost: ${date.ai.cost.level}
     Indoor: ${date.ai.weather.indoor ? 'Yes' : 'No'}
     Weather-dependent: ${date.ai.weather.weatherDependent ? 'Yes' : 'No'}
     Categories: ${date.ai.categories.join(', ')}
     ${date.ai.seasonal?.isEvent ? '⚠️ Seasonal event - verify dates' : ''}
  `).join('\n')}
  
    YOU MUST RESPOND ONLY WITH VALID JSON. NO OTHER TEXT.

    Required JSON format:
    {
    "message": "Brief 1-2 sentence intro",
    "recommendations": [
        {"id": "DQ5M5VKEcw2", "reason": "Why this is perfect"}
    ]
    }

    CRITICAL: Use the EXACT ID shown in [ID: ...] brackets, not the list numbers!

    Rules:
    - Return 3-5 recommendations
    - Use EXACT IDs from the numbered list above
    - NO markdown, NO code blocks, NO explanation
    - ONLY the raw JSON object
    - Start with { and end with }

    Example of what I want:
    {"message":"Great ideas for today!","recommendations":[{"id":"DQ5M5VKEcw2","reason":"Perfect indoor activity"},{"id":"DOM7i2QjPfQ","reason":"Fun fall experience"}]}

    NOW RESPOND WITH JSON ONLY:`
  
      // Call Claude API via proxy
      const response = await fetch('/.netlify/functions/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          model: 'claude-sonnet-4-20250514'
        })
      })
  
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error.message)
      }
      
      const responseText = data.content[0].text

    // Try to parse JSON response
    try {
    // Remove markdown code blocks if present
    const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleanedText)
    
    // Validate it has the expected structure
    if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
        return parsed
    }
    
    // Fallback to text if structure is wrong
    console.warn('Unexpected JSON structure, using text fallback')
    return { error: true, text: responseText }
    } catch (e) {
    // Fallback to text if JSON parsing fails
    console.warn('Failed to parse JSON response:', e)
    return { error: true, text: responseText }
    }
  
    } catch (error) {
      console.error('Claude API error:', error)
      throw new Error('Failed to get recommendations: ' + error.message)
    }
  }
  
  // Helper function to determine season from month
  function getSeason(month) {
    if (month >= 2 && month <= 4) return 'spring'
    if (month >= 5 && month <= 7) return 'summer'
    if (month >= 8 && month <= 10) return 'fall'
    return 'winter'
  }
  
  // Fisher-Yates shuffle for true randomization
  function fisherYatesShuffle(array) {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }