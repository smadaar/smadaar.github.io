import { API_URL } from "./config.js";

export async function loadRoadtrip() {
    const response = await fetch(API_URL, {
        cache: "no-store"
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
}