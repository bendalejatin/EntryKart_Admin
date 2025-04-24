import React, { useState, useEffect } from "react";
import axios from "axios";
import "./styles/EventManagement.css";

//const BASE_URL = "http://localhost:5000"; // Adjust this to your backend URL
const BASE_URL = "https://dec-entrykart-backend.onrender.com" ; // deployment url

const EventManagement = () => {
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    image: "",
    societyName: "",
  });
  const [editingEvent, setEditingEvent] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [error, setError] = useState("");
  const [societies, setSocieties] = useState([]);
  const [selectedSociety, setSelectedSociety] = useState("");

  const adminEmail = localStorage.getItem("adminEmail") || "dec@gmail.com";

  useEffect(() => {
    fetchEvents();
    fetchSocieties();
  }, []);

  const fetchEvents = async () => {
    try {
      console.log("Fetching events for:", adminEmail);
      const response = await axios.get(`${BASE_URL}/api/events?email=${adminEmail}`);
      setEvents(response.data);
      setError("");
    } catch (error) {
      console.error("Error fetching events:", error);
      setError(`Failed to fetch events: ${error.response?.data?.message || error.message}`);
    }
  };

  const fetchSocieties = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/societies?email=${adminEmail}`);
      setSocieties(response.data);
    } catch (error) {
      console.error("Error fetching societies:", error);
      setError(`Failed to fetch societies: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleChange = (e) => {
    setNewEvent({ ...newEvent, [e.target.name]: e.target.value });
  };

  const handleSocietyChange = (e) => {
    const societyName = e.target.value;
    setSelectedSociety(societyName);
    setNewEvent({ ...newEvent, societyName });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 500 * 1024) {
        setError("Image size must be less than 500KB to avoid payload limits.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewEvent({ ...newEvent, image: reader.result });
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const addEvent = async () => {
    if (!adminEmail) {
      setError("Admin email is not set. Please log in.");
      return;
    }
    if (
      !newEvent.title ||
      !newEvent.description ||
      !newEvent.date ||
      !newEvent.time ||
      !newEvent.location ||
      !newEvent.societyName
    ) {
      setError(
        "Please fill all required fields (title, description, date, time, location, society name)."
      );
      return;
    }
    try {
      console.log("Sending event data:", { ...newEvent, adminEmail });
      const response = await axios.post(`${BASE_URL}/api/events`, {
        ...newEvent,
        adminEmail,
      });
      setEvents([...events, response.data]);
      setNewEvent({
        title: "",
        description: "",
        date: "",
        time: "",
        location: "",
        image: "",
        societyName: "",
      });
      setSelectedSociety("");
      setImagePreview("");
      setError("");
      alert("✅ Event added successfully!");
    } catch (error) {
      console.error("Error adding event:", error);
      setError(`Failed to add event: ${error.response?.data?.message || error.message}`);
    }
  };

  const deleteEvent = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this event?");
    if (!confirmDelete) return;
    try {
      console.log(`Deleting event with ID: ${id}`);
      await axios.delete(`${BASE_URL}/api/events/${id}`);
      setEvents(events.filter((event) => event._id !== id));
      setError("");
      alert("✅ Event deleted successfully!");
    } catch (error) {
      console.error("Error deleting event:", error);
      setError(`Failed to delete event: ${error.response?.data?.message || error.message}`);
    }
  };

  const editEvent = (event) => {
    console.log("Editing event:", event);
    setEditingEvent(event);
    setSelectedSociety(event.societyName);
    setNewEvent({
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      location: event.location,
      image: event.image || "",
      societyName: event.societyName,
    });
    setImagePreview(event.image || "https://via.placeholder.com/300");
    setError("");
  };

  const updateEvent = async () => {
    if (!editingEvent) {
      setError("No event selected for update.");
      return;
    }
    if (
      !newEvent.title ||
      !newEvent.description ||
      !newEvent.date ||
      !newEvent.time ||
      !newEvent.location ||
      !newEvent.societyName
    ) {
      setError(
        "Please fill all required fields (title, description, date, time, location, society name)."
      );
      return;
    }
    try {
      console.log("Updating event with ID:", editingEvent._id, "Data:", newEvent);
      const response = await axios.put(`${BASE_URL}/api/events/${editingEvent._id}`, newEvent);
      setEvents(events.map((event) => (event._id === editingEvent._id ? response.data : event)));
      setNewEvent({
        title: "",
        description: "",
        date: "",
        time: "",
        location: "",
        image: "",
        societyName: "",
      });
      setSelectedSociety("");
      setImagePreview("");
      setEditingEvent(null);
      setError("");
      alert("✅ Event updated successfully!");
    } catch (error) {
      console.error("Error updating event:", error);
      setError(`Failed to update event: ${error.response?.data?.message || error.message}`);
    }
  };

  const resetForm = () => {
    setNewEvent({
      title: "",
      description: "",
      date: "",
      time: "",
      location: "",
      image: "",
      societyName: "",
    });
    setSelectedSociety("");
    setImagePreview("");
    setEditingEvent(null);
    setError("");
  };

  return (
    <div className="event-management">
      <h2>📅 Event Management</h2>
      {error && <p className="error-message">{error}</p>}
      <div className="event-form">
        <input
          type="text"
          name="title"
          placeholder="Event Title"
          value={newEvent.title}
          onChange={handleChange}
        />
        <textarea
          name="description"
          placeholder="Description"
          value={newEvent.description}
          onChange={handleChange}
        ></textarea>
        <input
          type="date"
          name="date"
          value={newEvent.date}
          onChange={handleChange}
        />
        <input
          type="time"
          name="time"
          value={newEvent.time}
          onChange={handleChange}
        />
        <input
          type="text"
          name="location"
          placeholder="Location"
          value={newEvent.location}
          onChange={handleChange}
        />
        <select
          name="societyName"
          value={selectedSociety}
          onChange={handleSocietyChange}
        >
          <option value="">Select Society</option>
          {societies.map((society) => (
            <option key={society._id} value={society.name}>
              {society.name}
            </option>
          ))}
        </select>
        <input
          type="file"
          name="image"
          accept="image/*"
          onChange={handleImageChange}
        />
        {imagePreview && (
          <img
            src={imagePreview}
            alt="Event Preview"
            style={{ maxWidth: "200px", marginTop: "10px" }}
          />
        )}
        {editingEvent ? (
          <>
            <button onClick={updateEvent}>Update Event</button>
            <button onClick={resetForm}>Cancel Edit</button>
          </>
        ) : (
          <button onClick={addEvent}>Add Event</button>
        )}
      </div>
      <div className="event-list">
        {events.length > 0 ? (
          events.map((event) => (
            <div key={event._id} className="event-card">
              <h3>{event.title}</h3>
              <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
              <p><strong>Time:</strong> {event.time}</p>
              <p><strong>Location:</strong> {event.location}</p>
              <p><strong>Society Name:</strong> {event.societyName}</p>
              <p><strong>Description:</strong> {event.description}</p>
              {event.image && (
                <img
                  src={event.image}
                  alt={event.title}
                  style={{ maxWidth: "100%", marginTop: "10px" }}
                />
              )}
              <div className="button-container">
                <button className="edit-btn" onClick={() => editEvent(event)}>
                  Edit
                </button>
                <button className="delete-btn" onClick={() => deleteEvent(event._id)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>No events available.</p>
        )}
      </div>
    </div>
  );
};

export default EventManagement;