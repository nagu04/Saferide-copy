const BASE_URL = "https://saferide-backend-1tqc.onrender.com";

function getToken() {
  return localStorage.getItem("access_token");
}

// GET ALL VIOLATIONS (USER-SCOPED LATER)
export const fetchViolations = async () => {
  const token = getToken();

  const res = await fetch(`${BASE_URL}/api/user/violations`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Failed to fetch violations");

  return await res.json();
};

// GET RECENT USER VIOLATIONS (we will improve backend later)
export async function fetchRecentViolations(limit = 3) {
  const res = await fetch(`${BASE_URL}/api/dashboard/recent?limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  });

  if (!res.ok) throw new Error("Failed to fetch recent violations");
  return res.json();
}