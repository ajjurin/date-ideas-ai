export async function getRecommendations(query, allDates) {
    try {
      // Smart pre-filtering based on query
      let filteredDates = allDates
      
      // Filter for rainy/bad weather
      if (query.toLowerCase().includes('rain') || query.toLowerCase().includes('rainy')) {
        filteredDates = filteredDates.filter(date => 
          date.ai.weather.indoor === true || 
          date.ai.weather.weatherDependent === false
        )
      }
      
      // Filter for budget keywords
      if (query.toLowerCase().includes('cheap') || query.toLowerCase().includes('free')) {
        filteredDates = filteredDates.filter(date => 
          date.ai.cost.level === 'free' || date.ai.cost.level === '$'
        )
      }
      
      // Filter for outdoor
      if (query.toLowerCase().includes('outdoor')) {
        filteredDates = filteredDates.filter(date => 
          date.ai.weather.outdoor === true
        )
      }
      
      // Take only 15 most relevant
      const datesToSend = filteredDates.slice(0, 15)
      
      // Build prompt for Claude
      const prompt = `You are a helpful date planning assistant. The user asked: "${query}"
  
  Here are ${datesToSend.length} relevant date ideas:
  
  ${datesToSend.map((date, i) => `${i+1}. ${date.ai.title}
     ${date.ai.summary}
     Location: ${date.ai.location.city}, ${date.ai.location.state}
     Cost: ${date.ai.cost.level}
     Indoor: ${date.ai.weather.indoor ? 'Yes' : 'No'}
     Weather-dependent: ${date.ai.weather.weatherDependent ? 'Yes' : 'No'}
     Categories: ${date.ai.categories.join(', ')}
     ${date.ai.seasonal?.isEvent ? '⚠️ Seasonal event - verify dates' : ''}
  `).join('\n')}
  
  Recommend 3-5 date ideas that best match their query.
  For each recommendation:
  - Say the title
  - Explain in 1-2 sentences why it's perfect for their request
  - Be conversational and enthusiastic but concise
  
  Don't recommend outdoor activities if they mentioned rain or bad weather.`
  
    // Call Claude API via proxy
        const response = await fetch('http://localhost:3001/api/recommend', {
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
        
        return data.content[0].text
  
    } catch (error) {
      console.error('Claude API error:', error)
      throw new Error('Failed to get recommendations: ' + error.message)
    }
  }