import axios from "axios";

const API = axios.create({
	baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:8000/api/v1",
	withCredentials: true,
	headers: { "Content-Type": "application/json" },
});

API.interceptors.request.use((config) => {
	const token = localStorage.getItem("accessToken");
	if (token) config.headers.Authorization = `Bearer ${token}`;
	return config;
});

let refreshPromise = null;
const excludedRefreshPaths = ["/auth/login", "/auth/register", "/auth/refresh-token"];

API.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;
		const path = originalRequest?.url || "";
		if (
			error.response?.status !== 401 ||
			originalRequest?._retry ||
			excludedRefreshPaths.some((excluded) => path.includes(excluded))
		) {
			return Promise.reject(error);
		}

		originalRequest._retry = true;
		try {
			refreshPromise ||= API.post("/auth/refresh-token");
			const response = await refreshPromise;
			const accessToken = response.data?.data?.accessToken;
			if (!accessToken) throw new Error("Refresh response did not include an access token");
			localStorage.setItem("accessToken", accessToken);
			originalRequest.headers.Authorization = `Bearer ${accessToken}`;
			return API(originalRequest);
		} catch (refreshError) {
			localStorage.removeItem("accessToken");
			window.location.href = "/login";
			return Promise.reject(refreshError);
		} finally {
			refreshPromise = null;
		}
	},
);

export default API;

export const loginUser = (data) => API.post("/auth/login", data);
export const registerUser = (data) => API.post("/auth/register", data);
export const logoutUser = () => API.post("/auth/logout");
export const getAllSkills = () => API.get("/skills");
export const saveSkills = (data) => API.post("/user-skills", data);
export const getUserSkills = () => API.get("/user-skills/me");
export const getProgress = () => API.get("/progress");
export const getRequests = () => API.get("/requests");
