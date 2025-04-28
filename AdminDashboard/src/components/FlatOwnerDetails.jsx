import React, { useState, useEffect } from "react";
import axios from "axios";
import "./styles/FlatOwnerDetails.css";

//const BASE_URL = "http://localhost:5000"; // Adjust this to your backend URL
const BASE_URL = "https://dec-entrykart-backend.onrender.com" ; // deployment url

const FlatOwnerDetails = () => {
  const [societies, setSocieties] = useState([]);
  const [flatNumbers, setFlatNumbers] = useState([]);
  const [selectedSociety, setSelectedSociety] = useState("");
  const [selectedFlat, setSelectedFlat] = useState("");
  const [ownerDetails, setOwnerDetails] = useState(null);
  const [isEditingOwner, setIsEditingOwner] = useState(false);
  const [flats, setFlats] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [ownerForm, setOwnerForm] = useState({
    ownerName: "",
    profession: "",
    contact: "",
    email: "",
  });
  const [familyMember, setFamilyMember] = useState({
    name: "",
    relation: "",
    age: "",
    profession: "",
    contact: "",
  });
  const [editIndex, setEditIndex] = useState(null);
  const [flatOwners, setFlatOwners] = useState([]);
  const [ownerCount, setOwnerCount] = useState(0);

  const adminEmail = localStorage.getItem("adminEmail");

  useEffect(() => {
      fetchSocieties();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

  const fetchSocieties = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/societies?email=${adminEmail}`);
      setSocieties(response.data);
    } catch (error) {
      console.error("Error fetching societies:", error);
    }
  };

  // // Fetch societies on mount
  // useEffect(() => {
  //   axios.get("http://localhost:5000/api/flats/societies")
  //     .then(response => setSocieties(response.data))
  //     .catch(error => console.error("Error fetching societies:", error));
  // }, []);

  // Fetch flats when a society is selected
  useEffect(() => {
    if (selectedSociety) {
      axios.get(`${BASE_URL}/api/flats/flats/${selectedSociety}`)
        .then(response => setFlatNumbers(response.data))
        .catch(error => console.error("Error fetching flats:", error));
    }
  }, [selectedSociety]);

  // Fetch owner details when society and flat are selected
  useEffect(() => {
    if (selectedSociety && selectedFlat) {
      axios.get(`${BASE_URL}/api/flats/owner/${selectedSociety}/${selectedFlat}`)
        .then(response => {
          setOwnerDetails(response.data);
          setOwnerForm({
            ownerName: response.data.ownerName || "",
            profession: response.data.profession || "",
            contact: response.data.contact || "",
            email: response.data.email || "",
          });
        })
        .catch(error => {
          if (error.response && error.response.status === 404) {
            setOwnerDetails(null);
            setOwnerForm({ ownerName: "", profession: "", contact: "", email: "" });
          } else {
            console.error("Error fetching owner details:", error);
          }
        });
    }
  }, [selectedSociety, selectedFlat]);

  // Fetch all flat owner records and count for dashboard
  const fetchFlatOwners = () => {
    axios.get(`${BASE_URL}/api/flats/all?email=${adminEmail}`)
      .then(response => setFlatOwners(response.data))
      .catch(error => console.error("Error fetching flat owners:", error));

    axios.get(`${BASE_URL}/api/flats/count?email=${adminEmail}`)
      .then(response => setOwnerCount(response.data.count))
      .catch(error => console.error("Error fetching owner count:", error));
  };

  useEffect(() => {
    fetchFlatOwners();
  }, []);

  // Handle changes in the owner form
  const handleOwnerChange = (e) => {
    const { name, value } = e.target;
    setOwnerForm(prev => ({ ...prev, [name]: value }));
  };

  // Create or update owner details
  const handleOwnerSubmit = () => {
    const payload = {
      societyName: selectedSociety,
      flatNumber: selectedFlat,
      ownerName: ownerForm.ownerName,
      profession: ownerForm.profession,
      contact: ownerForm.contact,
      email: ownerForm.email,
      adminEmail: adminEmail
    };
    if (ownerDetails && ownerDetails._id) {
      axios.put(`${BASE_URL}/api/flats/owner/${ownerDetails._id}/update`, payload)
        .then(response => {
          setOwnerDetails(response.data);
          setIsEditingOwner(false);
          fetchFlatOwners();
        })
        .catch(error => console.error("Error updating owner details:", error));
    } else {
      axios.post(`${BASE_URL}/api/flats/owner`, payload)
        .then(response => {
          setOwnerDetails(response.data);
          fetchFlatOwners();
        })
        .catch(error => console.error("Error creating owner:", error));
    }
  };

  // Family member change handler
  const handleFamilyMemberChange = (e) => {
    const { name, value } = e.target;
    setFamilyMember(prev => ({ ...prev, [name]: value }));
  };

  // Add or edit a family member
  const handleFamilyMemberSubmit = (e) => {
    e.preventDefault();
    if (!ownerDetails || !ownerDetails._id) return;
    if (editIndex !== null) {
      axios.put(`${BASE_URL}/api/flats/owner/${ownerDetails._id}/edit-family/${editIndex}`, familyMember)
        .then(response => {
          setOwnerDetails(response.data);
          setFamilyMember({ name: "", relation: "", age: "", profession: "", contact: "" });
          setEditIndex(null);
          fetchFlatOwners();
        })
        .catch(error => console.error("Error updating family member:", error));
    } else {
      axios.put(`${BASE_URL}/api/flats/owner/${ownerDetails._id}/add-family`, familyMember)
        .then(response => {
          setOwnerDetails(response.data);
          setFamilyMember({ name: "", relation: "", age: "", profession: "", contact: "" });
          fetchFlatOwners();
        })
        .catch(error => console.error("Error adding family member:", error));
    }
  };

  const handleEditFamilyMember = (index) => {
    const member = ownerDetails.familyMembers[index];
    setFamilyMember(member);
    setEditIndex(index);
  };

  const handleDeleteFamilyMember = (index) => {
    axios.delete(`${BASE_URL}/api/flats/owner/${ownerDetails._id}/delete-family/${index}`)
      .then(response => {
        setOwnerDetails(response.data);
        fetchFlatOwners();
      })
      .catch(error => console.error("Error deleting family member:", error));
  };

  // Delete FlatOwner record
  const handleDeleteOwner = (id) => {
    axios.delete(`${BASE_URL}/api/flats/owner/${id}`)
      .then(response => {
        fetchFlatOwners();
        if (ownerDetails && ownerDetails._id === id) {
          setOwnerDetails(null);
          setOwnerForm({ ownerName: "", profession: "", contact: "", email: "" });
        }
      })
      .catch(error => console.error("Error deleting owner:", error));
  };

  // Populate form for editing from table row
  const handleEditOwner = (owner) => {
    setSelectedSociety(owner.societyName);
    setSelectedFlat(owner.flatNumber);
    setOwnerDetails(owner);
    setOwnerForm({
      ownerName: owner.ownerName,
      profession: owner.profession,
      contact: owner.contact,
      email: owner.email,
    });
  };

  const handleSocietyChange = (societyId) => {
    setSelectedSociety(societyId);
    const society = societies.find(soc => soc._id === societyId);
    setFlats(society ? society.flats : []);
    setSelectedFlat("");
    setSelectedUser("");
  };

  return (
    <div className="flat-owner-details">
      <h2>Flat Owner Management</h2>
      <div className="dashboard-info">
        <p>Total Flat Owners: {ownerCount}</p>
      </div>
      <div className="selection-form">
        <select value={selectedSociety} onChange={(e) => setSelectedSociety(e.target.value)}>
          <option value="">Select Society</option>
          {societies.map(society => (
            <option key={society._id} value={society.name}>{society.name}</option>
          ))}
        </select>
        <select value={selectedFlat} onChange={(e) => setSelectedFlat(e.target.value)} disabled={!selectedSociety}>
          <option value="">Select Flat</option>
          {flatNumbers.map((flat, index) => (
            <option key={index} value={flat}>{flat}</option>
          ))}
        </select>
      </div>

      {selectedSociety && selectedFlat && (
        <div className="owner-card">
          <h3>{ownerDetails && ownerDetails._id ? "Owner Details" : "Add Owner Details"}</h3>
          <div className="owner-form">
            <input 
              type="text" 
              name="ownerName" 
              placeholder="Owner Name" 
              value={ownerForm.ownerName} 
              onChange={handleOwnerChange} 
            />
            <input 
              type="text" 
              name="profession" 
              placeholder="Profession" 
              value={ownerForm.profession} 
              onChange={handleOwnerChange} 
            />
            <input 
              type="text" 
              name="contact" 
              placeholder="Contact" 
              value={ownerForm.contact} 
              onChange={handleOwnerChange} 
            />
            <input 
              type="email" 
              name="email" 
              placeholder="Email" 
              value={ownerForm.email} 
              onChange={handleOwnerChange} 
            />
            <button onClick={handleOwnerSubmit} className="save-btn">
              {ownerDetails && ownerDetails._id ? "Update Owner" : "Add Owner"}
            </button>
            {ownerDetails && ownerDetails._id && (
              <button onClick={() => handleDeleteOwner(ownerDetails._id)} className="delete-btn">
                Delete Owner
              </button>
            )}
          </div>
          {ownerDetails && (
            <div className="display-owner">
              <p><strong>Name:</strong> {ownerDetails.ownerName}</p>
              <p><strong>Profession:</strong> {ownerDetails.profession}</p>
              <p><strong>Contact:</strong> {ownerDetails.contact}</p>
              <p><strong>Email:</strong> {ownerDetails.email}</p>
            </div>
          )}
        </div>
      )}

      {ownerDetails && (
        <div className="family-form">
          <h3>Family Members</h3>
{ownerDetails.familyMembers && ownerDetails.familyMembers.length > 0 ? (
  <div className="family-table-wrapper">
    <table className="family-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Relation</th>
          <th>Age</th>
          <th>Profession</th>
          <th>Contact</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {ownerDetails.familyMembers.map((member, index) => (
          <tr key={index}>
            <td>{member.name}</td>
            <td>{member.relation}</td>
            <td>{member.age}</td>
            <td>{member.profession}</td>
            <td>{member.contact}</td>
            <td>
              <button onClick={() => handleEditFamilyMember(index)} className="edit-btn">Edit</button>
              <button onClick={() => handleDeleteFamilyMember(index)} className="delete-btn">Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
) : (
  <p>No family members added yet.</p>
)}


          <h4>{editIndex !== null ? "Edit Family Member" : "Add Family Member"}</h4>
          <form onSubmit={handleFamilyMemberSubmit}>
            <input type="text" name="name" placeholder="Name" value={familyMember.name} onChange={handleFamilyMemberChange} required />
            <input type="text" name="relation" placeholder="Relation" value={familyMember.relation} onChange={handleFamilyMemberChange} required />
            <input type="number" name="age" placeholder="Age" value={familyMember.age} onChange={handleFamilyMemberChange} required />
            <input type="text" name="profession" placeholder="Profession" value={familyMember.profession} onChange={handleFamilyMemberChange} />
            <input type="text" name="contact" placeholder="Contact" value={familyMember.contact} onChange={handleFamilyMemberChange} />
            <button type="submit" className="save-btn">
              {editIndex !== null ? "Update Member" : "Add Member"}
            </button>
          </form>
        </div>
      )}

      <div className="owner-table">
        <h3>All Flat Owners</h3>
        <div className="table-container">
        {flatOwners.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Society</th>
                <th>Flat</th>
                <th>Owner Name</th>
                <th>Profession</th>
                <th>Contact</th>
                <th>Email</th>
                <th>Family Members</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {flatOwners.map(owner => (
                <tr key={owner._id}>
                  <td>{owner.societyName}</td>
                  <td>{owner.flatNumber}</td>
                  <td>{owner.ownerName}</td>
                  <td>{owner.profession}</td>
                  <td>{owner.contact}</td>
                  <td>{owner.email}</td>
                  <td>{owner.familyMembers ? owner.familyMembers.length : 0}</td>
                  <td>
                    <button onClick={() => handleEditOwner(owner)} className="edit-btn">Edit</button>
                    <button onClick={() => handleDeleteOwner(owner._id)} className="delete-btn">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No flat owner records available.</p>
        )}
        </div>
      </div>
    </div>
  );
};

export default FlatOwnerDetails;
