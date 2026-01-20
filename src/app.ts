import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import _globals from "./config/_globals";
import { initializeDatabase } from "./config/_database";
import logger from "./config/_logger";
import validateJSON from "./middleware/app/validateJSON";
import appRouter from "./routers/_appRouter";

// Load environment variables
dotenv.config(
  process.env.NODE_ENV === "production"
    ? { path: ".env.production" }
    : { path: ".env.development" }
);

// Create an Express app
const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(validateJSON);

// App Router
app.use("/", appRouter);

// Initialize database and start the server
initializeDatabase().then(() => {
  app.listen(process.env.PORT, () => {
    logger.info(`Server is running on port ${process.env.PORT}`);
    logger.info(`MODE: ${process.env.MODE}`);

    _globals?.FOLDERS?.forEach((DIR) => {
      if (!fs.existsSync(DIR)) {
        fs.mkdirSync(DIR);
      }
    });
  });
}).catch((error) => {
  logger.error("Failed to start server: " + error.message);
  process.exit(1);
});
