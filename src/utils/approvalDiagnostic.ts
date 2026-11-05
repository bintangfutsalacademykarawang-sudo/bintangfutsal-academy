import { getIdTokenResult } from 'firebase/auth';
import { auth, approveStudentRegistration } from '../firebase';
import { ApprovalDiagnosticResult } from '../types';

export const ALLOWLISTED_ADMIN_UIDS = [
  'UbYPHGfX3gTL8H38GTg50nATd042',
  'h826b0NzwyRePEG2TvWCekIw7AG2',
];

/**
 * Executes student registration approval while gathering forensic diagnostic telemetry
 * tailored for display on Android mobile devices.
 * 
 * Guarantees:
 * 1. Executes approveStudentRegistration EXACTLY ONCE per invocation.
 * 2. Checks active Firebase Auth currentUser UID and matches against official allowlist.
 * 3. Inspects custom claims via forced token refresh (`getIdTokenResult(user, true)`).
 * 4. Preserves boolean false values for claims without converting to null.
 * 5. Captures native Firestore error name, code, and message on transaction rejection.
 * 6. Records checkTimestamp and transactionTimestamp separately.
 */
export async function runApprovalWithDiagnostics(
  studentId: string,
  adminName: string = 'Admin BFA'
): Promise<{ result: ApprovalDiagnosticResult; success: boolean }> {
  const checkTimestamp = new Date().toISOString();
  const currentUser = auth.currentUser;
  const adminUid = currentUser?.uid || 'TIDAK_TERAUTENTIKASI';
  const isAllowlistedUid = ALLOWLISTED_ADMIN_UIDS.includes(adminUid);

  let claimsCheckFailed = false;
  let claimsErrorMessage: string | undefined = undefined;
  let rawClaims: Record<string, any> | null = null;

  if (currentUser) {
    try {
      // Force refresh ID token to obtain fresh claims from Firebase Auth server
      const tokenResult = await getIdTokenResult(currentUser, true);
      rawClaims = tokenResult.claims || {};
    } catch (err: any) {
      claimsCheckFailed = true;
      claimsErrorMessage = err?.message || String(err);
    }
  } else {
    claimsCheckFailed = true;
    claimsErrorMessage = 'Tidak ada currentUser aktif di Firebase Auth runtime SDK.';
  }

  // Extract claims preserving boolean false values
  const roleVal = rawClaims && ('role' in rawClaims) ? rawClaims.role : null;
  const adminVal = rawClaims && ('admin' in rawClaims) ? rawClaims.admin : null;

  let promiseStatus: 'RESOLVED' | 'REJECTED' = 'RESOLVED';
  let errorDetails: { name: string; code: string; message: string } | undefined = undefined;
  let success = false;

  try {
    // Run Firestore approval transaction EXACTLY ONCE
    await approveStudentRegistration(studentId, adminName);
    promiseStatus = 'RESOLVED';
    success = true;
  } catch (err: any) {
    promiseStatus = 'REJECTED';
    success = false;
    errorDetails = {
      name: err?.name || 'Error',
      code: err?.code || 'unknown_code',
      message: err?.message || String(err),
    };
  }

  const transactionTimestamp = new Date().toISOString();

  const diagnosticResult: ApprovalDiagnosticResult = {
    checkTimestamp,
    transactionTimestamp,
    adminUid,
    isAllowlistedUid,
    claimsCheckFailed,
    ...(claimsErrorMessage ? { claimsErrorMessage } : {}),
    claims: {
      role: roleVal !== undefined ? roleVal : null,
      admin: adminVal !== undefined ? adminVal : null,
    },
    promiseStatus,
    ...(errorDetails ? { errorDetails } : {}),
  };

  return { result: diagnosticResult, success };
}
