require("dotenv").config(
  process.env.NODE_ENV === "production"
    ? { path: ".env.production" }
    : { path: ".env.development" }
);

const { execSync } = require("child_process");

execSync("npx prisma migrate dev", { stdio: "inherit" });
