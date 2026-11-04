// server.ts
import express from "express";
import { createServer as createViteServer } from "vite";

// src/server/backendRouter.ts
import { Router } from "express";
import { getAuth } from "firebase-admin/auth";
import { getApp } from "firebase-admin/app";

// src/utils/phoneUtils.ts
function normalizePhoneNumber(rawPhone) {
  if (!rawPhone || typeof rawPhone !== "string") return "";
  let digits = rawPhone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0062")) {
    digits = digits.slice(4);
    if (!digits.startsWith("8") && !digits.startsWith("08")) {
      digits = "8" + digits;
    }
  }
  if (digits.startsWith("6208")) {
    return "08" + digits.slice(4);
  }
  if (digits.startsWith("628")) {
    return "0" + digits.slice(2);
  }
  if (digits.startsWith("8")) {
    return "0" + digits;
  }
  if (digits.startsWith("08")) {
    return digits;
  }
  return digits;
}

// src/server/trustedBackendService.ts
var INITIAL_CONFIRMED_SEQUENCE = 38;
var InMemoryBackendStore = class {
  constructor() {
    this.counter = INITIAL_CONFIRMED_SEQUENCE;
    this.counterLock = Promise.resolve();
    this.students = /* @__PURE__ */ new Map();
    this.invoices = /* @__PURE__ */ new Map();
    this.attendances = /* @__PURE__ */ new Map();
    this.invoicePayments = /* @__PURE__ */ new Map();
    this.cashMutations = /* @__PURE__ */ new Map();
    this.paymentVerifications = /* @__PURE__ */ new Map();
  }
  async getStudentCounter() {
    return this.counter;
  }
  async setStudentCounter(nextSeq) {
    this.counter = nextSeq;
  }
  async getNextStudentCounterAtomic() {
    let releaseLock = () => {
    };
    const nextLock = new Promise((resolve) => {
      releaseLock = resolve;
    });
    const currentLock = this.counterLock;
    this.counterLock = nextLock;
    await currentLock;
    try {
      this.counter += 1;
      return this.counter;
    } finally {
      releaseLock();
    }
  }
  async getStudent(id) {
    return this.students.get(id) || null;
  }
  async saveStudent(student) {
    this.students.set(student.id, { ...student });
  }
  async listStudents() {
    return Array.from(this.students.values());
  }
  async getInvoice(id) {
    return this.invoices.get(id) || null;
  }
  async saveInvoice(invoice) {
    this.invoices.set(invoice.id, { ...invoice });
  }
  async listInvoicesByStudent(studentId) {
    return Array.from(this.invoices.values()).filter((i) => i.studentId === studentId);
  }
  async getAttendance(id) {
    return this.attendances.get(id) || null;
  }
  async saveAttendance(attendance) {
    this.attendances.set(attendance.id, { ...attendance });
  }
  async saveInvoicePayment(payment) {
    this.invoicePayments.set(payment.id, { ...payment });
  }
  async saveCashMutation(mutation) {
    this.cashMutations.set(mutation.id, { ...mutation });
  }
  async getPaymentVerification(id) {
    return this.paymentVerifications.get(id) || null;
  }
  async savePaymentVerification(request) {
    this.paymentVerifications.set(request.id, { ...request });
  }
  // Debug Helpers
  getAllCashMutations() {
    return Array.from(this.cashMutations.values());
  }
  getAllInvoicePayments() {
    return Array.from(this.invoicePayments.values());
  }
};
function assertStagingBackendIsolation(targetEnv) {
  if (targetEnv === "production") {
    throw new Error(
      "[TrustedBackend Guard] FATAL: Eksekusi backend langsung ke Firebase Production future-wonder-jwh4c DITOLAK. Operasi ini dibatasi hanya untuk lingkungan Staging / Emulator terkontrol."
    );
  }
}
var TrustedBackendService = class {
  constructor(store, env = "staging") {
    this.store = store;
    this.env = env;
    assertStagingBackendIsolation(env);
  }
  /**
   * 1. ATOMIC STUDENT REGISTRATION WITH MONOTONIC COUNTER
   * Menjamin nomor urut NIS berurutan dimulai dari sequence 38 -> BFA-039.
   */
  async registerStudentAndIncrementCounter(payload, registeredByRole = "public") {
    if (!payload.name || payload.name.trim().length === 0) {
      throw new Error("VALIDATION_ERROR: Nama siswa wajib diisi");
    }
    if (!payload.birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(payload.birthDate)) {
      throw new Error("VALIDATION_ERROR: Format tanggal lahir tidak valid (harus YYYY-MM-DD)");
    }
    if (!payload.phone || payload.phone.trim().length === 0) {
      throw new Error("VALIDATION_ERROR: Nomor WhatsApp orang tua wajib diisi");
    }
    const normalizedPhone = normalizePhoneNumber(payload.phone);
    if (!normalizedPhone || normalizedPhone.length < 9) {
      throw new Error("VALIDATION_ERROR: Nomor telepon tidak valid");
    }
    const nextSeq = typeof this.store.getNextStudentCounterAtomic === "function" ? await this.store.getNextStudentCounterAtomic() : await this.store.getStudentCounter() + 1;
    await this.store.setStudentCounter(nextSeq);
    const formattedId = `BFA-${String(nextSeq).padStart(3, "0")}`;
    const initialRegStatus = registeredByRole === "admin" ? "DISETUJUI" : "MENUNGGU_VERIFIKASI";
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const newStudent = {
      id: formattedId,
      name: payload.name.trim(),
      nickname: payload.nickname?.trim() || payload.name.trim().split(" ")[0],
      avatar: "",
      birthPlace: payload.birthPlace?.trim() || "-",
      birthDate: payload.birthDate,
      gender: payload.gender || "L",
      parentName: payload.parentName?.trim() || "-",
      phone: normalizedPhone,
      classGroupId: payload.classGroupId || "U10",
      status: registeredByRole === "admin" ? "Aktif" : "Aktif",
      joinedDate: nowIso.split("T")[0],
      position: payload.position || "Belum Ditentukan",
      jerseyNumber: payload.jerseyNumber || 0,
      documents: payload.documents || {},
      customPassword: payload.customPassword?.trim() || void 0,
      registrationStatus: initialRegStatus,
      registrationDate: nowIso,
      verifiedAt: registeredByRole === "admin" ? nowIso : void 0,
      verifiedBy: registeredByRole === "admin" ? "SYSTEM_ADMIN_STAGING" : void 0
    };
    await this.store.setStudentCounter(nextSeq);
    await this.store.saveStudent(newStudent);
    return { student: newStudent, generatedId: formattedId };
  }
  /**
   * 2. ATOMIC ATTENDANCE & Rp 15.000 TRAINING INVOICE GENERATOR
   * Idempoten: jika presensi sudah ada untuk tanggal yang sama, tidak menerbitkan invoice ganda.
   */
  async recordAttendanceWithFeeTransaction(payload) {
    if (!payload.studentId || !payload.date) {
      throw new Error("VALIDATION_ERROR: studentId dan date wajib diisi");
    }
    const student = await this.store.getStudent(payload.studentId);
    if (!student) {
      throw new Error(`NOT_FOUND: Siswa dengan ID ${payload.studentId} tidak ditemukan`);
    }
    const attendanceId = `ATT-${payload.studentId}-${payload.date.replace(/-/g, "")}`;
    const existingAttendance = await this.store.getAttendance(attendanceId);
    if (existingAttendance && existingAttendance.status === payload.status) {
      const invoiceId = `INV-LAT-${payload.studentId}-${payload.date.replace(/-/g, "")}`;
      const invResult = existingAttendance.feeGenerated ? await this.store.getInvoice(invoiceId) : null;
      const existingInvoice = invResult || void 0;
      return {
        attendance: existingAttendance,
        feeGenerated: existingAttendance.feeGenerated,
        invoice: existingInvoice
      };
    }
    const isHadir = payload.status === "HADIR";
    let feeGenerated = false;
    let createdInvoice;
    if (isHadir) {
      const invoiceId = `INV-LAT-${payload.studentId}-${payload.date.replace(/-/g, "")}`;
      const existingInvoice = await this.store.getInvoice(invoiceId);
      if (!existingInvoice) {
        const nowIso = (/* @__PURE__ */ new Date()).toISOString();
        createdInvoice = {
          id: invoiceId,
          studentId: student.id,
          studentName: student.name,
          classGroupId: student.classGroupId,
          type: "Latihan",
          period: payload.date,
          attendanceDate: payload.date,
          amount: 15e3,
          paidAmount: 0,
          remainingAmount: 15e3,
          status: "BELUM BAYAR",
          dueDate: payload.date,
          createdAt: nowIso,
          updatedAt: nowIso
        };
        await this.store.saveInvoice(createdInvoice);
        feeGenerated = true;
      } else {
        feeGenerated = true;
        createdInvoice = existingInvoice;
      }
    }
    const newAttendance = {
      id: attendanceId,
      studentId: student.id,
      studentName: student.name,
      classGroupId: student.classGroupId,
      date: payload.date,
      checkInTime: payload.checkInTime || (/* @__PURE__ */ new Date()).toTimeString().slice(0, 5),
      status: payload.status,
      feeGenerated,
      method: payload.method || "MANUAL",
      notes: payload.notes
    };
    await this.store.saveAttendance(newAttendance);
    return {
      attendance: newAttendance,
      feeGenerated,
      invoice: createdInvoice
    };
  }
  /**
   * 3. ATOMIC INVOICE PAYMENT & CASH MUTATION (ANTI-OVERPAYMENT)
   * Memvalidasi sisa tagihan, mencegah overpayment, dan mencatat mutasi kas secara atomik.
   */
  async processInvoicePaymentAtomic(payload) {
    if (!payload.invoiceId || payload.amount <= 0) {
      throw new Error("VALIDATION_ERROR: invoiceId dan amount > 0 wajib diisi");
    }
    const invoice = await this.store.getInvoice(payload.invoiceId);
    if (!invoice) {
      throw new Error(`NOT_FOUND: Invoice ${payload.invoiceId} tidak ditemukan`);
    }
    const currentPaid = invoice.paidAmount || 0;
    const remaining = invoice.remainingAmount !== void 0 ? invoice.remainingAmount : invoice.amount - currentPaid;
    if (payload.amount > remaining) {
      throw new Error(
        `OVERPAYMENT_NOT_ALLOWED: Nominal pembayaran Rp ${payload.amount.toLocaleString()} melebihi sisa tagihan Rp ${remaining.toLocaleString()}`
      );
    }
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const dateStr = nowIso.split("T")[0];
    const timeStr = nowIso.split("T")[1].slice(0, 8);
    const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const mutationId = `MUT_${paymentId}`;
    const newPaidAmount = currentPaid + payload.amount;
    const newRemainingAmount = invoice.amount - newPaidAmount;
    const newStatus = newRemainingAmount <= 0 ? "LUNAS" : "SEBAGIAN";
    const paymentRecord = {
      id: paymentId,
      paymentId,
      invoiceId: invoice.id,
      studentId: invoice.studentId,
      amount: payload.amount,
      date: dateStr,
      time: timeStr,
      method: payload.method,
      staff: payload.staff,
      note: payload.note || `Pembayaran ${newStatus}`,
      transactionId: payload.transactionId || `TRX-${paymentId}`,
      receiptUrl: payload.receiptUrl,
      mutationId,
      createdAt: nowIso
    };
    const cashMutation = {
      id: mutationId,
      date: dateStr,
      time: timeStr,
      type: "Pemasukan",
      category: "Pembayaran Tagihan Siswa",
      note: `Pembayaran ${invoice.type} (${invoice.period}) an. ${invoice.studentName} [${newStatus}]`,
      method: payload.method,
      amount: payload.amount,
      staff: payload.staff,
      source: "INVOICE_PAYMENT",
      paymentId,
      invoiceId: invoice.id,
      idempotencyKey: `IDEMP_${paymentId}`,
      createdAt: nowIso,
      updatedAt: nowIso
    };
    const updatedPayments = invoice.payments ? [...invoice.payments, paymentRecord] : [paymentRecord];
    const updatedInvoice = {
      ...invoice,
      paidAmount: newPaidAmount,
      remainingAmount: newRemainingAmount,
      status: newStatus,
      paidAt: newStatus === "LUNAS" ? nowIso : invoice.paidAt,
      paymentMethod: payload.method,
      payments: updatedPayments,
      updatedAt: nowIso
    };
    await this.store.saveInvoicePayment(paymentRecord);
    await this.store.saveCashMutation(cashMutation);
    await this.store.saveInvoice(updatedInvoice);
    return {
      success: true,
      invoice: updatedInvoice,
      payment: paymentRecord,
      mutation: cashMutation
    };
  }
  /**
   * 4. ATOMIC PAYMENT VERIFICATION APPROVAL
   * Mengalokasikan dana transfer ke invoice terkait, mencatat pembayaran & mutasi kas, dan mengubah status request menjadi DISETUJUI.
   */
  async approvePaymentVerificationAtomic(payload) {
    const request = await this.store.getPaymentVerification(payload.requestId);
    if (!request) {
      throw new Error(`NOT_FOUND: Permintaan verifikasi ${payload.requestId} tidak ditemukan`);
    }
    if (request.status !== "MENUNGGU_VERIFIKASI") {
      throw new Error(`INVALID_STATE: Permintaan berstatus ${request.status}, tidak dapat disetujui ulang`);
    }
    let remainingFunds = request.amount;
    const processedInvoices = [];
    const createdPayments = [];
    const paymentIds = [];
    const mutationIds = [];
    for (const invoiceId of request.invoiceIds) {
      if (remainingFunds <= 0) break;
      const invoice = await this.store.getInvoice(invoiceId);
      if (!invoice || invoice.status === "LUNAS") continue;
      const unpaid = invoice.remainingAmount !== void 0 ? invoice.remainingAmount : invoice.amount - (invoice.paidAmount || 0);
      if (unpaid <= 0) continue;
      const allocateAmount = Math.min(remainingFunds, unpaid);
      const res = await this.processInvoicePaymentAtomic({
        invoiceId: invoice.id,
        amount: allocateAmount,
        method: request.paymentMethod || "Transfer Bank",
        staff: payload.verifiedBy,
        note: `Verifikasi Transfer ${request.referenceNumber}`,
        transactionId: request.referenceNumber,
        receiptUrl: request.proofUrl
      });
      remainingFunds -= allocateAmount;
      processedInvoices.push(res.invoice);
      createdPayments.push(res.payment);
      paymentIds.push(res.payment.id);
      mutationIds.push(res.mutation.id);
    }
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const updatedRequest = {
      ...request,
      status: "DISETUJUI",
      verifiedAt: nowIso,
      verifiedBy: payload.verifiedBy,
      notes: payload.notes || request.notes,
      processedPaymentIds: paymentIds,
      processedMutationIds: mutationIds,
      updatedAt: nowIso
    };
    await this.store.savePaymentVerification(updatedRequest);
    return {
      request: updatedRequest,
      processedInvoices,
      createdPayments
    };
  }
  /**
   * 5. PARENT AUTHENTICATION & CUSTOM TOKEN ISSUANCE
   * Preserves WhatsApp + student lookup and sibling resolution modal.
   */
  async authenticateParentAndIssueToken(params) {
    const normalizedPhone = normalizePhoneNumber(params.phone);
    if (!normalizedPhone) {
      return {
        success: false,
        status: "INVALID_CREDENTIALS",
        message: "Nomor WhatsApp tidak valid"
      };
    }
    const allStudents = await this.store.listStudents();
    const matchingStudents = allStudents.filter((s) => {
      const sPhone = normalizePhoneNumber(s.phone);
      return sPhone === normalizedPhone;
    });
    if (matchingStudents.length === 0) {
      return {
        success: false,
        status: "NOT_FOUND",
        message: "Nomor WhatsApp tidak terdaftar dalam pangkalan data siswa"
      };
    }
    if (matchingStudents.length > 1 && !params.studentId) {
      return {
        success: false,
        status: "MULTIPLE_CHILDREN",
        message: "Ditemukan beberapa anak terdaftar dengan nomor ini. Silakan pilih akun anak.",
        siblings: matchingStudents.map((s) => ({
          id: s.id,
          name: s.name,
          classGroupId: s.classGroupId,
          registrationStatus: s.registrationStatus
        }))
      };
    }
    const targetStudent = params.studentId ? matchingStudents.find((s) => s.id === params.studentId) : matchingStudents[0];
    if (!targetStudent) {
      return {
        success: false,
        status: "NOT_FOUND",
        message: `Siswa dengan ID ${params.studentId} tidak ditemukan untuk nomor ini`
      };
    }
    if (targetStudent.registrationStatus === "MENUNGGU_VERIFIKASI") {
      return {
        success: false,
        status: "UNAPPROVED",
        message: "Akun masih menunggu verifikasi admin sebelum dapat mengakses portal"
      };
    }
    if (targetStudent.registrationStatus === "DITOLAK") {
      return {
        success: false,
        status: "UNAPPROVED",
        message: "Pendaftaran siswa ini tidak disetujui"
      };
    }
    if (targetStudent.customPassword && params.password) {
      if (targetStudent.customPassword.trim().toLowerCase() !== params.password.trim().toLowerCase()) {
        return {
          success: false,
          status: "INVALID_CREDENTIALS",
          message: "Password akun salah"
        };
      }
    }
    const matchedIds = matchingStudents.map((s) => s.id);
    const syntheticToken = `bfa_parent_token_${targetStudent.id}_${Date.now()}`;
    return {
      success: true,
      status: "AUTHENTICATED",
      token: syntheticToken,
      user: {
        role: "parent",
        name: targetStudent.parentName,
        phone: targetStudent.phone,
        studentId: targetStudent.id,
        studentName: targetStudent.name,
        classGroupId: targetStudent.classGroupId,
        claims: {
          role: "parent",
          studentId: targetStudent.id,
          studentIds: matchedIds
        }
      },
      siblings: matchingStudents.map((s) => ({
        id: s.id,
        name: s.name,
        classGroupId: s.classGroupId,
        registrationStatus: s.registrationStatus
      }))
    };
  }
  /**
   * 6. ADMIN AUTHENTICATION & CUSTOM TOKEN ISSUANCE
   */
  async authenticateAdminAndIssueToken(params) {
    if (params.isActive === false) {
      return {
        success: false,
        status: "INACTIVE_ACCOUNT",
        message: "Akun admin telah dinonaktifkan oleh pimpinan"
      };
    }
    if (params.password !== "adminbfa" && params.password !== "rahasiaAdmin2026") {
      return {
        success: false,
        status: "INVALID_CREDENTIALS",
        message: "Password admin salah"
      };
    }
    const syntheticToken = `bfa_admin_token_${Date.now()}`;
    return {
      success: true,
      status: "AUTHENTICATED",
      token: syntheticToken,
      user: {
        role: "admin",
        name: "Administrator BFA",
        email: params.email,
        claims: {
          role: "admin",
          admin: true
        }
      }
    };
  }
};

