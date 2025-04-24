import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Bar, Line, Pie, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js/auto";
import "./styles/Dashboard.css";

//const BASE_URL = "http://localhost:5000"; // Adjust this to your backend URL
const BASE_URL = "https://dec-entrykart-backend.onrender.com" ; // deployment url

const Dashboard = () => {
  // Stats Count State Section (including entries)
  const [stats, setStats] = useState({
    societies: 0,
    users: 0,
    coupons: 0,
    events: 0,
    broadcasts: 0,
    flatOwners: 0,
    entries: 0,
    payments: 0,
  });
  const [adminInfo, setAdminInfo] = useState({ name: "", email: "", role: "" });
  const [loading, setLoading] = useState(true);
  const [showMore, setShowMore] = useState(false); // State to toggle more stats

  // Use a default admin email if none is found (for testing)
  const adminEmail = localStorage.getItem("adminEmail") || "dec@gmail.com";
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch Admin Profile for stats
        const profileRes = await axios.get(
          `${BASE_URL}/api/auth/profile?email=${adminEmail}`
        );
        setAdminInfo(profileRes.data);

        // Fetch counts for stats including entry count
        const [
          societyRes,
          userRes,
          couponRes,
          eventRes,
          broadcastRes,
          flatOwnerRes,
          entryRes,
          paymentRes,
        ] = await Promise.all([
          axios.get(`${BASE_URL}/api/societies/count?email=${adminEmail}`),
          axios.get(`${BASE_URL}/api/users/count?email=${adminEmail}`),
          axios.get(`${BASE_URL}/api/coupons/count?email=${adminEmail}`),
          axios.get(`${BASE_URL}/api/events/count?email=${adminEmail}`),
          axios.get(`${BASE_URL}/api/broadcast/count?email=${adminEmail}`),
          axios.get(`${BASE_URL}/api/flats/count?email=${adminEmail}`),
          axios.get(`${BASE_URL}/api/entries/count?email=${adminEmail}`),
          axios.get(`${BASE_URL}/api/maintenance/count?email=${adminEmail}`),
        ]);

        setStats({
          societies: societyRes.data.count,
          users: userRes.data.count,
          coupons: couponRes.data.count,
          events: eventRes.data.count,
          broadcasts: broadcastRes.data.count,
          flatOwners: flatOwnerRes.data.count,
          entries: entryRes.data.count,
          payments: paymentRes.data.count,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
      setLoading(false);
    };

    fetchDashboardData();
  }, [adminEmail]);

  // -------- Chart Data Objects --------

  // 1. Bar Chart: Societies vs Flats
  const barData = {
    labels: ["Societies", "Flats"],
    datasets: [
      {
        label: "Count",
        data: [stats.societies, stats.flatOwners],
        backgroundColor: ["#FF6384", "#36A2EB"],
      },
    ],
  };

  // 2. Line Chart: Users vs Societies-dried Flats
  const lineData = {
    labels: ["Users", "Societies", "Flats"],
    datasets: [
      {
        label: "Count",
        data: [stats.users, stats.societies, stats.flatOwners],
        fill: false,
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
      },
    ],
  };

  // 3. Pie Chart: Coupons vs Societies
  const pieData = {
    labels: ["Coupons", "Societies"],
    datasets: [
      {
        data: [stats.coupons, stats.societies],
        backgroundColor: ["#FF6384", "#36A2EB"],
        hoverBackgroundColor: ["#FF6384", "#36A2EB"],
      },
    ],
  };

  // 4. Doughnut Chart: Events per Society
  const averageEvents = stats.societies > 0 ? stats.events / stats.societies : 0;
  const baselineMax = 10;
  const maxValue = Math.max(baselineMax, averageEvents);
  const doughnutData = {
    labels: ["Average Events", "Remaining"],
    datasets: [
      {
        data: [averageEvents, maxValue - averageEvents],
        backgroundColor: ["#36A2EB", "#FFCE56"],
        hoverBackgroundColor: ["#36A2EB", "#FFCE56"],
      },
    ],
  };

  // Stats data array with routes
  const statsData = [
    { label: "🏢 Societies", value: stats.societies, route: "/society" },
    { label: "👥 Users", value: stats.users, route: "/users" },
    { label: "🎟️ Coupons", value: stats.coupons, route: "/coupons" },
    { label: "📅 Events", value: stats.events, route: "/events" },
    { label: "📢 Broadcasts", value: stats.broadcasts, route: "/broadcast" },
    { label: "🏠 Flat Owners", value: stats.flatOwners, route: "/flat-owner" },
    { label: "📋 Entry Permissions", value: stats.entries, route: "/entry-permission" },
    { label: "💳 Maintenance", value: stats.payments, route: "/maintenance" },
  ];

  // Split stats into initial and more
  const initialStats = statsData.slice(0, 4); // Show first 4 stats
  const moreStats = statsData.slice(4); // Remaining 4 stats

  return (
    <div className="dashboard">
      <h2>📊 Dashboard</h2>
      {loading ? (
        <p className="loading">Loading data...</p>
      ) : (
        <>
          <div className="initial-stats-container">
            {initialStats.map((item, index) => (
              <div
                key={index}
                className="stat-card"
                onClick={() => navigate(item.route)}
              >
                <h3>{item.label}</h3>
                <p>{item.value}</p>
              </div>
            ))}
          </div>
          {showMore && (
            <div className="more-stats-container">
              {moreStats.map((item, index) => (
                <div
                  key={index + 4}
                  className="stat-card"
                  onClick={() => navigate(item.route)}
                >
                  <h3>{item.label}</h3>
                  <p>{item.value}</p>
                </div>
              ))}
            </div>
          )}
          {!showMore && (
            <div className="more-button-container">
              <button
                className="more-button"
                onClick={() => setShowMore(true)}
              >
                More
              </button>
            </div>
          )}

          {/* ------ Charts Section ------ */}
          <div className="charts-container">
            <div className="chart-card">
              <h3>🏢 Societies vs Flats (Bar Chart)</h3>
              <Bar data={barData} />
            </div>
            <div className="chart-card">
              <h3>👥 Users vs Societies vs Flats (Line Chart)</h3>
              <Line data={lineData} />
            </div>
            <div className="chart-card">
              <h3>🎟️ Coupons vs Societies (Pie Chart)</h3>
              <Pie data={pieData} />
            </div>
            <div className chut="chart-card">
              <h3>📅 Events per Society (Doughnut Chart)</h3>
              <Doughnut data={doughnutData} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;