import { useState, useEffect } from 'react';
import "./DashboardFoodBank.css";
import { useAuth } from '../contexts/AuthContext';

function MyMeetups() {
  const [meetups, setMeetups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const { user } = useAuth();

  // Cache for donors to avoid refetching
  const [donorsCache, setDonorsCache] = useState({});

  // Fetch all meetups for this food bank
  useEffect(() => {
    const fetchMeetups = async () => {
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

        // Fetch all meetups for this food bank
        const meetupsResponse = await fetch(
          `http://127.0.0.1:5000/api/meetups?food_bank_id=${user.id}`
        );

        if (!meetupsResponse.ok) {
          throw new Error('Failed to fetch meetups');
        }

        const meetupsData = await meetupsResponse.json();
        const meetupsList = meetupsData.meetups || [];

        // Fetch time change requests
        const timeChangeResponse = await fetch(
          'http://127.0.0.1:5000/api/meetup_time_change_requests'
        );

        let timeChangeRequests = [];
        if (timeChangeResponse.ok) {
          const timeChangeData = await timeChangeResponse.json();
          timeChangeRequests = timeChangeData.requests || [];
        }

        // Create a map of meetup_id -> most recent time change request
        const timeChangeByMeetupId = {};
        timeChangeRequests.forEach(req => {
          if (!timeChangeByMeetupId[req.meetup_id] || 
              new Date(req.created_at) > new Date(timeChangeByMeetupId[req.meetup_id].created_at)) {
            timeChangeByMeetupId[req.meetup_id] = req;
          }
        });

        // For each meetup, fetch donor and posting details
        const meetupsWithDetails = await Promise.all(
          meetupsList.map(async (meetup) => {
            try {
              // Get donor name from cache or fetch
              let donorName = 'Unknown Donor';
              if (donorsCache[meetup.donor_id]) {
                donorName = donorsCache[meetup.donor_id];
              } else {
                const donorResponse = await fetch(
                  `http://127.0.0.1:5000/api/donors/${meetup.donor_id}`
                );
                if (donorResponse.ok) {
                  const donorData = await donorResponse.json();
                  donorName = `${donorData.first_name} ${donorData.last_name}`;
                  setDonorsCache(prev => ({ ...prev, [meetup.donor_id]: donorName }));
                }
              }

              // Get posting details (food item name)
              let foodItemName = 'Unknown Item';
              const postingResponse = await fetch(
                `http://127.0.0.1:5000/api/donation_postings/${meetup.posting_id}`
              );
              if (postingResponse.ok) {
                const postingData = await postingResponse.json();
                foodItemName = postingData.food_name;
              }

              // Check for time change request
              const timeChangeRequest = timeChangeByMeetupId[meetup.id];

              return {
                id: meetup.id,
                donorName: donorName,
                foodItem: foodItemName,
                quantity: `${meetup.quantity} lbs`,
                scheduledDate: meetup.scheduled_date,
                scheduledTime: meetup.scheduled_time,
                completed: meetup.completed,
                timeChangeRequest: timeChangeRequest || null,
              };
            } catch (err) {
              console.error(`Error fetching details for meetup ${meetup.id}:`, err);
              return {
                id: meetup.id,
                donorName: 'Unknown Donor',
                foodItem: 'Unknown Item',
                quantity: `${meetup.quantity} lbs`,
                scheduledDate: meetup.scheduled_date,
                scheduledTime: meetup.scheduled_time,
                completed: meetup.completed,
                timeChangeRequest: null,
              };
            }
          })
        );

        // Sort by date (most recent first)
        meetupsWithDetails.sort((a, b) => {
          const dateA = new Date(a.scheduledDate + 'T' + a.scheduledTime);
          const dateB = new Date(b.scheduledDate + 'T' + b.scheduledTime);
          return dateB - dateA;
        });

        setMeetups(meetupsWithDetails);
        setLastFetchTime(Date.now());
      } catch (err) {
        console.error('Error fetching meetups:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchMeetups();
    }
  }, [user, lastFetchTime, donorsCache]);

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

  // Categorize meetups
  const pendingMeetups = meetups.filter(m => !m.completed);
  const completedMeetups = meetups.filter(m => m.completed);

  const renderMeetupCard = (meetup) => (
    <div key={meetup.id} className="item-card">
      <div className="item-info">
        <h3>
          {meetup.donorName}
          {!meetup.timeChangeRequest && !meetup.completed && <span className="verified">✓</span>}
          {meetup.timeChangeRequest && meetup.timeChangeRequest.status === 'pending' && (
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
              ⏱ PENDING DONOR RESPONSE
            </span>
          )}
          {meetup.timeChangeRequest && meetup.timeChangeRequest.status === 'approved' && (
            <span className="verified">✓</span>
          )}
          {meetup.timeChangeRequest && meetup.timeChangeRequest.status === 'rejected' && (
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
        </h3>
        <p className="quantity">Item: {meetup.foodItem}</p>
        <p className="quantity">Amount: {meetup.quantity}</p>
        <div className="details">
          <span>
            Scheduled: {new Date(meetup.scheduledDate).toLocaleDateString()} at {meetup.scheduledTime}
          </span>
          {meetup.timeChangeRequest && meetup.timeChangeRequest.status === 'pending' && (
            <span style={{ color: '#ff9800', fontWeight: '600' }}>
              Requested time: {new Date(meetup.timeChangeRequest.new_date).toLocaleDateString()} at {meetup.timeChangeRequest.new_time}
            </span>
          )}
          {meetup.timeChangeRequest && meetup.timeChangeRequest.status === 'approved' && (
            <span style={{ color: '#4a7c59', fontWeight: '600' }}>
              Time change approved
            </span>
          )}
          {meetup.timeChangeRequest && meetup.timeChangeRequest.status === 'rejected' && (
            <span style={{ color: '#d32f2f', fontWeight: '600' }}>
              Time change rejected by donor
            </span>
          )}
        </div>
        {meetup.completed && (
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

          {meetups.length === 0 ? (
            <p className="no-donors">No meetups scheduled yet. Visit the Dashboard to view donation postings and donors!</p>
          ) : (
            <>
              {/* Pending Section */}
              {pendingMeetups.length > 0 && (
                <div style={{ marginBottom: '40px' }}>
                  <h2 style={{ color: '#4a7c59', marginBottom: '20px', fontSize: '1.5em' }}>Pending Meetups</h2>
                  <div className="items-list">
                    {pendingMeetups.map(renderMeetupCard)}
                  </div>
                </div>
              )}

              {/* Completed/Cancelled Section */}
              {completedMeetups.length > 0 && (
                <div style={{ marginBottom: '40px' }}>
                  <h2 style={{ color: '#666', marginBottom: '20px', fontSize: '1.5em' }}>Completed/Cancelled</h2>
                  <div className="items-list">
                    {completedMeetups.map(renderMeetupCard)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default MyMeetups;
