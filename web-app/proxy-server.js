import 'dotenv/config'
import express from 'express'
import cors from 'cors'

console.log('API Key loaded:', process.env.ANTHROPIC_API_KEY ? 'YES' : 'NO')
console.log('First 10 chars:', process.env.ANTHROPIC_API_KEY?.substring(0, 10))

const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))

app.post('/api/recommend', async (req, res) => {
  try {
    const { prompt, model } = req.body

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model || 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })

    const data = await response.json()
    res.json(data)
  } catch (error) {
    console.error('Proxy error:', error)
    res.status(500).json({ error: error.message })
  }
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`✅ Proxy server running on http://localhost:${PORT}`)
})