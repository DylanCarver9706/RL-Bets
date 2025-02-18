import React, { useEffect, useState } from "react";
import { fetchTransactionHistory } from "../../../services/userService.js";
import { useUser } from "../../../contexts/UserContext.js";
import { capitalize } from "../../../services/wagerService.js";

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const { user } = useUser();

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchTransactionHistory(user.mongoUserId);
      setTransactions(data);
    };

    fetchData();
  }, [user.mongoUserId]);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Transaction History</h2>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.headerCell}>Credits</th>
            <th style={styles.headerCell}>Type</th>
            <th style={styles.headerCell}>Wager</th>
            <th style={styles.headerCell}>Date</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction, index) => (
            <tr key={index}>
              <td style={styles.cell}>{["payout", "purchase"].includes(transaction.type) ? `+${parseFloat(transaction.credits).toFixed(2)}` : `-${parseFloat(transaction.credits).toFixed(2)}`}</td>
              <td style={styles.cell}>{capitalize(transaction.type)}</td>
              <td style={styles.cell}>{transaction.wager || "N/A"}</td>
              <td style={styles.cell}>
                {new Date(transaction.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionHistory;

const styles = {
  container: {
    padding: "20px",
    maxWidth: "800px",
    margin: "0 auto",
    backgroundColor: "#635d5d",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
  },
  title: {
    textAlign: "center",
    marginBottom: "20px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  headerCell: {
    borderBottom: "2px solid #ddd",
    textAlign: "left",
    padding: "10px",
    backgroundColor: "#333",
    color: "#fff",
  },
  cell: {
    borderBottom: "1px solid #ddd",
    padding: "10px",
  },
};
