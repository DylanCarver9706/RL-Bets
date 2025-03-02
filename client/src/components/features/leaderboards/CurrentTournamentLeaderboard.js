import React, { useEffect, useState } from "react";
import { subscribeToUpdates } from "../../../services/supabaseService";
import { fetchCurrentLeaderboard } from "../../../services/leaderboardService";
import "../../../styles/components/leaderboards/CurrentTournamentLeaderboard.css";
import { getUsers } from "../../../services/adminService";

const CurrentTournamentLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const leaderboardData = await fetchCurrentLeaderboard();
        setLeaderboard(leaderboardData);
        const usersData = await getUsers();
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      }
    };

    fetchData();
  }, []);

  // Listen for updates
  useEffect(() => {
    const subscription = subscribeToUpdates('leaderboard', 'updateLeaderboard', (payload) => {
      setLeaderboard(payload.leaderboard);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const getRankClass = (rank) => {
    if (rank === 1) return "rank-1";
    if (rank === 2) return "rank-2";
    if (rank === 3) return "rank-3";
    return "";
  };

  const renderLeaderboardRow = (rank, user, reward) => {
    return (
      <tr
        key={user?._id || `placeholder-${rank}`}
        className="tournament-leaderboard-tr"
      >
        <td className={`tournament-leaderboard-td ${getRankClass(rank)}`}>
          {rank}
        </td>
        <td className={`tournament-leaderboard-td ${getRankClass(rank)}`}>
          {user?.username || "—"}
        </td>
        <td className={`tournament-leaderboard-td ${getRankClass(rank)}`}>
          {user?.points ? parseFloat(user.points).toFixed(4) : "—"}
        </td>
        <td className={`tournament-leaderboard-td ${getRankClass(rank)}`}>
          {reward}
        </td>
      </tr>
    );
  };

  if (!leaderboard || !Array.isArray(leaderboard.users)) {
    return (
      <div className="tournament-leaderboard-container">
        <p className="no-tournament-message">
          No Active Tournaments At This Time
        </p>
      </div>
    );
  }

  return (
    <div className="tournament-leaderboard-container">
      <h2 className="tournament-leaderboard-header">
        User Rankings for "{leaderboard.name}"
      </h2>
      <table className="tournament-leaderboard-table">
        <thead>
          <tr>
            <th className="tournament-leaderboard-th">Rank</th>
            <th className="tournament-leaderboard-th">Name</th>
            <th className="tournament-leaderboard-th">Earned Credits</th>
            <th className="tournament-leaderboard-th">Reward</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard?.rewards &&
            Object.entries(leaderboard.rewards).map(([rank, reward]) => {
              const rankNum = parseInt(rank);
              const user = users.find((u) => u.rank === rankNum);
              return renderLeaderboardRow(rankNum, user, reward);
            })}
        </tbody>
      </table>
    </div>
  );
};

export default CurrentTournamentLeaderboard;
