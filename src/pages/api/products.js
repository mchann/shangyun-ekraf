export const prerender = false;

import { getServerSql } from '../../lib/serverDb.js';
import { INITIAL_PRODUCTS } from '../../lib/db.js';

export async function GET({ request }) {
  const sql = getServerSql();
  if (!sql) {
    return new Response(JSON.stringify(INITIAL_PRODUCTS), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const rows = await sql.query(`
      SELECT 
        p.id, p.seller_id, p.nama, p.kategori, p.harga, p.stok, p.deskripsi, p.image_url, p.unggulan,
        s.nama_toko, s.no_wa as seller_wa
      FROM sy_products p
      LEFT JOIN sy_sellers s ON p.seller_id = s.id
      ORDER BY p.created_at ASC, p.id ASC
    `);
    
    // Normalize numeric values
    const normalized = (rows.length > 0 ? rows : INITIAL_PRODUCTS).map(p => ({
      ...p,
      harga: Number(p.harga),
      stok: Number(p.stok),
      unggulan: Boolean(p.unggulan)
    }));

    return new Response(JSON.stringify(normalized), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Error fetching products from Neon:', err);
    return new Response(JSON.stringify(INITIAL_PRODUCTS), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST({ request }) {
  const sql = getServerSql();
  try {
    const body = await request.json();
    const newId = 'p' + Date.now().toString(36);
    const product = {
      id: newId,
      seller_id: body.seller_id || 's1',
      nama: body.nama?.trim() || 'Karya Baru',
      kategori: body.kategori?.trim() || 'Dekorasi',
      harga: Number(body.harga) || 0,
      stok: Number(body.stok) || 0,
      deskripsi: body.deskripsi?.trim() || '',
      image_url: body.image_url?.trim() || '',
      unggulan: Boolean(body.unggulan)
    };

    if (sql) {
      await sql.query(
        `INSERT INTO sy_products (id, seller_id, nama, kategori, harga, stok, deskripsi, image_url, unggulan)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          product.id,
          product.seller_id,
          product.nama,
          product.kategori,
          product.harga,
          product.stok,
          product.deskripsi,
          product.image_url,
          product.unggulan
        ]
      );
    }

    return new Response(JSON.stringify(product), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Error adding product:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function PUT({ request }) {
  const sql = getServerSql();
  try {
    const body = await request.json();
    const { id, seller_id, nama, kategori, harga, stok, deskripsi, image_url, unggulan } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: 'id required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (sql) {
      await sql.query(
        `UPDATE sy_products 
         SET seller_id = $1, nama = $2, kategori = $3, harga = $4, stok = $5, deskripsi = $6, image_url = $7, unggulan = $8
         WHERE id = $9`,
        [
          seller_id || 's1',
          nama?.trim(),
          kategori?.trim(),
          Number(harga) || 0,
          Number(stok) || 0,
          deskripsi?.trim() || '',
          image_url?.trim() || '',
          Boolean(unggulan),
          id
        ]
      );
    }

    return new Response(JSON.stringify({ success: true, ...body }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Error updating product:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function DELETE({ request }) {
  const sql = getServerSql();
  try {
    const { id } = await request.json();
    if (!id) {
      return new Response(JSON.stringify({ error: 'id required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (sql) {
      await sql.query('DELETE FROM sy_products WHERE id = $1', [id]);
    }

    return new Response(JSON.stringify({ success: true, id }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Error deleting product:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

