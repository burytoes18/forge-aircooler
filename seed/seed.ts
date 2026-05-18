// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

async function seedProjectBrief() {
  const product_context = `Air cooling device that:
- Operates on the radiator / heat exchanger principle (NOT a compressor-based refrigeration cycle)
- Uses a liquid coolant circulated through a radiator/coil to absorb and dissipate heat
- Target: residential room cooling, potentially commercial/industrial spaces
- Goal: energy-efficient, lower-cost, and simpler alternative to conventional ACs

Key engineering distinction:
- Standard AC uses a compressor + refrigerant vapor-compression cycle (active cooling)
- This product uses a passive or pump-driven liquid cooling loop — similar to car radiators or data center liquid cooling
- May be hybrid evaporative + liquid cooling, or a chilled water loop — exact mechanism needs validation`;

  const unknowns = `- Cooling capacity vs energy consumption vs ambient temperature trade-offs
- Whether a heat rejection mechanism (cooling tower, ground loop, etc.) is needed
- Regulatory and safety requirements for coolant handling
- Manufacturing complexity vs BOM cost`;

  const domain_areas = `Six domains: market, engineering, financial, design, regulatory, manufacturing.
Owner is a hardware entrepreneur, not a trained engineer. Plain language, no jargon, but precise units.`;

  const anti_patterns = `- Do not conflate with evaporative cooler or vapor-compression AC
- Do not invent market data, engineering specs, costs, or regulatory details
- Do not present a single option as the only path
- Do not skip units
- Do not give engineering or regulatory advice as if certified — tag 'needs_expert'
- Do not write long prose introductions`;

  // Wipe and re-seed singleton
  await supabase.from('project_brief').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const { error } = await supabase.from('project_brief').insert({
    product_context, unknowns, domain_areas, anti_patterns,
  });
  if (error) throw error;
  console.log('✓ project_brief seeded');
}

async function seedWorkflows() {
  const dir = path.join(process.cwd(), 'lib', 'workflows');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  await supabase.from('workflows').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  for (const file of files) {
    const spec = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
    const { error } = await supabase.from('workflows').insert(spec);
    if (error) throw error;
    console.log(`✓ workflow seeded: ${spec.slug}`);
  }
}

async function seedBenchmarks() {
  await supabase.from('benchmarks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const rows = [
    { metric: 'Cooling capacity of 1-ton AC', value: '3,517', unit: 'W (12,000 BTU/hr)', source_title: 'ASHRAE standard', confidence_tag: 'verified', notes: 'Standard reference for sizing comparisons.' },
    { metric: 'COP of standard split AC (3-5 star)', value: '3.0–5.5', unit: 'COP', source_title: 'BEE India ratings', confidence_tag: 'verified', notes: 'Coefficient of Performance — cooling output per unit electricity input.' },
    { metric: 'COP target for this product', value: 'TBD', unit: 'COP', confidence_tag: 'needs_expert', notes: 'Must be competitive with split AC. To be established via engineering analysis.' },
    { metric: 'Retail price of 1-ton split AC (India)', value: '30,000–50,000', unit: '₹', confidence_tag: 'estimate', notes: 'Market research range. Verify quarterly.' },
    { metric: 'Monthly electricity cost, 1-ton AC at 8hr/day', value: '1,500–2,500', unit: '₹/month', confidence_tag: 'estimate', notes: 'Assumes BEE 3-star, ₹7/kWh average residential tariff.' },
    { metric: 'Target BOM cost', value: 'TBD', unit: '₹', confidence_tag: 'needs_expert', notes: 'To be established via unit economics workflow.' },
    { metric: 'India room AC market size', value: '4–6', unit: '$B', confidence_tag: 'estimate', notes: 'Verify via CEAMA/EMAAR reports.' },
  ];
  for (const row of rows) {
    const { error } = await supabase.from('benchmarks').insert(row);
    if (error) throw error;
  }
  console.log(`✓ ${rows.length} benchmarks seeded`);
}

(async () => {
  try {
    await seedProjectBrief();
    await seedWorkflows();
    await seedBenchmarks();
    console.log('\nAll seed data inserted successfully.');
  } catch (e) {
    console.error('Seed failed:', e);
    process.exit(1);
  }
})();
