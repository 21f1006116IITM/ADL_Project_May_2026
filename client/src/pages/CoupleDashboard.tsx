import { useEffect, useState } from "react";
import { apiRequest } from "../api";

interface Listing {
  id: string;
  title: string;
  description: string;
  event_date: string;
  category: string;
  capacity: number;
  location: string;
}

interface Booking {
  id: string;
  status: string;
  listing: Listing;
}

interface ConnectionRequestItem {
  id: string;
  status: string;
  requester: { id: string; name: string; partner_name: string };
  target: { id: string; name: string; partner_name: string };
}

interface ExploreCouple {
  id: string;
  name: string;
  partner_name: string;
  display_name: string;
  location: string;
  interests: string[];
  languages_spoken: string[];
  verified: boolean;
  connection_status: "none" | "pending" | "accepted" | "rejected" | "cancelled" | "self";
  bio?: string;
  photo_url?: string;
  favourite_movies?: string[];
  favourite_books?: string[];
  favourite_cuisine?: string[];
  favourite_music_genres?: string[];
  pets?: string[];
  ideal_weekend_activity?: string;
  email?: string;
  phone_number?: string;
}

type Tab = "explore" | "browse" | "bookings" | "connections";

export default function CoupleDashboard() {
  const [tab, setTab] = useState<Tab>("explore");
  const [couples, setCouples] = useState<ExploreCouple[]>([]);
  const [locationFilter, setLocationFilter] = useState("");
  const [interestFilter, setInterestFilter] = useState("");
  const [listings, setListings] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [connections, setConnections] = useState<ConnectionRequestItem[]>([]);
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<ExploreCouple | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  async function handleViewProfile(coupleId: string) {
    setProfileLoading(true);
    setMessage("");
    try {
      const data = await apiRequest(`/couples/${coupleId}`);
      setSelectedProfile(data);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not load profile");
    } finally {
      setProfileLoading(false);
    }
  }

  async function loadCouples() {
    const params = new URLSearchParams();
    if (locationFilter) params.set("location", locationFilter);
    if (interestFilter) params.set("interest", interestFilter);
    const query = params.toString() ? `?${params.toString()}` : "";
    const data = await apiRequest(`/couples${query}`);
    setCouples(data);
  }

  async function loadListings() {
    const query = category ? `?category=${category}` : "";
    const data = await apiRequest(`/listings${query}`);
    setListings(data.data);
  }

  async function loadBookings() {
    const data = await apiRequest("/bookings/my");
    setBookings(data);
  }

  async function loadConnections() {
    const data = await apiRequest("/connections/my");
    setConnections(data);
  }

  useEffect(() => {
    setMessage("");
    if (tab === "explore") loadCouples();
    if (tab === "browse") loadListings();
    if (tab === "bookings") loadBookings();
    if (tab === "connections") loadConnections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, category, locationFilter, interestFilter]);

  async function handleBook(listingId: string) {
    setMessage("");
    try {
      await apiRequest("/bookings", { method: "POST", body: { listing_id: listingId } });
      setMessage("Booked successfully.");
      loadListings();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Booking failed");
    }
  }

  async function handleCancelBooking(id: string) {
    await apiRequest(`/bookings/${id}/cancel`, { method: "PATCH" });
    loadBookings();
  }

  async function handleConnect(targetCoupleId: string) {
    setMessage("");
    try {
      await apiRequest("/connections", { method: "POST", body: { target_couple_id: targetCoupleId } });
      setMessage("Connection request sent.");
      loadCouples();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to send request");
    }
  }

  async function handleBlock(targetCoupleId: string) {
    setMessage("");
    try {
      await apiRequest("/connections/block", { method: "POST", body: { target_couple_id: targetCoupleId } });
      setMessage("Couple blocked.");
      loadCouples();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to block");
    }
  }

  async function handleReportCouple(targetCoupleId: string) {
    const reason = window.prompt("What's the reason for this report?");
    if (!reason) return;
    setMessage("");
    try {
      await apiRequest("/reports", { method: "POST", body: { reported_couple_id: targetCoupleId, reason } });
      setMessage("Report submitted.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to submit report");
    }
  }

  async function handleReportListing(listingId: string) {
    const reason = window.prompt("What's the reason for this report?");
    if (!reason) return;
    setMessage("");
    try {
      await apiRequest("/reports", { method: "POST", body: { reported_listing_id: listingId, reason } });
      setMessage("Report submitted.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to submit report");
    }
  }

  async function handleConnectionAction(id: string, action: "accept" | "reject" | "cancel") {
    await apiRequest(`/connections/${id}/${action}`, { method: "PATCH" });
    loadConnections();
  }

  function connectButtonFor(couple: ExploreCouple) {
    switch (couple.connection_status) {
      case "none":
        return <button onClick={() => handleConnect(couple.id)}>Connect</button>;
      case "pending":
        return <button disabled>Request pending</button>;
      case "accepted":
        return <button disabled>Connected</button>;
      case "rejected":
      case "cancelled":
        return <button onClick={() => handleConnect(couple.id)}>Connect</button>;
      default:
        return null;
    }
  }

  return (
    <div className="dashboard">
      <h1>Couple Dashboard</h1>

      <div className="tabs">
        <button className={tab === "explore" ? "tab active" : "tab"} onClick={() => setTab("explore")}>Explore Couples</button>
        <button className={tab === "browse" ? "tab active" : "tab"} onClick={() => setTab("browse")}>Browse Listings</button>
        <button className={tab === "bookings" ? "tab active" : "tab"} onClick={() => setTab("bookings")}>My Bookings</button>
        <button className={tab === "connections" ? "tab active" : "tab"} onClick={() => setTab("connections")}>Connections</button>
      </div>

      {message && <p className="info-text">{message}</p>}

      {tab === "explore" && (
        <div>
          <div className="filter-row">
            <label>
              Location
              <input
                type="text"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                placeholder="Filter by city"
              />
            </label>
            <label>
              Interest
              <input
                type="text"
                value={interestFilter}
                onChange={(e) => setInterestFilter(e.target.value)}
                placeholder="e.g. hiking"
              />
            </label>
          </div>
          {couples.length === 0 ? (
            <p className="empty-state">No other couples found yet.</p>
          ) : (
            <div className="card-grid">
              {couples.map((c) => (
                <div className="card" key={c.id}>
                  <h3>{c.display_name}{c.verified && " \u2713"}</h3>
                  <p className="card-meta">{c.location}</p>
                  {c.interests.length > 0 && <p className="card-meta">Interests: {c.interests.join(", ")}</p>}
                  {c.languages_spoken.length > 0 && <p className="card-meta">Speaks: {c.languages_spoken.join(", ")}</p>}
                  {c.connection_status === "accepted" && c.bio && <p>{c.bio}</p>}
                  {c.connection_status === "accepted" && (
                    <>
                      <p className="card-meta">Email: {c.email}</p>
                      <p className="card-meta">Phone: {c.phone_number}</p>
                    </>
                  )}
                  <div className="button-row">
                    <button onClick={() => handleViewProfile(c.id)}>View profile</button>
                    {connectButtonFor(c)}
                    {c.connection_status !== "accepted" && (
                      <button onClick={() => handleBlock(c.id)}>Block</button>
                    )}
                    <button onClick={() => handleReportCouple(c.id)}>Report</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "browse" && (
        <div>
          <div className="filter-row">
            <label>
              Category
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">All</option>
                <option value="event">Event</option>
                <option value="activity">Activity</option>
              </select>
            </label>
          </div>
          {listings.length === 0 ? (
            <p className="empty-state">No listings found.</p>
          ) : (
            <div className="card-grid">
              {listings.map((listing) => (
                <div className="card" key={listing.id}>
                  <span className="tag">{listing.category}</span>
                  <h3>{listing.title}</h3>
                  <p className="card-meta">{listing.location}</p>
                  <p>{listing.description}</p>
                  <p className="card-meta">{new Date(listing.event_date).toLocaleString()}</p>
                  <p className="card-meta">Capacity {listing.capacity}</p>
                  <div className="button-row">
                    <button onClick={() => handleBook(listing.id)}>Book</button>
                    <button onClick={() => handleReportListing(listing.id)}>Report</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "bookings" && (
        <div className="card-grid">
          {bookings.length === 0 ? (
            <p className="empty-state">You have no bookings yet.</p>
          ) : (
            bookings.map((b) => (
              <div className="card" key={b.id}>
                <h3>{b.listing.title}</h3>
                <p className="card-meta">Status: {b.status}</p>
                <p className="card-meta">{new Date(b.listing.event_date).toLocaleString()}</p>
                {b.status === "confirmed" && (
                  <button onClick={() => handleCancelBooking(b.id)}>Cancel booking</button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === "connections" && (
        <div>
          {connections.length === 0 ? (
            <p className="empty-state">No connection requests yet. Try the Explore Couples tab.</p>
          ) : (
            <div className="card-grid">
              {connections.map((c) => (
                <div className="card" key={c.id}>
                  <p>Requester: {c.requester.name} &amp; {c.requester.partner_name}</p>
                  <p>Target: {c.target.name} &amp; {c.target.partner_name}</p>
                  <p className="card-meta">Status: {c.status}</p>
                  {c.status === "pending" && (
                    <div className="button-row">
                      <button onClick={() => handleConnectionAction(c.id, "accept")}>Accept</button>
                      <button onClick={() => handleConnectionAction(c.id, "reject")}>Reject</button>
                      <button onClick={() => handleConnectionAction(c.id, "cancel")}>Cancel</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {profileLoading && <p className="info-text">Loading profile...</p>}

      {selectedProfile && (
        <div className="modal-backdrop" onClick={() => setSelectedProfile(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedProfile(null)}>×</button>
            <h2>{selectedProfile.display_name}{selectedProfile.verified && " ✓"}</h2>
            <p className="card-meta">{selectedProfile.location}</p>
            {selectedProfile.interests.length > 0 && (
              <p className="card-meta">Interests: {selectedProfile.interests.join(", ")}</p>
            )}
            {selectedProfile.languages_spoken.length > 0 && (
              <p className="card-meta">Speaks: {selectedProfile.languages_spoken.join(", ")}</p>
            )}
            {selectedProfile.connection_status === "accepted" || selectedProfile.connection_status === "self" ? (
              <>
                <p>{selectedProfile.bio || "No bio added yet."}</p>
                {selectedProfile.favourite_movies && selectedProfile.favourite_movies.length > 0 && (
                  <p className="card-meta">Favourite movies: {selectedProfile.favourite_movies.join(", ")}</p>
                )}
                {selectedProfile.favourite_books && selectedProfile.favourite_books.length > 0 && (
                  <p className="card-meta">Favourite books: {selectedProfile.favourite_books.join(", ")}</p>
                )}
                {selectedProfile.favourite_cuisine && selectedProfile.favourite_cuisine.length > 0 && (
                  <p className="card-meta">Favourite cuisine: {selectedProfile.favourite_cuisine.join(", ")}</p>
                )}
                {selectedProfile.favourite_music_genres && selectedProfile.favourite_music_genres.length > 0 && (
                  <p className="card-meta">Favourite music: {selectedProfile.favourite_music_genres.join(", ")}</p>
                )}
                {selectedProfile.pets && selectedProfile.pets.length > 0 && (
                  <p className="card-meta">Pets: {selectedProfile.pets.join(", ")}</p>
                )}
                {selectedProfile.ideal_weekend_activity && (
                  <p className="card-meta">Ideal weekend: {selectedProfile.ideal_weekend_activity}</p>
                )}
                {(selectedProfile.email || selectedProfile.phone_number) && (
                  <>
                    <p className="card-meta">Email: {selectedProfile.email}</p>
                    <p className="card-meta">Phone: {selectedProfile.phone_number}</p>
                  </>
                )}
              </>
            ) : (
              <p className="empty-state">Full profile is visible once a connection request is accepted.</p>
            )}
            {selectedProfile.connection_status !== "self" && (
              <div className="button-row">
                {connectButtonFor(selectedProfile)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
