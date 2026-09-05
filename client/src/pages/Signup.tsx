import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function toList(value: string): string[] {
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<"couple" | "organizer">("couple");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Mandatory couple fields
  const [name, setName] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [location, setLocation] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [interests, setInterests] = useState("");
  const [languages, setLanguages] = useState("");

  // Optional couple fields
  const [favouriteMovies, setFavouriteMovies] = useState("");
  const [favouriteBooks, setFavouriteBooks] = useState("");
  const [favouriteCuisine, setFavouriteCuisine] = useState("");
  const [favouriteMusicGenres, setFavouriteMusicGenres] = useState("");
  const [pets, setPets] = useState("");
  const [idealWeekendActivity, setIdealWeekendActivity] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload: Record<string, unknown> = { email, password, role };
      if (role === "couple") {
        payload.name = name;
        payload.partner_name = partnerName;
        payload.location = location;
        payload.phone_number = phoneNumber;
        payload.interests = toList(interests);
        payload.languages_spoken = toList(languages);

        if (favouriteMovies) payload.favourite_movies = toList(favouriteMovies);
        if (favouriteBooks) payload.favourite_books = toList(favouriteBooks);
        if (favouriteCuisine) payload.favourite_cuisine = toList(favouriteCuisine);
        if (favouriteMusicGenres) payload.favourite_music_genres = toList(favouriteMusicGenres);
        if (pets) payload.pets = toList(pets);
        if (idealWeekendActivity) payload.ideal_weekend_activity = idealWeekendActivity;
      }
      await signup(payload);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Sign up</h1>
        {error && <p className="error-text">{error}</p>}

        <label>
          I am signing up as
          <select value={role} onChange={(e) => setRole(e.target.value as "couple" | "organizer")}>
            <option value="couple">A couple</option>
            <option value="organizer">An organizer</option>
          </select>
        </label>

        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>

        {role === "couple" && (
          <>
            <label>
              Your name
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label>
              Partner's name
              <input type="text" value={partnerName} onChange={(e) => setPartnerName(e.target.value)} required />
            </label>
            <label>
              Location
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} required />
            </label>
            <label>
              Phone number (shown only once a connection is accepted)
              <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
            </label>
            <label>
              Interests (comma separated)
              <input
                type="text"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="hiking, board games, cooking"
                required
              />
            </label>
            <label>
              Languages spoken (comma separated)
              <input
                type="text"
                value={languages}
                onChange={(e) => setLanguages(e.target.value)}
                placeholder="English, German"
                required
              />
            </label>

            <h2 style={{ marginTop: "1.2em" }}>Optional — visible once connected</h2>

            <label>
              Favourite movies (comma separated)
              <input type="text" value={favouriteMovies} onChange={(e) => setFavouriteMovies(e.target.value)} />
            </label>
            <label>
              Favourite books (comma separated)
              <input type="text" value={favouriteBooks} onChange={(e) => setFavouriteBooks(e.target.value)} />
            </label>
            <label>
              Favourite cuisine (comma separated)
              <input type="text" value={favouriteCuisine} onChange={(e) => setFavouriteCuisine(e.target.value)} />
            </label>
            <label>
              Favourite music genres (comma separated)
              <input type="text" value={favouriteMusicGenres} onChange={(e) => setFavouriteMusicGenres(e.target.value)} />
            </label>
            <label>
              Pets (comma separated)
              <input type="text" value={pets} onChange={(e) => setPets(e.target.value)} />
            </label>
            <label>
              Ideal weekend activity
              <input type="text" value={idealWeekendActivity} onChange={(e) => setIdealWeekendActivity(e.target.value)} />
            </label>
          </>
        )}

        <button type="submit" disabled={loading}>{loading ? "Signing up..." : "Sign up"}</button>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}