import { useState, useEffect } from 'react';
import "./DashboardDonor.css";
import { useAuth } from '../contexts/AuthContext';

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
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [donationQuantity, setDonationQuantity] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [donationForm, setDonationForm] = useState({
    name: '',
    dateOfBirth: '',
    amount: '',
    donationTime: ''
  });
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const [foodBankItemsCache, setFoodBankItemsCache] = useState({});
  const [sortBy, setSortBy] = useState('name');
  const { user } = useAuth();
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
  
  useEffect(() => {
    const fetchFoodBanks = async () => {
      const now = Date.now();
      if (lastFetchTime && now - lastFetchTime < 30000) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`${API_URL}/api/food_banks`);
        if (!response.ok) {
          throw new Error('Failed to fetch food banks');
        }
        
        const data = await response.json();

        const transformedData = data.food_banks.map(bank => ({
          id: bank.id,
          name: bank.name,
          distance: 'N/A',
          verified: true,
          itemCount: bank.items_needed || 0
        }));

        setNearbyFoodBanks(transformedData);
        setLastFetchTime(Date.now());
      } catch (error) {
        console.error('Error fetching food banks:', error);
        setError('Failed to load food banks. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchFoodBanks();
  }, [lastFetchTime]);

  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const response = await fetch(`${API_URL}/api/items/autocomplete?q=${encodeURIComponent(searchTerm)}`);
        const data = await response.json();
        setSuggestions(data.items || []);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleFoodBankClick = async (foodBank) => {
    setSelectedFoodBank(foodBank);
    
    if (foodBankItemsCache[foodBank.id]) {
      setFoodItemsNeeded(foodBankItemsCache[foodBank.id]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${API_URL}/api/donation_postings?food_bank_id=${foodBank.id}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch donation postings for this food bank');
      }
      
      const data = await response.json();
      
      const transformedItems = data.postings.map(posting => ({
        id: posting.id,
        name: posting.food_name,
        urgency: posting.urgency,
        quantityNeeded: `${posting.qty_needed} lbs`,
        fromDate: posting.from_date,
        toDate: posting.to_date,
        fromTime: posting.from_time,
        toTime: posting.to_time,
      }));
      
      setFoodItemsNeeded(transformedItems);
      // Cache the items for this food bank
      setFoodBankItemsCache(prev => ({
        ...prev,
        [foodBank.id]: transformedItems
      }));
    } catch (err) {
      console.error('Error fetching food items:', err);
      setError('Failed to load food items for this food bank. Please try again.');
      setFoodItemsNeeded([]);
    } finally {
      setLoading(false);
    }
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
    setDonationQuantity('');
    setSubmitError(null);
  };

const handleConfirm = async (e) => {
  e.preventDefault();
  setSubmitLoading(true);
  setSubmitError(null);

  if (!user || !user.id) {
    setSubmitError('You must be logged in as a Donor to schedule a donation');
    setSubmitLoading(false);
    return;
  }

  // Parse the quantity needed from the selected item
  const quantityNeededStr = selectedItem.quantityNeeded.replace(' lbs', '');
  const quantityNeeded = parseFloat(quantityNeededStr);
  const donationQty = parseFloat(donationQuantity);

  // Validate donation quantity
  if (donationQty > quantityNeeded) {
    setSubmitError(`Donation quantity (${donationQty} lbs) exceeds quantity needed (${quantityNeeded} lbs)`);
    setSubmitLoading(false);
    return;
  }

  if (donationQty <= 0) {
    setSubmitError('Donation quantity must be greater than 0');
    setSubmitLoading(false);
    return;
  }

  // Validate meeting time is within available time range
  const meetingTimeValue = meetingTime; // Format: "HH:MM"
  const fromTimeValue = selectedItem.fromTime.substring(0, 5);
  const toTimeValue = selectedItem.toTime.substring(0, 5);

  if (meetingTimeValue < fromTimeValue || meetingTimeValue > toTimeValue) {
    setSubmitError(`Meeting time must be between ${fromTimeValue} and ${toTimeValue}`);
    setSubmitLoading(false);
    return;
  }

  // Validate meeting date is within available date range
  if (meetingDate < selectedItem.fromDate || meetingDate > selectedItem.toDate) {
    setSubmitError(`Meeting date must be between ${selectedItem.fromDate} and ${selectedItem.toDate}`);
    setSubmitLoading(false);
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/meetups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        posting_id: selectedItem.id,
        donor_id: user.id,
        food_bank_id: selectedFoodBank.id,
        scheduled_date: meetingDate,
        scheduled_time: meetingTime,
        donation_item: selectedItem.name,
        quantity: donationQty,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to schedule donation');
    }

    setFoodItemsNeeded(prevItems =>
      prevItems.map(item => {
        if (item.id === selectedItem.id) {
          const currentQty = parseFloat(item.quantityNeeded.replace(' lbs', ''));
          const newQty = currentQty - donationQty;
          return {
            ...item,
            quantityNeeded: `${newQty.toFixed(2)} lbs`
          };
        }
        return item;
      })
    );

      setFoodBankItemsCache(prev => {
        const newCache = { ...prev };
        delete newCache[selectedFoodBank.id];
        return newCache;
      });

      alert('Donation scheduled successfully! The food bank will be notified.');
      handleCloseModal();
    } catch (error) {
      console.error('Error scheduling donation:', error);
      setSubmitError(error.message);
    } finally {
      setSubmitLoading(false);
    }
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
      const response = await fetch(`${API_URL}/api/search/postings?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      console.log('Search results:', data.postings);
    } catch (error) {
      console.error('Error searching postings:', error);
    }
  };

  const sortedFoodBanks = [...nearbyFoodBanks].sort((a, b) => {
    if (sortBy === 'items') {
      return b.itemCount - a.itemCount;
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <div id="dashboard">
      <div className="dashboard-grid">
        <div className="main-content">
          {loading && !selectedFoodBank ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
              <div className="spinner"></div>
            </div>
          ) : !selectedFoodBank ? (
            <>
              <div className="content-header">
                <h2>Nearby Food Banks</h2>
                <div className="filters">
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="name">Sort by Name</option>
                    <option value="items">Sort by Items Needed</option>
                  </select>
                </div>
              </div>

              <div className="items-list">
                {sortedFoodBanks.map((bank) => (
                  <div 
                    key={bank.id} 
                    className="item-card clickable"
                    onClick={() => handleFoodBankClick(bank)}
                  >
                    <div className="item-info">
                      <h3>{bank.name}</h3>
                      <p className="item-count">
                        {bank.itemCount} item{bank.itemCount !== 1 ? 's' : ''} needed
                      </p>
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

              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                  <div className="spinner"></div>
                </div>
              ) : (
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
              )}
            </>
          )}
        </div>
      </div>

      {showDonationModal && selectedItem && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content small-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Schedule Donation</h2>
              <button className="close-btn" onClick={handleCloseModal}>×</button>
            </div>

            {submitError && (
              <div className="error-message" style={{ color: 'red', padding: '10px', marginBottom: '10px' }}>
                {submitError}
              </div>
            )}
            
            <form onSubmit={handleConfirm}>
              <div className="form-group">
                <label htmlFor="donationQuantity">Quantity You're Donating (lbs)</label>
                <input
                  type="number"
                  id="donationQuantity"
                  name="donationQuantity"
                  value={donationQuantity}
                  onChange={(e) => setDonationQuantity(e.target.value)}
                  min="0.1"
                  max={parseFloat(selectedItem?.quantityNeeded?.replace(' lbs', '') || '0')}
                  step="0.1"
                  required
                />
                <small style={{ color: '#666', fontSize: '0.85em' }}>
                  Maximum: {selectedItem?.quantityNeeded}
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="meetingDate">Meeting Date</label>
                <input
                  type="date"
                  id="meetingDate"
                  name="meetingDate"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  min={selectedItem?.fromDate}
                  max={selectedItem?.toDate}
                  required
                />
                <small style={{ color: '#666', fontSize: '0.85em', display: 'block', marginTop: '4px' }}>
                  Dates: {selectedItem?.fromDate} to {selectedItem?.toDate}
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="meetingTime">Meeting Time</label>
                <input
                  type="time"
                  id="meetingTime"
                  name="meetingTime"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                  min={selectedItem?.fromTime?.substring(0, 5)}
                  max={selectedItem?.toTime?.substring(0, 5)}
                  required
                />
                <small style={{ color: '#666', fontSize: '0.85em' }}>
                  Available Time: {selectedItem?.fromTime?.substring(0, 5)} - {selectedItem?.toTime?.substring(0, 5)}
                </small>
              </div>
              <button type="submit" className="submit-btn" disabled={submitLoading}>
                {submitLoading ? 'Scheduling...' : 'Confirm Donation'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardDonor;