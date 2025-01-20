import React, { useState, useEffect } from "react";
import { getUsers, sendEmailToUsers } from "../services/adminService"; // Assumes these functions are defined in your service layer
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const AdminEmail = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userTypeFilter, setUserTypeFilter] = useState("all");
  const [subject, setSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const allUsers = await getUsers();
        setUsers(allUsers);
        setFilteredUsers(allUsers);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Failed to fetch users. Please try again later.");
      }
    };

    fetchUsers();
  }, []);

  const handleFilterChange = (e) => {
    const userType = e.target.value;
    setUserTypeFilter(userType);

    if (userType === "all") {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter((user) => user.userType === userType);
      setFilteredUsers(filtered);
    }
  };

  const handleSelectAll = () => {
    // Get all user IDs from the filtered users based on the selected user type
    const userIds = filteredUsers.map((user) => user.email);
    setSelectedUsers((prevSelected) =>
      Array.from(new Set([...prevSelected, ...userIds]))
    );
  };

  const handleDeselectAll = () => {
    const userIds = filteredUsers.map((user) => user.email);
    setSelectedUsers((prevSelected) =>
      prevSelected.filter((id) => !userIds.includes(id))
    );
  };

  const handleUserSelect = (userId) => {
    setSelectedUsers((prevSelected) =>
      prevSelected.includes(userId)
        ? prevSelected.filter((id) => id !== userId)
        : [...prevSelected, userId]
    );
  };

  const handleSubmit = async () => {
    if (!subject || !emailBody) {
      setError("Subject and email body are required.");
      return;
    }

    if (selectedUsers.length === 0) {
      setError("Please select at least one user.");
      return;
    }

    try {
      await sendEmailToUsers(selectedUsers, subject, emailBody);

      alert("Email sent successfully.");
      setSubject("");
      setEmailBody("");
      setSelectedUsers([]);
    } catch (err) {
      console.error("Error sending email:", err);
      setError("Failed to send email. Please try again later.");
    }
  };

  return (
    <div style={styles.container}>
      <h1>Admin Email</h1>

      {error && <p style={styles.error}>{error}</p>}

      <div style={styles.contentWrapper}>
        <div style={styles.emailForm}>
          <label>
            Subject:
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={styles.input}
            />
          </label>

          <label>
            Email Body:
            <ReactQuill
              value={emailBody}
              onChange={setEmailBody}
              style={styles.richTextEditor}
            />
          </label>

          <button onClick={handleSubmit} style={styles.submitButton}>
            Send Email
          </button>
        </div>

        <div style={styles.userSection}>
          <div style={styles.filterSection}>
            <label>
              Filter by User Type:
              <select
                value={userTypeFilter}
                onChange={handleFilterChange}
                style={styles.select}
              >
                <option value="all">All</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <button onClick={handleSelectAll} style={styles.button}>
              Select All
            </button>
            <button onClick={handleDeselectAll} style={styles.button}>
              Deselect All
            </button>
          </div>

          <div style={styles.userList}>
            {filteredUsers.map((user) => (
              <div key={user.email} style={styles.userItem}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.email)}
                    onChange={() => handleUserSelect(user.email)}
                  />
                  {user.name} ({user.email})
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: "20px",
    maxWidth: "1000px",
    margin: "0 auto",
  },
  contentWrapper: {
    display: "flex",
    gap: "20px",
  },
  emailForm: {
    flex: 1,
  },
  userSection: {
    flex: 1,
  },
  filterSection: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "20px",
  },
  userList: {
    maxHeight: "400px",
    overflowY: "auto",
    border: "1px solid #ccc",
    padding: "10px",
    borderRadius: "4px",
  },
  userItem: {
    marginBottom: "10px",
  },
  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "4px",
    border: "1px solid #ccc",
  },
  richTextEditor: {
    height: "300px",
    marginBottom: "20px",
  },
  select: {
    padding: "5px",
    borderRadius: "4px",
    border: "1px solid #ccc",
  },
  button: {
    padding: "10px 15px",
    marginLeft: "10px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  submitButton: {
    padding: "10px 20px",
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginTop: "20px",
  },
  error: {
    color: "red",
    marginBottom: "20px",
  },
  success: {
    color: "green",
    marginBottom: "20px",
  },
};

export default AdminEmail;
