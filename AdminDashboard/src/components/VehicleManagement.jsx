import React, { useState, useEffect } from "react";
import axios from "axios";
import "./styles/VehicleManagement.css";

// const BASE_URL = "http://localhost:5000";
const BASE_URL = "https://entrykart-admin.onrender.com" ;

const VehicleManagement = () => {
  const [vehicles, setVehicles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editVehicle, setEditVehicle] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      handleSearch();
    }, 300); // Debounce for 300ms to avoid excessive API calls

    return () => clearTimeout(delayDebounceFn); // Cleanup on unmount or searchTerm change
  }, [searchTerm]);

  const fetchVehicles = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/vehicles`);
      setVehicles(response.data);
      setError("");
    } catch (err) {
      setError("Failed to fetch vehicles.");
    }
  };

  const handleSearch = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/vehicles/search`, {
        params: { query: searchTerm },
      });
      setVehicles(response.data);
      setError("");
    } catch (err) {
      setError("No vehicles found for this search term.");
    }
  };

  const handleEdit = (vehicle) => {
    setEditVehicle(vehicle);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`${BASE_URL}/api/vehicles/${editVehicle._id}`, editVehicle, {
        headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
      });
      setVehicles(vehicles.map((v) => (v._id === editVehicle._id ? response.data : v)));
      setEditVehicle(null);
      setError("");
    } catch (err) {
      setError("Failed to update vehicle.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this vehicle?")) return;
    try {
      await axios.delete(`${BASE_URL}/api/vehicles/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
      });
      setVehicles(vehicles.filter((v) => v._id !== id));
      setError("");
    } catch (err) {
      setError("Failed to delete vehicle.");
    }
  };

  return (
    <div className="vehicle-management-container">
      <h1>Vehicle Management</h1>
      {error && <p className="error-message">{error}</p>}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by flat number, owner name, or vehicle name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      {editVehicle && (
        <form onSubmit={handleUpdate} className="edit-vehicle-form">
          <input
            type="text"
            value={editVehicle.ownerName}
            onChange={(e) => setEditVehicle({ ...editVehicle, ownerName: e.target.value })}
            placeholder="Owner Name"
            required
          />
          <input
            type="text"
            value={editVehicle.flatNumber}
            onChange={(e) => setEditVehicle({ ...editVehicle, flatNumber: e.target.value })}
            placeholder="Flat Number"
            required
          />
          <select
            value={editVehicle.vehicleType}
            onChange={(e) => setEditVehicle({ ...editVehicle, vehicleType: e.target.value })}
            required
          >
            <option value="bike">Bike</option>
            <option value="car">Car</option>
          </select>
          <input
            type="text"
            value={editVehicle.vehicleName}
            onChange={(e) => setEditVehicle({ ...editVehicle, vehicleName: e.target.value })}
            placeholder="Vehicle Name"
            required
          />
          <input
            type="text"
            value={editVehicle.numberPlate}
            onChange={(e) => setEditVehicle({ ...editVehicle, numberPlate: e.target.value })}
            placeholder="Number Plate (e.g., MH12AB1234)"
            required
          />
          <button type="submit">Update</button>
          <button type="button" onClick={() => setEditVehicle(null)}>Cancel</button>
        </form>
      )}
      <div className="vehicle-list">
        {vehicles.map((vehicle) => (
          <div key={vehicle._id} className="vehicle-item">
            <p><strong>Owner:</strong> {vehicle.ownerName}</p>
            <p><strong>Flat:</strong> {vehicle.flatNumber}</p>
            <p><strong>Type:</strong> {vehicle.vehicleType}</p>
            <p><strong>Name:</strong> {vehicle.vehicleName}</p>
            <p><strong>Number Plate:</strong> {vehicle.numberPlate}</p>
            <div className="vehicle-actions">
              <button onClick={() => handleEdit(vehicle)}>Edit</button>
              <button onClick={() => handleDelete(vehicle._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VehicleManagement;