import app from "./app";

export default app;
// Just export the app for Vercel. The server will be started by Vercel when deployed, and we don't want to start it here when running in a different context (like tests or local development with hot reload).
