// India-specific helpers used by the address forms.

export const INDIAN_STATES = [
  // States
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
  // Union Territories
  "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
  "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

/**
 * Look up an Indian PIN code. Uses the free `api.postalpincode.in` service
 * (no API key required). Returns { city, state, postOffices: [name…] } when
 * found, or null otherwise.
 *
 * The API returns 200 with `Status: "Error"` for invalid pincodes — we treat
 * that as not-found rather than throwing.
 */
export async function lookupPincode(pin) {
  if (!/^\d{6}$/.test(String(pin || "").trim())) return null;
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
    if (!res.ok) return null;
    const data = await res.json();
    const entry = Array.isArray(data) ? data[0] : null;
    if (!entry || entry.Status !== "Success" || !Array.isArray(entry.PostOffice) || entry.PostOffice.length === 0) {
      return null;
    }
    const first = entry.PostOffice[0];
    return {
      city: first.District || "",
      state: first.State || "",
      postOffices: entry.PostOffice.map((p) => p.Name).filter(Boolean),
    };
  } catch (err) {
    console.warn("lookupPincode failed", err);
    return null;
  }
}
