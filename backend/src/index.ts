import app from "./app";

const port = Number(process.env.BACKEND_PORT || 3001);

// Start the server (only if this file is run directly, not imported as a module)
const server = app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});