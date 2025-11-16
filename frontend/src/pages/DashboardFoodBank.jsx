import { useState, useEffect } from 'react';
import "./DashboardFoodBank.css";

function DashboardFoodBank() {
  const [foodItems, setFoodItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [donorsForItem, setDonorsForItem] = useState([]);

  useEffect(() => {
    // Mock data: Food items the food bank needs
    setFoodItems([
      { id: 1, name: 'Rice', urgency: 'High', quantityNeeded: '50 lbs', donorCount: 3 },
      { id: 2, name: 'Milk', urgency: 'Medium', quantityNeeded: '20 gallons', donorCount: 2 },
      { id: 3, name: 'Chocolate', urgency: 'Low', quantityNeeded: '10 lbs', donorCount: 1 },
      { id: 4, name: 'Canned Goods', urgency: 'High', quantityNeeded: '100 cans', donorCount: 5 },
      { id: 5, name: 'Fresh Produce', urgency: 'High', quantityNeeded: '30 lbs', donorCount: 2 }
    ]);
  }, []);

  const handleItemClick = (item) => {
    setSelectedItem(item);
    
    // Mock data: Donors for the specific food item
    // In real app, this would be an API call based on item.id
    const mockDonors = {
      1: [
        { id: 1, name: 'Gordon Ramsay', quantity: '25 lbs', distance: '2.3 miles', verified: true },
        { id: 2, name: 'Jamie Oliver', quantity: '15 lbs', distance: '1.5 miles', verified: true },
        { id: 3, name: 'Local Grocery Store', quantity: '50 lbs', distance: '3.1 miles', verified: false }
      ],
      2: [ // Milk donors
        { id: 4, name: 'Sydney Sweeney', quantity: '10 gallons', distance: '1.2 miles', verified: true },
        { id: 5, name: 'Dairy Farm Co', quantity: '15 gallons', distance: '5.0 miles', verified: true }
      ],
      3: [ // Chocolate donors
        { id: 6, name: 'Wonka Factory', quantity: '10 lbs', distance: '4.5 miles', verified: true }
      ],
      4: [ // Canned Goods donors
        { id: 7, name: 'Gordon Ramsay', quantity: '50 cans', distance: '2.3 miles', verified: true },
        { id: 8, name: 'Community Center', quantity: '30 cans', distance: '1.8 miles', verified: true },
        { id: 9, name: 'Local Grocery Store', quantity: '100 cans', distance: '3.1 miles', verified: false },
        { id: 10, name: 'Food Drive Org', quantity: '75 cans', distance: '2.9 miles', verified: true },
        { id: 11, name: 'School Cafeteria', quantity: '40 cans', distance: '1.1 miles', verified: true }
      ],
      5: [ // Fresh Produce donors
        { id: 12, name: 'Community Garden', quantity: '20 lbs', distance: '0.8 miles', verified: true },
        { id: 13, name: 'Farmers Market', quantity: '15 lbs', distance: '2.5 miles', verified: true }
      ]
    };

    setDonorsForItem(mockDonors[item.id] || []);
  };

  const handleBackToItems = () => {
    setSelectedItem(null);
    setDonorsForItem([]);
  };

  return (
    <div id="dashboard">
      <div className="dashboard-grid">
        <div className="main-content">
          {!selectedItem ? (
            <>
              <div className="content-header">
                <h2>Food Items We Need</h2>
                <div className="filters">
                  <select>
                    <option>All Urgency Levels</option>
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
              </div>

              <div className="items-list">
                {foodItems.map(item => (
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
                      <p className="donor-count">{item.donorCount} donor{item.donorCount !== 1 ? 's' : ''} available</p>
                    </div>
                    <button className="view-donors-btn">View Donors →</button>
                  </div>
                ))}
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

              <div className="items-list">
                {donorsForItem.length > 0 ? (
                  donorsForItem.map(donor => (
                    <div key={donor.id} className="item-card">
                      <div className="item-info">
                        <h3>
                          {donor.name} 
                          {donor.verified && <span className="verified">✓</span>}
                        </h3>
                        <p className="quantity">Available: {donor.quantity}</p>
                        <p className="distance">{donor.distance} away</p>
                      </div>
                      <button className="contact-btn">Contact</button>
                    </div>
                  ))
                ) : (
                  <p className="no-donors">No donors available for this item yet.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardFoodBank;