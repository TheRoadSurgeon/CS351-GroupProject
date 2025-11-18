import { useState, useEffect } from 'react';
import "./DashboardDonor.css";

function DashboardDonor() {
  const [nearbyFoodBanks, setNearbyFoodBanks] = useState([]);
  const [selectedFoodBank, setSelectedFoodBank] = useState(null);
  const [foodItemsNeeded, setFoodItemsNeeded] = useState([]);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [donationForm, setDonationForm] = useState({
    name: '',
    dateOfBirth: '',
    amount: '',
    donationTime: ''
  });
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');

  useEffect(() => {
    const fetchFoodBanks = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('http://127.0.0.1:5000/api/food_banks');
        if (!response.ok) {
          throw new Error('Failed to fetch food banks');
        }
        
        const data = await response.json();

        // Transform the data to match the expected format
        const transformedData = data.food_banks.map(bank => ({
          id: bank.id,
          name: bank.name,
          distance: 'N/A', // Need distance calculation
          verified: true, // Need verification status
          itemCount: 0 // Need to fetch actual item count
        }));

        setNearbyFoodBanks(transformedData);
      } catch (error) {
        console.error('Error fetching food banks:', error);
        setError('Failed to load food banks. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchFoodBanks();
  }, []);

  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:5000/api/items/autocomplete?q=${encodeURIComponent(searchTerm)}`);
        const data = await response.json();
        setSuggestions(data.items || []);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleFoodBankClick = (foodBank) => {
    setSelectedFoodBank(foodBank);
    
    // Mock data: Food items needed by each food bank
    const mockFoodItems = {
      1: [ // Central Food Bank
        { id: 1, name: 'Canned Goods', urgency: 'High', quantityNeeded: '100 cans' },
        { id: 2, name: 'Rice', urgency: 'High', quantityNeeded: '50 lbs' },
        { id: 3, name: 'Pasta', urgency: 'Medium', quantityNeeded: '30 lbs' },
        { id: 4, name: 'Cooking Oil', urgency: 'Low', quantityNeeded: '10 gallons' }
      ],
      2: [ // Community Kitchen
        { id: 5, name: 'Fresh Produce', urgency: 'High', quantityNeeded: '40 lbs' },
        { id: 6, name: 'Dairy', urgency: 'High', quantityNeeded: '20 gallons' },
        { id: 7, name: 'Bread', urgency: 'Medium', quantityNeeded: '50 loaves' }
      ],
      3: [ // Hope Center
        { id: 8, name: 'Canned Vegetables', urgency: 'High', quantityNeeded: '75 cans' },
        { id: 9, name: 'Peanut Butter', urgency: 'Medium', quantityNeeded: '20 jars' },
        { id: 10, name: 'Cereal', urgency: 'Medium', quantityNeeded: '30 boxes' },
        { id: 11, name: 'Baby Food', urgency: 'High', quantityNeeded: '50 jars' },
        { id: 12, name: 'Coffee', urgency: 'Low', quantityNeeded: '10 lbs' }
      ]
    };

    setFoodItemsNeeded(mockFoodItems[foodBank.id] || []);
  };

  const handleBackToFoodBanks = () => {
    setSelectedFoodBank(null);
    setFoodItemsNeeded([]);
  };

  const handleDonateClick = (item) => {
    setSelectedItem(item);
    setShowDonationModal(true);
  };

  const handleCloseModal = () => {
    setShowDonationModal(false);
    setSelectedItem(null);
    setMeetingDate('');
    setMeetingTime('');
  };

  const handleConfirm = (e) => {
    e.preventDefault();
    console.log('Meeting scheduled:', { item: selectedItem, meetingDate, meetingTime });
    handleCloseModal();
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
    searchPostings(suggestion);
  };

  const searchPostings = async (query) => {
    if (!query.trim()) return;
    
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/search/postings?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      console.log('Search results:', data.postings);
    } catch (error) {
      console.error('Error searching postings:', error);
    }
  };

  return (
    <div id="dashboard">
      <div className="dashboard-grid">
        <div className="main-content">
          {!selectedFoodBank ? (
            <>
              <div className="content-header">
                <h2>Nearby Food Banks</h2>
                <div className="filters">
                  <select>
                    <option>Within 5 miles</option>
                    <option>Within 2 miles</option>
                    <option>Within 1 mile</option>
                  </select>
                </div>
              </div>

              <div className="items-list">
                {nearbyFoodBanks.map(bank => (
                  <div 
                    key={bank.id} 
                    className="item-card clickable"
                    onClick={() => handleFoodBankClick(bank)}
                  >
                    <div className="item-info">
                      <h3>
                        {bank.name} 
                        {bank.verified && <span className="verified">✓</span>}
                      </h3>
                      <p className="distance">{bank.distance}</p>
                      <p className="item-count">{bank.itemCount} item{bank.itemCount !== 1 ? 's' : ''} needed</p>
                    </div>
                    <button className="view-items-btn">View Items →</button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="content-header">
                <button className="back-btn" onClick={handleBackToFoodBanks}>
                  ← Back to Food Banks
                </button>
              </div>
              <h2 className="items-header">Items Needed by {selectedFoodBank.name}</h2>
              <div className="search-container-centered">
                <div className="search-autocomplete-container">
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search for food items (e.g., rice, canned goods...)"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="suggestions-dropdown">
                      {suggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="suggestion-item"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="items-list">
                {foodItemsNeeded.length > 0 ? (
                  foodItemsNeeded
                    .filter(item => {
                      if (!searchTerm.trim()) return true;
                      const searchLower = searchTerm.toLowerCase();
                      return item.name.toLowerCase().includes(searchLower);
                    })
                    .map(item => (
                      <div key={item.id} className="item-card">
                        <div className="item-info">
                          <h3>
                            {item.name}
                            <span className={`urgency-badge ${item.urgency.toLowerCase()}`}>
                              {item.urgency}
                            </span>
                          </h3>
                          <p className="quantity">Need: {item.quantityNeeded}</p>
                        </div>
                        <button 
                          className="donate-btn"
                          onClick={() => handleDonateClick(item)}
                        >
                          Donate This Item
                        </button>
                      </div>
                    ))
                ) : (
                  <p className="no-items">No items needed at this time.</p>
                )}
                {foodItemsNeeded.length > 0 && 
                 foodItemsNeeded.filter(item => {
                   if (!searchTerm.trim()) return true;
                   const searchLower = searchTerm.toLowerCase();
                   return item.name.toLowerCase().includes(searchLower);
                 }).length === 0 && (
                  <p className="no-items">No items match your search.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Meeting Time Modal */}
      {showDonationModal && selectedItem && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content small-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Schedule Donation</h2>
              <button className="close-btn" onClick={handleCloseModal}>×</button>
            </div>
            
            <form onSubmit={handleConfirm}>
              <div className="form-group">
                <label htmlFor="meetingDate">Meeting Date</label>
                <input
                  type="date"
                  id="meetingDate"
                  name="meetingDate"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="meetingTime">Meeting Time</label>
                <input
                  type="time"
                  id="meetingTime"
                  name="meetingTime"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="submit-btn">Confirm</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardDonor;