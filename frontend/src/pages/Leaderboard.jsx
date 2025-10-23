import { useState, useEffect } from 'react';
import "./Leaderboard.css";

function Leaderboard() {
  const [timeFrame, setTimeFrame] = useState('week');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mockData = {
      week: [
        { id: 1, name: "Sarah Johnson", totalValue: 450, topItem: "Canned Goods", totalWeight: "120 lbs", image: "" },
        { id: 2, name: "Michael Chen", totalValue: 380, topItem: "Fresh Produce", totalWeight: "95 lbs", image: "" },
        { id: 3, name: "Emma Williams", totalValue: 320, topItem: "Rice & Pasta", totalWeight: "80 lbs", image: "" }
      ],
      month: [
        { id: 1, name: "Robert Davis", totalValue: 1850, topItem: "Canned Goods", totalWeight: "450 lbs", image: "" },
        { id: 2, name: "Lisa Anderson", totalValue: 1620, topItem: "Fresh Produce", totalWeight: "380 lbs", image: "" },
        { id: 3, name: "David Martinez", totalValue: 1450, topItem: "Dairy Products", totalWeight: "320 lbs", image: "" }
      ],
      alltime: [
        { id: 1, name: "Jennifer Lopez", totalValue: 8500, topItem: "Mixed Items", totalWeight: "2100 lbs", image: "" },
        { id: 2, name: "William Brown", totalValue: 7800, topItem: "Canned Goods", totalWeight: "1850 lbs", image: "" },
        { id: 3, name: "Patricia Garcia", totalValue: 7200, topItem: "Fresh Produce", totalWeight: "1650 lbs", image: "" }
      ]
    };

    setLeaderboardData(mockData[timeFrame]);
    setLoading(false);
  }, [timeFrame]);

  return (
    <div id="leaderboard">
      <div className="time-filter">
        <button 
          className={timeFrame === 'week' ? 'active' : ''}
          onClick={() => setTimeFrame('week')}
        >
          This Week
        </button>
        <button 
          className={timeFrame === 'month' ? 'active' : ''}
          onClick={() => setTimeFrame('month')}
        >
          This Month
        </button>
        <button 
          className={timeFrame === 'alltime' ? 'active' : ''}
          onClick={() => setTimeFrame('alltime')}
        >
          All Time
        </button>
      </div>

      <div className="leaderboard-content">
        <div className="leaderboard-header">
          <h2>User Information</h2>
        </div>

        {loading ? (
          <div className="loading-message">Loading leaderboard...</div>
        ) : (
          <div className="leaderboard-list">
            {leaderboardData.map((user, index) => (
              <div key={user.id} className="leaderboard-card">
                <div className="rank-badge">
                  {index === 0 && <span className="trophy">🏆</span>}
                  {index === 1 && <span className="medal">🥈</span>}
                  {index === 2 && <span className="medal">🥉</span>}
                  <span className="rank-number">#{index + 1}</span>
                </div>

                <div className="user-image">
                  {user.image ? (
                    <img src={user.image} alt={user.name} />
                  ) : (
                    <div className="image-placeholder">(Image)</div>
                  )}
                </div>

                <div className="user-info">
                  <div className="info-column left">
                    <div className="info-item">
                      <strong>Name: </strong>{user.name}
                    </div>
                    <div className="info-item">
                      <strong>Top donate item: </strong>{user.topItem}
                    </div>
                  </div>

                  <div className="info-column right">
                    <div className="info-item">
                      <strong>Total donation: </strong>${user.totalValue}
                    </div>
                    <div className="info-item">
                      <strong>Total donation: </strong>{user.totalWeight}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Leaderboard;