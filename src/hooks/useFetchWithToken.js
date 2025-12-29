import { useState, useEffect } from "react";

const useFetchWithToken = (url) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token"); // Lấy token từ localStorage

      if (!token) {
        console.warn("⚠️ Token not found for URL:", url);
        setError("Token not found");
        setLoading(false);
        return;
      }

      try {
        const authHeader = token.startsWith("Bearer ")
          ? token
          : `Bearer ${token}`;
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          console.warn(`⚠️ Fetch failed for ${url}: ${response.status}`);
          throw new Error(`Failed to fetch data: ${response.status}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error };
};

export default useFetchWithToken;
