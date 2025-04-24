import React, { useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../components/styles/EntryPermissionForm.css";

//const BASE_URL = "http://localhost:5000"; // Adjust this to your backend URL
const BASE_URL = "https://dec-entrykart-backend.onrender.com" ; // deployment url

const EntryPermissionForm = () => {
  const [entries, setEntries] = useState([]);
  const [name, setName] = useState("");
  const [societies, setSocieties] = useState([]);
  const [selectedSociety, setSelectedSociety] = useState("");
  const [flats, setFlats] = useState([]);
  const [flatNumber, setFlatNumber] = useState("");
  const [email, setEmail] = useState("");
  const [users, setUsers] = useState([]);
  const [dateTime, setDateTime] = useState("");
  const [description, setDescription] = useState("");
  const [additionalDateTime, setAdditionalDateTime] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [visitorType, setVisitorType] = useState("");
  const [status, setStatus] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");

  const adminEmail = localStorage.getItem("adminEmail");

  // Fetch data on component mount
  useEffect(() => {
    fetchEntries();
    fetchSocieties();
    fetchUsers();
    checkExpiringPermissions();
  }, []);

  const fetchEntries = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/entries?email=${adminEmail}`);
      setEntries(res.data);
    } catch (error) {
      console.error("Error fetching entries:", error);
    }
  };

  const fetchSocieties = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/societies?email=${adminEmail}`);
      setSocieties(response.data);
    } catch (error) {
      console.error("Error fetching societies:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/users?email=${adminEmail}`);
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const checkExpiringPermissions = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/entries/expiring-soon`);
      if (res.data.length > 0) {
        res.data.forEach((entry) => {
          toast.warn(`Permission for ${entry.name} is expiring soon!`);
        });
      }
    } catch (error) {
      console.error("Error checking expiring permissions:", error);
    }
  };

  const handleSocietyChange = (societyId) => {
    setSelectedSociety(societyId);
    const society = societies.find((soc) => soc._id === societyId);
    setFlats(society ? society.flats : []);
    setFlatNumber("");
    setEmail("");
  };

  const handleFlatChange = (flatNo) => {
    setFlatNumber(flatNo);
    const user = users.find(
      (user) =>
        user.flatNumber === flatNo &&
        user.society &&
        user.society._id === selectedSociety
    );
    setEmail(user ? user.email : "");
  };

  const handleSave = async () => {
    if (!name || !selectedSociety || !flatNumber || !dateTime || !description || !additionalDateTime || !visitorType || !status) {
      toast.error("All fields are required");
      return;
    }

    const expirationDate = new Date(dateTime);
    expirationDate.setDate(expirationDate.getDate() + 7);

    if (!adminEmail) {
      toast.error("Admin email is missing. Please log in.");
      return;
    }

    try {
      const payload = {
        name,
        flatNumber,
        dateTime,
        description,
        additionalDateTime,
        expirationDateTime: expirationDate,
        adminEmail,
        visitorType,
        status,
        societyId: selectedSociety,
        email,
      };

      if (editingId) {
        await axios.put(`${BASE_URL}/api/entries/${editingId}`, payload);
        setEntries(
          entries.map((entry) =>
            entry._id === editingId ? { ...entry, ...payload } : entry
          )
        );
        toast.success("Entry updated successfully!");
        setEditingId(null);
      } else {
        const res = await axios.post(`${BASE_URL}/api/entries`, payload);
        setEntries([...entries, res.data]);
        toast.success("Entry added successfully!");
      }
      resetForm();
    } catch (error) {
      console.error("Error saving entry:", error);
      toast.error("Error saving entry");
    }
  };

  // Helper function to extract society ID from string or object
  const getSocietyId = (societyId) => {
    return typeof societyId === "string" ? societyId : societyId?._id || "";
  };

  const handleEdit = (entry) => {
    const societyId = getSocietyId(entry.societyId);
    setName(entry.name);
    setSelectedSociety(societyId);
    const society = societies.find((soc) => soc._id === societyId);
    setFlats(society ? society.flats : []);
    setFlatNumber(entry.flatNumber);
    setEmail(entry.email || "");
    setDateTime(entry.dateTime);
    setVisitorType(entry.visitorType || "");
    setStatus(entry.status || "pending");
    setDescription(entry.description);
    setAdditionalDateTime(entry.additionalDateTime);
    setEditingId(entry._id);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${BASE_URL}/api/entries/${id}`);
      setEntries(entries.filter((entry) => entry._id !== id));
      toast.success("Entry deleted successfully!");
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast.error("Error deleting entry");
    }
  };

  const resetForm = () => {
    setName("");
    setSelectedSociety("");
    setFlats([]);
    setFlatNumber("");
    setEmail("");
    setVisitorType("");
    setStatus("pending");
    setDateTime("");
    setDescription("");
    setAdditionalDateTime("");
    setEditingId(null);
  };

  const filteredEntries = entries.filter(
    (entry) =>
      entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.flatNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container">
      <h2 className="title">Entry Permission Form</h2>
      <div className="form-group">
        <h3>Name:</h3>
        <input
          type="text"
          placeholder="Enter Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-field"
        />

        <h3>Society:</h3>
        <select
          value={selectedSociety}
          onChange={(e) => handleSocietyChange(e.target.value)}
          className="input-field"
        >
          <option value="">Select Society</option>
          {societies.map((society) => (
            <option key={society._id} value={society._id}>
              {society.name}
            </option>
          ))}
        </select>

        <h3>Flat Number:</h3>
        <select
          value={flatNumber}
          onChange={(e) => handleFlatChange(e.target.value)}
          disabled={!selectedSociety}
          className="input-field"
        >
          <option value="">Select Flat</option>
          {flats.map((flat) => (
            <option key={flat} value={flat}>
              {flat}
            </option>
          ))}
        </select>

        <h3>Email:</h3>
        <input
          type="email"
          value={email}
          readOnly
          className="input-field"
        />

        <h3>Visitor Type:</h3>
        <select
          value={visitorType}
          onChange={(e) => setVisitorType(e.target.value)}
          className="input-field"
          required
        >
          <option value="">Select Visitor Type</option>
          <option value="Guest">Guest</option>
          <option value="Swiggy/Zomato">Swiggy/Zomato</option>
          <option value="Maid">Maid</option>
          <option value="Other">Other</option>
        </select>

        <h3>Status:</h3>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="input-field"
          required
        >
          <option value="pending">Pending</option>
          <option value="allow">Allow</option>
          <option value="deny">Deny</option>
        </select>

        <h3>Date & Time:</h3>
        <input
          type="datetime-local"
          value={dateTime}
          onChange={(e) => setDateTime(e.target.value)}
          className="input-field"
        />

        <h3>Description:</h3>
        <textarea
          placeholder="Enter Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="textarea-field"
        />

        <h3>Expiry Date & Time:</h3>
        <input
          type="datetime-local"
          value={additionalDateTime}
          onChange={(e) => setAdditionalDateTime(e.target.value)}
          className="input-field"
        />

        <button className="btn add-btn" onClick={handleSave}>
          {editingId ? "Update Entry" : "Add Entry"}
        </button>
        {editingId && (
          <button className="btn" onClick={resetForm}>
            Cancel Edit
          </button>
        )}
      </div>

      <h2 className="sub-title">Entries</h2>
      <input
        type="text"
        placeholder="Search"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="input-field"
      />
      <div className="entries-list">
        {filteredEntries.map((entry) => (
          <div key={entry._id} className="entry">
            <div className="entry-text">
              <p>
                <strong>Name:</strong> {entry.name}
              </p>
              <p>
                <strong>Society:</strong>{" "}
                {societies.find((soc) => soc._id === getSocietyId(entry.societyId))?.name || ""}
              </p>
              <p>
                <strong>Flat Number:</strong> {entry.flatNumber}
              </p>
              <p>
                <strong>Email:</strong> {entry.email || "N/A"}
              </p>
              <p>
                <strong>Visitor Type:</strong> {entry.visitorType}
              </p>
              <p>
                <strong>Status:</strong> {entry.status}
              </p>
              <p>
                <strong>Date & Time:</strong>{" "}
                {new Date(entry.dateTime).toLocaleString()}
              </p>
              <p>
                <strong>Description:</strong> {entry.description}
              </p>
              <p>
                <strong>Expiry Date & Time:</strong>{" "}
                {new Date(entry.additionalDateTime).toLocaleString()}
              </p>
              <div className="buttons">
                <button
                  className="btn edit-btn"
                  onClick={() => handleEdit(entry)}
                >
                  Edit
                </button>
                <button
                  className="btn delete-btn"
                  onClick={() => handleDelete(entry._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ToastContainer />
    </div>
  );
};

export default EntryPermissionForm;