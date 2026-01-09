export async function getCurrentWeather() {
    try {
      const response = await fetch('/.netlify/functions/weather')
      const data = await response.json()
      
      if (data.cod !== 200) {
        throw new Error('Weather fetch failed')
      }
      
      return {
        temp: Math.round(data.main.temp),
        condition: data.weather[0].main, // "Rain", "Clear", "Clouds", etc.
        description: data.weather[0].description, // "light rain", "clear sky"
        isRaining: data.weather[0].main === 'Rain',
        isCold: data.main.temp < 45,
        isNice: data.main.temp > 60 && data.main.temp < 85 && data.weather[0].main === 'Clear'
      }
    } catch (error) {
      console.error('Weather error:', error)
      return null // Graceful degradation
    }
  }