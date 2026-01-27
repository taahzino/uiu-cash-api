import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";
import fs, { existsSync } from "fs";
import _globals from "./config/_globals";
import { initializeDatabase } from "./config/_database";
import logger from "./config/_logger";
import validateJSON from "./middleware/app/validateJSON";
import appRouter from "./routers/_appRouter";
import path from "path";

// Load environment variables
dotenv.config(
  process.env.NODE_ENV === "production"
    ? { path: ".env.production" }
    : { path: ".env.development" }
);

// Check for required PEM files in root directory
const rootDir = path.join(__dirname, "..");
const privatePemPath = path.join(rootDir, "private.pem");
const publicPemPath = path.join(rootDir, "public.pem");

if (!existsSync(privatePemPath)) {
  logger.error("❌ FATAL ERROR: private.pem file not found in root directory");
  logger.error(`Expected path: ${privatePemPath}`);
  process.exit(1);
}

if (!existsSync(publicPemPath)) {
  logger.error("❌ FATAL ERROR: public.pem file not found in root directory");
  logger.error(`Expected path: ${publicPemPath}`);
  process.exit(1);
}

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
