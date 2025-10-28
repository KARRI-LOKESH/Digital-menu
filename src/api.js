// src/api.js
import axios from "axios";

export const getCsrfToken = async () => {
  const res = await axios.get("http://127.0.0.1:8000/api/get-csrf-token/", { withCredentials: true });
  return res.data.csrfToken;
};
