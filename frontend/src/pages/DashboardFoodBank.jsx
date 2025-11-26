import { useState, useEffect } from 'react';
import "./DashboardFoodBank.css";
import { useAuth } from '../contexts/AuthContext'

function DashboardFoodBank() {
  const [foodItems, setFoodItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [donorsForItem, setDonorsForItem] = useState([]);
  const [showPostModal, setShowPostModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [donorsLoading, setDonorsLoading] = useState(false);
  const [urgencyFilter, setUrgencyFilter] = useState('All');
  const [postForm, setPostForm] = useState({
    foodName: '',
    urgency: 'Medium',
    quantityNeeded: '',
    fromDate: '',
    toDate: '',
    fromTime: '',
    toTime: ''
  });

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [showTimeChangeModal, setShowTimeChangeModal] = useState(false);
  const [selectedMeetup, setSelectedMeetup] = useState(null);
  const [timeChangeForm, setTimeChangeForm] = useState({
    newDate: '',
    newTime: '',
    reason: ''
  });
  const [timeChangeLoading, setTimeChangeLoading] = useState(false);
  const [timeChangeError, setTimeChangeError] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const [donorsCache, setDonorsCache] = useState({});
  const { user } = useAuth();

  const FOOD_BANK_ID = user?.id;
  const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

  // Fetch donation postings and their donor counts
useEffect(() => {
  const fetchDonationPostings = async () => {
    if (!FOOD_BANK_ID) {
      setError('User not logged in');
      setLoading(false);
      return;
    }

    const now = Date.now();
    if (lastFetchTime && now - lastFetchTime < 30000) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/api/donation_postings?food_bank_id=${FOOD_BANK_ID}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch donation postings');
      }

      const data = await response.json();
      
      // For each posting, fetch the number of NON-COMPLETED meetups (donors)
      const postingsWithDonorCounts = await Promise.all(
        data.postings.map(async (posting) => {
          try {
            const meetupsResponse = await fetch(
              `${API_URL}/api/meetups?posting_id=${posting.id}&completed=false`
            );
            
            let donorCount = 0;
            if (meetupsResponse.ok) {
              const meetupsData = await meetupsResponse.json();
              donorCount = meetupsData.meetups?.length || 0;
            }

            return {
              id: posting.id,
              name: posting.food_name,
              urgency: posting.urgency,
              quantityNeeded: `${posting.qty_needed} lbs`,
              donorCount: donorCount,
              fromDate: posting.from_date,
              toDate: posting.to_date,
              fromTime: posting.from_time,
              toTime: posting.to_time,
            };
          } catch (err) {
            console.error(`Error fetching meetups for posting ${posting.id}:`, err);
            return {
              id: posting.id,
              name: posting.food_name,
              urgency: posting.urgency,
              quantityNeeded: `${posting.qty_needed} lbs`,
              donorCount: 0,
              fromDate: posting.from_date,
              toDate: posting.to_date,
              fromTime: posting.from_time,
              toTime: posting.to_time,
            };
          }
        })
      );

      setFoodItems(postingsWithDonorCounts);
      setLastFetchTime(Date.now());
      setError(null);
    } catch (err) {
      console.error('Error fetching donation postings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    fetchDonationPostings();
  }
}, [FOOD_BANK_ID, user, lastFetchTime]);

const handleDeletePosting = async (itemId) => {
  if (!window.confirm('Are you sure you want to delete this donation posting? Scheduled meetups will remain visible in your Donations tab.')) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/donation_postings/${itemId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete posting');
    }

    setFoodItems(foodItems.filter(item => item.id !== itemId));
    alert('Posting deleted successfully!');

  } catch (error) {
    console.error('Error deleting posting:', error);
    alert(`Error: ${error.message}`);
  }
};


const handleItemClick = async (item) => {
  setSelectedItem(item);
  
  // Check if we have cached data for this posting
  if (donorsCache[item.id]) {
    setDonorsForItem(donorsCache[item.id]);
    return;
  }

  setDonorsLoading(true);
  
  try {
    // Fetch ONLY non-completed meetups for this posting
    const meetupsResponse = await fetch(
      `${API_URL}/api/meetups?posting_id=${item.id}&completed=false`
    );
    
    if (!meetupsResponse.ok) {
      throw new Error('Failed to fetch meetups');
    }

    const meetupsData = await meetupsResponse.json();
    const meetups = meetupsData.meetups || [];

    // Fetch time change requests for these meetups
    const timeChangeResponse = await fetch(
      `${API_URL}/api/meetup_time_change_requests`
    );

    let timeChangeRequests = [];
    if (timeChangeResponse.ok) {
      const timeChangeData = await timeChangeResponse.json();
      timeChangeRequests = timeChangeData.requests || [];
      console.log('Fetched time change requests:', timeChangeRequests);
    }

    // Create a map of meetup_id -> time change request
    const timeChangeByMeetupId = {};
    timeChangeRequests.forEach(req => {
      // Only store the most recent request for each meetup
      if (!timeChangeByMeetupId[req.meetup_id] || 
          new Date(req.created_at) > new Date(timeChangeByMeetupId[req.meetup_id].created_at)) {
        timeChangeByMeetupId[req.meetup_id] = req;
      }
    });

    // Fetch donor details for each meetup
    const donorsWithDetails = await Promise.all(
      meetups.map(async (meetup) => {
        try {
          // Fetch donor profile
          const donorResponse = await fetch(
            `${API_URL}/api/donors/${meetup.donor_id}`
          );

          let donorName = 'Unknown Donor';
          if (donorResponse.ok) {
            const donorData = await donorResponse.json();
            donorName = `${donorData.first_name} ${donorData.last_name}`;
          }

          // Check for time change request status
          const timeChangeRequest = timeChangeByMeetupId[meetup.id];

          return {
            id: meetup.id,
            name: donorName,
            quantity: `${meetup.quantity} lbs`,
            scheduledDate: meetup.scheduled_date, // Store as-is from backend
            scheduledTime: meetup.scheduled_time, // Store as-is from backend
            completed: meetup.completed,
            verified: true,
            timeChangeRequest: timeChangeRequest || null,
          };
        } catch (err) {
          console.error(`Error fetching donor ${meetup.donor_id}:`, err);
          return {
            id: meetup.id,
            name: 'Unknown Donor',
            quantity: `${meetup.quantity} lbs`,
            scheduledDate: meetup.scheduled_date,
            scheduledTime: meetup.scheduled_time,
            completed: meetup.completed,
            verified: false,
            timeChangeRequest: null,
          };
        }
      })
    );

    setDonorsForItem(donorsWithDetails);
    // Cache the donors for this posting
    setDonorsCache(prev => ({
      ...prev,
      [item.id]: donorsWithDetails
    }));
  } catch (err) {
    console.error('Error fetching donors for item:', err);
    setError('Failed to load donors for this item');
    setDonorsForItem([]);
  } finally {
    setDonorsLoading(false);
  }
};


  const handleBackToItems = () => {
    setSelectedItem(null);
    setDonorsForItem([]);
  };

  const handleOpenPostModal = () => {
    setShowPostModal(true);
  };

  const handleClosePostModal = () => {
    setShowPostModal(false);
    setPostForm({
      foodName: '',
      urgency: 'Medium',
      quantityNeeded: '',
      fromDate: '',
      toDate: '',
      fromTime: '',
      toTime: ''
    });
    setSubmitError(null);
  };

  const handleOpenTimeChangeModal = (meetup) => {
    setSelectedMeetup(meetup);
    setShowTimeChangeModal(true);
    setTimeChangeForm({
      newDate: meetup.scheduledDate,
      newTime: meetup.scheduledTime,
      reason: ''
    });
  };

  const handleCloseTimeChangeModal = () => {
    setShowTimeChangeModal(false);
    setSelectedMeetup(null);
    setTimeChangeForm({
      newDate: '',
      newTime: '',
      reason: ''
    });
    setTimeChangeError(null);
  };

  const handleTimeChangeFormChange = (e) => {
    setTimeChangeForm({
      ...timeChangeForm,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmitTimeChange = async (e) => {
    e.preventDefault();
    setTimeChangeLoading(true);
    setTimeChangeError(null);

    const now = new Date();
    const today = now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0');
    const nowTime = now.toTimeString().slice(0,5);

    // Validate new date
    if (timeChangeForm.newDate < today) {
      setTimeChangeError('New date cannot be in the past');
      setTimeChangeLoading(false);
      return;
    }

    // Validate new time
    if (timeChangeForm.newDate === today && timeChangeForm.newTime < nowTime) {
      setTimeChangeError('New time cannot be earlier than the current time');
      setTimeChangeLoading(false);
      return;
    }

    try {
      // Create a time change request instead of directly updating the meetup
      const response = await fetch(`${API_URL}/api/meetup_time_change_requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetup_id: selectedMeetup.id,
          food_bank_id: user.id,
          new_date: timeChangeForm.newDate,
          new_time: timeChangeForm.newTime,
          reason: timeChangeForm.reason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create time change request');
      }

      const data = await response.json();
      console.log('Time change request created:', data);

      // Update local state to show pending badge immediately
      setDonorsForItem(donorsForItem.map(d =>
        d.id === selectedMeetup.id
          ? { ...d, timeChangeRequest: data }
          : d
      ));

      // Update cache as well
      if (selectedItem && donorsCache[selectedItem.id]) {
        setDonorsCache(prev => ({
          ...prev,
          [selectedItem.id]: prev[selectedItem.id].map(d =>
            d.id === selectedMeetup.id
              ? { ...d, timeChangeRequest: data }
              : d
          )
        }));
      }

      // Show success message
      alert('Time change request sent to donor for approval!');

      handleCloseTimeChangeModal();

    } catch (error) {
      console.error('Error creating time change request:', error);
      setTimeChangeError(error.message);
    } finally {
      setTimeChangeLoading(false);
    }
  };

  const handleFormChange = (e) => {
    setPostForm({
      ...postForm,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmitPost = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setSubmitError(null);

    const now = new Date();
    const today = now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0');
    const nowTime = now.toTimeString().slice(0,5);

    // Validate fromDate
    if (postForm.fromDate < today) {
      setSubmitError('From Date cannot be in the past');
      setSubmitLoading(false);
      return;
    }


    if (postForm.fromDate === today && postForm.fromTime < nowTime) {
      setSubmitError('From Time cannot be earlier than the current time');
      setSubmitLoading(false);
      return;
    }

    if (postForm.toDate < postForm.fromDate) {
      setSubmitError('To Date cannot be earlier than From Date');
      setSubmitLoading(false);
      return;
    }
    
    if (postForm.fromDate === postForm.toDate && postForm.toTime < postForm.fromTime) {
      setSubmitError('To Time cannot be earlier than From Time on the same day');
      setSubmitLoading(false);
      return;
    }

    if (postForm.toDate === today && postForm.toTime < nowTime) {
      setSubmitError('To Time cannot be earlier than the current time');
      setSubmitLoading(false);
      return;
    }
    
    if (!user || !user.id) {
      setSubmitError('You must be logged in as a Food Bank to create a post');
      setSubmitLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/donation_postings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          food_bank_id: user.id,
          food_name: postForm.foodName,
          urgency: postForm.urgency,
          quantity_needed: parseFloat(postForm.quantityNeeded),
          from_date: postForm.fromDate,
          to_date: postForm.toDate,
          from_time: postForm.fromTime,
          to_time: postForm.toTime,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create donation post');
      }

      const data = await response.json();
      console.log('Donation post created:', data);

      const newItem = {
        id: data.id,
        name: data.food_name,
        urgency: data.urgency,
        quantityNeeded: `${data.qty_needed} lbs`,
        donorCount: 0,
        fromDate: data.from_date,
        toDate: data.to_date,
        fromTime: data.from_time,
        toTime: data.to_time,
      };
      setFoodItems([newItem, ...foodItems]);

      // Clear the cache to refresh data on next view
      setLastFetchTime(null);

      handleClosePostModal();

    } catch (error) {
      console.error('Error creating donation post:', error);
      setSubmitError(error.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const filteredFoodItems = urgencyFilter === 'All' 
    ? foodItems 
    : foodItems.filter(item => item.urgency === urgencyFilter);

  useEffect(() => {
    if (showPostModal) {
      const now = new Date();
      const localDateString = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0');
      const currentTime = now.toTimeString().slice(0,5); // 'HH:MM'
      setPostForm(form => ({
        ...form,
        fromDate: localDateString,
        fromTime: currentTime
      }));
    }
  }, [showPostModal]);

  if (loading && foodItems.length === 0) {
    return (
      <div id="dashboard">
        <div className="dashboard-grid">
          <div className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div id="dashboard">
        <div className="dashboard-grid">
          <div className="main-content">
            <p style={{ color: 'red' }}>Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="dashboard">
      <div className="dashboard-grid">
        <div className="main-content">
          {!selectedItem ? (
            <>
              <div className="content-header">
                <h2>Food Items We Need</h2>
                  <div className="header-actions">
                    <button className="post-btn" onClick={handleOpenPostModal}>
                      + Make Donation Post
                    </button>
                    <div className="filters">
                      <select 
                        value={urgencyFilter} 
                        onChange={(e) => setUrgencyFilter(e.target.value)}
                      >
                        <option value="All">All Urgency Levels</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                  </div>
              </div>

              {error && (
                <div style={{ color: 'red', padding: '10px', marginBottom: '10px' }}>
                  Error: {error}
                </div>
              )}

              <div className="items-list">
                {filteredFoodItems.length === 0 ? (
                  <p>No donation postings {urgencyFilter !== 'All' ? `with ${urgencyFilter} urgency` : ''} yet. {urgencyFilter === 'All' ? 'Create one to get started!' : 'Try a different urgency level.'}</p>
                ) : (
                  filteredFoodItems.map(item => (
                    <div 
                      key={item.id} 
                      className="item-card"
                    >
                      <div className="item-info" onClick={() => handleItemClick(item)} style={{ cursor: 'pointer', flex: 1 }}>
                        <h3>
                          {item.name}
                          <span className={`urgency-badge ${item.urgency.toLowerCase()}`}>
                            {item.urgency}
                          </span>
                        </h3>
                        <p className="quantity">Need: {item.quantityNeeded}</p>
                        <p className="donor-count">{item.donorCount} donor{item.donorCount !== 1 ? 's' : ''} scheduled</p>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                          className="view-donors-btn"
                          onClick={() => handleItemClick(item)}
                        >
                          View Donors →
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (item.donorCount === 0) {
                              handleDeletePosting(item.id);
                            }
                          }}
                          disabled={item.donorCount > 0}
                          style={{
                            backgroundColor: item.donorCount > 0 ? '#ffcdd2' : '#f44336',
                            color: item.donorCount > 0 ? '#c62828' : 'white',
                            border: 'none',
                            padding: '10px 15px',
                            borderRadius: '4px',
                            cursor: item.donorCount > 0 ? 'not-allowed' : 'pointer',
                            fontWeight: '600',
                            fontSize: '14px',
                            opacity: item.donorCount > 0 ? 0.9 : 1
                          }}
                          onMouseEnter={(e) => {
                            if (item.donorCount === 0) {
                              e.target.style.backgroundColor = '#da190b';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (item.donorCount === 0) {
                              e.target.style.backgroundColor = '#f44336';
                            }
                          }}
                          title={item.donorCount > 0 ? 'Cannot delete a post that has donors' : 'Delete this posting'}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              <div className="content-header">
                <button className="back-btn" onClick={handleBackToItems}>
                  ← Back to Food Items
                </button>
                <h2>Donors for {selectedItem.name}</h2>
              </div>

              {donorsLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                  <div className="spinner"></div>
                </div>
              ) : (
                <div className="items-list">
                {donorsForItem.length > 0 ? (
                  donorsForItem.map(donor => (
                    <div key={donor.id} className="item-card">
                      <div className="item-info">
                        <h3>
                          {donor.name} 
                          {donor.verified && !donor.timeChangeRequest && <span className="verified">✓</span>}
                          {donor.timeChangeRequest && donor.timeChangeRequest.status === 'approved' && (
                            <span className="verified">✓</span>
                          )}
                          {donor.timeChangeRequest && donor.timeChangeRequest.status === 'rejected' && (
                            <span style={{
                              background: '#d32f2f',
                              color: 'white',
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: '0.75em',
                              fontWeight: '600',
                              marginLeft: '12px',
                              textTransform: 'uppercase'
                            }}>
                              ✗ REJECTED
                            </span>
                          )}
                          {donor.timeChangeRequest && donor.timeChangeRequest.status === 'pending' && (
                            <span style={{
                              background: '#ff9800',
                              color: 'white',
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: '0.75em',
                              fontWeight: '600',
                              marginLeft: '12px',
                              textTransform: 'uppercase'
                            }}>
                              ⏱ PENDING
                            </span>
                          )}
                        </h3>
                        <p className="quantity">Donating: {donor.quantity}</p>
                        <p className="distance">
                          Scheduled: {donor.scheduledDate} at {donor.scheduledTime}
                        </p>
                        {donor.completed && (
                          <span className="completed-badge" style={{ 
                            backgroundColor: '#4caf50', 
                            color: 'white', 
                            padding: '2px 8px', 
                            borderRadius: '4px',
                            fontSize: '0.85em'
                          }}>
                            Completed
                          </span>
                        )}
                      </div>
                      <button 
                        className="contact-btn" 
                        onClick={() => handleOpenTimeChangeModal(donor)}
                        disabled={donor.timeChangeRequest && donor.timeChangeRequest.status === 'pending'}
                        style={{
                          opacity: donor.timeChangeRequest && donor.timeChangeRequest.status === 'pending' ? 0.6 : 1,
                          cursor: donor.timeChangeRequest && donor.timeChangeRequest.status === 'pending' ? 'not-allowed' : 'pointer'
                        }}
                      >
                        Request Time Change
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="no-donors">No donors scheduled for this item yet.</p>
                )}
              </div>
              )}
            </>
          )}
        </div>
      </div>

      {showPostModal && (
        <div className="modal-overlay" onClick={handleClosePostModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Make Donation Post</h2>
              <button className="close-btn" onClick={handleClosePostModal}>×</button>
            </div>

            {submitError && (
              <div className="error-message" style={{ color: 'red', padding: '10px', marginBottom: '10px' }}>
                {submitError}
              </div>
            )}
            
            <form onSubmit={handleSubmitPost}>
              <div className="form-group">
                <label htmlFor="foodName">Food Name</label>
                <input
                  type="text"
                  id="foodName"
                  name="foodName"
                  value={postForm.foodName}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="urgency">Urgency</label>
                <select
                  id="urgency"
                  name="urgency"
                  value={postForm.urgency}
                  onChange={handleFormChange}
                  required
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="quantityNeeded">Quantity Needed (in pounds)</label>
                <input
                  type="number"
                  id="quantityNeeded"
                  name="quantityNeeded"
                  value={postForm.quantityNeeded}
                  onChange={handleFormChange}
                  min="0"
                  step="0.1"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="fromDate">From Date</label>
                <input
                  type="date"
                  id="fromDate"
                  name="fromDate"
                  value={postForm.fromDate}
                  min={(() => {
                    const now = new Date();
                    return now.getFullYear() + '-' +
                      String(now.getMonth() + 1).padStart(2, '0') + '-' +
                      String(now.getDate()).padStart(2, '0');
                  })()}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="toDate">To Date</label>
                <input
                  type="date"
                  id="toDate"
                  name="toDate"
                  value={postForm.toDate}
                  min={(() => {
                    const now = new Date();
                    return now.getFullYear() + '-' +
                      String(now.getMonth() + 1).padStart(2, '0') + '-' +
                      String(now.getDate()).padStart(2, '0');
                  })()}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="fromTime">From Time</label>
                <input
                  type="time"
                  id="fromTime"
                  name="fromTime"
                  value={postForm.fromTime}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="toTime">To Time</label>
                <input
                  type="time"
                  id="toTime"
                  name="toTime"
                  value={postForm.toTime}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <button type="submit" className="submit-btn" disabled={submitLoading}>
                {submitLoading ? 'Submitting...' : 'Submit'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showTimeChangeModal && selectedMeetup && (
        <div className="modal-overlay" onClick={handleCloseTimeChangeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Request Time Change</h2>
              <button className="close-btn" onClick={handleCloseTimeChangeModal}>×</button>
            </div>

            {timeChangeError && (
              <div className="error-message" style={{ color: 'red', padding: '10px', marginBottom: '10px' }}>
                {timeChangeError}
              </div>
            )}

            <div style={{ marginLeft: '30px', marginRight: '30px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px', color: '#333' }}>
              <p><strong>Donor:</strong> {selectedMeetup.name}</p>
              <p><strong>Current Schedule:</strong> {selectedMeetup.scheduledDate} at {selectedMeetup.scheduledTime}</p>
              <p><strong>Quantity:</strong> {selectedMeetup.quantity}</p>
            </div>
            
            <form onSubmit={handleSubmitTimeChange}>
              <div className="form-group">
                <label htmlFor="newDate">New Date</label>
                <input
                  type="date"
                  id="newDate"
                  name="newDate"
                  value={timeChangeForm.newDate}
                  min={(() => {
                    const now = new Date();
                    return now.getFullYear() + '-' +
                      String(now.getMonth() + 1).padStart(2, '0') + '-' +
                      String(now.getDate()).padStart(2, '0');
                  })()}
                  onChange={handleTimeChangeFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="newTime">New Time</label>
                <input
                  type="time"
                  id="newTime"
                  name="newTime"
                  value={timeChangeForm.newTime}
                  onChange={handleTimeChangeFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="reason">Reason for Change (Optional)</label>
                <textarea
                  id="reason"
                  name="reason"
                  value={timeChangeForm.reason}
                  onChange={handleTimeChangeFormChange}
                  rows="3"
                  placeholder="Provide a reason for the time change request..."
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    fontFamily: 'inherit',
                    fontSize: '14px',
                    color: '#333'
                  }}
                />
              </div>

              <button type="submit" className="submit-btn" disabled={timeChangeLoading}>
                {timeChangeLoading ? 'Submitting...' : 'Request Time Change'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardFoodBank;