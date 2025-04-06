export async function fetchTables() {
    try {
      const res = await fetch("http://localhost:4000/database/old/table");
      if (!res.ok) {
        throw new Error("Hiba a fetch-ben");
      }
      const data = await res.json();
      return data;
    } catch (error) {
      console.error("Failed to load tables:", error);
      throw error;
    }
  }
  