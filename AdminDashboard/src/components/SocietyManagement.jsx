import React, { useState, useEffect } from "react";
import axios from "axios";
import "./styles/SocietyManagement.css";

const BASE_URL = "http://localhost:5000";
//const BASE_URL = "https://backend-clr8.onrender.com" ;

const SocietyManagement = () => {
  const [societies, setSocieties] = useState([]);
  const [newSociety, setNewSociety] = useState({
    name: "",
    location: "",
    totalFlats: "",
  });
  const [editingSociety, setEditingSociety] = useState(null);

  useEffect(() => {
    fetchSocieties();
  }, []);

  // Fetch societies filtered by adminEmail
  const fetchSocieties = async () => {
    try {
      const adminEmail = localStorage.getItem("adminEmail");
      const response = await axios.get(
        `${BASE_URL}/api/societies?email=${adminEmail}`
      );
      setSocieties(response.data);
    } catch (error) {
      console.error("Error fetching societies:", error);
    }
  };

  const handleChange = (e) => {
    setNewSociety({ ...newSociety, [e.target.name]: e.target.value });
  };

  // Create or update society
  const addSociety = async () => {
    if (!newSociety.name || !newSociety.location || !newSociety.totalFlats) {
      alert("Please fill all fields.");
      return;
    }
    try {
      const adminEmail = localStorage.getItem("adminEmail");
      if (!adminEmail) {
        alert("Admin email is missing. Please log in again.");
        return;
      }
      let response;
      if (editingSociety) {
        // Assuming your backend supports updating via PUT
        response = await axios.put(
          `${BASE_URL}/api/societies/${editingSociety._id}`,
          {
            name: newSociety.name,
            location: newSociety.location,
            totalFlats: newSociety.totalFlats,
            adminEmail,
          }
        );
        alert("✅ Society updated successfully!");
      } else {
        response = await axios.post(`${BASE_URL}/api/societies`, {
          name: newSociety.name,
          location: newSociety.location,
          totalFlats: newSociety.totalFlats,
          adminEmail,
        });
        alert("✅ Society added successfully!");
      }
      fetchSocieties();
      resetForm();
    } catch (error) {
      console.error("Error saving society:", error);
      alert(
        `❌ Failed to save society: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  // Delete society by id – note the use of type="button" on the button element.
  const handleDeleteSociety = async (id) => {
    console.log("Deleting society with id:", id);
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this society?"
    );
    if (!confirmDelete) return;
    try {
      // The DELETE URL must match your backend route.
      await axios.delete(`${BASE_URL}/api/societies/${id}`);
      // Remove the deleted society from local state.
      setSocieties((prev) => prev.filter((society) => society._id !== id));
      alert("✅ Society deleted successfully!");
    } catch (error) {
      console.error("Error deleting society:", error);
      alert(
        `❌ Error deleting society: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  const handleEditSociety = (society) => {
    setEditingSociety(society);
    setNewSociety({
      name: society.name,
      location: society.location,
      totalFlats: society.flats.length.toString(),
    });
  };

  const resetForm = () => {
    setNewSociety({ name: "", location: "", totalFlats: "" });
    setEditingSociety(null);
  };

  return (
    <div className="society-management">
      <h2>🏢 Society Management</h2>
      <div className="society-form">
        <input
          type="text"
          name="name"
          placeholder="Society Name"
          value={newSociety.name}
          onChange={handleChange}
        />
        <input
          type="text"
          name="location"
          placeholder="Location"
          value={newSociety.location}
          onChange={handleChange}
        />
        <input
          type="number"
          name="totalFlats"
          placeholder="Total Flats"
          value={newSociety.totalFlats}
          onChange={handleChange}
        />
        <button onClick={addSociety}>
          {editingSociety ? "Update Society" : "Add Society"}
        </button>
        {editingSociety && <button onClick={resetForm}>Cancel Edit</button>}
      </div>

      <div className="society-list">
        {societies.length > 0 ? (
          societies.map((society) => (
            <div key={society._id} className="society-card">
              <h3>
                <strong>Society:</strong> {society.name}
              </h3>
              <p>
                <strong>Location:</strong> {society.location}
              </p>
              <p>
                <strong>Total Flats:</strong> {society.flats.length}
              </p>
              <div className="button-container">
                <button
                  className="edit-btn"
                  onClick={() => handleEditSociety(society)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="delete-btn"
                  onClick={() => handleDeleteSociety(society._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>No societies available.</p>
        )}
      </div>
    </div>
  );
};

export default SocietyManagement;
