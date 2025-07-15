import React, { useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./styles/ServiceEntryManagement.css";

//const BASE_URL = "http://localhost:5000"; // Adjust this to your backend URL
const BASE_URL = "https://entrykart-admin.onrender.com" ; // deployment url

const ServiceEntryManagement = () => {
  const [entries, setEntries] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const adminEmail = localStorage.getItem("adminEmail");

  useEffect(() => {
    if (!adminEmail) {
      setError("Please log in to access service entries.");
      setLoading(false);
      return;
    }
    fetchEntries();
  }, [adminEmail]);

  const fetchEntries = async (retryCount = 3) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/api/service-entries?adminEmail=${adminEmail}`,
        { headers: { "Cache-Control": "no-cache" } }
      );
      setEntries(response.data || []);
      if (response.data.length === 0) {
        setError("No service entries found.");
      }
    } catch (error) {
      console.error("Error fetching service entries:", error);
      if (retryCount > 0) {
        console.log(`Retrying fetchEntries... (${retryCount} attempts left)`);
        setTimeout(() => fetchEntries(retryCount - 1), 2000);
      } else {
        setError("Failed to fetch service entries. Please check your connection.");
        toast.error("Failed to fetch service entries.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;
    try {
      await axios.delete(`${BASE_URL}/api/service-entries/${id}`);
      setEntries(entries.filter((entry) => entry._id !== id));
      toast.success("Entry deleted successfully!");
    } catch (error) {
      toast.error("Error deleting entry");
    }
  };

  const filteredEntries = entries.filter(
    (entry) =>
      entry.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.visitorType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="service-entry-container">
        <h2>Loading...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="service-entry-container">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="service-entry-container">
      <h2 className="form-title">Service Entries</h2>
      <div className="entry-card">
        <input
          type="text"
          placeholder="Search entries..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field"
          aria-label="Search service entries"
        />
        <div className="entries-list">
          {filteredEntries.length === 0 ? (
            <p>No service entries found.</p>
          ) : (
            filteredEntries.map((entry) => (
              <div key={entry._id} className="entry-item">
                <div className="entry-details">
                  <h4>{entry.name}</h4>
                  {entry.photo && (
                    <img
                      src={entry.photo}
                      alt={entry.name}
                      className="entry-photo"
                      style={{ width: "100px", height: "100px", objectFit: "cover" }}
                    />
                  )}
                  <p><strong>Society:</strong> {entry.societyId?.name || "N/A"}</p>
                  <p><strong>Phone Number:</strong> {entry.phoneNumber}</p>
                  <p><strong>Visitor Type:</strong> {entry.visitorType}</p>
                  <p><strong>Status:</strong> {entry.status}</p>
                  <p><strong>Check-In:</strong> {entry.checkInTime ? new Date(entry.checkInTime).toLocaleString() : "N/A"}</p>
                  <p><strong>Check-Out:</strong> {entry.checkOutTime ? new Date(entry.checkOutTime).toLocaleString() : "N/A"}</p>
                  <p><strong>Description:</strong> {entry.description || "N/A"}</p>
                </div>
                <div className="entry-actions">
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(entry._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default ServiceEntryManagement;