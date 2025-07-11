import React, { useState, useEffect } from "react";
import axios from "axios";
import "./styles/SocietyManagement.css";

//const BASE_URL = "http://localhost:5000"; // Adjust this to your backend URL
const BASE_URL = "https://dec-entrykart-backend.onrender.com" ; // deployment url

const SocietyManagement = () => {
  const [societies, setSocieties] = useState([]);
  const [newSociety, setNewSociety] = useState({
    name: "",
    location: "",
    societyType: "",
    blocks: "",
    flatsPerFloor: "",
    floorsPerBlock: "",
    totalHouses: "",
  });
  const [editingSociety, setEditingSociety] = useState(null);
  const [expandedFlats, setExpandedFlats] = useState({});

  useEffect(() => {
    fetchSocieties();
  }, []);

  const fetchSocieties = async () => {
    try {
      const adminEmail = localStorage.getItem("adminEmail");
      if (!adminEmail) {
        alert("Admin email is missing. Please log in again.");
        return;
      }
      const response = await axios.get(
        `${BASE_URL}/api/societies?email=${adminEmail}`,
        { headers: { "Cache-Control": "no-cache" } }
      );
      console.log("Fetched societies:", response.data); // Debug log
      setSocieties(response.data || []);
      if (response.data.length === 0) {
        alert("No societies found for this admin.");
      }
    } catch (error) {
      console.error("Error fetching societies:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      let errorMessage = "Failed to fetch societies. Please check your connection or contact the server admin.";
      if (error.response?.status === 401) {
        errorMessage = "Unauthorized access. Please verify your admin login credentials.";
      } else if (error.response?.status === 404) {
        errorMessage = "No societies available. Please add a society.";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error. Please contact the server admin.";
      }
      alert(`❌ ${errorMessage}`);
    }
  };

  const handleChange = (e) => {
    setNewSociety({ ...newSociety, [e.target.name]: e.target.value });
  };

  const addSociety = async () => {
    if (!newSociety.name || !newSociety.location || !newSociety.societyType) {
      alert("Please fill name, location, and society type.");
      return;
    }
    if (newSociety.societyType === "RowHouse" && !newSociety.totalHouses) {
      alert("Please fill total houses for RowHouse.");
      return;
    }
    if (
      newSociety.societyType === "Flat" &&
      (!newSociety.blocks || !newSociety.flatsPerFloor || !newSociety.floorsPerBlock)
    ) {
      alert("Please fill blocks, flats per floor, and floors per block for Flat.");
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
        response = await axios.put(
          `${BASE_URL}/api/societies/${editingSociety._id}`,
          {
            name: newSociety.name,
            location: newSociety.location,
            societyType: newSociety.societyType,
            blocks: newSociety.societyType === "Flat" ? newSociety.blocks : undefined,
            flatsPerFloor:
              newSociety.societyType === "Flat" ? parseInt(newSociety.flatsPerFloor, 10) : undefined,
            floorsPerBlock:
              newSociety.societyType === "Flat" ? parseInt(newSociety.floorsPerBlock, 10) : undefined,
            totalHouses:
              newSociety.societyType === "RowHouse" ? parseInt(newSociety.totalHouses, 10) : undefined,
            adminEmail,
          }
        );
        alert("✅ Society updated successfully!");
      } else {
        response = await axios.post(`${BASE_URL}/api/societies`, {
          name: newSociety.name,
          location: newSociety.location,
          societyType: newSociety.societyType,
          blocks: newSociety.societyType === "Flat" ? newSociety.blocks : undefined,
          flatsPerFloor:
            newSociety.societyType === "Flat" ? parseInt(newSociety.flatsPerFloor, 10) : undefined,
          floorsPerBlock:
            newSociety.societyType === "Flat" ? parseInt(newSociety.floorsPerBlock, 10) : undefined,
          totalHouses:
            newSociety.societyType === "RowHouse" ? parseInt(newSociety.totalHouses, 10) : undefined,
          adminEmail,
        });
        alert("✅ Society added successfully!");
      }
      fetchSocieties();
      resetForm();
    } catch (error) {
      console.error("Error saving society:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      alert(
        `❌ Failed to save society: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  const handleDeleteSociety = async (id) => {
    console.log("Deleting society with id:", id);
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this society?"
    );
    if (!confirmDelete) return;
    try {
      await axios.delete(`${BASE_URL}/api/societies/${id}`);
      setSocieties((prev) => prev.filter((society) => society._id !== id));
      alert("✅ Society deleted successfully!");
    } catch (error) {
      console.error("Error deleting society:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
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
      societyType: society.societyType,
      blocks: society.blocks ? society.blocks.join(", ") : "",
      flatsPerFloor: society.flatsPerFloor ? society.flatsPerFloor.toString() : "",
      floorsPerBlock: society.floorsPerBlock ? society.floorsPerBlock.toString() : "",
      totalHouses: society.totalHouses ? society.totalHouses.toString() : "",
    });
  };

  const resetForm = () => {
    setNewSociety({
      name: "",
      location: "",
      societyType: "",
      blocks: "",
      flatsPerFloor: "",
      floorsPerBlock: "",
      totalHouses: "",
    });
    setEditingSociety(null);
  };

  const toggleFlats = (societyId) => {
    setExpandedFlats((prev) => ({
      ...prev,
      [societyId]: !prev[societyId],
    }));
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
        <select
          name="societyType"
          value={newSociety.societyType}
          onChange={handleChange}
        >
          <option value="" disabled>Select Society Type</option>
          <option value="Flat">Flat</option>
          <option value="RowHouse">RowHouse</option>
        </select>
        {newSociety.societyType === "Flat" && (
          <>
            <input
              type="text"
              name="blocks"
              placeholder="Towers (e.g., A, B, C)"
              value={newSociety.blocks}
              onChange={handleChange}
            />
            <input
              type="number"
              name="flatsPerFloor"
              placeholder="Flats per Floor"
              value={newSociety.flatsPerFloor}
              onChange={handleChange}
            />
            <input
              type="number"
              name="floorsPerBlock"
              placeholder="Floors per Tower"
              value={newSociety.floorsPerBlock}
              onChange={handleChange}
            />
          </>
        )}
        {newSociety.societyType === "RowHouse" && (
          <input
            type="number"
            name="totalHouses"
            placeholder="Total Houses"
            value={newSociety.totalHouses}
            onChange={handleChange}
          />
        )}
        <button onClick={addSociety}>
          {editingSociety ? "Update Society" : "Add Society"}
        </button>
        {editingSociety && <button onClick={resetForm}>Cancel Edit</button>}
      </div>

      <div className="society-list">
        {societies.length > 0 ? (
          societies.map((society) => {
            const isExpanded = expandedFlats[society._id];
            const displayedFlats = isExpanded
              ? society.flats
              : society.flats.slice(0, 5);
            return (
              <div key={society._id} className="society-card">
                <h3><strong>Society:</strong> {society.name}</h3>
                <p><strong>Location:</strong> {society.location}</p>
                <p><strong>Society Type:</strong> {society.societyType}</p>
                {society.societyType === "Flat" && (
                  <>
                    <p><strong>Towers:</strong> {society.blocks?.join(", ") || "N/A"}</p>
                    <p><strong>Flats per Floor:</strong> {society.flatsPerFloor || "N/A"}</p>
                    <p><strong>Floors per Tower:</strong> {society.floorsPerBlock || "N/A"}</p>
                  </>
                )}
                {society.societyType === "RowHouse" && (
                  <p><strong>Total Houses:</strong> {society.totalHouses || "N/A"}</p>
                )}
                <p>
                  <strong>{society.societyType === "RowHouse" ? "Houses" : "Flats"}:</strong>{" "}
                  {displayedFlats.join(", ")}
                  {society.flats.length > 5 && !isExpanded && (
                    <span>
                      {" ... "}
                      <button
                        className="more-btn"
                        onClick={() => toggleFlats(society._id)}
                      >
                        More
                      </button>
                    </span>
                  )}
                  {isExpanded && (
                    <button
                      className="less-btn"
                      onClick={() => toggleFlats(society._id)}
                    >
                      Show Less
                    </button>
                  )}
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
            );
          })
        ) : (
          <p>No societies available.</p>
        )}
      </div>
    </div>
  );
};

export default SocietyManagement;