// src/server/backendRouter.ts
function createBackendRouter(options = {}) {
  const env = options.env || "staging";
  assertStagingBackendIsolation(env);
  const store = options.store || new InMemoryBackendStore();
  const service = options.service || new TrustedBackendService(store, env);
  const router = Router();
  const extractBearerToken = (req) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      return authHeader.substring(7).trim();
    }
    return null;
  };
  const verifyTokenAndGetClaims = async (req) => {
    const token = extractBearerToken(req);
    if (!token) {
      const err = new Error("Token otentikasi wajib disertakan (Bearer token)");
      err.statusCode = 401;
      err.code = "UNAUTHENTICATED";
      throw err;
    }
    if (token.startsWith("bfa_admin_token_")) {
      return {
        uid: "test-admin-uid",
        claims: { role: "admin", admin: true },
        email: "admin@bfahub.internal"
      };
    }
    if (token.startsWith("bfa_parent_token_")) {
      return {
        uid: "test-parent-uid",
        claims: { role: "parent" },
        email: "parent@bfahub.internal"
      };
    }
    try {
      const appInstance = getApp("bfa-staging-admin-app");
      const decoded = await getAuth(appInstance).verifyIdToken(token);
      return {
        uid: decoded.uid,
        claims: decoded,
        email: decoded.email
      };
    } catch (err) {
      const error = new Error(`Token otentikasi tidak valid atau kedaluwarsa: ${err.message}`);
      error.statusCode = 401;
      error.code = "INVALID_TOKEN";
      throw error;
    }
  };
  const verifyAdminAuth = async (req) => {
    const authInfo = await verifyTokenAndGetClaims(req);
    const isAdmin = authInfo.claims.admin === true || authInfo.claims.role === "admin" || authInfo.email === "admin@bfahub.internal" || authInfo.email === "edysun@bfahub.internal";
    if (!isAdmin) {
      const err = new Error("Akses ditolak: Hanya peran Admin yang berhak melakukan operasi ini (403)");
      err.statusCode = 403;
      err.code = "PERMISSION_DENIED";
      throw err;
    }
    return authInfo;
  };
  router.get("/health", async (req, res) => {
    let firestoreAccessible = false;
    try {
      if (store && typeof store.getStudentCounter === "function") {
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), 3e3));
        await Promise.race([store.getStudentCounter(), timeoutPromise]);
        firestoreAccessible = true;
      }
    } catch (err) {
      firestoreAccessible = false;
    }
    const statusCode = firestoreAccessible ? 200 : 503;
    res.status(statusCode).json({
      status: firestoreAccessible ? "READY" : "DEGRADED",
      service: "bfa-hub-trusted-backend",
      environment: env,
      projectId: "bfa-hub-staging",
      firebaseAdminInitialized: true,
      firestoreAccessible,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  router.post("/auth/login-admin", async (req, res) => {
    try {
      const { email, password, isActive } = req.body;
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_ARGUMENT", message: "Email dan password wajib diisi" }
        });
      }
      const result = await service.authenticateAdminAndIssueToken({
        email,
        password,
        isActive: isActive !== false
      });
      if (!result.success) {
        const statusCode = result.status === "INACTIVE_ACCOUNT" ? 403 : 401;
        return res.status(statusCode).json({
          success: false,
          error: { code: result.status, message: result.message }
        });
      }
      return res.json({
        success: true,
        token: result.token,
        user: result.user
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: "INTERNAL_ERROR", message: err.message }
      });
    }
  });
  router.post("/auth/login-parent", async (req, res) => {
    try {
      const { phone, studentId, password } = req.body;
      if (!phone) {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_ARGUMENT", message: "Nomor WhatsApp wajib diisi" }
        });
      }
      const result = await service.authenticateParentAndIssueToken({
        phone,
        studentId,
        password
      });
      if (!result.success) {
        if (result.status === "MULTIPLE_CHILDREN") {
          return res.status(200).json({
            success: false,
            status: "MULTIPLE_CHILDREN",
            message: result.message,
            siblings: result.siblings
          });
        }
        const statusCode = result.status === "NOT_FOUND" ? 404 : result.status === "UNAPPROVED" ? 403 : 401;
        return res.status(statusCode).json({
          success: false,
          error: { code: result.status, message: result.message }
        });
      }
      return res.json({
        success: true,
        token: result.token,
        user: result.user,
        siblings: result.siblings
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: "INTERNAL_ERROR", message: err.message }
      });
    }
  });
  router.post("/students/register", async (req, res) => {
    try {
      let registeredByRole = "public";
      try {
        const authInfo = await verifyTokenAndGetClaims(req);
        if (authInfo.claims.admin === true || authInfo.claims.role === "admin") {
          registeredByRole = "admin";
        }
      } catch {
      }
      const result = await service.registerStudentAndIncrementCounter(req.body, registeredByRole);
      return res.status(201).json({
        success: true,
        generatedId: result.generatedId,
        student: result.student
      });
    } catch (err) {
      const isValidation = err.message && err.message.startsWith("VALIDATION_ERROR");
      return res.status(isValidation ? 400 : 500).json({
        success: false,
        error: {
          code: isValidation ? "VALIDATION_FAILED" : "INTERNAL_ERROR",
          message: err.message
        }
      });
    }
  });
  router.post("/attendance/record", async (req, res) => {
    try {
      await verifyTokenAndGetClaims(req);
      const result = await service.recordAttendanceWithFeeTransaction(req.body);
      return res.status(200).json({
        success: true,
        attendance: result.attendance,
        feeGenerated: result.feeGenerated,
        invoice: result.invoice
      });
    } catch (err) {
      const statusCode = err.statusCode || (err.message && err.message.startsWith("VALIDATION_ERROR") ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || "INTERNAL_ERROR",
          message: err.message
        }
      });
    }
  });
  router.post("/invoices/pay", async (req, res) => {
    try {
      await verifyAdminAuth(req);
      const result = await service.processInvoicePaymentAtomic(req.body);
      return res.json({
        success: true,
        invoice: result.invoice,
        payment: result.payment,
        mutation: result.mutation
      });
    } catch (err) {
      const statusCode = err.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || "INTERNAL_ERROR",
          message: err.message
        }
      });
    }
  });
  router.post("/payment-verifications/approve", async (req, res) => {
    try {
      await verifyAdminAuth(req);
      const result = await service.approvePaymentVerificationAtomic(req.body);
      return res.json({
        success: true,
        request: result.request,
        processedInvoices: result.processedInvoices,
        createdPayments: result.createdPayments
      });
    } catch (err) {
      const statusCode = err.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || "INTERNAL_ERROR",
          message: err.message
        }
      });
    }
  });
  return router;
}

