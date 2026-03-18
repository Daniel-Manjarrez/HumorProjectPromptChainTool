import { requireAdmin } from '@/utils/auth';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import StepBuilderClient from './StepBuilderClient';
import { Layers, ArrowLeft } from 'lucide-react';

export default async function FlavorBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const supabase = await createClient();
  const { id } = await params;

  // Fetch the Flavor
  const { data: flavor, error: flavorError } = await supabase
    .from('humor_flavors')
    .select('*')
    .eq('id', id)
    .single();

  if (flavorError || !flavor) {
    notFound();
  }

  // Fetch the Steps
  const { data: steps, error: stepsError } = await supabase
    .from('humor_flavor_steps')
    .select('*')
    .eq('humor_flavor_id', id)
    .order('order_by', { ascending: true });

  // Fetch Lookup Tables for Dropdowns
  const [
    { data: inputTypes },
    { data: outputTypes },
    { data: models },
    { data: stepTypes }
  ] = await Promise.all([
    supabase.from('llm_input_types').select('*').order('id'),
    supabase.from('llm_output_types').select('*').order('id'),
    supabase.from('llm_models').select('*, llm_providers(name)').order('name'),
    supabase.from('humor_flavor_step_types').select('*').order('id')
  ]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <Link href="/flavors" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-2 font-medium">
            <ArrowLeft className="h-4 w-4" /> Back to Flavors
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-6 mb-8 border border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Layers className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            Chain Builder: {flavor.slug}
          </h1>
          {flavor.description && (
            <p className="mt-2 text-gray-600 dark:text-gray-400">{flavor.description}</p>
          )}
        </div>

        <StepBuilderClient
          flavorId={parseInt(id)}
          initialSteps={steps || []}
          lookups={{
            inputTypes: inputTypes || [],
            outputTypes: outputTypes || [],
            models: models || [],
            stepTypes: stepTypes || []
          }}
        />
      </div>
    </div>
  );
}
