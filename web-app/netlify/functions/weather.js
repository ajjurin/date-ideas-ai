export async function handler(event) {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=Princeton,NJ,US&units=imperial&appid=${process.env.WEATHER_API_KEY}`
      )
  
      const data = await response.json()
  
      return {
        statusCode: 200,
        body: JSON.stringify(data)
      }
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message })
      }
    }
  }