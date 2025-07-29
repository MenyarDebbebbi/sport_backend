const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
require("dotenv").config();

const connectDB = require("./config/database");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de sécurité et de performance
app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Middleware de logging
app.use(morgan("combined"));

// Middleware pour parser le JSON
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Middleware pour servir les fichiers statiques
app.use("/public", express.static("public"));

// Routes de base
app.get("/", (req, res) => {
  res.json({
    message: "API Sport Backend",
    version: "1.0.0",
    status: "running",
  });
});

// Routes API
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/workouts", require("./routes/workouts"));
app.use("/api/meals", require("./routes/meals"));

// Middleware de gestion d'erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Une erreur interne s'est produite",
    message:
      process.env.NODE_ENV === "development" ? err.message : "Erreur serveur",
  });
});

// Route 404
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route non trouvée",
    path: req.originalUrl,
  });
});

// Démarrage du serveur
const startServer = async () => {
  try {
    // Connexion à la base de données
    await connectDB();

    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur le port ${PORT}`);
      console.log(`📱 Mode: ${process.env.NODE_ENV || "development"}`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Erreur lors du démarrage du serveur:", error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
