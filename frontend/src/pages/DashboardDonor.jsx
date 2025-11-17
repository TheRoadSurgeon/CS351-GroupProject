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
  const [donationForm, setDonationForm] = useState({
    name: '',
    dateOfBirth: '',
    amount: '',
    donationTime: ''
  });

  useEffect(() => {
    // Mock data: Nearby food banks
    setNearbyFoodBanks([
      { id: 1, name: 'Central Food Bank', distance: '1.2 miles', verified: true, itemCount: 4 },
      { id: 2, name: 'Community Kitchen', distance: '2.1 miles', verified: true, itemCount: 3 },
      { id: 3, name: 'Hope Center', distance: '3.5 miles', verified: false, itemCount: 5 }
    ]);
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
    setDonationForm({
      name: '',
      dateOfBirth: '',
      amount: '',
      donationTime: ''
    });
  };

  const handleFormChange = (e) => {
    setDonationForm({
      ...donationForm,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Donation submitted:', donationForm);
    handleCloseModal();
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
    // Trigger search with the selected suggestion
    searchPostings(suggestion);
  };

  const searchPostings = async (query) => {
    if (!query.trim()) return;
    
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/search/postings?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      console.log('Search results:', data.postings);
      // You can use these results to filter or display items
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

      {showDonationModal && selectedItem && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Donate {selectedItem.name}</h2>
              <button className="close-btn" onClick={handleCloseModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={donationForm.name}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="dateOfBirth">Date of Birth</label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={donationForm.dateOfBirth}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="amount">Amount of {selectedItem.name} (in pounds)</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={donationForm.amount}
                  onChange={handleFormChange}
                  min="0"
                  step="0.1"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="donationTime">Preferred Drop-off Date & Time</label>
                <input
                  type="datetime-local"
                  id="donationTime"
                  name="donationTime"
                  value={donationForm.donationTime}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <button type="submit" className="submit-btn">Submit Donation</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardDonor;