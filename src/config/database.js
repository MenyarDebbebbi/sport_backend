const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/sport_app",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );

    console.log(`✅ MongoDB connecté: ${conn.connection.host}`);

    // Gestion des événements de connexion
    mongoose.connection.on("error", (err) => {
      console.error("❌ Erreur de connexion MongoDB:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("⚠️ MongoDB déconnecté");
    });

    // Gestion de l'arrêt propre
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("🔌 Connexion MongoDB fermée");
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Erreur de connexion à MongoDB:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
