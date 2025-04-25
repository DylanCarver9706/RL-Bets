import React, { useEffect, useState } from "react";
import { fetchTransactionHistory } from "../../../services/userService.js";
import { useUser } from "../../../contexts/UserContext.js";
import { capitalize } from "../../../services/wagerService.js";
import "../../../styles/components/core/TransactionHistory.css";

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const { user } = useUser();

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchTransactionHistory(user.mongoUserId);
      setTransactions(data);
    };

    fetchData();
  }, [user.mongoUserId]);

  // Format date to remove seconds
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  };

  const toggleRow = (index) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(index)) {
      newExpandedRows.delete(index);
    } else {
      newExpandedRows.add(index);
    }
    setExpandedRows(newExpandedRows);
  };

  return (
    <div className="transaction-container">
      <h2 className="transaction-header">Transaction History</h2>
      {transactions.length === 0 ? (
        <div className="no-transactions-message">
          No transactions to display
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="transaction-table">
            <thead>
              <tr>
                <th></th>
                <th>Credits</th>
                <th>Type</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction, index) => (
                <React.Fragment key={index}>
                  <tr>
                    <td className="expand-cell">
                      {transaction.type === "payout" && transaction.wager && (
                        <button
                          className={`expand-button ${
                            expandedRows.has(index) ? "active" : ""
                          }`}
                          onClick={() => toggleRow(index)}
                        >
                          {expandedRows.has(index) ? "▼" : "▶"}
                        </button>
                      )}
                    </td>
                    <td
                      className={`transaction-amount ${
                        ["payout", "purchase"].includes(transaction.type)
                          ? "amount-positive"
                          : "amount-negative"
                      }`}
                    >
                      {["payout", "purchase"].includes(transaction.type)
                        ? "+"
                        : "-"}
                      {parseFloat(transaction.credits).toFixed(2)}
                    </td>
                    <td className="transaction-type">
                      {capitalize(transaction.type)}
                    </td>
                    <td>{formatDate(transaction.createdAt)}</td>
                  </tr>
                  {transaction.type === "payout" &&
                    transaction.wager &&
                    expandedRows.has(index) && (
                      <tr className="expanded-row">
                        <td></td>
                        <td colSpan="3" className="wager-details">
                          {transaction.wager}
                        </td>
                      </tr>
                    )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
