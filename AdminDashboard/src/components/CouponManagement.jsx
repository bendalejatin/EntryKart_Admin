// File: CouponManagement.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./styles/CouponManagement.css";

//const BASE_URL = "http://localhost:5000"; // Adjust this to your backend URL
const BASE_URL = "https://entrykart-admin.onrender.com" ; // deployment url

const CouponManagement = () => {
  const storedAdminEmail = localStorage.getItem("adminEmail");
  const adminEmail = storedAdminEmail ? storedAdminEmail : "admin@example.com";

  const [societies, setSocieties] = useState([]);
  const [flats, setFlats] = useState([]);
  const [users, setUsers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [selectedSociety, setSelectedSociety] = useState("");
  const [selectedFlat, setSelectedFlat] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [code, setCode] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [generateForAll, setGenerateForAll] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);

  // --- Added Pagination States ---
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(coupons.length / itemsPerPage);
  const visibleCoupons = coupons.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const navigate = useNavigate();

  useEffect(() => {
    fetchSocieties();
    fetchEvents();
    fetchUsers();
    fetchCoupons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSocieties = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/api/societies?email=${adminEmail}`
      );
      setSocieties(response.data);
    } catch (error) {
      console.error("Error fetching societies:", error);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/api/events?email=${adminEmail}`
      );
      setEvents(response.data);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/api/users?email=${adminEmail}`
      );
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchCoupons = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/api/coupons?email=${adminEmail}`
      );
      setCoupons(response.data);
      // Reset pagination when new coupons are fetched.
      setCurrentPage(0);
    } catch (error) {
      console.error("Error fetching coupons:", error);
    }
  };

  const handleSocietyChange = (societyId) => {
    setSelectedSociety(societyId);
    const society = societies.find((soc) => soc._id === societyId);
    setFlats(society ? society.flats : []);
    setSelectedFlat("");
    setSelectedUser("");
  };

  const handleFlatChange = (flatNo) => {
    setSelectedFlat(flatNo);
    const user = users.find(
      (user) =>
        user.flatNumber === flatNo &&
        user.society &&
        user.society._id === selectedSociety
    );
    setSelectedUser(user ? user.name : "");
  };

  const handleEventChange = (e) => {
    const eventId = e.target.value;
    setSelectedEvent(eventId);
    const eventObj = events.find((event) => event._id === eventId);
    if (eventObj && eventObj.date) {
      // Convert the event date to YYYY-MM-DD format
      const eventDate = new Date(eventObj.date);
      if (!isNaN(eventDate)) {
        const formattedDate = eventDate.toISOString().split("T")[0];
        setExpiryDate(formattedDate);
      } else {
        setExpiryDate("");
      }
    } else {
      setExpiryDate("");
    }
  };

  const handleCouponSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSociety || !selectedEvent || !code || !expiryDate) {
      alert("⚠️ Please fill all required fields.");
      return;
    }
    // For non generateForAll, ensure that selectedUser is not an empty string.
    if (!generateForAll && (!selectedFlat || !selectedUser.trim())) {
      alert("⚠️ Please select a flat and ensure user details are available.");
      return;
    }
    try {
      let payload = {
        societyId: selectedSociety,
        code,
        expiryDate,
        eventId: selectedEvent,
        adminEmail,
      };
      if (generateForAll) {
        payload.generateForAllFlats = true;
        payload.flats = flats;
      } else {
        payload.flatNo = selectedFlat;
        payload.userName = selectedUser;
      }
      if (editingCoupon) {
        const response = await axios.put(
          `${BASE_URL}/api/coupons/${editingCoupon._id}`,
          payload
        );
        alert("✅ Coupon Updated Successfully!");
        setCoupons(
          coupons.map((coupon) =>
            coupon._id === editingCoupon._id ? response.data : coupon
          )
        );
        setEditingCoupon(null);
      } else {
        const response = await axios.post(`${BASE_URL}/api/coupons`, payload);
        alert("✅ Coupon Created Successfully!");
        if (Array.isArray(response.data))
          setCoupons([...coupons, ...response.data]);
        else setCoupons([...coupons, response.data]);
      }
      resetForm();
    } catch (error) {
      console.error(
        "❌ Error saving coupon:",
        error.response?.data || error.message
      );
      alert(
        `❌ Failed to save coupon: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) return;
    try {
      await axios.delete(`${BASE_URL}/api/coupons/${id}`);
      setCoupons(coupons.filter((coupon) => coupon._id !== id));
    } catch (error) {
      console.error("Error deleting coupon:", error);
    }
  };

  const handleEditCoupon = (coupon) => {
    setEditingCoupon(coupon);
    setSelectedSociety(coupon.society?._id || "");
    // Attempt to find the society in our list if coupon.society isn't populated
    const societyId =
      coupon.society && coupon.society._id
        ? coupon.society._id
        : coupon.society;
    const selectedSoc = societies.find((soc) => soc._id === societyId);
    setFlats(selectedSoc ? selectedSoc.flats : []);
    setSelectedFlat(coupon.flatNo);
    setSelectedUser(coupon.userName);
    setCode(coupon.code);
    setExpiryDate(coupon.expiryDate);
    setSelectedEvent(coupon.event?._id || "");
    setGenerateForAll(false);
  };

  // Manual scan: navigate to the manual QRScanner (coupon status remains active)
  const handleScanCoupon = (coupon) => {
    navigate(`/qrscanner?couponCode=${coupon.code}`);
  };

  const resetForm = () => {
    setSelectedSociety("");
    setFlats([]);
    setSelectedFlat("");
    setSelectedUser("");
    setCode("");
    setExpiryDate("");
    setSelectedEvent("");
    setEditingCoupon(null);
    setGenerateForAll(false);
  };

  // --- Pagination Handlers ---
  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="coupon-management">
      <h2>🎟️ Coupon Management</h2>
      <form className="coupon-form" onSubmit={handleCouponSubmit}>
        <label>Society:</label>
        <select
          value={selectedSociety}
          onChange={(e) => handleSocietyChange(e.target.value)}
        >
          <option value="">Select Society</option>
          {societies.map((society) => (
            <option key={society._id} value={society._id}>
              {society.name}
            </option>
          ))}
        </select>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={generateForAll}
            onChange={(e) => setGenerateForAll(e.target.checked)}
          />
          <span className="checkbox-text">Generate for All Flats</span>
        </label>

        {!generateForAll && (
          <>
            <label>Flat:</label>
            <select
              value={selectedFlat}
              onChange={(e) => handleFlatChange(e.target.value)}
              disabled={!selectedSociety}
            >
              <option value="">Select Flat</option>
              {flats.map((flat) => (
                <option key={flat} value={flat}>
                  {flat}
                </option>
              ))}
            </select>
            <label>User Name:</label>
            <input type="text" value={selectedUser} readOnly />
          </>
        )}

        <label>Coupon Code:</label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />

        <label>Event:</label>
        <select value={selectedEvent} onChange={handleEventChange} required>
          <option value="">Select Event</option>
          {events.map((event) => (
            <option key={event._id} value={event._id}>
              {event.title}
            </option>
          ))}
        </select>

        <label>Expiry Date (from Event):</label>
        <input type="date" value={expiryDate} readOnly required />

        <button type="submit">
          {editingCoupon ? "Update Coupon" : "Create Coupon"}
        </button>
        {editingCoupon && (
          <button type="button" onClick={resetForm}>
            Cancel Edit
          </button>
        )}
      </form>

      <div className="coupon-list">
        <h2>Existing Coupons</h2>
        {coupons.length === 0 ? (
          <p>No coupons found for {adminEmail}.</p>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>User Name</th>
                    <th>Flat No</th>
                    <th>Society</th>
                    <th>Event</th>
                    <th>Expiry Date</th>
                    <th>QR Code</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleCoupons.map((coupon) => (
                    <tr key={coupon._id}>
                      <td>{coupon.code}</td>
                      <td>{coupon.userName}</td>
                      <td>{coupon.flatNo}</td>
                      <td>
                        {coupon.society && coupon.society.name
                          ? coupon.society.name
                          : societies.find((soc) => soc._id === coupon.society)
                              ?.name || "N/A"}
                      </td>
                      <td>
                        {coupon.event && coupon.event.title
                          ? coupon.event.title
                          : events.find((ev) => ev._id === coupon.event)
                              ?.title || "N/A"}
                      </td>
                      <td>{coupon.expiryDate}</td>
                      <td>
                        {coupon.qrCode ? (
                          <img
                            src={coupon.qrCode}
                            alt="QR Code"
                            style={{ width: "80px" }}
                          />
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td>{coupon.status}</td>
                      <td>
                        <button
                          className="edit-btn"
                          onClick={() => handleEditCoupon(coupon)}
                        >
                          Edit
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDeleteCoupon(coupon._id)}
                        >
                          Delete
                        </button>
                        <button
                          className="scan-btn"
                          onClick={() => handleScanCoupon(coupon)}
                        >
                          🔍 Manual Scan
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* --- Pagination Controls --- */}
            <div className="pagination">
              <button onClick={handlePrevPage} disabled={currentPage === 0}>
                {"<"}
              </button>
              <span>
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage >= totalPages - 1}
              >
                {">"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CouponManagement;
