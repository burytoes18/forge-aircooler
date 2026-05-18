import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: Promise<{ deliverableId: string }> }) {
  const { deliverableId } = await params;
  const supabase = createServerClient();
  const { data } = await supabase.from('deliverables').select('*').eq('id', deliverableId).single();
  if (!data) return new Response('not found', { status: 404 });

  const safeName = data.title.replace(/[^a-z0-9-]+/gi, '-').toLowerCase().slice(0, 80);
  return new Response(data.content_markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="${safeName}.md"`,
    },
  });
}
