/**
 * BFA HUB — FRONTEND BACKEND API ADAPTER
 * Mode: STAGING-FIRST · FAIL-CLOSED · NO SILENT FALLBACK
 * 
 * Adapter frontend untuk berkomunikasi dengan Trusted Backend API Staging (/api/*).
 * Melarang keras fallback semu ke direct Firestore write jika backend gagal.
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  [key: string]: any;
}

const API_BASE = '/api';

function getAuthHeaders(token?: string): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function callBackendApi<T = any>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST',
  body?: any,
  token?: string
): Promise<T> {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, {
      method,
      headers: getAuthHeaders(token),
      body: body ? JSON.stringify(body) : undefined,
    });

    const contentType = response.headers.get('content-type') || '';
    const rawText = await response.text();
    let data: any = null;

    if (rawText && rawText.trim().length > 0) {
      if (contentType.includes('application/json') || rawText.trim().startsWith('{') || rawText.trim().startsWith('[')) {
        try {
          data = JSON.parse(rawText);
        } catch (parseErr) {
          console.warn(`[BackendApiAdapter] Tanggapan bukan format JSON valid dari ${endpoint}:`, parseErr);
        }
      }
    }

    if (!response.ok) {
      const serverMsg =
        data?.error?.message ||
        data?.message ||
        (typeof data?.error === 'string' ? data.error : null) ||
        (rawText && rawText.length < 200 && !rawText.includes('<html') ? rawText.trim() : null) ||
        `Layanan backend memberikan status HTTP ${response.status} (${response.statusText || 'Error'}).`;
      throw new Error(serverMsg);
    }

    if (!data) {
      throw new Error(`Tanggapan dari backend tidak berupa format JSON yang valid (HTTP ${response.status}).`);
    }

    return data as T;
  } catch (err: any) {
    console.error(`[BackendApiAdapter] Error calling ${endpoint}:`, err);
    throw new Error(err.message || 'Koneksi ke backend staging gagal. Transaksi dibatalkan (Fail-Closed).');
  }
}

/**
 * API Methods
 */
export const backendApi = {
  healthCheck: () => callBackendApi('/health', 'GET'),
  
  loginAdmin: (email: string, password: string, isActive: boolean = true) => 
    callBackendApi('/auth/login-admin', 'POST', { email, password, isActive }),

  loginParent: (phone: string, studentId?: string, password?: string) => 
    callBackendApi('/auth/login-parent', 'POST', { phone, studentId, password }),

  registerStudent: (payload: any, token?: string) => 
    callBackendApi('/students/register', 'POST', payload, token),

  recordAttendance: (payload: any, token: string) => 
    callBackendApi('/attendance/record', 'POST', payload, token),

  payInvoice: (payload: any, token: string) => 
    callBackendApi('/invoices/pay', 'POST', payload, token),

  approvePaymentVerification: (payload: any, token: string) => 
    callBackendApi('/payment-verifications/approve', 'POST', payload, token),
};
