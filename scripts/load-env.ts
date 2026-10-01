// Import this first: loads .env.local (preferred) then .env (fallback) without overriding already-set vars.
import { config } from "dotenv";

config({ path: ".env.local" });
config();
