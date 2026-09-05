import "reflect-metadata";
import express from "express";
import cors from "cors";
import { AppDataSource } from "./data-source";
import authRoutes from "./routes/auth.routes";
import listingRoutes from "./routes/listing.routes";
import bookingRoutes from "./routes/booking.routes";
import connectionRequestRoutes from "./routes/connectionRequest.routes";
import reportRoutes from "./routes/report.routes";
import coupleRoutes from "./routes/couple.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/connections", connectionRequestRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/couples", coupleRoutes);

const PORT = process.env.PORT || 4000;

AppDataSource.initialize()
  .then(() => {
    console.log("Data Source has been initialized!");
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error during Data Source initialization:", err);
  });