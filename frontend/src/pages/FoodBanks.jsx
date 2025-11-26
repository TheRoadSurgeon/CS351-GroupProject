import { useState, useEffect } from 'react';
import "./FoodBanks.css";

function FoodBanks() {
  const [foodBanks, setFoodBanks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

  useEffect(() => {
    fetch(`${API_URL}/banks.json`)
      .then(response => response.json())
      .then(data => {
        setFoodBanks(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading food banks:', error);
        setLoading(false);
      });
  }, []);

  const filteredBanks = foodBanks.filter(bank =>
    bank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bank.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bank.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatTags = (tags) => {
    return tags.map(tag => {
      const tagMap = {
        'canned': 'Canned Goods',
        'fresh': 'Fresh Produce',
        'distribution': 'Distribution Center',
        'meals': 'Prepared Meals'
      };
      return tagMap[tag] || tag;
    }).join(', ');
  };

  return (
    <div id="foodbanks">
      <div className="search-container">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="foodbanks-content">
        {loading ? (
          <div className="loading-message">Loading food banks...</div>
        ) : filteredBanks.length === 0 ? (
          <div className="no-results">No food banks found</div>
        ) : (
          <div className="foodbanks-list">
            {filteredBanks.map((bank) => (
              <div key={bank.id} className="foodbank-card">
                <div className="foodbank-image">
                  <div className="image-placeholder">(Image)</div>
                </div>

                <div className="foodbank-info">
                  <div className="info-row">
                    <div className="info-item">
                      <strong>Food Bank: </strong>{bank.name}
                    </div>
                    <div className="info-item">
                      <strong>City: </strong>{bank.city}
                    </div>
                  </div>
                  <div className="info-row">
                    <div className="info-item needs">
                      <strong>Needs: </strong>{formatTags(bank.tags)}
                    </div>
                    <div className="info-item">
                      <strong>Refrigerated: </strong>
                      {bank.refrigerated ? (
                        <span className="refrigerated-yes">✓ Yes</span>
                      ) : (
                        <span className="refrigerated-no">✗ No</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="foodbank-action">
                  <button className="donate-btn">
                    + Donate
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FoodBanks;