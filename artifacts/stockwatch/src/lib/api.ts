// Always use mock API for GitHub Pages deployment
// This allows the app to work on static hosting without a backend server
import { mockApi } from "./mockApi";

// Log to confirm mock API is being used
console.log("[StockWatch] Using mock API for GitHub Pages deployment");

export const api = mockApi;
