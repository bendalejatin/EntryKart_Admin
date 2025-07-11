import React, { useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../components/styles/EntryPermissionForm.css";

//const BASE_URL = "http://localhost:5000"; // Adjust this to your backend URL
const BASE_URL = "https://dec-entrykart-backend.onrender.com" ; // deployment url

const EntryPermissionForm = () => {
  const [entries, setEntries] = useState([]);
  const [societies, setSocieties] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const adminEmail = localStorage.getItem("adminEmail");

  useEffect(() => {
    if (!adminEmail) {
      setError("Please log in to access entry permissions.");
      setLoading(false);
      return;
    }
    fetchSocieties();
    fetchEntries();
    checkExpiringPermissions();
  }, [adminEmail]);

  const fetchSocieties = async (retryCount = 3) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/api/societies?email=${adminEmail}`,
        { headers: { "Cache-Control": "no-cache" } }
      );
      setSocieties(response.data || []);
      if (response.data.length === 0) {
        setError("No societies found. Contact the superadmin.");
      }
    } catch (error) {
      console.error("Error fetching societies:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      if (retryCount > 0) {
        console.log(`Retrying fetchSocieties... (${retryCount} attempts left)`);
        setTimeout(() => fetchSocieties(retryCount - 1), 2000);
      } else {
        let errorMessage = "Failed to fetch societies. Please check your connection.";
        if (error.response?.status === 401) {
          errorMessage = "Unauthorized access. Please verify your login credentials.";
        } else if (error.response?.status === 404) {
          errorMessage = "No societies available. Contact the superadmin.";
        }
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchEntries = async (retryCount = 3) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/api/entries?email=${adminEmail}`,
        { headers: { "Cache-Control": "no-cache" } }
      );
      console.log("Fetched entries:", response.data); // Debug log
      setEntries(response.data || []);
      if (response.data.length === 0) {
        console.log("No entries found for admin.");
      }
    } catch (error) {
      console.error("Error fetching entries:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      if (retryCount > 0) {
        console.log(`Retrying fetchEntries... (${retryCount} attempts left)`);
        setTimeout(() => fetchEntries(retryCount - 1), 2000);
      } else {
        let errorMessage = "Failed to fetch entries. Please check your connection.";
        if (error.response?.status === 401) {
          errorMessage = "Unauthorized access. Please verify your login credentials.";
        } else if (error.response?.status === 404) {
          errorMessage = "No entries available.";
        }
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const checkExpiringPermissions = async (retryCount = 3) => {
    try {
      const res = await axios.get(
        `${BASE_URL}/api/entries/expiring-soon?email=${adminEmail}`,
        { headers: { "Cache-Control": "no-cache" } }
      );
      if (res.data.length > 0) {
        res.data.forEach((entry) => {
          toast.warn(`Permission for ${entry.name} is expiring soon!`);
        });
      }
    } catch (error) {
      console.error("Error checking expiring permissions:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      if (retryCount > 0) {
        console.log(`Retrying checkExpiringPermissions... (${retryCount} attempts left)`);
        setTimeout(() => checkExpiringPermissions(retryCount - 1), 2000);
      } else {
        toast.error("Failed to check expiring permissions.");
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;
    try {
      await axios.delete(`${BASE_URL}/api/entries/${id}`);
      setEntries(entries.filter((entry) => entry._id !== id));
      toast.success("Entry deleted successfully!");
      await fetchEntries();
    } catch (error) {
      console.error("Error deleting entry:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      toast.error("Error deleting entry: " + (error.response?.data?.message || error.message));
    }
  };

  const getSocietyId = (societyIdValue) => {
    return typeof societyIdValue === "string" ? societyIdValue : societyIdValue?._id || "";
  };

  const filteredEntries = entries.filter(
    (entry) =>
      entry.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.flatNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.visitorType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container">
        <h2>Loading...</h2>
        <ToastContainer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <p className="error-message">{error}</p>
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="entry-form-container">
      <div className="entry-card">
        <div className="form-title">Entry Permissions</div>
        <div className="entry-form-content">
          <input
            type="text"
            placeholder="Search entries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field"
            aria-label="Search entries"
            style={{ marginBottom: "20px" }}
          />
          <p>Debug: Found {filteredEntries.length} entries (Total: {entries.length})</p>
          <div className="entries-list">
            {filteredEntries.length === 0 ? (
              <p>No entry permissions found.</p>
            ) : (
              filteredEntries.map((entry) => (
                <div key={entry._id} className="entry-item">
                  <div className="entry-details">
                    <h4>{entry.name}</h4>
                    <p>
                      <strong>Society:</strong>{" "}
                      {societies.find((soc) => soc._id === getSocietyId(entry.societyId))?.name || "N/A"}
                    </p>
                    <p><strong>Flat Number:</strong> {entry.flatNumber}</p>
                    <p><strong>Email:</strong> {entry.email || "N/A"}</p>
                    <p><strong>Visitor Type:</strong> {entry.visitorType}</p>
                    <p>
                      <strong>Status:</strong>{" "}
                      <span className={`status-${entry.status}`}>
                        {entry.status?.charAt(0).toUpperCase() + entry.status?.slice(1)}
                      </span>
                    </p>
                    <p><strong>Description:</strong> {entry.description}</p>
                    <p>
                      <strong>Date & Time:</strong>{" "}
                      {new Date(entry.dateTime).toLocaleString()}
                    </p>
                    <p>
                      <strong>Expiry:</strong>{" "}
                      {new Date(entry.additionalDateTime).toLocaleString()}
                    </p>
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
      </div>
      <ToastContainer />
    </div>
  );
};

export default EntryPermissionForm;