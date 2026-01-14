import { appCheck, auth } from "@/lib/firebase";
import type { InternalAxiosRequestConfig } from "axios";
import axios from "axios";
import { getToken } from "firebase/app-check";

const secureAxios = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 15000,
});
secureAxios.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      if (appCheck) {
        try {
          const { token } = await getToken(appCheck, false);
          config.headers.set("X-Firebase-AppCheck", token);
        } catch (err) {
          console.warn("App Check token error", err);
        }
      }
    } catch (err) {
      console.warn("App Check token error", err);
    }
    const user = auth.currentUser;
    if (user) {
      const idToken = await user.getIdToken();
      config.headers.set("Authorization", `Bearer ${idToken}`);
    }
    return config;
  },
  error => Promise.reject(error)
);

export default secureAxios;
