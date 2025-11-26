import { useState, useEffect } from 'react';
import './Leaderboard.css';

function Leaderboard() {
  const [timeFrame, setTimeFrame] = useState('week');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `${API_URL}/api/leaderboard?timeframe=${timeFrame}`
        );

        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`);
        }

        const json = await res.json();
        const list = Array.isArray(json.leaderboard) ? json.leaderboard : [];
        setLeaderboardData(list);
      } catch (err) {
        setError(err.message || 'Failed to load leaderboard');
        setLeaderboardData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [timeFrame]);

  const handleTimeFrameChange = (value) => {
    if (value !== timeFrame) {
      setTimeFrame(value);
    }
  };

  return (
    <div id="leaderboard">
      {/* Time frame buttons */}
      <div className="time-filter">
        <button
          className={timeFrame === 'week' ? 'active' : ''}
          onClick={() => handleTimeFrameChange('week')}
        >
          This Week
        </button>
        <button
          className={timeFrame === 'month' ? 'active' : ''}
          onClick={() => handleTimeFrameChange('month')}
        >
          This Month
        </button>
        <button
          className={timeFrame === 'alltime' ? 'active' : ''}
          onClick={() => handleTimeFrameChange('alltime')}
        >
          All Time
        </button>
      </div>

      <div className="leaderboard-content">
        <div className="leaderboard-header">
          <h2>Top Donors</h2>
        </div>

        {loading ? (
          <div className="loading-message">Loading leaderboard...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : leaderboardData.length === 0 ? (
          <div className="empty-message">
            No donations found for this timeframe yet.
          </div>
        ) : (
          <div className="leaderboard-list">
            {/* Column labels */}
            <div className="leaderboard-header-row">
              <div className="col-place">Place</div>
              <div className="col-player">Player</div>
              <div className="col-meetups">Meetups completed</div>
              <div className="col-weight">Total donated</div>
            </div>

            {/* Data rows */}
            {leaderboardData.map((entry, index) => {
              const rank = index + 1;
              const isTopThree = rank <= 3;

              let placeContent;
              if (rank === 1) {
                placeContent = <span className="medal-emoji">🥇</span>;
              } else if (rank === 2) {
                placeContent = <span className="medal-emoji">🥈</span>;
              } else if (rank === 3) {
                placeContent = <span className="medal-emoji">🥉</span>;
              } else {
                placeContent = <span className="rank-number">#{rank}</span>;
              }

              const firstName = entry.first_name || '';
              const lastName = entry.last_name || '';
              const fullName = (firstName + ' ' + lastName).trim() || 'Unknown donor';

              const initials =
                (firstName[0] || '').toUpperCase() +
                (lastName[0] || '').toUpperCase();

              const safeWeight =
                typeof entry.total_weight === 'number'
                  ? entry.total_weight
                  : parseFloat(entry.total_weight || '0');

              const totalMeetups =
                typeof entry.total_meetups === 'number'
                  ? entry.total_meetups
                  : parseInt(entry.total_meetups || '0', 10);

              return (
                <div
                  key={entry.donor_id || index}
                  className={`leaderboard-row ${isTopThree ? 'top-three' : ''}`}
                >
                  <div className="col-place">{placeContent}</div>

                  <div className="col-player">
                    <div className="player-info">
                      <div className="avatar-circle">
                        {initials || '??'}
                      </div>
                      <div className="player-name">{fullName}</div>
                    </div>
                  </div>

                  <div className="col-meetups">
                    {totalMeetups}
                  </div>

                  <div className="col-weight">
                    {safeWeight.toFixed(1)} lbs
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
export default Leaderboard;
