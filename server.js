require('dotenv').config();
const express = require('express');
const cors = require('cors');
const prisma = require('./src/config/db');
const authRoutes = require('./src/routes/auth.routes');
const newsRoutes = require('./src/routes/news.routes');
const discussionRoutes = require('./src/routes/discussion.routes');
const communityRoutes = require('./src/routes/community.routes');
const logger = require('./src/utils/logger');
const { io, app, server } = require('./src/config/socket');


app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});


app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    socket: io.engine.clientsCount ? "connected" : "disconnected",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/discussions", discussionRoutes);
app.use("/api/communities", communityRoutes);


app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});


function gracefulShutdown() {
  logger.info("Shutting down gracefully...");
  server.close(async () => {
    await prisma.$disconnect();
    logger.info("Disconnected from DB and closed HTTP server");
    process.exit(0);
  });

  setTimeout(() => {
    logger.error("Forced shutdown");
    process.exit(1);
  }, 5000);
}

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);


const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  logger.info(`Server running on port ${PORT}`);
  try {
    await prisma.$connect();
    logger.info("Connected to MongoDB");
  } catch (err) {
    logger.error("MongoDB connection error:", err);
  }
});


module.exports = { app, server };
