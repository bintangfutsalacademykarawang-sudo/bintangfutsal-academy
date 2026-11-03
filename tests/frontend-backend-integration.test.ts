/**
 * BFA HUB — FRONTEND & BACKEND STAGING INTEGRATION TEST SUITE
 * Mode: STAGING-FIRST · ZERO-TRUST · END-TO-END API INTEGRATION
 */

import { 
  TrustedBackendService, 
  InMemoryBackendStore 
} from '../src/server/trustedBackendService';
import { createBackendRouter } from '../src/server/backendRouter';
import express from 'express';
import request from 'supertest';

async function runIntegrationTestSuite() {
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  console.log('======================================================================');
  console.log('BFA HUB — FRONTEND & BACKEND STAGING INTEGRATION TEST SUITE');
  console.log('======================================================================\n');

  const store = new InMemoryBackendStore();
  const service = new TrustedBackendService(store, 'staging');
  const app = express();
  app.use(express.json());
  app.use('/api', createBackendRouter({ store, service, env: 'staging' }));

  // 1. Login Admin
  console.log('[1] Pengujian Integrasi Login Admin:');
  const adminRes = await request(app)
    .post('/api/auth/login-admin')
    .send({ email: 'admin@bfa.my.id', password: 'adminbfa', isActive: true });
  
  assert(adminRes.status === 200 && adminRes.body.success === true, '1.1 Admin berhasil login via API endpoint /api/auth/login-admin');
  const adminToken = adminRes.body.token;

  // 2. Registrasi Siswa via Backend API
  console.log('\n[2] Pengujian Integrasi Pendaftaran Siswa & Atomic Counter:');
  const regRes = await request(app)
    .post('/api/students/register')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'Rian Mahendra',
      birthPlace: 'Karawang',
      birthDate: '2015-06-15',
      gender: 'L',
      parentName: 'Bpk. Hendra',
      phone: '081300001111',
      classGroupId: 'U11',
      jerseyNumber: 10,
    });
  
  assert(regRes.status === 201 && regRes.body.generatedId === 'BFA-039', '2.1 Siswa baru berhasil didaftarkan dengan NIS atomik BFA-039');
  const studentId = regRes.body.generatedId;

  // 3. Login Parent via Backend API
  console.log('\n[3] Pengujian Integrasi Login Parent (WhatsApp + Student ID):');
  const parentLoginRes = await request(app)
    .post('/api/auth/login-parent')
    .send({ phone: '081300001111', studentId });
  
  assert(parentLoginRes.status === 200 && parentLoginRes.body.success === true, '3.1 Parent berhasil login menggunakan WhatsApp dan Student ID');
  const parentToken = parentLoginRes.body.token;

  // 4. Pencatatan Presensi & Penerbitan Invoice Latihan Rp 15.000
  console.log('\n[4] Pengujian Integrasi Presensi & Invoice Latihan Rp 15.000:');
  const attendanceRes = await request(app)
    .post('/api/attendance/record')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      studentId,
      date: '2026-11-03',
      status: 'HADIR',
      method: 'BARCODE',
    });

  assert(attendanceRes.status === 200 && attendanceRes.body.invoice?.amount === 15000, '4.1 Presensi HADIR otomatis menerbitkan invoice latihan Rp 15.000');
  const invoiceId = attendanceRes.body.invoice.id;

  // 5. Pembayaran Invoice Atomik & Buku Kas Mutasi
  console.log('\n[5] Pengujian Integrasi Pembayaran Invoice & Buku Kas Mutasi:');
  const paymentRes = await request(app)
    .post('/api/invoices/pay')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      invoiceId,
      amount: 15000,
      method: 'Tunai',
      staff: 'Admin Staging',
      note: 'Pelunasan Latihan',
    });

  assert(paymentRes.status === 200 && paymentRes.body.invoice.status === 'LUNAS', '5.1 Pembayaran penuh melunasi invoice dan mencatat mutasi kas secara atomik');

  // 6. Uji Penolakan Akses Lintas Peran (Negative RBAC)
  console.log('\n[6] Pengujian Penolakan Akses Lintas Peran (Negative RBAC):');
  const forbiddenPayRes = await request(app)
    .post('/api/invoices/pay')
    .set('Authorization', `Bearer ${parentToken}`)
    .send({
      invoiceId,
      amount: 15000,
      method: 'Tunai',
      staff: 'Parent',
    });

  assert(forbiddenPayRes.status === 403, '6.1 [NEGATIVE] Token Parent ditolak saat mencoba mengakses endpoint pembayaran admin (403 Forbidden)');

  // Ringkasan
  console.log('\n======================================================================');
  console.log(`RINGKASAN INTEGRASI STAGING: ${passed} Lulus, ${failed} Gagal`);
  console.log('======================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runIntegrationTestSuite().catch(err => {
  console.error('Fatal Integration Test Error:', err);
  process.exit(1);
});
