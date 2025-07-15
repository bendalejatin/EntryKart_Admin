import React, { useState, useEffect } from "react";
import axios from "axios";
import "./styles/BroadcastMessage.css"; // Import the CSS file

//const BASE_URL = "http://localhost:5000"; // Adjust this to your backend URL
const BASE_URL = "https://entrykart-admin.onrender.com" ; // deployment url

const BroadcastMessage = () => {
  const [message, setMessage] = useState("");
  const [broadcastType, setBroadcastType] = useState("specific");
  const [societies, setSocieties] = useState([]);
  const [selectedSociety, setSelectedSociety] = useState("");
  const [flats, setFlats] = useState([]);
  const [selectedFlat, setSelectedFlat] = useState("");
  const [broadcasts, setBroadcasts] = useState([]);
  const [editingBroadcast, setEditingBroadcast] = useState(null);

  const adminEmail = localStorage.getItem("adminEmail");

  // Fetch societies if broadcast type is not "all"
  useEffect(() => {
    if (broadcastType !== "all") {
      axios
        .get(`${BASE_URL}/api/societies?email=${adminEmail}`)
        .then((res) => {
          setSocieties(res.data);
        })
        .catch((err) => {
          console.error("Error fetching societies", err);
        });
    }
  }, [broadcastType, adminEmail]);

  // When a society is selected, get its flats
  useEffect(() => {
    if (selectedSociety) {
      const society = societies.find((s) => s._id === selectedSociety);
      if (society && society.flats) {
        setFlats(society.flats);
      }
    } else {
      setFlats([]);
    }
  }, [selectedSociety, societies]);

  // Fetch broadcast messages (filter by adminEmail)
  useEffect(() => {
    fetchBroadcasts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminEmail]);

  const fetchBroadcasts = () => {
    axios
      .get(`${BASE_URL}/api/broadcast?email=${adminEmail}`)
      .then((res) => {
        setBroadcasts(res.data);
      })
      .catch((err) => {
        console.error("Error fetching broadcast messages", err);
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      message,
      broadcastType,
      adminEmail,
      society: broadcastType !== "all" ? selectedSociety : null,
      flatNo: broadcastType === "specific" ? selectedFlat : null,
    };

    if (editingBroadcast) {
      axios
        .put(`${BASE_URL}/api/broadcast/${editingBroadcast._id}`, payload)
        .then((res) => {
          alert("Broadcast message updated successfully!");
          resetForm();
          fetchBroadcasts();
        })
        .catch((err) => {
          alert("Error updating broadcast message: " + (err.response?.data?.message || err.message));
        });
    } else {
      axios
        .post(`${BASE_URL}/api/broadcast`, payload)
        .then((res) => {
          alert("Broadcast message sent successfully!");
          resetForm();
          fetchBroadcasts();
        })
        .catch((err) => {
          alert("Error sending broadcast message: " + (err.response?.data?.message || err.message));
        });
    }
  };

  const resetForm = () => {
    setMessage("");
    setBroadcastType("specific");
    setSelectedSociety("");
    setSelectedFlat("");
    setEditingBroadcast(null);
  };

  const handleEdit = (broadcast) => {
    setEditingBroadcast(broadcast);
    setMessage(broadcast.message);
    setBroadcastType(broadcast.broadcastType);
    if (broadcast.broadcastType !== "all" && broadcast.society) {
      setSelectedSociety(broadcast.society._id || broadcast.society);
    }
    if (broadcast.broadcastType === "specific" && broadcast.flatNo) {
      setSelectedFlat(broadcast.flatNo);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this broadcast message?")) {
      axios
        .delete(`${BASE_URL}/api/broadcast/${id}`)
        .then(() => {
          alert("Broadcast message deleted successfully!");
          fetchBroadcasts();
        })
        .catch((err) => {
          alert("Error deleting broadcast message: " + (err.response?.data?.message || err.message));
        });
    }
  };

  return (
    <div className="broadcast-container">
      <h2>📢 Broadcast Message</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Message:</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message here..."
            required
          />
        </div>
        <div className="form-group">
          <label>Broadcast Type:</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                value="specific"
                checked={broadcastType === "specific"}
                onChange={() => setBroadcastType("specific")}
              />
              Specific (Select Society & Flat)
            </label>
            <label>
              <input
                type="radio"
                value="society"
                checked={broadcastType === "society"}
                onChange={() => setBroadcastType("society")}
              />
              Specific Society (All Flats)
            </label>
            <label>
              <input
                type="radio"
                value="all"
                checked={broadcastType === "all"}
                onChange={() => setBroadcastType("all")}
              />
              All Societies & All Flats
            </label>
          </div>
        </div>
        {broadcastType !== "all" && (
          <div className="form-group">
            <label>Select Society:</label>
            <select
              value={selectedSociety}
              onChange={(e) => setSelectedSociety(e.target.value)}
              required
            >
              <option value="">-- Select Society --</option>
              {societies.map((society) => (
                <option key={society._id} value={society._id}>
                  {society.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {broadcastType === "specific" && selectedSociety && (
          <div className="form-group">
            <label>Select Flat:</label>
            <select
              value={selectedFlat}
              onChange={(e) => setSelectedFlat(e.target.value)}
              required
            >
              <option value="">-- Select Flat --</option>
              {flats.map((flat, index) => (
                <option key={index} value={flat}>
                  {flat}
                </option>
              ))}
            </select>
          </div>
        )}
        <button type="submit">{editingBroadcast ? "Update Broadcast" : "Send Broadcast Message"}</button>
      </form>
      <hr />
      <h3>Existing Broadcast Messages</h3>
      <ul>
        {broadcasts.map((broadcast) => (
          <li key={broadcast._id}>
            <p><strong>Message:</strong> {broadcast.message}</p>
            <p><strong>Type:</strong> {broadcast.broadcastType}</p>
            {broadcast.broadcastType !== "all" && broadcast.society && (
              <p><strong>Society:</strong> {broadcast.society.name || broadcast.society}</p>
            )}
            {broadcast.broadcastType === "specific" && (
              <p><strong>Flat:</strong> {broadcast.flatNo}</p>
            )}
            <button className="edit-btn" onClick={() => handleEdit(broadcast)}>Edit</button>
            <button className="delete-btn" onClick={() => handleDelete(broadcast._id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BroadcastMessage;
