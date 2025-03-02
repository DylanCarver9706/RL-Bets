import React, { useEffect, useState } from "react";
import { subscribeToUpdates } from "../../../services/supabaseService";
import { fetchLifetimeLeaderboard } from "../../../services/leaderboardService";
import "../../../styles/components/leaderboards/LifetimeLeaderboard.css";

const LifetimeLeaderboard = () => {
  const [sortedUsers, setSortedUsers] = useState([]);

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersResponse = await fetchLifetimeLeaderboard();
        setSortedUsers(usersResponse);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  // Listen for updates
  useEffect(() => {
    const subscription = subscribeToUpdates('users', 'updateUsers', (payload) => {
      setSortedUsers(payload.users);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const getRankClass = (index) => {
    if (index === 0) return "rank-1";
    if (index === 1) return "rank-2";
    if (index === 2) return "rank-3";
    return "";
  };

  return (
    <div className="leaderboard-container">
      <h2 className="leaderboard-header">Lifetime User Rankings</h2>
      <table className="leaderboard-table">
        <thead>
          <tr>
            <th className="leaderboard-th">Rank</th>
            <th className="leaderboard-th">Name</th>
            <th className="leaderboard-th">Lifetime Earned Credits</th>
          </tr>
        </thead>
        <tbody>
          {sortedUsers.map((user, index) => (
            <tr key={index} className="leaderboard-tr">
              <td className={`leaderboard-td ${getRankClass(index)}`}>
                {index + 1}
              </td>
              <td className={`leaderboard-td ${getRankClass(index)}`}>
                {user.name}
              </td>
              <td className={`leaderboard-td ${getRankClass(index)}`}>
                {user.lifetimeEarnedCredits}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LifetimeLeaderboard;
