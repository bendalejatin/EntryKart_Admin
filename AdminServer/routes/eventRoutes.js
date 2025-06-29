const express = require("express");
const router = express.Router();
const Event = require("../models/Event");
const Admin = require("../models/Admin");

// Create Event
router.post("/", async (req, res) => {
  try {
    // console.log("POST /api/events received with data:", req.body);
    // console.log("Payload size:", JSON.stringify(req.body).length / 1024, "KB");

    const {
      title,
      description,
      date,
      time,
      location,
      image,
      adminEmail,
      societyName,
    } = req.body;

    if (!adminEmail || !societyName) {
      console.error("Missing adminEmail/societyName");
      return res
        .status(400)
        .json({ message: "Admin email and society name are required" });
    }

    if (!title || !description || !date || !time || !location) {
      console.error("Missing required fields:", {
        title,
        description,
        date,
        time,
        location,
      });
      return res
        .status(400)
        .json({
          message:
            "All required fields (title, description, date, time, location) must be provided",
        });
    }

    const event = new Event({
      title,
      description,
      date: new Date(date), // Ensure date is stored as Date object
      time,
      location,
      image,
      adminEmail,
      societyName: societyName.trim().toLowerCase(), // Normalize
    });

    await event.save();
    // console.log(`Created event ${title} with time ${time} for society ${societyName}`);
    res.status(201).json(event);
  } catch (error) {
    console.error("Error creating event:", error.message);
    if (error.message.includes("PayloadTooLargeError")) {
      return res
        .status(413)
        .json({
          message: "Payload too large. Image size must be less than 5MB.",
        });
    }
    res
      .status(500)
      .json({ message: `Failed to create event: ${error.message}` });
  }
});

// Get Events
router.get("/", async (req, res) => {
  try {
    const { email: adminEmail, societyName } = req.query;
    if (!adminEmail && !societyName) {
      console.error("Missing adminEmail or societyName in query");
      return res
        .status(400)
        .json({ message: "Admin email or society name is required" });
    }

    let filter = {};
    if (adminEmail) {
      const admin = await Admin.findOne({ email: adminEmail });
      if (!admin || admin.role !== "superadmin") {
        filter.adminEmail = adminEmail;
      }
    }
    if (societyName) {
      filter.societyName = new RegExp(
        `^${societyName.trim().toLowerCase()}$`,
        "i"
      ); // Normalize and case-insensitive
    }

    const events = await Event.find(filter).sort({ date: 1 }); // Sort by date ascending
    // console.log(`Fetched ${events.length} events for society ${societyName}`);
    res.json(events);
  } catch (error) {
    console.error("Error fetching events:", error.message);
    res
      .status(500)
      .json({ message: `Failed to fetch events: ${error.message}` });
  }
});

// Count Events
router.get("/count", async (req, res) => {
  try {
    const adminEmail = req.query.email;
    if (!adminEmail) {
      console.error("Missing adminEmail in query");
      return res.status(400).json({ message: "Admin email is required" });
    }

    const admin = await Admin.findOne({ email: adminEmail });
    const count =
      admin && admin.role === "superadmin"
        ? await Event.countDocuments()
        : await Event.countDocuments({ adminEmail });

    // console.log(`Counted ${count} events for admin ${adminEmail}`);
    res.json({ count });
  } catch (error) {
    console.error("Error counting events:", error.message);
    res
      .status(500)
      .json({ message: `Failed to count events: ${error.message}` });
  }
});

// Delete Event
router.delete("/:id", async (req, res) => {
  try {
    // console.log(`DELETE /api/events/${req.params.id} received`);
    const deletedEvent = await Event.findByIdAndDelete(req.params.id);

    if (!deletedEvent) {
      console.error(`Event with ID ${req.params.id} not found`);
      return res.status(404).json({ message: "Event not found" });
    }

    // console.log(`Deleted event ${deletedEvent.title}`);
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error.message);
    res
      .status(500)
      .json({ message: `Failed to delete event: ${error.message}` });
  }
});

// Update Event
router.put("/:id", async (req, res) => {
  try {
    // console.log(`PUT /api/events/${req.params.id} received with data:`, req.body);
    // console.log("Payload size:", JSON.stringify(req.body).length / 1024, "KB");

    const { title, description, date, time, location, image, societyName } =
      req.body;

    if (!title || !description || !date || !time || !location || !societyName) {
      console.error("Missing required fields for update");
      return res
        .status(400)
        .json({
          message:
            "All fields (title, description, date, time, location, societyName) must be provided",
        });
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        date: new Date(date), // Ensure date is stored as Date object
        time,
        location,
        image,
        societyName: societyName.trim().toLowerCase(), // Normalize
      },
      { new: true }
    );

    if (!updatedEvent) {
      console.error(`Event with ID ${req.params.id} not found`);
      return res.status(404).json({ message: "Event not found" });
    }

    // console.log(`Updated event ${updatedEvent.title} for society ${societyName}`);
    res.json(updatedEvent);
  } catch (error) {
    console.error("Error updating event:", error.message);
    if (error.message.includes("PayloadTooLargeError")) {
      return res
        .status(413)
        .json({
          message: "Payload too large. Image size must be less than 5MB.",
        });
    }
    res
      .status(500)
      .json({ message: `Failed to update event: ${error.message}` });
  }
});

module.exports = router;
