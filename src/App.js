import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// Initialize the Supabase Client securely using your unique keys
const SUPABASE_URL = "https://glbholdlcohohytwzjjy.supabase.co";
const SUPABASE_KEY = "sb_publishable_GDT6ryuQY_yi9cMFPXMGog_kYmmrQ1-";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function App() {
  // NAVIGATION ROUTER STATES
  const [currentScreen, setCurrentScreen] = useState("homepage");
  const [selectedListing, setSelectedListing] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedZone, setSelectedZone] = useState("All");

  // DYNAMIC DATABASE STATES
  const [listings, setListings] = useState([]);
  const [roommates, setRoommates] = useState([]);
  const [loading, setLoading] = useState(true);

  // FETCH ALL DATA FROM CLOUD ON APP LAUNCH
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Listings combined with their respective reviews
      const { data: listingsData, error: listingsError } = await supabase
        .from("listings")
        .select(`*, reviews(*)`)
        .order("id", { ascending: false });

      if (listingsError) throw listingsError;

      // 2. Fetch Roommate matching profiles
      const { data: roommatesData, error: roommatesError } = await supabase
        .from("roommates")
        .select("*")
        .order("id", { ascending: false });

      if (roommatesError) throw roommatesError;

      setListings(listingsData || []);
      setRoommates(roommatesData || []);
    } catch (err) {
      console.error("Database initialization error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const zones = [
    "All",
    "Aserifa",
    "Omole Area",
    "Road 7 Extension",
    "AP Area",
    "Campus Gate",
    "Ede Road",
    "Modomo",
    "Fashina",
    "Eleweran",
    "Modakeke",
    "Mayfair",
    "Parakin",
    "Lagere",
  ];

  const openWhatsApp = (phone, message) => {
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, "_blank");
  };

  // PERSIST FAKE LISTING FLAGGING LOGIC IN CLOUD
  const handleReport = async (id, title, currentReports) => {
    const targetReports = (currentReports || 0) + 1;
    try {
      const { error } = await supabase
        .from("listings")
        .update({ reports: targetReports })
        .eq("id", id);

      if (error) throw error;

      setListings(
        listings.map((item) =>
          item.id === id ? { ...item, reports: targetReports } : item
        )
      );
      alert(
        `Thank you for flagging "${title}". Our OAU student safety team will review this listing.`
      );
    } catch (err) {
      alert("Error reporting: " + err.message);
    }
  };

  const addNewListing = async (newHouse) => {
    try {
      const { data, error } = await supabase
        .from("listings")
        .insert([newHouse])
        .select();

      if (error) throw error;
      // Re-fetch to keep frontend UI totally accurate
      fetchData();
    } catch (err) {
      alert("Error saving house: " + err.message);
    }
  };

  const addNewRoommate = async (newProfile) => {
    try {
      const { error } = await supabase.from("roommates").insert([newProfile]);

      if (error) throw error;
      fetchData();
    } catch (err) {
      alert("Error saving roommate entry: " + err.message);
    }
  };

  const addReviewToListing = async (listingId, newReview) => {
    try {
      const { error } = await supabase
        .from("reviews")
        .insert([{ ...newReview, listing_id: listingId }]);

      if (error) throw error;
      fetchData();
    } catch (err) {
      alert("Error posting review: " + err.message);
    }
  };

  // FILTER LOGIC
  const filteredListings = listings.filter((house) => {
    const matchesSearch =
      house.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      house.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesZone =
      selectedZone === "All" ||
      house.location.toLowerCase() === selectedZone.toLowerCase();
    return matchesSearch && matchesZone;
  });

  // LOADING SHIELD SCREEN
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          backgroundColor: "#f3f4f6",
        }}
      >
        <div
          style={{
            border: "4px solid #f3f4f6",
            borderTop: "4px solid #4f46e5",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            animation: "spin 1s linear infinite",
          }}
        />
        <p
          style={{
            marginTop: "12px",
            fontWeight: "bold",
            color: "#4b5563",
            fontSize: "14px",
          }}
        >
          Connecting to IfeHomes Cloud Database...
        </p>
      </div>
    );
  }

  if (currentScreen === "upload") {
    return (
      <LandlordUpload
        onBack={() => setCurrentScreen("homepage")}
        onAddListing={addNewListing}
        zonesList={zones.filter((z) => z !== "All")}
      />
    );
  }

  if (currentScreen === "roommates") {
    return (
      <RoommateScreen
        roommates={roommates}
        onBack={() => setCurrentScreen("homepage")}
        onAddRoommate={addNewRoommate}
        onChat={openWhatsApp}
      />
    );
  }

  if (selectedListing) {
    // Keep dynamic track of real-time incoming reviews
    const liveHouseData =
      listings.find((l) => l.id === selectedListing.id) || selectedListing;
    return (
      <ViewDetails
        house={liveHouseData}
        onBack={() => setSelectedListing(null)}
        onChat={openWhatsApp}
        onSubmitReview={(review) =>
          addReviewToListing(selectedListing.id, review)
        }
      />
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f3f4f6",
        color: "#1f2937",
        fontFamily: "sans-serif",
        margin: 0,
        paddingBottom: "40px",
      }}
    >
      {/* HEADER */}
      <header
        style={{
          backgroundColor: "white",
          padding: "12px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "20px",
            fontWeight: "900",
            color: "#4f46e5",
          }}
        >
          IfeHomes
        </h1>
        <button
          onClick={() => setCurrentScreen("upload")}
          style={{
            backgroundColor: "#e0e7ff",
            color: "#4f46e5",
            fontWeight: "600",
            fontSize: "12px",
            padding: "8px 16px",
            borderRadius: "9999px",
            border: "none",
            cursor: "pointer",
          }}
        >
          List Your House
        </button>
      </header>

      {/* HERO */}
      <section
        style={{
          background: "linear-gradient(to bottom right, #4f46e5, #7c3aed)",
          color: "white",
          padding: "24px 20px",
          textAlign: "center",
          borderBottomLeftRadius: "24px",
          borderBottomRightRadius: "24px",
        }}
      >
        <h2
          style={{ margin: "0 0 8px 0", fontSize: "22px", fontWeight: "bold" }}
        >
          No Agent Fees. No Scams.
        </h2>
        <p style={{ margin: "0 0 20px 0", color: "#e0e7ff", fontSize: "14px" }}>
          Find direct accommodations around OAU campus.
        </p>

        <div style={{ maxWidth: "400px", margin: "0 auto" }}>
          <input
            type="text"
            placeholder="Search by area (e.g. Modomo, Campus Gate)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "90%",
              padding: "12px 16px",
              borderRadius: "9999px",
              border: "none",
              fontSize: "14px",
              outline: "none",
            }}
          />
        </div>
      </section>

      {/* ROOMMATE BANNER */}
      <section style={{ margin: "16px" }}>
        <div
          onClick={() => setCurrentScreen("roommates")}
          style={{
            background: "linear-gradient(to right, #14b8a6, #059669)",
            color: "white",
            padding: "16px",
            borderRadius: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
          }}
        >
          <div>
            <span
              style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                fontSize: "10px",
                fontWeight: "bold",
                padding: "2px 8px",
                borderRadius: "9999px",
                textTransform: "uppercase",
              }}
            >
              Community Hub
            </span>
            <h3
              style={{
                margin: "4px 0 2px 0",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              Need someone to split rent?
            </h3>
            <p style={{ margin: 0, fontSize: "12px", color: "#ccfbf1" }}>
              Click here to find active student roommates! 🤝
            </p>
          </div>
          <span
            style={{
              backgroundColor: "white",
              color: "#059669",
              fontSize: "12px",
              fontWeight: "bold",
              padding: "8px 12px",
              borderRadius: "8px",
            }}
          >
            Open →
          </span>
        </div>
      </section>

      {/* QUICK FILTER TAGS */}
      <section style={{ margin: "24px 16px 0 16px" }}>
        <h3
          style={{
            margin: "0 0 12px 0",
            fontSize: "12px",
            fontWeight: "bold",
            textTransform: "uppercase",
            color: "#9ca3af",
          }}
        >
          Popular Campus Zones
        </h3>
        <div
          style={{
            display: "flex",
            gap: "8px",
            overflowX: "auto",
            paddingBottom: "8px",
          }}
        >
          {zones.map((zone, index) => (
            <button
              key={index}
              onClick={() => setSelectedZone(zone)}
              style={{
                whiteSpace: "nowrap",
                padding: "6px 16px",
                borderRadius: "9999px",
                fontSize: "12px",
                fontWeight: "500",
                border: selectedZone === zone ? "none" : "1px solid #e5e7eb",
                backgroundColor: selectedZone === zone ? "#4f46e5" : "white",
                color: selectedZone === zone ? "white" : "#4b5563",
                cursor: "pointer",
              }}
            >
              {zone}
            </button>
          ))}
        </div>
      </section>

      {/* CORE FLATS LAYOUT FEED */}
      <section style={{ margin: "24px 16px 0 16px" }}>
        <h3
          style={{ margin: "0 0 16px 0", fontWeight: "bold", fontSize: "18px" }}
        >
          Available Apartments
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {filteredListings.map((house) => (
            <div
              key={house.id}
              style={{
                backgroundColor: "white",
                borderRadius: "16px",
                overflow: "hidden",
                border: "1px solid #f3f4f6",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ position: "relative", height: "180px" }}>
                <img
                  src={house.image}
                  alt={house.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "12px",
                    left: "12px",
                    backgroundColor: "white",
                    padding: "4px 12px",
                    borderRadius: "9999px",
                    fontWeight: "bold",
                    color: "#4f46e5",
                  }}
                >
                  ₦{house.price}/yr
                </div>
                <button
                  onClick={() =>
                    handleReport(house.id, house.title, house.reports)
                  }
                  style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    backgroundColor: "#fef2f2",
                    color: "#dc2626",
                    fontSize: "10px",
                    fontWeight: "bold",
                    padding: "4px 10px",
                    borderRadius: "9999px",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  ⚠️ Report {house.reports > 0 && `(${house.reports})`}
                </button>
              </div>

              <div style={{ padding: "16px" }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    backgroundColor: "#f3f4f6",
                    color: "#4b5563",
                    padding: "2px 8px",
                    borderRadius: "4px",
                  }}
                >
                  📍 {house.location}
                </span>
                <h4
                  style={{
                    margin: "8px 0 12px 0",
                    fontWeight: "bold",
                    fontSize: "16px",
                  }}
                >
                  {house.title}
                </h4>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => setSelectedListing(house)}
                    style={{
                      flex: 1,
                      backgroundColor: "#f3f4f6",
                      color: "#374151",
                      fontSize: "12px",
                      fontWeight: "bold",
                      padding: "12px 0",
                      borderRadius: "12px",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    View Details & Reviews 👀
                  </button>
                  <button
                    onClick={() =>
                      openWhatsApp(
                        house.phone,
                        `Hello, I'm interested in inspecting your flat at ${house.location} featured on IfeHomes.`
                      )
                    }
                    style={{
                      flex: 1,
                      backgroundColor: "#4f46e5",
                      color: "white",
                      fontSize: "12px",
                      fontWeight: "bold",
                      padding: "12px 0",
                      borderRadius: "12px",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    💬 Chat Owner
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredListings.length === 0 && (
            <p
              style={{
                textAlign: "center",
                color: "#6b7280",
                fontSize: "14px",
                marginTop: "20px",
              }}
            >
              No properties matching search fields inside this zone.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

// --- SUBCOMPONENT: DETAILED PRODUCT + REVIEW LOGGER ENGINE ---
function ViewDetails({ house, onBack, onChat, onSubmitReview }) {
  const [newComment, setNewComment] = useState("");
  const [newStars, setNewStars] = useState(5);
  const [newName, setNewName] = useState("");

  const reviewsList = house.reviews || [];
  const averageRating =
    reviewsList.length > 0
      ? (
          reviewsList.reduce((acc, curr) => acc + curr.rating, 0) /
          reviewsList.length
        ).toFixed(1)
      : "No logs yet";

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    onSubmitReview({
      author: newName.trim() || "Anonymous Student",
      rating: Number(newStars),
      comment: newComment.trim(),
    });
    setNewComment("");
    setNewName("");
    alert("Log successfully tracked in database!");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f9fafb",
        fontFamily: "sans-serif",
        paddingBottom: "60px",
      }}
    >
      <div
        style={{
          position: "relative",
          height: "220px",
          backgroundColor: "#e5e7eb",
        }}
      >
        <img
          src={house.image}
          alt={house.title}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <button
          onClick={onBack}
          style={{
            position: "absolute",
            top: "16px",
            left: "16px",
            backgroundColor: "white",
            border: "none",
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
            color: "#4f46e5",
          }}
        >
          ← Back
        </button>
      </div>

      <div style={{ padding: "20px" }}>
        <span
          style={{
            fontSize: "12px",
            fontWeight: "bold",
            backgroundColor: "#e0e7ff",
            color: "#4f46e5",
            padding: "4px 10px",
            borderRadius: "9999px",
          }}
        >
          📍 {house.location}
        </span>
        <h2
          style={{
            margin: "12px 0 4px 0",
            fontSize: "22px",
            fontWeight: "900",
          }}
        >
          {house.title}
        </h2>

        <div
          style={{
            backgroundColor: "#fef08a",
            color: "#854d0e",
            padding: "6px 12px",
            borderRadius: "8px",
            display: "inline-block",
            fontSize: "13px",
            fontWeight: "bold",
            marginBottom: "20px",
          }}
        >
          ⭐ Community Score: {averageRating} ({reviewsList.length} reviews)
        </div>

        <div
          style={{
            backgroundColor: "white",
            padding: "16px",
            borderRadius: "12px",
            marginBottom: "12px",
            border: "1px solid #e5e7eb",
          }}
        >
          <h3
            style={{
              fontSize: "13px",
              fontWeight: "bold",
              color: "#dc2626",
              margin: "0 0 6px 0",
            }}
          >
            📜 Compound Guidelines
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: "14px",
              color: "#4b5563",
              lineHeight: "1.4",
            }}
          >
            {house.rules || "Direct student entries active."}
          </p>
        </div>

        <div
          style={{
            backgroundColor: "white",
            padding: "16px",
            borderRadius: "12px",
            marginBottom: "24px",
            border: "1px solid #e5e7eb",
          }}
        >
          <h3
            style={{
              fontSize: "13px",
              fontWeight: "bold",
              color: "#059669",
              margin: "0 0 6px 0",
            }}
          >
            💡 Utilities Setup
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: "14px",
              color: "#4b5563",
              lineHeight: "1.4",
            }}
          >
            {house.utilities || "Standard utility setups apply."}
          </p>
        </div>

        {/* FEEDBACK LOGS HUB */}
        <div
          style={{
            marginBottom: "24px",
            padding: "16px",
            backgroundColor: "white",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
          }}
        >
          <h3
            style={{
              fontSize: "15px",
              fontWeight: "bold",
              margin: "0 0 12px 0",
            }}
          >
            Resident Verification Logs
          </h3>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              marginBottom: "20px",
            }}
          >
            {reviewsList.map((rev, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: "#f3f4f6",
                  padding: "12px",
                  borderRadius: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "4px",
                  }}
                >
                  <span style={{ fontSize: "12px", fontWeight: "bold" }}>
                    {rev.author}
                  </span>
                  <span style={{ fontSize: "12px", color: "#eab308" }}>
                    {"★".repeat(rev.rating)}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: "13px", color: "#4b5563" }}>
                  "{rev.comment}"
                </p>
              </div>
            ))}
            {reviewsList.length === 0 && (
              <p style={{ fontSize: "13px", color: "#9ca3af", margin: 0 }}>
                No dynamic student ratings logged yet. Write one down below!
              </p>
            )}
          </div>

          <form
            onSubmit={handleReviewSubmit}
            style={{ borderTop: "1px solid #e5e7eb", paddingTop: "12px" }}
          >
            <h4
              style={{
                margin: "0 0 8px 0",
                fontSize: "13px",
                color: "#374151",
              }}
            >
              File Anonymous Verification Card
            </h4>
            <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
              <input
                type="text"
                placeholder="Alias / Dept"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  fontSize: "13px",
                }}
              />
              <select
                value={newStars}
                onChange={(e) => setNewStars(e.target.value)}
                style={{
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  fontSize: "13px",
                }}
              >
                <option value={5}>5 Stars ★★★★★</option>
                <option value={4}>4 Stars ★★★★</option>
                <option value={3}>3 Stars ★★★</option>
                <option value={2}>2 Stars ★★</option>
                <option value={1}>1 Star ★</option>
              </select>
            </div>
            <textarea
              placeholder="How is the water supply, security, and power setup?"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              style={{
                width: "94%",
                padding: "8px",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
                fontSize: "13px",
                height: "50px",
                fontFamily: "sans-serif",
                marginBottom: "8px",
              }}
              required
            />
            <button
              type="submit"
              style={{
                backgroundColor: "#111827",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Publish Log
            </button>
          </form>
        </div>

        <button
          onClick={() =>
            onChat(
              house.phone,
              `Hello, I'm checking out your lodge profile "${house.title}" around ${house.location} listed on IfeHomes. Is it still open for structural inspections?`
            )
          }
          style={{
            width: "100%",
            backgroundColor: "#4f46e5",
            color: "white",
            padding: "14px",
            borderRadius: "12px",
            border: "none",
            fontSize: "15px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          💬 Securely Chat Landlord on WhatsApp
        </button>
      </div>
    </div>
  );
}

// --- SUBCOMPONENT: MATCHMAKER COMMUNITY SYSTEM ---
function RoommateScreen({ roommates, onBack, onAddRoommate, onChat }) {
  const [name, setName] = useState("");
  const [dept, setDept] = useState("");
  const [gender, setGender] = useState("Male");
  const [budget, setBudget] = useState("");
  const [zone, setZone] = useState("");
  const [lifestyle, setLifestyle] = useState("");
  const [phone, setPhone] = useState("");
  const [showForm, setShowForm] = useState(false);

  const handleSubmitProfile = (e) => {
    e.preventDefault();
    let standardPhone = phone.trim();
    if (standardPhone.startsWith("0")) {
      standardPhone = "234" + standardPhone.substring(1);
    }

    onAddRoommate({
      name,
      dept,
      gender,
      budget: `₦${Number(budget).toLocaleString()}`,
      preferredzone: zone || "Anywhere near campus",
      lifestyle,
      phone: standardPhone,
    });

    setName("");
    setDept("");
    setBudget("");
    setZone("");
    setLifestyle("");
    setPhone("");
    setShowForm(false);
    alert("Roommate setup dispatched directly to cloud server!");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f3f4f6",
        fontFamily: "sans-serif",
        padding: "16px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "transparent",
            border: "none",
            color: "#059669",
            fontWeight: "bold",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          ← Back to Houses
        </button>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            backgroundColor: "#059669",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "9999px",
            fontSize: "12px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          {showForm ? "Cancel Form" : "Post My Request ✍️"}
        </button>
      </div>

      <h2
        style={{
          textAlign: "center",
          margin: "0 0 16px 0",
          fontSize: "20px",
          color: "#065f46",
          fontWeight: "900",
        }}
      >
        Roommate Matchmaker
      </h2>

      {showForm ? (
        <form
          onSubmit={handleSubmitProfile}
          style={{
            backgroundColor: "white",
            padding: "16px",
            borderRadius: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
            }}
            required
          />
          <input
            type="text"
            placeholder="Dept & Level"
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            style={{
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
            }}
          />
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            style={{
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
            }}
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          <input
            type="number"
            placeholder="Budget Split Cap Amount (₦)"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            style={{
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
            }}
            required
          />
          <input
            type="text"
            placeholder="Target Areas (e.g. Omole)"
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            style={{
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
            }}
          />
          <input
            type="text"
            placeholder="WhatsApp Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
            }}
            required
          />
          <textarea
            placeholder="Lifestyle quirks/rules..."
            value={lifestyle}
            onChange={(e) => setLifestyle(e.target.value)}
            style={{
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              fontFamily: "sans-serif",
              height: "50px",
            }}
          />
          <button
            type="submit"
            style={{
              backgroundColor: "#059669",
              color: "white",
              padding: "12px",
              border: "none",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Publish Dynamic Request 🚀
          </button>
        </form>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {roommates.map((buddy) => (
            <div
              key={buddy.id}
              style={{
                backgroundColor: "white",
                borderRadius: "16px",
                padding: "16px",
                border: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <h4
                    style={{ margin: 0, fontSize: "15px", fontWeight: "bold" }}
                  >
                    {buddy.name} ({buddy.gender})
                  </h4>
                  <p
                    style={{
                      margin: "2px 0 0 0",
                      fontSize: "12px",
                      color: "#6b7280",
                    }}
                  >
                    📚 {buddy.dept || "OAU Student"}
                  </p>
                </div>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: "bold",
                    color: "#059669",
                  }}
                >
                  {buddy.budget}
                </span>
              </div>
              <p
                style={{
                  margin: "10px 0",
                  fontSize: "13px",
                  color: "#4b5563",
                  backgroundColor: "#f9fafb",
                  padding: "8px",
                  borderRadius: "6px",
                }}
              >
                <strong>Habits:</strong> {buddy.lifestyle}
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "12px",
                }}
              >
                <span>
                  📍 Target:{" "}
                  <strong>{buddy.preferredzone || buddy.preferredZone}</strong>
                </span>
                <button
                  onClick={() =>
                    onChat(
                      buddy.phone,
                      `Hello ${buddy.name}, I found your roommate pairing card on IfeHomes! Let's discuss house plans.`
                    )
                  }
                  style={{
                    backgroundColor: "#e6f4ea",
                    color: "#059669",
                    border: "none",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  🤝 Connect
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- SUBCOMPONENT: UPLOAD REGISTRATION CONTROLLER ---
function LandlordUpload({ onBack, onAddListing, zonesList }) {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState(zonesList[0] || "Aserifa");
  const [price, setPrice] = useState("");
  const [phone, setPhone] = useState("");
  const [water, setWater] = useState(false);
  const [light, setLight] = useState(false);
  const [fenced, setFenced] = useState(false);
  const [rules, setRules] = useState("");
  const [utilities, setUtilities] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    let cleanPhone = phone.trim();
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "234" + cleanPhone.substring(1);
    }

    const features = [];
    if (water) features.push("Running Water");
    if (light) features.push("Constant Light");
    if (fenced) features.push("Fenced Gate");

    onAddListing({
      title,
      location,
      price: Number(price).toLocaleString(),
      phone: cleanPhone,
      image:
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=500&q=80",
      features,
      reports: 0,
      landlord: "Private Landlord",
      rules,
      utilities,
    });
    onBack();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f9fafb",
        padding: "20px",
        fontFamily: "sans-serif",
      }}
    >
      <button
        onClick={onBack}
        style={{
          background: "transparent",
          border: "none",
          color: "#4f46e5",
          fontWeight: "bold",
          cursor: "pointer",
          marginBottom: "16px",
        }}
      >
        ← Back
      </button>
      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: "white",
          padding: "16px",
          borderRadius: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <h3>List Your Property</h3>
        <input
          type="text"
          placeholder="Title (e.g. Single Room Self-Contain)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            padding: "10px",
            borderRadius: "6px",
            border: "1px solid #d1d5db",
          }}
          required
        />
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          style={{
            padding: "10px",
            borderRadius: "6px",
            border: "1px solid #d1d5db",
          }}
        >
          {zonesList.map((z, idx) => (
            <option key={idx} value={z}>
              {z}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Rent price contribution (₦ / year)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          style={{
            padding: "10px",
            borderRadius: "6px",
            border: "1px solid #d1d5db",
          }}
          required
        />
        <input
          type="text"
          placeholder="Landlord Active WhatsApp Line"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={{
            padding: "10px",
            borderRadius: "6px",
            border: "1px solid #d1d5db",
          }}
          required
        />
        <textarea
          placeholder="Lodge Compound Rules"
          value={rules}
          onChange={(e) => setRules(e.target.value)}
          style={{
            padding: "10px",
            borderRadius: "6px",
            border: "1px solid #d1d5db",
            fontFamily: "sans-serif",
          }}
        />
        <textarea
          placeholder="Utility Charges breakdown details"
          value={utilities}
          onChange={(e) => setUtilities(e.target.value)}
          style={{
            padding: "10px",
            borderRadius: "6px",
            border: "1px solid #d1d5db",
            fontFamily: "sans-serif",
          }}
        />
        <button
          type="submit"
          style={{
            backgroundColor: "#4f46e5",
            color: "white",
            padding: "12px",
            border: "none",
            borderRadius: "8px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Publish Live 🚀
        </button>
      </form>
    </div>
  );
}
