import { useState, useEffect } from 'react';
import "./DashboardDonor.css";
import { useAuth } from '../contexts/AuthContext';

function MyDonations() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTimeChangeModal, setShowTimeChangeModal] = useState(false);
  const [selectedTimeChange, setSelectedTimeChange] = useState(null);
  const [respondLoading, setRespondLoading] = useState(false);
  const [respondError, setRespondError] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const { user } = useAuth();

  // Cache for food banks to avoid refetching
  const [foodBanksCache, setFoodBanksCache] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

  // Fetch all donations (meetups) for this donor
  useEffect(() => {
    const fetchDonations = async () => {
      if (!user || !user.id) {
        setError('User not logged in');
        setLoading(false);
        return;
      }

      // Avoid refetching if we fetched within the last 30 seconds
      const now = Date.now();
      if (lastFetchTime && now - lastFetchTime < 30000) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch all meetups for this donor
        const meetupsResponse = await fetch(
          `${API_URL}/api/meetups?donor_id=${user.id}`
        );

        if (!meetupsResponse.ok) {
          throw new Error('Failed to fetch donations');
        }

        const meetupsData = await meetupsResponse.json();
        const meetups = meetupsData.meetups || [];

        // Fetch pending time change requests
        const timeChangeResponse = await fetch(
          `${API_URL}/api/meetup_time_change_requests?status=pending`
        );

        let timeChangeRequests = [];
        if (timeChangeResponse.ok) {
          const timeChangeData = await timeChangeResponse.json();
          timeChangeRequests = timeChangeData.requests || [];
        }

        // Create a map of meetup_id -> time change request
        const timeChangeByMeetupId = {};
        timeChangeRequests.forEach(req => {
          timeChangeByMeetupId[req.meetup_id] = req;
        });

        // Fetch food banks once and cache them
        let foodBanksData;
        if (foodBanksCache) {
          foodBanksData = foodBanksCache;
        } else {
          const foodBankResponse = await fetch(
            `${API_URL}/api/food_banks`
          );
          if (foodBankResponse.ok) {
            const data = await foodBankResponse.json();
            foodBanksData = data.food_banks;
            setFoodBanksCache(data.food_banks);
          } else {
            foodBanksData = [];
          }
        }

        // For each meetup, fetch food bank and posting details
        const donationsWithDetails = await Promise.all(
          meetups.map(async (meetup) => {
            try {
              // Get food bank name from cached data
              let foodBankName = 'Unknown Food Bank';
              const foodBank = foodBanksData.find(
                fb => fb.id === meetup.food_bank_id
              );
              if (foodBank) {
                foodBankName = foodBank.name;
              }

              // Check if there's a pending time change request for this meetup
              const timeChangeRequest = timeChangeByMeetupId[meetup.id];
              const hasPendingTimeChange = !!timeChangeRequest;

              return {
                id: meetup.id,
                foodBankName: foodBankName,
                donationItem: meetup.donation_item,
                quantity: `${meetup.quantity} lbs`,
                scheduledDate: meetup.scheduled_date,
                scheduledTime: meetup.scheduled_time,
                completed: meetup.completed,
                verified: !hasPendingTimeChange, // Not verified if there's a pending time change
                timeChangeRequest: timeChangeRequest || null,
              };
            } catch (err) {
              console.error(`Error fetching details for meetup ${meetup.id}:`, err);
              return {
                id: meetup.id,
                foodBankName: 'Unknown Food Bank',
                donationItem: meetup.donation_item,
                quantity: `${meetup.quantity} lbs`,
                scheduledDate: meetup.scheduled_date,
                scheduledTime: meetup.scheduled_time,
                completed: meetup.completed,
                verified: true,
                timeChangeRequest: null,
              };
            }
          })
        );

        // Sort by date (most recent first)
        donationsWithDetails.sort((a, b) => {
          const dateA = new Date(a.scheduledDate + 'T' + a.scheduledTime);
          const dateB = new Date(b.scheduledDate + 'T' + b.scheduledTime);
          return dateB - dateA;
        });

        setDonations(donationsWithDetails);
        setLastFetchTime(Date.now());
      } catch (err) {
        console.error('Error fetching donations:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDonations();
    }
  }, [user, lastFetchTime, foodBanksCache]);

  const handleViewTimeChangeRequest = (donation) => {
    setSelectedTimeChange(donation);
    setShowTimeChangeModal(true);
  };

  const handleCloseTimeChangeModal = () => {
    setShowTimeChangeModal(false);
    setSelectedTimeChange(null);
    setRespondError(null);
  };

  const handleRespondToTimeChange = async (action) => {
    if (!selectedTimeChange || !selectedTimeChange.timeChangeRequest) {
      return;
    }

    setRespondLoading(true);
    setRespondError(null);

    try {
      const response = await fetch(
        `${API_URL}/api/meetup_time_change_requests/${selectedTimeChange.timeChangeRequest.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: action, // 'approve' or 'reject'
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} time change request`);
      }

      const data = await response.json();
      console.log('Time change request responded:', data);

      // Update local state
      if (action === 'approve') {
        // Update the donation with the new time
        setDonations(donations.map(d =>
          d.id === selectedTimeChange.id
            ? {
                ...d,
                scheduledDate: selectedTimeChange.timeChangeRequest.new_date,
                scheduledTime: selectedTimeChange.timeChangeRequest.new_time,
                verified: true,
                timeChangeRequest: null,
              }
            : d
        ));
        alert('Time change approved! Your donation schedule has been updated.');
      } else {
        // Just mark as verified (original time remains)
        setDonations(donations.map(d =>
          d.id === selectedTimeChange.id
            ? { ...d, verified: true, timeChangeRequest: null }
            : d
        ));
        alert('Time change rejected. Your original donation schedule remains unchanged.');
      }

      handleCloseTimeChangeModal();
    } catch (error) {
      console.error('Error responding to time change request:', error);
      setRespondError(error.message);
    } finally {
      setRespondLoading(false);
    }
  };

  if (loading) {
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

  // Categorize donations
  const needActionDonations = donations.filter(d => d.timeChangeRequest && !d.completed);
  const pendingDonations = donations.filter(d => !d.timeChangeRequest && !d.completed);
  const completedDonations = donations.filter(d => d.completed);

  const renderDonationCard = (donation) => (
    <div key={donation.id} className="item-card">
      <div className="item-info">
        <h3>
          {donation.foodBankName}
          {donation.verified && !donation.completed && <span className="verified">✓</span>}
          {!donation.verified && donation.timeChangeRequest && (
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
              TIME CHANGE REQUESTED
            </span>
          )}
        </h3>
        <p className="quantity">Item: {donation.donationItem}</p>
        <p className="quantity">Amount: {donation.quantity}</p>
        <div className="details">
          <span>
            Scheduled: {donation.scheduledDate} at {donation.scheduledTime.substring(0, 5)}
          </span>
          {donation.timeChangeRequest && (
            <span style={{ color: '#ff9800', fontWeight: '600' }}>
              New time requested: {donation.timeChangeRequest.new_date} at {donation.timeChangeRequest.new_time}
            </span>
          )}
        </div>
        {donation.completed && (
          <span style={{
            backgroundColor: '#4caf50',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '0.85em',
            fontWeight: '600',
            marginTop: '8px',
            display: 'inline-block'
          }}>
            COMPLETED
          </span>
        )}
      </div>
      {donation.timeChangeRequest && (
        <button
          className="contact-btn"
          onClick={() => handleViewTimeChangeRequest(donation)}
        >
          Review Time Change
        </button>
      )}
    </div>
  );

  return (
    <div id="dashboard">
      <div className="dashboard-grid">
        <div className="main-content">
          {error && (
            <div style={{ color: 'red', padding: '10px', marginBottom: '10px' }}>
              Error: {error}
            </div>
          )}

          {donations.length === 0 ? (
            <p className="no-donors">No donations scheduled yet. Visit the Dashboard to schedule your first donation!</p>
          ) : (
            <>
              {/* Need Action Section */}
              {needActionDonations.length > 0 && (
                <div style={{ marginBottom: '40px' }}>
                  <h2 style={{ color: '#ff9800', marginBottom: '20px', fontSize: '1.5em' }}>Need Action</h2>
                  <div className="items-list">
                    {needActionDonations.map(renderDonationCard)}
                  </div>
                </div>
              )}

              {/* Pending Section */}
              {pendingDonations.length > 0 && (
                <div style={{ marginBottom: '40px' }}>
                  <h2 style={{ color: '#4a7c59', marginBottom: '20px', fontSize: '1.5em' }}>Pending</h2>
                  <div className="items-list">
                    {pendingDonations.map(renderDonationCard)}
                  </div>
                </div>
              )}

              {/* Completed/Dropped Section */}
              {completedDonations.length > 0 && (
                <div style={{ marginBottom: '40px' }}>
                  <h2 style={{ color: '#666', marginBottom: '20px', fontSize: '1.5em' }}>Completed/Dropped</h2>
                  <div className="items-list">
                    {completedDonations.map(renderDonationCard)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Time Change Request Modal */}
      {showTimeChangeModal && selectedTimeChange && selectedTimeChange.timeChangeRequest && (
        <div className="modal-overlay" onClick={handleCloseTimeChangeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Time Change Request</h2>
              <button className="close-btn" onClick={handleCloseTimeChangeModal}>×</button>
            </div>

            {respondError && (
              <div className="error-message" style={{ color: 'red', padding: '10px 30px', marginBottom: '10px' }}>
                {respondError}
              </div>
            )}

            <div style={{ padding: '30px' }}>
              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#333' }}>
                  <strong>Food Bank:</strong> {selectedTimeChange.timeChangeRequest.requested_by}
                </p>
                <p style={{ margin: '0 0 8px 0', color: '#666' }}>
                  <strong>Item:</strong> {selectedTimeChange.donationItem}
                </p>
                <p style={{ margin: '0', color: '#666' }}>
                  <strong>Amount:</strong> {selectedTimeChange.quantity}
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.1em', color: '#333', marginBottom: '12px' }}>Current Schedule:</h3>
                <p style={{ margin: '0', padding: '12px', background: '#fff', border: '1px solid #ddd', borderRadius: '6px', color: '#333' }}>
                  <strong>Date:</strong> {selectedTimeChange.scheduledDate}<br />
                  <strong>Time:</strong> {selectedTimeChange.scheduledTime.substring(0, 5)}
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.1em', color: '#ff9800', marginBottom: '12px' }}>Requested New Schedule:</h3>
                <p style={{ margin: '0', padding: '12px', background: '#fff8e1', border: '1px solid #ff9800', borderRadius: '6px', color: '#333' }}>
                  <strong>Date:</strong> {selectedTimeChange.timeChangeRequest.new_date}<br />
                  <strong>Time:</strong> {selectedTimeChange.timeChangeRequest.new_time}
                </p>
              </div>

              {selectedTimeChange.timeChangeRequest.reason && (
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '1.1em', color: '#333', marginBottom: '12px' }}>Reason:</h3>
                  <p style={{ margin: '0', padding: '12px', background: '#f5f5f5', borderRadius: '6px', fontStyle: 'italic', color: '#555' }}>
                    "{selectedTimeChange.timeChangeRequest.reason}"
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '30px' }}>
                <button
                  onClick={() => handleRespondToTimeChange('approve')}
                  disabled={respondLoading}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: '#4a7c59',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: respondLoading ? 'not-allowed' : 'pointer',
                    opacity: respondLoading ? 0.6 : 1
                  }}
                >
                  {respondLoading ? 'Processing...' : 'Accept'}
                </button>
                <button
                  onClick={() => handleRespondToTimeChange('reject')}
                  disabled={respondLoading}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: '#d32f2f',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: respondLoading ? 'not-allowed' : 'pointer',
                    opacity: respondLoading ? 0.6 : 1
                  }}
                >
                  {respondLoading ? 'Processing...' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyDonations;
