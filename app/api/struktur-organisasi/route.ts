import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'needajob',
  database: process.env.MYSQL_DATABASE || 'si_tekkim',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function GET() {
  try {
    const [rows] = await pool.query(
      'SELECT id, narasi, gambar FROM struktur_organisasi_content LIMIT 1'
    );
    
    return NextResponse.json({ data: (rows as any[])[0] || null });
  } catch (error) {
    console.error('Error fetching struktur organisasi:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { narasi, gambar } = body;

    const [result] = await pool.query(
      'INSERT INTO struktur_organisasi_content (narasi, gambar) VALUES (?, ?)',
      [narasi || '', gambar || null]
    );

    const insertId = (result as any).insertId;

    return NextResponse.json({ 
      data: { id: insertId, narasi, gambar },
      message: 'Data berhasil disimpan'
    });
  } catch (error) {
    console.error('Error saving struktur organisasi:', error);
    return NextResponse.json(
      { error: 'Failed to save data' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, narasi, gambar } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    await pool.query(
      'UPDATE struktur_organisasi_content SET narasi = ?, gambar = ? WHERE id = ?',
      [narasi || '', gambar || null, id]
    );

    return NextResponse.json({ 
      data: { id, narasi, gambar },
      message: 'Data berhasil diupdate'
    });
  } catch (error) {
    console.error('Error updating struktur organisasi:', error);
    return NextResponse.json(
      { error: 'Failed to update data' },
      { status: 500 }
    );
  }
}
