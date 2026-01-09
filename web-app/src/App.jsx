import { useState, useEffect } from 'react'
import './App.css'
import { getRecommendations } from './services/ollama'

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
  const [chatQuery, setChatQuery] = useState('')
  const [chatResponse, setChatResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
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
      setChatResponse(response)
    } catch (error) {
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

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.title.trim() || !formData.summary.trim()) {
      alert('Please fill in all required fields')
      return
    }

    // Create new date object
    const newDate = {
      id: `custom-${Date.now()}`,
      url: '',
      caption: '',
      ai: {
        title: formData.title,
        summary: formData.summary,
        categories: formData.categories,
        location: {
          city: formData.city,
          state: formData.state,
          neighborhood: '',
          isLocal: false,
          driveTime: ''
        },
        time: {
          duration: '',
          timeOfDay: [],
          bestTime: ''
        },
        cost: {
          level: formData.costLevel,
          estimate: '',
          notes: ''
        },
        weather: {
          indoor: formData.indoor,
          outdoor: formData.outdoor,
          weatherDependent: false
        },
        seasonal: {
          isEvent: formData.isSeasonalEvent,
          eventNotes: formData.isSeasonalEvent ? 'Custom seasonal event' : null,
          bestSeasons: [],
          yearRound: !formData.isSeasonalEvent
        }
      }
    }

    // Add to custom dates and save to localStorage
    const updatedCustomDates = [...customDates, newDate]
    setCustomDates(updatedCustomDates)
    localStorage.setItem('customDates', JSON.stringify(updatedCustomDates))

    // Reset form and close modal
    setFormData({
      title: '',
      summary: '',
      categories: [],
      city: '',
      state: '',
      costLevel: '$',
      indoor: false,
      outdoor: false,
      isSeasonalEvent: false
    })
    setShowModal(false)
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
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
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
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 shadow-md"
            >
              + Add Date
            </button>
          </div>
          <p className="text-center text-gray-600">{dates.length} curated date ideas</p>
        </div>
      </header>

      {/* AI Chat Interface */}
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
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {chatResponse}
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

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
                <h2 className="text-2xl font-bold text-gray-900">Add New Date Idea</h2>
                <button
                  onClick={() => setShowModal(false)}
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
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 shadow-md"
                  >
                    Save
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
            {filteredDates.map(date => (
            <div 
              key={date.id} 
              className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-2xl transition-all duration-300 flex flex-col"
            >
              {/* Seasonal Event Warning Banner */}
              {date.ai?.seasonal?.isEvent === true && (
                <div className="bg-orange-50 text-orange-700 border-b border-orange-200 p-3 mb-3 rounded-t-xl -mx-6 -mt-6 px-6">
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <span>⚠️</span>
                    <span>{date.ai?.seasonal?.eventNotes || 'Seasonal Event - Verify current dates'}</span>
                  </div>
                </div>
              )}
              
              {/* Title */}
              <h2 className="text-xl font-bold mb-3 text-gray-900 leading-tight">{date.ai?.title || 'Untitled'}</h2>
              
              {/* Summary */}
              <p className="text-gray-600 mb-4 text-sm leading-relaxed flex-grow">{date.ai.summary}</p>
              
              {/* Categories */}
              <div className="flex flex-wrap gap-2 mb-4">
                {date.ai.categories.map(cat => (
                  <span 
                    key={cat} 
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                  >
                    {cat}
                  </span>
                ))}
              </div>
              
              {/* Location & Cost */}
              <div className="flex items-center gap-4 mb-4 text-sm text-gray-500 border-t border-gray-100 pt-4">
                <span className="flex items-center gap-1">
                  <span>📍</span>
                  <span>{date.ai.location.city}, {date.ai.location.state}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span>💰</span>
                  <span>{date.ai.cost.level}</span>
                </span>
              </div>
              
              {/* Buttons */}
              <div className="flex gap-2 mt-auto">
                <button
                  onClick={() => toggleFavorite(date.id)}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                    favorites.includes(date.id)
                      ? 'bg-yellow-400 text-white hover:bg-yellow-500 shadow-md'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {favorites.includes(date.id) ? '⭐ Favorited' : '☆ Favorite'}
                </button>
                
                <button
                  onClick={() => toggleComplete(date.id)}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                    completed.includes(date.id)
                      ? 'bg-green-500 text-white hover:bg-green-600 shadow-md'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {completed.includes(date.id) ? '✓ Done' : 'Complete'}
                </button>
              </div>
            </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default App