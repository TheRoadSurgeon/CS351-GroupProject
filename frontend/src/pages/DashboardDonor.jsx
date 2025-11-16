import { useState, useEffect } from 'react';
import "./DashboardDonor.css";

function DashboardDonor() {
  const [nearbyFoodBanks, setNearbyFoodBanks] = useState([]);
  const [selectedFoodBank, setSelectedFoodBank] = useState(null);
  const [foodItemsNeeded, setFoodItemsNeeded] = useState([]);

  useEffect(() => {
    // Mock data: Nearby food banks
    setNearbyFoodBanks([
      { id: 1, name: 'Central Food Bank', distance: '1.2 miles', verified: true, itemCount: 4 },
      { id: 2, name: 'Community Kitchen', distance: '2.1 miles', verified: true, itemCount: 3 },
      { id: 3, name: 'Hope Center', distance: '3.5 miles', verified: false, itemCount: 5 }
    ]);
  }, []);

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
            /* Show food items needed by selected food bank */
            <>
              <div className="content-header">
                <button className="back-btn" onClick={handleBackToFoodBanks}>
                  ← Back to Food Banks
                </button>
                <h2>Items Needed by {selectedFoodBank.name}</h2>
              </div>

              <div className="items-list">
                {foodItemsNeeded.length > 0 ? (
                  foodItemsNeeded.map(item => (
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
                      <button className="donate-btn">Donate This Item</button>
                    </div>
                  ))
                ) : (
                  <p className="no-items">No items needed at this time.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardDonor;