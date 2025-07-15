import React, { useState, useEffect } from "react";
import axios from "axios";
import "./styles/Payment.css";

//const BASE_URL = "http://localhost:5000"; // Adjust this to your backend URL
const BASE_URL = "https://entrykart-admin.onrender.com" ; // deployment url

const Payment = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingRecord, setEditingRecord] = useState(null);
  const [editForm, setEditForm] = useState({
    amount: "",
    penalty: "",
    status: "",
    paymentDate: "",
    dueDate: "",
  });

  const fetchRecords = async () => {
    setLoading(true);
    setError("");
    const adminEmail = localStorage.getItem("adminEmail");
    if (!adminEmail) {
      setError("Please log in as an admin to view maintenance records.");
      setLoading(false);
      return;
    }

    try {
      console.log(`Fetching maintenance records for admin: ${adminEmail}`);
      const response = await axios.get(`${BASE_URL}/api/maintenance/admin/all`, {
        params: { email: adminEmail },
      });
      console.log("Fetched records:", response.data);
      setRecords(response.data);
      if (response.data.length === 0) {
        setError(
          `No maintenance records found for admin ${adminEmail}. Ensure societies and owners are assigned to this admin email, or contact support.`
        );
      } else {
        setError("");
      }
    } catch (err) {
      console.error("Error fetching records:", err);
      setError(
        "Failed to fetch maintenance records: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleEditClick = (record) => {
    console.log("Editing record:", record);
    setEditingRecord(record);
    setEditForm({
      amount: record.amount || "",
      penalty: record.penalty || 0,
      status: record.status || "",
      paymentDate: record.paymentDate
        ? new Date(record.paymentDate).toISOString().split("T")[0]
        : "",
      dueDate: record.dueDate
        ? new Date(record.dueDate).toISOString().split("T")[0]
        : "",
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm({ ...editForm, [name]: value });
  };

  const handleEditSubmit = async () => {
    try {
      const adminEmail = localStorage.getItem("adminEmail");
      if (!adminEmail) {
        setError("Admin email not found. Please log in again.");
        return;
      }

      console.log(`Submitting edit for record: ${editingRecord._id}`);
      const response = await axios.put(
        `${BASE_URL}/api/maintenance/${editingRecord._id}?email=${adminEmail}`,
        editForm
      );
      console.log("Updated record:", response.data);
      setRecords(
        records.map((record) =>
          record._id === editingRecord._id ? response.data : record
        )
      );
      setEditingRecord(null);
      setError("");
      alert("Record updated successfully!");
    } catch (err) {
      console.error("Error updating record:", err);
      setError(
        "Error updating record: " + (err.response?.data?.message || err.message)
      );
    }
  };

  const handleCancelEdit = () => {
    setEditingRecord(null);
    setEditForm({ amount: "", penalty: "", status: "", paymentDate: "", dueDate: "" });
  };

  return (
    <div className="payment-container">
      <h1 className="page-title">Admin Payment Management</h1>
      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i> {error}
          {error.includes("No maintenance records found") && (
            <button
              onClick={fetchRecords}
              className="retry-button"
              style={{ marginLeft: "10px", padding: "5px 10px" }}
            >
              Retry
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="loading-spinner">Loading...</div>
      ) : (
        <div className="records-section card">
          <h2 className="section-title">
            <i className="fas fa-database"></i> All Maintenance Records
          </h2>
          {records.length > 0 ? (
            <div className="table-wrapper">
              <table className="records-table">
                <thead>
                  <tr>
                    <th>Owner</th>
                    <th>Email</th>
                    <th>Flat</th>
                    <th>Society</th>
                    <th>Amount</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Penalty</th>
                    <th>Payment Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record._id}>
                      <td>{record.ownerId?.ownerName || "Unknown Owner"}</td>
                      <td>{record.ownerId?.email || "N/A"}</td>
                      <td>{record.flatNumber || "N/A"}</td>
                      <td>{record.societyName || "N/A"}</td>
                      <td>₹{record.amount?.toLocaleString() || "0"}</td>
                      <td>
                        {record.dueDate
                          ? new Date(record.dueDate).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })
                          : "N/A"}
                      </td>
                      <td>
                        <span
                          className={`status-badge status-${record.status?.toLowerCase() || "unknown"}`}
                        >
                          {record.status || "Unknown"}
                        </span>
                      </td>
                      <td>₹{record.penalty?.toLocaleString() || "0"}</td>
                      <td>
                        {record.paymentDate
                          ? new Date(record.paymentDate).toLocaleDateString(
                              "en-GB",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              }
                            )
                          : "N/A"}
                      </td>
                      <td>
                        <button
                          onClick={() => handleEditClick(record)}
                          className="edit-button"
                          disabled={loading}
                        >
                          <i className="fas fa-edit"></i> Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="no-data">
              No maintenance records available. Please check if owners are assigned to societies managed by this admin.
            </p>
          )}
        </div>
      )}

      {editingRecord && (
        <div className="modal">
          <div className="modal-content">
            <h3 className="modal-title">Edit Maintenance Record</h3>
            <div className="form-group">
              <label htmlFor="amount">Amount</label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={editForm.amount}
                onChange={handleEditChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="penalty">Penalty</label>
              <input
                type="number"
                id="penalty"
                name="penalty"
                value={editForm.penalty}
                onChange={handleEditChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={editForm.status}
                onChange={handleEditChange}
                required
              >
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="dueDate">Due Date</label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={editForm.dueDate}
                onChange={handleEditChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="paymentDate">Payment Date</label>
              <input
                type="date"
                id="paymentDate"
                name="paymentDate"
                value={editForm.paymentDate}
                onChange={handleEditChange}
              />
            </div>
            <div className="modal-buttons">
              <button onClick={handleEditSubmit} className="submit-button">
                <i className="fas fa-check-circle"></i> Save
              </button>
              <button onClick={handleCancelEdit} className="cancel-button">
                <i className="fas fa-times-circle"></i> Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payment;