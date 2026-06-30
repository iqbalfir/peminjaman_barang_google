/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/index.ts';
import {
  kategori,
  barang,
  peminjam,
  users,
  peminjaman,
  detailPeminjaman,
  pengembalian,
  auditLog,
  serahTerima,
  detailSerahTerima,
  perbaikan,
} from './src/db/schema.ts';
import { sql } from 'drizzle-orm';

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  const PORT = 3000;

  // 1. Connection Status API
  app.get('/api/cloudsql/status', async (req, res) => {
    try {
      // Test simple query
      const result = await db.execute(sql`SELECT 1 as connected`);
      
      // Get table counts
      const counts: Record<string, number> = {};
      try {
        const katCount = await db.execute(sql`SELECT count(*)::int as count FROM tabel_kategori`);
        counts.kategori = katCount.rows[0]?.count as number || 0;

        const brgCount = await db.execute(sql`SELECT count(*)::int as count FROM tabel_barang`);
        counts.barang = brgCount.rows[0]?.count as number || 0;

        const pmjCount = await db.execute(sql`SELECT count(*)::int as count FROM tabel_peminjam`);
        counts.peminjam = pmjCount.rows[0]?.count as number || 0;

        const usrCount = await db.execute(sql`SELECT count(*)::int as count FROM tabel_users`);
        counts.users = usrCount.rows[0]?.count as number || 0;

        const pmjnCount = await db.execute(sql`SELECT count(*)::int as count FROM tabel_peminjaman`);
        counts.peminjaman = pmjnCount.rows[0]?.count as number || 0;
      } catch (countErr) {
        console.error('Error fetching table counts:', countErr);
      }

      res.json({
        status: 'Connected',
        database: process.env.SQL_DB_NAME || 'Default',
        host: process.env.SQL_HOST || 'Local Proxy',
        user: process.env.SQL_USER || 'Default App User',
        counts,
      });
    } catch (error: any) {
      console.error('Cloud SQL connection failed:', error);
      res.status(500).json({
        status: 'Disconnected',
        error: error.message || String(error),
      });
    }
  });

  // 2. Export Local Data to Cloud SQL (Sync UP)
  app.post('/api/cloudsql/export', async (req, res) => {
    try {
      const data = req.body;
      if (!data) {
        return res.status(400).json({ error: 'Data is required' });
      }

      // Use a single transactional connection
      await db.transaction(async (tx) => {
        // Use DELETE FROM instead of TRUNCATE to avoid table ownership permission errors
        await tx.execute(sql`DELETE FROM tabel_detail_serah_terima;`);
        await tx.execute(sql`DELETE FROM tabel_detail_peminjaman;`);
        await tx.execute(sql`DELETE FROM tabel_pengembalian;`);
        await tx.execute(sql`DELETE FROM tabel_serah_terima;`);
        await tx.execute(sql`DELETE FROM tabel_peminjaman;`);
        await tx.execute(sql`DELETE FROM tabel_perbaikan;`);
        await tx.execute(sql`DELETE FROM tabel_barang;`);
        await tx.execute(sql`DELETE FROM tabel_kategori;`);
        await tx.execute(sql`DELETE FROM tabel_peminjam;`);
        await tx.execute(sql`DELETE FROM tabel_users;`);
        await tx.execute(sql`DELETE FROM tabel_audit_log;`);

        if (data.kategori && data.kategori.length > 0) {
          await tx.insert(kategori).values(data.kategori);
        }
        if (data.barang && data.barang.length > 0) {
          await tx.insert(barang).values(data.barang);
        }
        if (data.peminjam && data.peminjam.length > 0) {
          await tx.insert(peminjam).values(data.peminjam);
        }
        if (data.users && data.users.length > 0) {
          await tx.insert(users).values(data.users);
        }
        if (data.peminjaman && data.peminjaman.length > 0) {
          await tx.insert(peminjaman).values(data.peminjaman);
        }
        if (data.detail_peminjaman && data.detail_peminjaman.length > 0) {
          await tx.insert(detailPeminjaman).values(data.detail_peminjaman);
        }
        if (data.pengembalian && data.pengembalian.length > 0) {
          await tx.insert(pengembalian).values(data.pengembalian);
        }
        if (data.audit_log && data.audit_log.length > 0) {
          await tx.insert(auditLog).values(data.audit_log);
        }
        if (data.serah_terima && data.serah_terima.length > 0) {
          await tx.insert(serahTerima).values(data.serah_terima);
        }
        if (data.detail_serah_terima && data.detail_serah_terima.length > 0) {
          await tx.insert(detailSerahTerima).values(data.detail_serah_terima);
        }
        if (data.perbaikan && data.perbaikan.length > 0) {
          await tx.insert(perbaikan).values(data.perbaikan);
        }

        // Reset sequences to maximum ID so that next insertions don't violate unique constraints
        const tablesToReset = [
          { name: 'tabel_kategori', col: 'id_kategori' },
          { name: 'tabel_barang', col: 'id_barang' },
          { name: 'tabel_peminjam', col: 'id_peminjam' },
          { name: 'tabel_users', col: 'id_user' },
          { name: 'tabel_peminjaman', col: 'id_peminjaman' },
          { name: 'tabel_detail_peminjaman', col: 'id_detail' },
          { name: 'tabel_pengembalian', col: 'id_pengembalian' },
          { name: 'tabel_audit_log', col: 'id_log' },
          { name: 'tabel_serah_terima', col: 'id_serah_terima' },
          { name: 'tabel_detail_serah_terima', col: 'id_detail_bast' },
          { name: 'tabel_perbaikan', col: 'id_perbaikan' },
        ];

        for (const t of tablesToReset) {
          try {
            await tx.execute(sql.raw(`SELECT setval(pg_get_serial_sequence('${t.name}', '${t.col}'), COALESCE(MAX(${t.col}), 1), MAX(${t.col}) IS NOT NULL) FROM ${t.name};`));
          } catch (seqErr) {
            console.warn(`Failed to reset sequence for ${t.name}:`, seqErr);
          }
        }
      });

      res.json({ success: true, message: 'Seluruh data berhasil diekspor ke Cloud SQL PostgreSQL' });
    } catch (error: any) {
      console.error('Cloud SQL Export failed:', error);
      res.status(500).json({ error: error.message || String(error) });
    }
  });

  // 3. Import Data from Cloud SQL to Local State (Sync DOWN)
  app.get('/api/cloudsql/import', async (req, res) => {
    try {
      const katRes = await db.select().from(kategori);
      const brgRes = await db.select().from(barang);
      const pmjRes = await db.select().from(peminjam);
      const usrRes = await db.select().from(users);
      const pmjnRes = await db.select().from(peminjaman);
      const detRes = await db.select().from(detailPeminjaman);
      const pengRes = await db.select().from(pengembalian);
      const logRes = await db.select().from(auditLog);
      const stRes = await db.select().from(serahTerima);
      const detStRes = await db.select().from(detailSerahTerima);
      const perRes = await db.select().from(perbaikan);

      res.json({
        kategori: katRes,
        barang: brgRes,
        peminjam: pmjRes,
        users: usrRes,
        peminjaman: pmjnRes,
        detail_peminjaman: detRes,
        pengembalian: pengRes,
        audit_log: logRes,
        serah_terima: stRes,
        detail_serah_terima: detStRes,
        perbaikan: perRes,
      });
    } catch (error: any) {
      console.error('Cloud SQL Import failed:', error);
      res.status(500).json({ error: error.message || String(error) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
