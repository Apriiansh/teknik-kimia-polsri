import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const createAuthClientFromRequest = (request: NextRequest) => {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : null;

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: token
        ? {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        : undefined,
    },
  );
};

const getAuthenticatedUser = async (request: NextRequest) => {
  const authClient = createAuthClientFromRequest(request);
  const {
    data: { user: tokenUser },
    error: tokenError,
  } = await authClient.auth.getUser();

  if (!tokenError && tokenUser) {
    return tokenUser;
  }

  const supabase = await createClient();
  const {
    data: { user: cookieUser },
    error: cookieError,
  } = await supabase.auth.getUser();

  if (cookieError || !cookieUser) {
    return null;
  }

  return cookieUser;
};

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('struktur_organisasi_content')
      .select('id, narasi, gambar')
      .order('id', { ascending: true })
      .limit(1);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      );
    }
    
    return NextResponse.json({ data: data?.[0] || null });
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
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authClient = createAuthClientFromRequest(request);
    const body = await request.json();
    const { narasi, gambar } = body;

    const { data, error } = await authClient
      .from('struktur_organisasi_content')
      .insert({
        narasi: narasi || '',
        gambar: gambar || null,
      })
      .select('id, narasi, gambar')
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ 
      data,
      message: 'Data berhasil disimpan'
    });
  } catch (error) {
    console.error('Error saving struktur organisasi:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save data' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authClient = createAuthClientFromRequest(request);
    const body = await request.json();
    const { id, narasi, gambar } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await authClient
      .from('struktur_organisasi_content')
      .update({
        narasi: narasi || '',
        gambar: gambar || null,
      })
      .eq('id', id)
      .select('id, narasi, gambar')
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ 
      data,
      message: 'Data berhasil diupdate'
    });
  } catch (error) {
    console.error('Error updating struktur organisasi:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update data' },
      { status: 500 }
    );
  }
}
