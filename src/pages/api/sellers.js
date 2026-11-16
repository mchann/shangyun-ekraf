export const prerender = false;

import { getServerSql } from '../../lib/serverDb.js';
import { DEFAULT_SELLERS } from '../../lib/db.js';

export async function GET({ request }) {
  const sql = getServerSql();
  if (!sql) {
    return new Response(JSON.stringify(DEFAULT_SELLERS), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const rows = await sql.query('SELECT * FROM sy_sellers ORDER BY id ASC');
    return new Response(JSON.stringify(rows.length > 0 ? rows : DEFAULT_SELLERS), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Error fetching sellers from Neon:', err);
    return new Response(JSON.stringify(DEFAULT_SELLERS), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST({ request }) {
  const sql = getServerSql();
  try {
    const body = await request.json();
    const newId = 's' + Date.now().toString(36);
    const seller = {
      id: newId,
      nama: body.nama?.trim() || 'Perajin Baru',
      email: body.email?.trim() || `${newId}@shangyun.id`,
      nama_toko: body.nama_toko?.trim() || 'Atelier Baru',
      no_wa: body.no_wa?.trim() || '6285738211550',
      spesialisasi: body.spesialisasi?.trim() || 'Kerajinan Tangan'
    };

    if (sql) {
      await sql.query(
        `INSERT INTO sy_sellers (id, nama, email, nama_toko, no_wa, spesialisasi)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [seller.id, seller.nama, seller.email, seller.nama_toko, seller.no_wa, seller.spesialisasi]
      );
    }

    return new Response(JSON.stringify(seller), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Error adding seller:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function PATCH({ request }) {
  const sql = getServerSql();
  try {
    const { id, no_wa } = await request.json();
    if (!id || !no_wa) {
      return new Response(JSON.stringify({ error: 'id and no_wa required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (sql) {
      await sql.query('UPDATE sy_sellers SET no_wa = $1 WHERE id = $2', [no_wa, id]);
    }

    return new Response(JSON.stringify({ success: true, id, no_wa }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Error updating seller WA:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

