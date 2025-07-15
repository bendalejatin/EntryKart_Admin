import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import "./styles/QRScanner.css";

//const BASE_URL = "http://localhost:5000"; // Adjust this to your backend URL
const BASE_URL = "https://entrykart-admin.onrender.com" ; // deployment url

const QRScanner = () => {
  const [couponDetails, setCouponDetails] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const couponCodeQuery = queryParams.get("couponCode");

  useEffect(() => {
    if (couponCodeQuery) {
      handleScan(couponCodeQuery);
    }
  }, [couponCodeQuery]);

  const handleScan = async (code) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/api/coupons/scan/manual/${code}`
      );
      setCouponDetails(response.data.coupon);
      setErrorMessage("");
    } catch (error) {
      setCouponDetails(null);
      setErrorMessage(error.response?.data?.message || "Error scanning coupon");
    }
  };

  return (
    <div className="qr-scanner">
      <h2>Manual QR Code Scanner</h2>
      {!couponCodeQuery && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleScan(e.target.couponCode.value);
          }}
        >
          <input
            type="text"
            name="couponCode"
            placeholder="Enter or scan coupon code"
            required
          />
          <button type="submit">Scan</button>
        </form>
      )}
      {errorMessage && <p className="error">{errorMessage}</p>}
      {couponDetails && (
        <div className="coupon-details">
          <h3>Coupon Details</h3>
          <p>
            <strong>QR Code ID:</strong> {couponDetails.qrCodeId}
          </p>
          <p>
            <strong>Coupon Code:</strong> {couponDetails.code}
          </p>
          <p>
            <strong>User Name:</strong> {couponDetails.userName}
          </p>
          <p>
            <strong>Flat No:</strong> {couponDetails.flatNo}
          </p>
          <p>
            <strong>Society:</strong> {couponDetails.society}
          </p>
          <p>
            <strong>Event:</strong> {couponDetails.event}
          </p>
          <p>
            <strong>Expiry Date:</strong> {couponDetails.expiryDate}
          </p>
          <p>
            <strong>Status:</strong> {couponDetails.status}
          </p>
          <p>
            <strong>Used:</strong> {couponDetails.used}
          </p>
          <p>
            <strong>Active:</strong> {couponDetails.active}
          </p>
        </div>
      )}
    </div>
  );
};

export default QRScanner;
