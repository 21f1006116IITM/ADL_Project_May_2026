import { useEffect, useState, FormEvent } from "react";
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
  couple: { id: string; name: string; partner_name: string };
}

export default function OrganizerDashboard() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [message, setMessage] = useState("");
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [category, setCategory] = useState<"event" | "activity">("event");
  const [capacity, setCapacity] = useState(10);
  const [location, setLocation] = useState("");

  async function loadMyListings() {
    const data = await apiRequest("/listings/mine");
    setListings(data);
  }

  useEffect(() => {
    loadMyListings();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    try {
      const created = await apiRequest("/listings", {
        method: "POST",
        body: {
          title,
          description,
          event_date: new Date(eventDate).toISOString(),
          category,
          capacity: Number(capacity),
          location,
        },
      });
      setListings((prev) => [...prev, created]);
      setMessage("Listing created.");
      setTitle("");
      setDescription("");
      setEventDate("");
      setLocation("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to create listing");
    }
  }

  async function handleViewBookings(listingId: string) {
    setSelectedListingId(listingId);
    const data = await apiRequest(`/bookings/listing/${listingId}`);
    setBookings(data);
  }

  async function handleDelete(listingId: string) {
    setMessage("");
    try {
      await apiRequest(`/listings/${listingId}`, { method: "DELETE" });
      setListings((prev) => prev.filter((l) => l.id !== listingId));
      if (selectedListingId === listingId) setSelectedListingId(null);
      setMessage("Listing deleted.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to delete listing");
    }
  }

  async function handleReportCouple(coupleId: string) {
    const reason = window.prompt("What's the reason for this report?");
    if (!reason) return;
    setMessage("");
    try {
      await apiRequest("/reports", { method: "POST", body: { reported_couple_id: coupleId, reason } });
      setMessage("Report submitted.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to submit report");
    }
  }

  return (
    <div className="dashboard">
      <h1>Organizer Dashboard</h1>
      {message && <p className="info-text">{message}</p>}

      <section>
        <h2>Create a Listing</h2>
        <form className="stacked-form" onSubmit={handleCreate}>
          <label>
            Title
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label>
            Description
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
          </label>
          <label>
            Event date
            <input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required />
          </label>
          <label>
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value as "event" | "activity")}>
              <option value="event">Event</option>
              <option value="activity">Activity</option>
            </select>
          </label>
          <label>
            Capacity
            <input type="number" min={1} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} required />
          </label>
          <label>
            Location
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} required />
          </label>
          <button type="submit">Create Listing</button>
        </form>
      </section>

      <section>
        <h2>Your Listings</h2>
        {listings.length === 0 ? (
          <p className="empty-state">You haven't created any listings yet.</p>
        ) : (
          <div className="card-grid">
            {listings.map((listing) => (
              <div className="card" key={listing.id}>
                <span className="tag">{listing.category}</span>
                <h3>{listing.title}</h3>
                <p className="card-meta">{listing.location}</p>
                <p className="card-meta">Capacity {listing.capacity}</p>
                <div className="button-row">
                  <button onClick={() => handleViewBookings(listing.id)}>View bookings</button>
                  <button onClick={() => handleDelete(listing.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {selectedListingId && (
        <section>
          <h2>Bookings</h2>
          {bookings.length === 0 ? (
            <p className="empty-state">No bookings yet for this listing.</p>
          ) : (
            <ul className="simple-list">
              {bookings.map((b) => (
                <li key={b.id}>
                  {b.couple.name} &amp; {b.couple.partner_name} — {b.status}{" "}
                  <button onClick={() => handleReportCouple(b.couple.id)}>Report</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
