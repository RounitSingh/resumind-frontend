
import axios from "axios";
import {
  mapDetail,
  mapSummary,
  type ApiCustomizationDetail,
  type ApiCustomizationSummary,
} from "@/lib/adapters";
import type {
  CoverLetter,
  CreateCustomizationBody,
  CustomizationDetail,
  CustomizationSummary,
  ExportFormat,
  Page,
  ResumeSummary,
  Tone,
  UploadedResume,
} from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";

// Axios setup
const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!baseURL) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL is missing");
}

const http = axios.create({
  baseURL: baseURL.replace(/\/+$/, ""),
  withCredentials: true,
});

// Used only for authentication refresh requests
const authHttp = axios.create({
  baseURL: baseURL.replace(/\/+$/, ""),
  withCredentials: true,
});

// API error: a plain Error carrying the backend's error fields (no class).
// status 0 means the request never got a response (offline / server down).
export type ApiError = Error & {
  isApiError: true
  status: number
  code: string
  details?: unknown
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof Error && (error as Partial<ApiError>).isApiError === true
}

const FALLBACK_MESSAGE = "Something went wrong. Please try again."

function createApiError(
  status: number,
  code: string,
  message: string,
  details?: unknown
): ApiError {
  return Object.assign(new Error(message), { isApiError: true as const, status, code, details })
}

// Turns anything thrown by axios into an ApiError.
async function toApiError(error: unknown): Promise<ApiError> {
  if (isApiError(error)) return error
  if (!axios.isAxiosError(error)) {
    return createApiError(0, "UNKNOWN", error instanceof Error ? error.message : FALLBACK_MESSAGE)
  }
  if (!error.response) {
    return createApiError(0, "NETWORK", "Can't reach the server. Check your connection and try again.")
  }

  let body = error.response.data
  if (body instanceof Blob) {
    body = await body.text().then(JSON.parse).catch(() => null) // blob downloads (exports)
  }

  return createApiError(
    error.response.status,
    body?.error?.code ?? "UNKNOWN",
    body?.error?.message ?? `Request failed (${error.response.status})`,
    body?.error?.details
  )
}

export function getErrorMessage(error: unknown): string {
  if (isApiError(error) || error instanceof Error) return error.message || FALLBACK_MESSAGE
  return FALLBACK_MESSAGE
}

// Auth requests: failures also surface as ApiError
authHttp.interceptors.response.use(undefined, async (error) => {
  throw await toApiError(error);
});

// Attach access token to requests
http.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Refresh expired access token and retry once
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (
      error.response?.status !== 401 ||
      !original ||
      original._retried
    ) {
      throw await toApiError(error);
    }

    original._retried = true;

    try {
      const response = await authHttp.post("/api/auth/refresh");
      const token = response.data.accessToken;

      if (!token) {
        throw new Error("Unable to refresh session");
      }

      useAuthStore.setState({ accessToken: token });

      original.headers.Authorization = `Bearer ${token}`;

      return http(original);
    } catch (refreshError) {
      useAuthStore.getState().expire();
      throw await toApiError(refreshError);
    }
  }
);

// Authentication APIs
export type AuthUser = {
  id: string;
  email: string;
  role: "user" | "admin";
  createdAt: string;
};
export type AuthResponse = { user: AuthUser; accessToken: string };

// Debug logging for login/register (visible in the browser console, also in production).
// Never logs the password or tokens.
async function loggedAuthCall(
  action: "login" | "register",
  email: string,
  password: string
): Promise<AuthResponse> {
  const url = `${authHttp.defaults.baseURL}/api/auth/${action}`;
  console.log(`[auth:${action}] request`, { url, email });

  try {
    const { data } = await authHttp.post<AuthResponse>(`/api/auth/${action}`, { email, password });
    console.log(`[auth:${action}] success`, { userId: data.user.id, role: data.user.role });
    return data;
  } catch (error) {
    if (isApiError(error)) {
      console.error(`[auth:${action}] failed`, {
        url,
        status: error.status,
        code: error.code,
        message: error.message,
        details: error.details,
      });
    } else {
      console.error(`[auth:${action}] failed`, { url, error });
    }
    throw error;
  }
}

export const authApi = {
  login: (email: string, password: string) =>
    loggedAuthCall("login", email, password),

  register: (email: string, password: string) =>
    loggedAuthCall("register", email, password),

  refresh: () =>
    authHttp.post<AuthResponse>("/api/auth/refresh").then((r) => r.data),

  logout: () =>
    authHttp.post("/api/auth/logout").then((r) => r.data),
};

// Pagination
type PageQuery = {
  offset?: number;
  limit?: number;
};

// Resume and customization APIs
export const api = {
  uploadResume: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    return http.post<UploadedResume>("/api/resumes", formData)
      .then((r) => r.data);
  },

  listResumes: (params: PageQuery = {}) =>
    http.get<Page<ResumeSummary>>("/api/resumes", { params })
      .then((r) => r.data),

  getResume: (id: string) =>
    http.get<ResumeSummary>(`/api/resumes/${id}`)
      .then((r) => r.data),

  deleteResume: (id: string) =>
    http.delete(`/api/resumes/${id}`).then(() => undefined),

  createCustomization: (body: CreateCustomizationBody) =>
    http.post<{ id: string }>("/api/customizations", body)
      .then((r) => r.data),

  listCustomizations: (
    params: PageQuery & { resumeId?: string } = {}
  ) =>
    http.get<Page<ApiCustomizationSummary>>(
      "/api/customizations",
      { params }
    ).then((r): Page<CustomizationSummary> => ({
      ...r.data,
      items: r.data.items.map(mapSummary),
    })),

  getCustomization: (id: string): Promise<CustomizationDetail> =>
    http.get<ApiCustomizationDetail>(`/api/customizations/${id}`)
      .then((r) => mapDetail(r.data)),

  tailorCustomization: (id: string) =>
    http.post(`/api/customizations/${id}/tailor`)
      .then(() => undefined),

  generateCoverLetter: (id: string, tone: Tone) =>
    http.post<CoverLetter>(
      `/api/customizations/${id}/cover-letter`,
      { tone }
    ).then((r) => r.data),

  exportResume: async (id: string, format: ExportFormat) => {
    const response = await http.get<Blob>(
      `/api/customizations/${id}/export`,
      {
        params: { format },
        responseType: "blob",
      }
    );

    return {
      blob: response.data,
      fileName: `resume.${format}`,
    };
  },
};
