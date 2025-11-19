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
  const { user } = useAuth();

  const FOOD_BANK_ID = user?.id;

  // Fetch donation postings and their donor counts
  useEffect(() => {
    const fetchDonationPostings = async () => {
      if (!FOOD_BANK_ID) {
        setError('User not logged in');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(
          `http://127.0.0.1:5000/api/donation_postings?food_bank_id=${FOOD_BANK_ID}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch donation postings');
        }

        const data = await response.json();
        
        // For each posting, fetch the number of meetups (donors)
        const postingsWithDonorCounts = await Promise.all(
          data.postings.map(async (posting) => {
            try {
              const meetupsResponse = await fetch(
                `http://127.0.0.1:5000/api/meetups?posting_id=${posting.id}`
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
  }, [FOOD_BANK_ID, user]);

  const handleItemClick = async (item) => {
    setSelectedItem(item);
    setDonorsLoading(true);
    
    try {
      // Fetch meetups for this posting
      const meetupsResponse = await fetch(
        `http://127.0.0.1:5000/api/meetups?posting_id=${item.id}`
      );
      
      if (!meetupsResponse.ok) {
        throw new Error('Failed to fetch meetups');
      }

      const meetupsData = await meetupsResponse.json();
      const meetups = meetupsData.meetups || [];

      // Fetch donor details for each meetup
      const donorsWithDetails = await Promise.all(
        meetups.map(async (meetup) => {
          try {
            // Fetch donor profile
            const donorResponse = await fetch(
              `http://127.0.0.1:5000/api/donors/${meetup.donor_id}`
            );

            let donorName = 'Unknown Donor';
            if (donorResponse.ok) {
              const donorData = await donorResponse.json();
              donorName = `${donorData.first_name} ${donorData.last_name}`;
            }

            return {
              id: meetup.id,
              name: donorName,
              quantity: `${meetup.quantity} lbs`,
              scheduledDate: meetup.scheduled_date,
              scheduledTime: meetup.scheduled_time,
              completed: meetup.completed,
              verified: true, // You can add verification logic later
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
            };
          }
        })
      );

      setDonorsForItem(donorsWithDetails);
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

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().slice(0,5);

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
      // const response = await fetch(`http://127.0.0.1:5000/api/meetups/${selectedMeetup.id}`, {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     scheduled_date: timeChangeForm.newDate,
      //     scheduled_time: timeChangeForm.newTime,
      //     // You can add a field to track the reason for the change if needed
      //   }),
      // });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update meetup time');
      }

      const data = await response.json();
      // console.log('Meetup time updated:', data);

      // // Update the local state
      // setDonorsForItem(donorsForItem.map(donor => 
      //   donor.id === selectedMeetup.id 
      //     ? { ...donor, scheduledDate: timeChangeForm.newDate, scheduledTime: timeChangeForm.newTime }
      //     : donor
      // ));

      handleCloseTimeChangeModal();

    } catch (error) {
      console.error('Error updating meetup time:', error);
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

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().slice(0,5); // 'HH:MM'

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

    if (postForm.toDate < today) {
      setSubmitError('To Date cannot be in the past');
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
      const response = await fetch('http://127.0.0.1:5000/api/donation_postings', {
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

      handleClosePostModal();

    } catch (error) {
      console.error('Error creating donation post:', error);
      setSubmitError(error.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Set today's date as default for fromDate and current time as default for fromTime
  useEffect(() => {
    if (showPostModal) {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      const currentTime = now.toTimeString().slice(0,5); // 'HH:MM'
      setPostForm(form => ({
        ...form,
        fromDate: today,
        fromTime: currentTime
      }));
    }
  }, [showPostModal]);

  if (loading) {
    return (
      <div id="dashboard">
        <div className="dashboard-grid">
          <div className="main-content">
            <p>Loading donation postings...</p>
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
                      <select>
                        <option>All Urgency Levels</option>
                        <option>High</option>
                        <option>Medium</option>
                        <option>Low</option>
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
                {foodItems.length === 0 ? (
                  <p>No donation postings yet. Create one to get started!</p>
                ) : (
                  foodItems.map(item => (
                    <div 
                      key={item.id} 
                      className="item-card clickable"
                      onClick={() => handleItemClick(item)}
                    >
                      <div className="item-info">
                        <h3>
                          {item.name}
                          <span className={`urgency-badge ${item.urgency.toLowerCase()}`}>
                            {item.urgency}
                          </span>
                        </h3>
                        <p className="quantity">Need: {item.quantityNeeded}</p>
                        <p className="donor-count">{item.donorCount} donor{item.donorCount !== 1 ? 's' : ''} scheduled</p>
                      </div>
                      <button className="view-donors-btn">View Donors →</button>
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
                <p>Loading donors...</p>
              ) : (
                <div className="items-list">
                  {donorsForItem.length > 0 ? (
                    donorsForItem.map(donor => (
                      <div key={donor.id} className="item-card">
                        <div className="item-info">
                          <h3>
                            {donor.name} 
                            {donor.verified && <span className="verified">✓</span>}
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
                        <button className="contact-btn" onClick={() => handleOpenTimeChangeModal(donor)}>Request Time Change</button>
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
                  min={new Date().toISOString().split('T')[0]}
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
                  min={new Date().toISOString().split('T')[0]}
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
                    fontSize: '14px'
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