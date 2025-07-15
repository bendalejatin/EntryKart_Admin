import React, { useState, useEffect } from "react";
import axios from "axios";
import "./styles/UserManagement.css";
import {
  MaterialReactTable,
  useMaterialReactTable,
  createMRTColumnHelper,
} from "material-react-table";
import { Box, Button } from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const columnHelper = createMRTColumnHelper();

//const BASE_URL = "http://localhost:5000"; // Adjust this to your backend URL
const BASE_URL = "https://entrykart-admin.onrender.com" ; // deployment url

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [societies, setSocieties] = useState([]);
  const [flats, setFlats] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    societyId: "",
    flatNumber: "",
  });
  const [editingUser, setEditingUser] = useState(null);
  const adminEmail = localStorage.getItem("adminEmail");

  const [userData, setUserData] = useState([]);

  // Fetch user data from the backend API
  useEffect(() => {
    fetch(`${BASE_URL}/api/users?email=${adminEmail}`)
      .then((res) => res.json())
      .then((data) => setUserData(data))
      .catch((err) => console.error("Error fetching users:", err));
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (adminEmail) {
      fetchUsers();
      fetchSocieties();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminEmail]);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "societyId") {
      const selectedSociety = societies.find((s) => s._id === value);
      setFlats(selectedSociety ? selectedSociety.flats : []);
      setFormData((prev) => ({ ...prev, flatNumber: "" }));
    }
  };

  const saveUser = async () => {
    // Validate fields
    if (
      !formData.name ||
      !formData.email ||
      !formData.phone ||
      !formData.societyId ||
      !formData.flatNumber
    ) {
      alert("⚠️ Please fill all fields.");
      return;
    }
    try {
      const payload = { ...formData, adminEmail };
      if (editingUser) {
        await axios.put(`${BASE_URL}/api/users/${editingUser._id}`, payload);
        alert("✅ User updated successfully!");
      } else {
        await axios.post(`${BASE_URL}/api/users`, payload);
        alert("✅ User added successfully!");
      }
      fetchUsers();
      resetForm();
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message;
      alert(`❌ Error: ${errMsg}`);
      console.error("Error saving user:", error);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      societyId: user.society?._id || "",
      flatNumber: user.flatNumber,
    });
    const selectedSociety = societies.find((s) => s._id === user.society?._id);
    setFlats(selectedSociety ? selectedSociety.flats : []);
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await axios.delete(`${BASE_URL}/api/users/${id}`);
      fetchUsers();
    } catch (error) {
      alert(
        `❌ Error deleting user: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      societyId: "",
      flatNumber: "",
    });
    setEditingUser(null);
    setFlats([]);
  };

  const handleExportRows = (rows) => {
    const doc = new jsPDF();
    const tableData = rows.map((row) => {
      const { society, ...users } = row.original;
      return [
        users.name,
        users.flatNumber,
        users.email,
        users.phone,
        users.profession,
        society?.name || "",
      ];
    });

    const tableHeaders = [
      "Name",
      "Flat Number",
      "Email",
      "Phone",
      "Profession",
      "Society",
    ];

    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
    });

    doc.save("users.pdf");
  };

  // const handleEdit = (row) => {
  //   alert(`Edit user: ${row.original.name}`);
  //   // Navigate to edit page or open modal
  // };

  // const handleDelete = (row) => {
  //   const confirmDelete = window.confirm(`Are you sure you want to delete ${row.original.name}?`);
  //   if (confirmDelete) {
  //     // Call backend DELETE API
  //     alert(`Deleted user: ${row.original.name}`);
  //   }
  // };

  const columns = [
    columnHelper.accessor("name", { header: "Name", size: 100 }),
    columnHelper.accessor("flatNumber", { header: "Flat Number", size: 80 }),
    columnHelper.accessor("email", { header: "Email", size: 100 }),
    columnHelper.accessor("phone", { header: "Phone", size: 100 }),
    columnHelper.accessor("profession", { header: "Profession", size: 100 }),
    columnHelper.accessor("society.name", {
      header: "Society",
      cell: ({ row }) => row.original.society?.name || "",
      size: 100,
    }),
    {
      header: "Action",
      id: "action",
      size: 100,
      Cell: ({ row }) => (
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            style={{
              padding: "4px 8px",
              backgroundColor: "#1976d2",
              color: "white",
              border: "none",
              borderRadius: "4px",
            }}
            onClick={() => handleEditUser(row.original)}
          >
            Edit
          </button>
          <button
            style={{
              padding: "4px 8px",
              backgroundColor: "#d32f2f",
              color: "white",
              border: "none",
              borderRadius: "4px",
            }}
            onClick={() => handleDeleteUser(row.original._id)}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  const table = useMaterialReactTable({
    columns,
    data: userData,
    enableRowSelection: true,
    columnFilterDisplayMode: "popover",
    paginationDisplayMode: "pages",
    positionToolbarAlertBanner: "bottom",
    renderTopToolbarCustomActions: ({ table }) => (
      <Box
        sx={{
          display: "flex",
          gap: "16px",
          padding: "8px",
          flexWrap: "wrap",
        }}
      >
        <Button
          disabled={table.getPrePaginationRowModel().rows.length === 0}
          onClick={() =>
            handleExportRows(table.getPrePaginationRowModel().rows)
          }
          startIcon={<FileDownloadIcon />}
        >
          Export All Rows
        </Button>
        {/* <Button
          disabled={table.getRowModel().rows.length === 0}
          onClick={() => handleExportRows(table.getRowModel().rows)}
          startIcon={<FileDownloadIcon />}
        >
          Export Page Rows
        </Button> */}
        <Button
          disabled={
            !table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected()
          }
          onClick={() => handleExportRows(table.getSelectedRowModel().rows)}
          startIcon={<FileDownloadIcon />}
        >
          Export Selected Rows
        </Button>
      </Box>
    ),
  });

  return (
    <>
      <div className="user-management">
        <h2>👥 User Management</h2>
        <div className="user-form">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveUser();
            }}
            className="add-user-form"
          >
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter Name"
              required
            />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter Email"
              required
            />
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Phone Number"
              required
            />
            <select
              name="societyId"
              value={formData.societyId}
              onChange={handleChange}
              required
            >
              <option value="">Select Society</option>
              {societies.map((society) => (
                <option key={society._id} value={society._id}>
                  {society.name} ({society.location})
                </option>
              ))}
            </select>
            <select
              name="flatNumber"
              value={formData.flatNumber}
              onChange={handleChange}
              disabled={!formData.societyId}
              required
            >
              <option value="">Select Flat Number</option>
              {flats.map((flat, index) => (
                <option key={index} value={flat}>
                  {flat}
                </option>
              ))}
            </select>
            <button type="submit">
              {editingUser ? "Update User" : "➕ Add User"}
            </button>
            {editingUser && (
              <button type="button" onClick={resetForm}>
                Cancel Edit
              </button>
            )}
          </form>
        </div>
      </div>

      <div className="user-list">
        <h3>📋 Users List</h3>
        {/* <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Society</th>
              <th>Flat No</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user) => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.phone}</td>
                  <td>{user.society?.name || "N/A"}</td>
                  <td>{user.flatNumber}</td>
                  <td>
                    <button className="edit-btn" onClick={() => handleEditUser(user)}>✏ Edit</button>
                    <button className="delete-btn" onClick={() => handleDeleteUser(user._id)}>🗑 Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: "center" }}>No users found.</td>
              </tr>
            )}
          </tbody>
        </table> */}
        <Box sx={{ width: "100%", overflowX: "auto" }}>
          <MaterialReactTable table={table} />
        </Box>
      </div>
    </>
  );
};

export default UserManagement;
