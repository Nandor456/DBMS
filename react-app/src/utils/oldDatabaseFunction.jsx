export async function fetchDatabases() {
    try {
      const res = await fetch("http://localhost:4000/database/old");
      if (!res.ok) {
        throw new Error("Hiba a fetchDB-ben");
      }
      const data = await res.json();
      return data;
    } catch (error) {
      console.error("Failed to load tables:", error);
      throw error;
    }
}
  

