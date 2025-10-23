import { useState, useEffect } from 'react';
import "./Dashboard.css";

function Dashboard() {
  const [userType, setUserType] = useState('donor');
  const [donations, setDonations] = useState([]);
  const [nearbyFoodBanks, setNearbyFoodBanks] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    setDonations([
      { id: 1, type: 'Canned Goods', quantity: '50 cans', location: '2.3 miles away', expires: '2025-12-15', donor: 'Local Grocery Store', verified: true },
      { id: 2, type: 'Fresh Produce', quantity: '20 lbs', location: '1.1 miles away', expires: '2025-10-25', donor: 'Community Garden', verified: true },
      { id: 3, type: 'Bread & Bakery', quantity: '30 loaves', location: '0.8 miles away', expires: '2025-10-24', donor: 'Downtown Bakery', verified: false }
    ]);

    setNearbyFoodBanks([
      { id: 1, name: 'Central Food Bank', distance: '1.2 miles', needs: ['Canned Goods', 'Rice'], verified: true },
      { id: 2, name: 'Community Kitchen', distance: '2.1 miles', needs: ['Fresh Produce', 'Dairy'], verified: true }
    ]);

    setNotifications([
      { id: 1, message: 'New donation posted: Fresh Produce nearby', time: '2 hours ago' },
      { id: 2, message: 'Central Food Bank requested pickup for your canned goods', time: '4 hours ago' }
    ]);
  }, []);

  return (
    <div id="dashboard">
      <div className="page-header">
        <div className="user-type-selector">
          <button 
            className={userType === 'donor' ? 'active' : ''} 
            onClick={() => setUserType('donor')}
          >
            I'm a Donor
          </button>
          <button 
            className={userType === 'foodbank' ? 'active' : ''} 
            onClick={() => setUserType('foodbank')}
          >
            I'm a Food Bank
          </button>
        </div>
      </div>

      <div className="actions-row">
        {userType === 'donor' ? (
          <>
            <button className="action-btn primary">+ Create Donation Post</button>
            <button className="action-btn secondary">View My Donations</button>
            <button className="action-btn secondary">Find Nearby Food Banks</button>
          </>
        ) : (
          <>
            <button className="action-btn primary">Search Donations</button>
            <button className="action-btn secondary">Update Our Needs</button>
            <button className="action-btn secondary">Schedule Pickups</button>
          </>
        )}
      </div>

      <div className="dashboard-grid">
        <div className="main-content">
          <div className="content-header">
            <h2>{userType === 'donor' ? 'Nearby Food Banks' : 'Available Donations'}</h2>
            <div className="filters">
              <select>
                <option>All Types</option>
                <option>Canned Goods</option>
                <option>Fresh Produce</option>
                <option>Dairy</option>
                <option>Bread & Bakery</option>
              </select>
              <select>
                <option>Within 5 miles</option>
                <option>Within 2 miles</option>
                <option>Within 1 mile</option>
              </select>
            </div>
          </div>

          <div className="items-list">
            {userType === 'donor' ? (
              nearbyFoodBanks.map(bank => (
                <div key={bank.id} className="item-card">
                  <div className="item-info">
                    <h3>{bank.name} {bank.verified && <span className="verified">✓</span>}</h3>
                    <p className="distance">{bank.distance}</p>
                    <p className="needs">Currently needs: {bank.needs.join(', ')}</p>
                  </div>
                  <button className="contact-btn">Contact</button>
                </div>
              ))
            ) : (
              donations.map(donation => (
                <div key={donation.id} className="item-card">
                  <div className="item-info">
                    <h3>{donation.type} {donation.verified && <span className="verified">✓</span>}</h3>
                    <p className="location">{donation.location}</p>
                    <div className="details">
                      <span>Quantity: {donation.quantity}</span>
                      <span>Expires: {donation.expires}</span>
                      <span>Donor: {donation.donor}</span>
                    </div>
                  </div>
                  <button className="contact-btn">Request Pickup</button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="dashboard-sidebar">
          
          <div className="sidebar-section">
            <h3>Recent Activity</h3>
            <div className="activity-list">
              {notifications.map(notification => (
                <div key={notification.id} className="activity-item">
                  <p>{notification.message}</p>
                  <span className="time">{notification.time}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Map View</h3>
            <div className="map-preview">
              <p>🗺️ Interactive map</p>
              <button className="map-btn">View Full Map</button>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Your Impact</h3>
            <div className="stats">
              <div className="stat">
                <span className="number">12</span>
                <span className="label">Donations</span>
              </div>
              <div className="stat">
                <span className="number">450</span>
                <span className="label">Meals</span>
              </div>
              <div className="stat">
                <span className="number">8</span>
                <span className="label">Food Banks</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Dashboard