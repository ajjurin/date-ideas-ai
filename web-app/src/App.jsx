import { useState, useEffect, useDeferredValue } from 'react'
import './App.css'
import { getRecommendations } from './services/recommendations'

function App() {
  const [jsonDates, setJsonDates] = useState([])
  const [customDates, setCustomDates] = useState([])
  const [favorites, setFavorites] = useState([])
  const [completed, setCompleted] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedView, setSelectedView] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingDate, setEditingDate] = useState(null)
  const [chatQuery, setChatQuery] = useState('')
  const [chatResponse, setChatResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('ask')
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    url: '',
    categories: [],
    city: '',
    state: '',
    costLevel: '$',
    indoor: false,
    outdoor: false,
    isSeasonalEvent: false
  })

  // Merge JSON dates with custom dates
  const dates = [...jsonDates, ...customDates]

  // Defer search query for better typing responsiveness
  const deferredSearchQuery = useDeferredValue(searchQuery)

  // Load data
  useEffect(() => {
    // Load custom dates from localStorage
    const savedCustomDates = JSON.parse(localStorage.getItem('customDates') || '[]')
    setCustomDates(savedCustomDates)
    
    // Load JSON dates
    fetch('/data/dates.json')
      .then(res => res.json())
      .then(data => {
        setJsonDates(data.posts)
        setLoading(false)
      })
      .catch(err => console.error('Error loading dates:', err))
    
    // Load from localStorage
    const savedFavorites = JSON.parse(localStorage.getItem('favorites') || '[]')
    const savedCompleted = JSON.parse(localStorage.getItem('completed') || '[]')
    setFavorites(savedFavorites)
    setCompleted(savedCompleted)
  }, [])

  // Toggle favorite
  const toggleFavorite = (id) => {
    const newFavorites = favorites.includes(id)
      ? favorites.filter(f => f !== id)
      : [...favorites, id]
    setFavorites(newFavorites)
    localStorage.setItem('favorites', JSON.stringify(newFavorites))
  }

  // Toggle complete
  const toggleComplete = (id) => {
    const newCompleted = completed.includes(id)
      ? completed.filter(c => c !== id)
      : [...completed, id]
    setCompleted(newCompleted)
    localStorage.setItem('completed', JSON.stringify(newCompleted))
  }

  // Available categories for the form
  const availableCategories = ['food', 'outdoor', 'cultural', 'active', 'romantic', 'creative', 'nightlife', 'seasonal', 'entertainment', 'educational']

  // Get all unique categories
  const allCategories = Array.from(
    new Set(dates.flatMap(date => date.ai?.categories || []))
  ).sort()

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    if (type === 'checkbox') {
      if (name === 'categories') {
        const newCategories = formData.categories.includes(value)
          ? formData.categories.filter(c => c !== value)
          : [...formData.categories, value]
        setFormData({ ...formData, categories: newCategories })
      } else {
        setFormData({ ...formData, [name]: checked })
      }
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  // Handle chat submission
  const handleChatSubmit = async (e) => {
    e.preventDefault()
    if (!chatQuery.trim()) return
    
    setIsLoading(true)
    setChatResponse('')
    
    try {
      const response = await getRecommendations(chatQuery, dates)
      console.log('📥 Raw AI Response:', response)
      console.log('📥 Response type:', typeof response)
      console.log('📥 Response length:', response?.length)
      setChatResponse(response)
    } catch (error) {
      console.error('❌ Error getting recommendations:', error)
      setChatResponse(`Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle follow-up action buttons
  const handleFollowUp = async (query) => {
    setChatQuery(query)
    setIsLoading(true)
    setChatResponse('')
    
    try {
      const response = await getRecommendations(query, dates)
      console.log('📥 Raw AI Response:', response)
      console.log('📥 Response type:', typeof response)
      console.log('📥 Response length:', response?.length)
      setChatResponse(response)
    } catch (error) {
      console.error('❌ Error getting recommendations:', error)
      setChatResponse(`Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Clear chat response
  const clearChat = () => {
    setChatQuery('')
    setChatResponse('')
  }

  // Generate contextual follow-up buttons based on query and recommendations
  const generateContextualButtons = (query, recommendations) => {
    const buttons = []
    const queryLower = query.toLowerCase()
    
    // Get recommendation data
    const recDates = recommendations
      .map(rec => dates.find(d => d.id === rec.id))
      .filter(Boolean)
    
    if (recDates.length === 0) return []
    
    // Analyze recommendations
    const categories = new Set()
    const costLevels = new Set()
    let hasIndoor = false
    let hasOutdoor = false
    let hasLocal = false
    let hasDayTrip = false
    let hasFood = false
    let hasRomantic = false
    let hasActive = false
    let hasCreative = false
    
    recDates.forEach(date => {
      // Categories
      date.ai?.categories?.forEach(cat => categories.add(cat))
      if (date.ai?.categories?.includes('food')) hasFood = true
      if (date.ai?.categories?.includes('romantic')) hasRomantic = true
      if (date.ai?.categories?.includes('active')) hasActive = true
      if (date.ai?.categories?.includes('creative')) hasCreative = true
      
      // Cost
      if (date.ai?.cost?.level) costLevels.add(date.ai.cost.level)
      
      // Weather
      if (date.ai?.weather?.indoor) hasIndoor = true
      if (date.ai?.weather?.outdoor) hasOutdoor = true
      
      // Location
      if (date.ai?.location?.isLocal) hasLocal = true
      if (date.ai?.location?.driveTime === 'day-trip') hasDayTrip = true
    })
    
    // Analyze query for context
    const isRainy = queryLower.includes('rain') || queryLower.includes('rainy') || queryLower.includes('wet')
    const isSunny = queryLower.includes('sunny') || queryLower.includes('sun')
    const mentionsIndoor = queryLower.includes('indoor')
    const mentionsOutdoor = queryLower.includes('outdoor')
    const mentionsCheap = queryLower.includes('cheap') || queryLower.includes('budget') || queryLower.includes('affordable') || queryLower.includes('free')
    const mentionsExpensive = queryLower.includes('expensive') || queryLower.includes('splurge') || queryLower.includes('luxury')
    const mentionsRomantic = queryLower.includes('romantic') || queryLower.includes('romance')
    const mentionsActive = queryLower.includes('active') || queryLower.includes('exercise') || queryLower.includes('sport')
    const mentionsFood = queryLower.includes('food') || queryLower.includes('restaurant') || queryLower.includes('dining') || queryLower.includes('eat')
    const mentionsCreative = queryLower.includes('creative') || queryLower.includes('art') || queryLower.includes('craft')
    const mentionsNearby = queryLower.includes('nearby') || queryLower.includes('local') || queryLower.includes('close')
    const mentionsDayTrip = queryLower.includes('day trip') || queryLower.includes('day-trip') || queryLower.includes('drive')
    
    // Generate contextual buttons
    
    // Cost-related buttons
    const hasExpensive = costLevels.has('$$$') || costLevels.has('$$')
    const hasCheap = costLevels.has('free') || costLevels.has('$')
    
    if (hasExpensive && !mentionsCheap) {
      buttons.push({ text: '💰 Show Cheaper Options', query: 'Show cheaper options' })
    }
    if (hasCheap && !mentionsExpensive && !queryLower.includes('cheap')) {
      buttons.push({ text: '💎 More Upscale Options', query: 'Show more upscale or splurge-worthy date ideas' })
    }
    
    // Weather/Indoor-Outdoor buttons
    if ((isRainy || mentionsIndoor || hasIndoor) && !hasOutdoor && !mentionsOutdoor) {
      buttons.push({ text: '☀️ Outdoor Options', query: 'Show outdoor date ideas' })
    }
    if ((isSunny || mentionsOutdoor || hasOutdoor) && !hasIndoor && !mentionsIndoor) {
      buttons.push({ text: '🏠 Indoor Activities', query: 'Show indoor date ideas' })
    }
    
    // Category-specific buttons
    if (hasFood && !mentionsFood) {
      buttons.push({ text: '🍽️ More Food Options', query: 'Show more food and dining date ideas' })
    }
    if (!hasFood && !mentionsFood) {
      buttons.push({ text: '🍽️ Food Options', query: 'Show food and dining date ideas' })
    }
    
    if (hasRomantic && !mentionsRomantic) {
      buttons.push({ text: '💕 More Romantic Ideas', query: 'Show more romantic date ideas' })
    }
    if (!hasRomantic && !mentionsRomantic) {
      buttons.push({ text: '💕 Romantic Dates', query: 'Show romantic date ideas' })
    }
    
    if (hasActive && !mentionsActive) {
      buttons.push({ text: '🏃 More Active Dates', query: 'Show more active and physical date ideas' })
    }
    if (!hasActive && !mentionsActive) {
      buttons.push({ text: '🏃 Active Dates', query: 'Show active and physical date ideas' })
    }
    
    if (hasCreative && !mentionsCreative) {
      buttons.push({ text: '🎨 More Creative Activities', query: 'Show more creative and artistic date ideas' })
    }
    if (!hasCreative && !mentionsCreative) {
      buttons.push({ text: '🎨 Creative Activities', query: 'Show creative and artistic date ideas' })
    }
    
    // Location buttons
    if (hasLocal && !hasDayTrip && !mentionsDayTrip) {
      buttons.push({ text: '🚗 Day Trip Ideas', query: 'Show day trip date ideas' })
    }
    if (hasDayTrip && !hasLocal && !mentionsNearby) {
      buttons.push({ text: '🏠 Nearby Only', query: 'Show local and nearby date ideas' })
    }
    if (!hasLocal && !hasDayTrip && !mentionsNearby) {
      buttons.push({ text: '🏠 Nearby Options', query: 'Show local and nearby date ideas' })
    }
    
    // Time-based buttons (if query mentions time)
    if (queryLower.includes('morning')) {
      buttons.push({ text: '🌆 Evening Options', query: 'Show evening date ideas' })
    }
    if (queryLower.includes('evening') || queryLower.includes('night')) {
      buttons.push({ text: '🌅 Morning Options', query: 'Show morning date ideas' })
    }
    
    // Category alternatives (if specific category is dominant)
    if (categories.size === 1) {
      const dominantCategory = Array.from(categories)[0]
      if (dominantCategory === 'food') {
        buttons.push({ text: '🎭 Non-Food Activities', query: 'Show date ideas that are not food-related' })
      }
      if (dominantCategory === 'romantic') {
        buttons.push({ text: '👥 Casual Dates', query: 'Show casual and non-romantic date ideas' })
      }
    }
    
    // Limit to 6 buttons max
    return buttons.slice(0, 6)
  }

  // Handle edit button click
  const handleEdit = (date) => {
    setEditingDate(date)
    setFormData({
      title: date.ai?.title || '',
      summary: date.ai?.summary || '',
      url: date.url || '',
      categories: date.ai?.categories || [],
      city: date.ai?.location?.city || '',
      state: date.ai?.location?.state || '',
      costLevel: date.ai?.cost?.level || '$',
      indoor: date.ai?.weather?.indoor || false,
      outdoor: date.ai?.weather?.outdoor || false,
      isSeasonalEvent: date.ai?.seasonal?.isEvent || false
    })
    setShowModal(true)
  }

  // Handle modal close
  const handleModalClose = () => {
    setShowModal(false)
    setEditingDate(null)
    setFormData({
      title: '',
      summary: '',
      url: '',
      categories: [],
      city: '',
      state: '',
      costLevel: '$',
      indoor: false,
      outdoor: false,
      isSeasonalEvent: false
    })
  }

  // Render a date card component
  const renderDateCard = (date, showEditButton = false) => (
    <div 
      key={date.id} 
      className="bg-white rounded-lg shadow-md border border-gray-100 p-5 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex flex-col relative"
    >
      {/* Edit Button - Only in Browse Dates tab */}
      {showEditButton && (
        <button
          onClick={() => handleEdit(date)}
          className="absolute top-3 right-3 text-sm text-gray-500 hover:text-blue-600 transition-colors duration-200"
          title="Edit date"
        >
          ✏️
        </button>
      )}
      
      {/* Seasonal Event Warning Banner */}
      {date.ai?.seasonal?.isEvent === true && (
        <div className="bg-orange-50 text-orange-600 border-b border-orange-100 p-2 mb-2 rounded-t-lg -mx-5 -mt-5 px-5">
          <div className="flex items-center gap-1.5 text-xs">
            <span>⚠️</span>
            <span>{date.ai?.seasonal?.eventNotes || 'Seasonal Event - Verify current dates'}</span>
          </div>
        </div>
      )}
      
      {/* Title */}
      <h2 className="text-lg font-bold mb-2 text-gray-900 leading-tight">{date.ai?.title || 'Untitled'}</h2>
      
      {/* Summary */}
      <p className="text-gray-500 mb-3 text-sm leading-relaxed flex-grow">{date.ai?.summary || ''}</p>
      
      {/* Categories */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {(date.ai?.categories || []).map(cat => (
          <span 
            key={cat} 
            className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs font-normal"
          >
            {cat}
          </span>
        ))}
      </div>
      
      {/* Location & Cost */}
      <div className="flex items-center gap-3 mb-3 text-xs text-gray-400 border-t border-gray-100 pt-3">
        <span>{date.ai?.location?.city || ''}, {date.ai?.location?.state || ''}</span>
        <span>•</span>
        <span>{date.ai?.cost?.level || ''}</span>
      </div>
      
      {/* Buttons */}
      <div className="flex items-center justify-between mt-auto gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => toggleFavorite(date.id)}
            className={`transition-all duration-200 hover:scale-110 ${
              favorites.includes(date.id)
                ? 'text-[#ED4956]'
                : 'text-gray-400 hover:text-gray-600'
            }`}
            title={favorites.includes(date.id) ? 'Remove from favorites' : 'Add to favorites'}
          >
            <span className="text-2xl">
              {favorites.includes(date.id) ? '♥' : '♡'}
            </span>
          </button>
          
          <button
            onClick={() => toggleComplete(date.id)}
            className={`transition-all duration-200 hover:scale-110 ${
              completed.includes(date.id)
                ? 'text-[#10B981]'
                : 'text-gray-400 hover:text-gray-600'
            }`}
            title={completed.includes(date.id) ? 'Mark as incomplete' : 'Mark as complete'}
          >
            <span className="text-2xl">
              {completed.includes(date.id) ? '✓' : '○'}
            </span>
          </button>
        </div>
        
        {date.url && date.url.trim() && (
          <a
            href={date.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-1.5 rounded-full text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-1.5"
            title="View on Instagram"
          >
            <span>📷</span>
            <span>Instagram</span>
          </a>
        )}
      </div>
    </div>
  )

  // Parse and render AI response
  const renderAIResponse = () => {
    if (!chatResponse) {
      console.log('🔍 renderAIResponse: No chatResponse')
      return null
    }

    console.log('🔍 renderAIResponse: chatResponse type:', typeof chatResponse)
    console.log('🔍 renderAIResponse: chatResponse value:', chatResponse)
    
    // If it's already an object, use it directly
    let parsedResponse
    if (typeof chatResponse === 'object' && chatResponse !== null) {
      console.log('✅ chatResponse is already an object')
      parsedResponse = chatResponse
    } else if (typeof chatResponse === 'string') {
      console.log('🔍 renderAIResponse: chatResponse is string, length:', chatResponse.length)
      console.log('🔍 renderAIResponse: First 200 chars:', chatResponse.substring(0, 200))
      
      // Try to parse as JSON
      try {
        parsedResponse = JSON.parse(chatResponse)
        console.log('✅ Successfully parsed as JSON:', parsedResponse)
      } catch (e) {
        console.log('⚠️ Not valid JSON, treating as plain text. Error:', e.message)
        // Not JSON, treat as plain text
        return (
          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {chatResponse}
          </div>
        )
      }
    } else {
      console.log('⚠️ Unexpected chatResponse type, treating as plain text')
      return (
        <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
          {String(chatResponse)}
        </div>
      )
    }

    console.log('✅ Parsed response keys:', Object.keys(parsedResponse))

    // Check if it's an error response
    if (parsedResponse.error) {
      console.log('❌ Error response detected:', parsedResponse.error)
      return (
        <div className="text-red-600 leading-relaxed whitespace-pre-wrap">
          {parsedResponse.error}
        </div>
      )
    }

    // Check if it has recommendations
    if (parsedResponse.recommendations && Array.isArray(parsedResponse.recommendations)) {
      console.log('✨ Recommendations array found, length:', parsedResponse.recommendations.length)
      console.log('✨ Recommendations:', parsedResponse.recommendations)
      console.log('✨ Available dates count:', dates.length)
      console.log('✨ Sample date IDs:', dates.slice(0, 5).map(d => d.id))

      return (
        <div className="space-y-6">
          {/* Intro message */}
          {parsedResponse.message && (
            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {parsedResponse.message}
            </div>
          )}

          {/* Recommendations section */}
          <div>
            <h4 className="text-xl font-semibold text-gray-900 mb-4">✨ AI Recommendations</h4>
            <div className="space-y-6">
              {parsedResponse.recommendations.map((rec, index) => {
                console.log(`🔍 Looking for date with ID: "${rec.id}" (index: ${index})`)
                const date = dates.find(d => d.id === rec.id)
                console.log(`   Found date:`, date ? `YES - ${date.ai?.title}` : 'NO')
                
                if (!date) {
                  console.warn(`⚠️ Date not found for ID: "${rec.id}"`)
                  return null
                }

                return (
                  <div key={rec.id || index} className="space-y-3">
                    {/* Date Card */}
                    {renderDateCard(date, false)}
                    
                    {/* AI Reasoning */}
                    {rec.reason && (
                      <div className="ml-2 pl-4 border-l-4 border-blue-200">
                        <p className="text-sm text-gray-600 italic leading-relaxed">
                          {rec.reason}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Follow-up Action Buttons */}
          {(() => {
            const contextualButtons = generateContextualButtons(chatQuery, parsedResponse.recommendations)
            if (contextualButtons.length === 0) return null
            
            return (
              <div className="flex flex-wrap justify-center gap-2 pt-4 border-t border-gray-200">
                {contextualButtons.map((button, index) => (
                  <button
                    key={index}
                    onClick={() => handleFollowUp(button.query)}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {button.text}
                  </button>
                ))}
              </div>
            )
          })()}
        </div>
      )
    }

    // Fallback: display as plain text if structure doesn't match
    console.log('⚠️ Structure doesn\'t match expected format. Keys:', Object.keys(parsedResponse))
    return (
      <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
        {chatResponse}
      </div>
    )
  }

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.title.trim() || !formData.summary.trim()) {
      alert('Please fill in all required fields')
      return
    }

    // Create date object
    const dateObject = {
      id: editingDate ? editingDate.id : `custom-${Date.now()}`,
      url: formData.url || '',
      caption: '',
      ai: {
        title: formData.title,
        summary: formData.summary,
        categories: formData.categories,
        location: {
          city: formData.city,
          state: formData.state,
          neighborhood: editingDate?.ai?.location?.neighborhood || '',
          isLocal: editingDate?.ai?.location?.isLocal || false,
          driveTime: editingDate?.ai?.location?.driveTime || ''
        },
        time: {
          duration: editingDate?.ai?.time?.duration || '',
          timeOfDay: editingDate?.ai?.time?.timeOfDay || [],
          bestTime: editingDate?.ai?.time?.bestTime || ''
        },
        cost: {
          level: formData.costLevel,
          estimate: editingDate?.ai?.cost?.estimate || '',
          notes: editingDate?.ai?.cost?.notes || ''
        },
        weather: {
          indoor: formData.indoor,
          outdoor: formData.outdoor,
          weatherDependent: editingDate?.ai?.weather?.weatherDependent || false
        },
        seasonal: {
          isEvent: formData.isSeasonalEvent,
          eventNotes: formData.isSeasonalEvent ? (editingDate?.ai?.seasonal?.eventNotes || 'Custom seasonal event') : null,
          bestSeasons: editingDate?.ai?.seasonal?.bestSeasons || [],
          yearRound: !formData.isSeasonalEvent
        }
      }
    }

    if (editingDate) {
      // Update existing date
      const updatedCustomDates = customDates.map(d => 
        d.id === editingDate.id ? dateObject : d
      )
      setCustomDates(updatedCustomDates)
      localStorage.setItem('customDates', JSON.stringify(updatedCustomDates))
      
      // Also update jsonDates if it's a custom date that was originally from JSON
      // (This shouldn't happen, but handle it just in case)
    } else {
      // Add new date
      const updatedCustomDates = [...customDates, dateObject]
      setCustomDates(updatedCustomDates)
      localStorage.setItem('customDates', JSON.stringify(updatedCustomDates))
    }

    // Reset form and close modal
    handleModalClose()
  }

  // Filter dates by view, category, and search
  const filteredDates = dates.filter(date => {
    // Apply view filter
    if (selectedView === 'Favorites' && !favorites.includes(date.id)) {
      return false
    }
    if (selectedView === 'Incomplete' && completed.includes(date.id)) {
      return false
    }
    
    // Apply category filter
    if (selectedCategory !== 'All' && !date.ai.categories.includes(selectedCategory)) {
      return false
    }
    
    // Apply search filter (using deferred value for better performance)
    if (deferredSearchQuery.trim()) {
      const query = deferredSearchQuery.toLowerCase().trim()
      const title = date.ai?.title?.toLowerCase() || ''
      const summary = date.ai?.summary?.toLowerCase() || ''
      const city = date.ai?.location?.city?.toLowerCase() || ''
      const state = date.ai?.location?.state?.toLowerCase() || ''
      const location = city && state ? `${city}, ${state}` : city || state || ''
      
      if (!title.includes(query) && 
          !summary.includes(query) && 
          !location.includes(query)) {
        return false
      }
    }
    
    return true
  })

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center gap-4 mb-2">
            <h1 className="text-4xl font-bold text-gray-900">Date Ideas AI</h1>
            {activeTab === 'browse' && (
              <button
                onClick={() => {
                  setEditingDate(null)
                  setFormData({
                    title: '',
                    summary: '',
                    url: '',
                    categories: [],
                    city: '',
                    state: '',
                    costLevel: '$',
                    indoor: false,
                    outdoor: false,
                    isSeasonalEvent: false
                  })
                  setShowModal(true)
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 shadow-md"
              >
                + Add Date
              </button>
            )}
          </div>
          <p className="text-center text-gray-600">{dates.length} curated date ideas</p>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex justify-center gap-2 py-3">
            <button
              onClick={() => setActiveTab('ask')}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-200 ${
                activeTab === 'ask'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Ask AI 🤖
            </button>
            <button
              onClick={() => setActiveTab('browse')}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-200 ${
                activeTab === 'browse'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Browse Dates 📋
            </button>
          </div>
        </div>
      </div>

      {/* AI Chat Interface */}
      {activeTab === 'ask' && (
      <div className="bg-white border-b border-gray-200 py-6">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleChatSubmit} className="space-y-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={chatQuery}
                  onChange={(e) => setChatQuery(e.target.value)}
                  placeholder="What should we do today? (e.g., 'rainy Saturday afternoon ideas')"
                  className="flex-1 text-lg px-6 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !chatQuery.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Get Recommendations
                </button>
              </div>
              
              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center gap-2 py-4">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-gray-600 font-medium">Thinking...</span>
                </div>
              )}
              
              {/* AI Response */}
              {chatResponse && !isLoading && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">AI Recommendations</h3>
                    <button
                      onClick={clearChat}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
                    >
                      Clear
                    </button>
                  </div>
                  {renderAIResponse()}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
      )}

      {/* Browse Dates Section */}
      {activeTab === 'browse' && (
      <>
      {/* Search Bar */}
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">
                🔍
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, location, or description..."
                className="w-full pl-12 pr-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <p className="text-center text-sm text-gray-500 mt-2">
              Showing {filteredDates.length} of {dates.length} dates
            </p>
          </div>
        </div>
      </div>

      {/* View Toggle Buttons */}
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => setSelectedView('All')}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-200 ${
                selectedView === 'All'
                  ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedView('Favorites')}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-200 ${
                selectedView === 'Favorites'
                  ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Favorites
            </button>
            <button
              onClick={() => setSelectedView('Incomplete')}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-200 ${
                selectedView === 'Incomplete'
                  ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Incomplete
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter Buttons */}
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                selectedCategory === 'All'
                  ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All
            </button>
            {allCategories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 capitalize ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Add Date Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingDate ? 'Edit Date Idea' : 'Add New Date Idea'}
                </h2>
                <button
                  onClick={handleModalClose}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Summary */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Summary <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="summary"
                    value={formData.summary}
                    onChange={handleInputChange}
                    required
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Instagram URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instagram URL (optional)
                  </label>
                  <input
                    type="url"
                    name="url"
                    value={formData.url}
                    onChange={handleInputChange}
                    placeholder="https://www.instagram.com/p/..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Categories */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categories
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {availableCategories.map(category => (
                      <label key={category} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="categories"
                          value={category}
                          checked={formData.categories.includes(category)}
                          onChange={handleInputChange}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 capitalize">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Cost Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost Level
                  </label>
                  <select
                    name="costLevel"
                    value={formData.costLevel}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="free">Free</option>
                    <option value="$">$</option>
                    <option value="$$">$$</option>
                    <option value="$$$">$$$</option>
                  </select>
                </div>

                {/* Indoor/Outdoor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Venue Type
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="indoor"
                        checked={formData.indoor}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Indoor</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="outdoor"
                        checked={formData.outdoor}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Outdoor</span>
                    </label>
                  </div>
                </div>

                {/* Seasonal Event */}
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isSeasonalEvent"
                      checked={formData.isSeasonalEvent}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Is this a seasonal event?</span>
                  </label>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleModalClose}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 shadow-md"
                  >
                    {editingDate ? 'Save Changes' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Grid of cards */}
      <div className="container mx-auto px-4 py-8 pb-12">
        {filteredDates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No date ideas found for this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDates.map(date => renderDateCard(date, true))}
          </div>
        )}
      </div>
      </>
      )}
    </div>
  )
}

export default App