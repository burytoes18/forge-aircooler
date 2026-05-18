import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('deliverables')
    .select('id, title, structured_content, content_markdown, created_at')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  return NextResponse.json(data);
}
