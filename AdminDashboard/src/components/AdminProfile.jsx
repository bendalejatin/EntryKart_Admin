import React, { useState, useEffect } from "react";
import axios from "axios";
import "./styles/AdminProfile.css";

//const BASE_URL = "http://localhost:5000"; // Adjust this to your backend URL
const BASE_URL = "https://entrykart-admin.onrender.com" ; // deployment url

const AdminProfile = () => {
  const [admin, setAdmin] = useState({
    name: "",
    email: "",
    phone: "",
    role: "Administrator",
    image: "https://dummyimage.com/200x200/ccc/000&text=Admin",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [imagePreview, setImagePreview] = useState(admin.image);
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const adminEmail = localStorage.getItem("adminEmail");
        if (!adminEmail) {
          alert("No admin email found. Please log in.");
          window.location.href = "/admin/login";
          return;
        }

        const response = await axios.get(`${BASE_URL}/api/auth/profile?email=${adminEmail}`);
        setAdmin((prevAdmin) => ({
          ...prevAdmin,
          ...response.data,
          image: response.data.image || prevAdmin.image,
        }));
        setImagePreview(response.data.image || "https://dummyimage.com/200x200/ccc/000&text=Admin");
      } catch (error) {
        console.error("Error fetching admin profile:", error);
        alert("Failed to fetch profile. Please try again.");
      }
    };

    fetchAdminData();
  }, []);

  // Handle Image Upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Preview image
      const imageURL = URL.createObjectURL(file);
      setImagePreview(imageURL);
      setImageFile(file);
    }
  };

  // Convert image to Base64
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle Profile Update
  const handleSave = async () => {
    try {
      const adminEmail = localStorage.getItem("adminEmail");
      if (!adminEmail) {
        alert("❌ No admin email found. Please log in again.");
        window.location.href = "/admin/login";
        return;
      }

      let imageBase64 = admin.image;
      if (imageFile) {
        imageBase64 = await convertToBase64(imageFile);
      }

      const updatedAdmin = { ...admin, image: imageBase64, email: adminEmail };
      const response = await axios.put(`${BASE_URL}/api/auth/update`, updatedAdmin);

      setAdmin((prevAdmin) => ({
        ...prevAdmin,
        ...response.data.admin,
      }));
      setImagePreview(response.data.admin.image);
      setImageFile(null);
      setIsEditing(false);
      alert("✅ Profile updated successfully!");
    } catch (error) {
      console.error("Error updating admin profile:", error);
      alert(`❌ Failed to update profile: ${error.response?.data?.message || error.message}`);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem("adminEmail");
    localStorage.removeItem("adminToken");
    alert("🔒 You have been logged out.");
    window.location.href = "/admin/login";
  };

  return (
    <div className="profile-container">
      <div className="profile-card">
        {/* Profile Image */}
        <div className="profile-image">
          <img src={imagePreview} alt="Admin Profile" />
          {isEditing && <input type="file" accept="image/*" onChange={handleImageChange} />}
        </div>

        {/* Profile Details */}
        <div className="profile-details">
          {isEditing ? (
            <>
              <input
                type="text"
                value={admin.name}
                onChange={(e) => setAdmin({ ...admin, name: e.target.value })}
              />
              <input
                type="email"
                value={admin.email}
                onChange={(e) => setAdmin({ ...admin, email: e.target.value })}
              />
              <input
                type="tel"
                value={admin.phone}
                onChange={(e) => setAdmin({ ...admin, phone: e.target.value })}
              />
              <input type="text" value={admin.role} readOnly />
              <button className="save-button" onClick={handleSave}>
                Save
              </button>
              <button className="cancel-button" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <h2 className="profile-name">{admin.name}</h2>
              <p className="profile-email">📧 {admin.email}</p>
              <p className="profile-phone">📞 {admin.phone}</p>
              <p className="profile-role">
                👨‍💼 Role: <strong>{admin.role}</strong>
              </p>
              <button className="edit-button" onClick={() => setIsEditing(true)}>
                Edit Profile
              </button>
              <button className="logout-button" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;