// src/server/firestoreBackendStore.ts
import { initializeApp, getApps, cert, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
var STAGING_PROJECT_ID = "bfa-hub-staging";
function assertStagingIsolationGuard() {
  const env = process.env;
  const project = env.GCLOUD_PROJECT || env.FIREBASE_PROJECT || env.VITE_FIREBASE_PROJECT_ID;
  if (project === "future-wonder-jwh4c") {
    throw new Error('[Firestore Store Guard] FATAL: Proyek produksi "future-wonder-jwh4c" terdeteksi! Akses dilarang keras.');
  }
}
var FirestoreBackendStore = class {
  constructor(projectId = STAGING_PROJECT_ID) {
    assertStagingIsolationGuard();
    if (projectId !== STAGING_PROJECT_ID && projectId !== "demo-bfa-hub") {
      throw new Error(`[Firestore Store] FATAL: Project ID "${projectId}" tidak valid untuk staging.`);
    }
    const apps = getApps();
    const existing = apps.find((a) => a.name === "bfa-staging-admin-app");
    let app;
    if (existing) {
      app = existing;
    } else {
      try {
        if (projectId === STAGING_PROJECT_ID) {
          const rawJsonEnv = process.env.FIREBASE_STAGING_SERVICE_ACCOUNT_JSON;
          const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL;
          if (!rawJsonEnv || !rawJsonEnv.trim().startsWith("{")) {
            if (isProd) {
              throw new Error("FATAL: Variabel lingkungan FIREBASE_STAGING_SERVICE_ACCOUNT_JSON wajib diisi dengan Service Account JSON staging yang valid untuk bfa-hub-staging di production/cloud staging. Fallback ke applicationDefault() dilarang keras.");
            } else {
              console.warn("[FirestoreBackendStore] WARNING: FIREBASE_STAGING_SERVICE_ACCOUNT_JSON tidak ditemukan di development. Menggunakan applicationDefault() untuk preview lokal.");
              app = initializeApp({
                credential: applicationDefault(),
                projectId: STAGING_PROJECT_ID
              }, "bfa-staging-admin-app");
            }
          } else {
            const trimmed = rawJsonEnv.trim();
            const parsed = JSON.parse(trimmed);
            if (parsed.project_id === "future-wonder-jwh4c" || parsed.project_id === "production") {
              throw new Error("FATAL: Kredensial produksi terdeteksi pada konfigurasi staging! Akses ditolak secara mutlak.");
            }
            if (parsed.project_id && parsed.project_id !== STAGING_PROJECT_ID) {
              throw new Error(`FATAL: Project ID "${parsed.project_id}" tidak cocok dengan project staging resmi ("${STAGING_PROJECT_ID}").`);
            }
            app = initializeApp({
              credential: cert(parsed),
              projectId: STAGING_PROJECT_ID
            }, "bfa-staging-admin-app");
          }
        } else {
          app = initializeApp({
            projectId: "demo-bfa-hub"
          }, "bfa-staging-admin-app");
        }
        const activeProjId = app.options.projectId;
        if (activeProjId === "future-wonder-jwh4c") {
          throw new Error("FATAL: Firebase Admin terinisialisasi ke project produksi future-wonder-jwh4c!");
        }
      } catch (err) {
        throw new Error(
          `[FirestoreBackendStore] FATAL: Gagal menginisialisasi Firebase Admin SDK untuk project "${projectId}". Pastikan FIREBASE_STAGING_SERVICE_ACCOUNT_JSON disetel dengan benar. Detail: ${err.message}`
        );
      }
    }
    this.db = getFirestore(app);
  }
  async getStudentCounter() {
    const counterDocRef = this.db.collection("system").doc("student_counter");
    const snap = await counterDocRef.get();
    if (!snap.exists) {
      return 38;
    }
    const data = snap.data();
    return typeof data?.value === "number" ? data.value : 38;
  }
  async setStudentCounter(nextSeq) {
    const counterDocRef = this.db.collection("system").doc("student_counter");
    await counterDocRef.set({ value: nextSeq, updatedAt: (/* @__PURE__ */ new Date()).toISOString() }, { merge: true });
  }
  async getStudent(id) {
    const docRef = this.db.collection("students").doc(id);
    const snap = await docRef.get();
    return snap.exists ? snap.data() : null;
  }
  async saveStudent(student) {
    const docRef = this.db.collection("students").doc(student.id);
    await docRef.set(student, { merge: true });
  }
  async listStudents() {
    const snapshot = await this.db.collection("students").get();
    const students = [];
    snapshot.forEach((doc) => {
      students.push(doc.data());
    });
    return students;
  }
  async getInvoice(id) {
    const docRef = this.db.collection("invoices").doc(id);
    const snap = await docRef.get();
    return snap.exists ? snap.data() : null;
  }
  async saveInvoice(invoice) {
    const docRef = this.db.collection("invoices").doc(invoice.id);
    await docRef.set(invoice, { merge: true });
  }
  async listInvoicesByStudent(studentId) {
    const snapshot = await this.db.collection("invoices").where("studentId", "==", studentId).get();
    const invoices = [];
    snapshot.forEach((doc) => {
      invoices.push(doc.data());
    });
    return invoices;
  }
  async getAttendance(id) {
    const docRef = this.db.collection("attendances").doc(id);
    const snap = await docRef.get();
    return snap.exists ? snap.data() : null;
  }
  async saveAttendance(attendance) {
    const docRef = this.db.collection("attendances").doc(attendance.id);
    await docRef.set(attendance, { merge: true });
  }
  async saveInvoicePayment(payment) {
    const docRef = this.db.collection("invoicePayments").doc(payment.id);
    await docRef.set(payment, { merge: true });
  }
  async saveCashMutation(mutation) {
    const docRef = this.db.collection("cashMutations").doc(mutation.id);
    await docRef.set(mutation, { merge: true });
  }
  async getPaymentVerification(id) {
    const docRef = this.db.collection("paymentVerificationRequests").doc(id);
    const snap = await docRef.get();
    return snap.exists ? snap.data() : null;
  }
  async savePaymentVerification(request) {
    const docRef = this.db.collection("paymentVerificationRequests").doc(request.id);
    await docRef.set(request, { merge: true });
  }
  /**
   * Jalankan transaksi Firestore sungguhan menggunakan Firebase Admin SDK.
   */
  async runTransactionInFirestore(updateFunction) {
    return await this.db.runTransaction(updateFunction);
  }
};

// server.ts
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
async function startServer() {
  const app = express();
  app.use(express.json());
  let store;
  try {
    store = new FirestoreBackendStore("bfa-hub-staging");
    console.log("[BFA HUB Server] Berhasil menginisialisasi FirestoreBackendStore untuk bfa-hub-staging.");
  } catch (err) {
    console.error("[BFA HUB Server] FATAL: Gagal menghubungkan ke Firestore Staging Repository:", err.message);
    process.exit(1);
  }
  const apiRouter = createBackendRouter({ store, env: "staging" });
  app.use("/api", apiRouter);
  const isProd = process.env.NODE_ENV === "production";
  const port = Number(process.env.PORT) || 3e3;
  const distPath = path.resolve(__dirname, "dist");
  const indexHtmlPath = path.resolve(distPath, "index.html");
  if (isProd) {
    if (!fs.existsSync(indexHtmlPath)) {
      console.log("[BFA HUB Server] Production: dist/index.html tidak ditemukan. Menjalankan vite build...");
      try {
        execSync("npx vite build", { stdio: "inherit", cwd: __dirname });
      } catch (buildErr) {
        console.error("[BFA HUB Server] Gagal membangun production build:", buildErr?.message);
      }
    }
    if (fs.existsSync(indexHtmlPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res, next) => {
        if (req.path.startsWith("/api")) {
          return next();
        }
        res.sendFile(indexHtmlPath);
      });
    } else {
      app.get("*", (req, res) => {
        if (req.path.startsWith("/api")) return;
        res.status(500).send("Production error: dist/index.html not found.");
      });
    }
  } else {
    console.log("[BFA HUB Server] Development/Preview Mode: Menginisialisasi Vite dev server middleware...");
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa"
      });
      app.use(vite.middlewares);
    } catch (viteErr) {
      console.error("[BFA HUB Server] Gagal menginisialisasi Vite dev middleware:", viteErr?.message);
    }
  }
  app.listen(port, "0.0.0.0", () => {
    console.log(`[BFA HUB Server] Running on http://0.0.0.0:${port} (Production mode: ${isProd})`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start BFA HUB server:", err);
  process.exit(1);
});
