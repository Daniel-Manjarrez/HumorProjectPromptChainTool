import { requireAdmin } from '@/utils/auth';
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Box, AlertCircle } from 'lucide-react';
import BackButton from '@/components/BackButton';

export default async function CaptionDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>,
  searchParams: Promise<{ flavor?: string, page?: string }>
}) {
  await requireAdmin();
  const supabase = await createClient();
  const { id } = await params;
  const resolvedSearchParams = await searchParams;

  const { data: caption, error } = await supabase
    .from('captions')
    .select(`
      *,
      images!image_id (
        url
      ),
      profiles!profile_id (
        email
      ),
      humor_flavors!humor_flavor_id (
        slug
      )
    `)
    .eq('id', id)
    .single();

  if (error || !caption) {
    if (error) console.error("Error fetching caption details:", error);
    notFound();
  }

  // Fetch associated LLM model responses if a chain ID exists
  let modelResponses: any[] = [];
  let debugError: any = null;
  let stepTypesMap: Record<number, string> = {};

  if (caption.llm_prompt_chain_id) {
    // Step 1: Fetch responses
    const { data: responses, error: responsesError } = await supabase
      .from('llm_model_responses')
      .select(`
        id,
        llm_model_id,
        llm_user_prompt,
        llm_model_response,
        llm_system_prompt,
        llm_temperature,
        processing_time_seconds,
        created_datetime_utc,
        humor_flavor_step_id,
        llm_models (
          name,
          provider_model_id
        )
      `)
      .eq('llm_prompt_chain_id', caption.llm_prompt_chain_id)
      .order('created_datetime_utc', { ascending: true }); // Order by step execution time

    if (responsesError) {
      debugError = responsesError;
      console.error("Error fetching model responses", responsesError);
    } else if (responses && responses.length > 0) {
      // Step 2: Extract step IDs to fetch step details
      const stepIds = Array.from(new Set(responses.map(r => r.humor_flavor_step_id).filter(Boolean)));

      let stepDetailsMap: Record<number, any> = {};

      if (stepIds.length > 0) {
        // Fetch steps without relying on joined relations that might have mismatched column names
        const { data: stepsData, error: stepsError } = await supabase
          .from('humor_flavor_steps')
          .select('*')
          .in('id', stepIds);

        if (!stepsError && stepsData) {
          stepDetailsMap = stepsData.reduce((acc, step) => {
            acc[step.id] = step;
            return acc;
          }, {} as Record<number, any>);

          // Step 2.5: Extract step type IDs and fetch those
          const stepTypeIds = Array.from(new Set(stepsData.map(s => s.humor_flavor_step_type_id).filter(Boolean)));
          if (stepTypeIds.length > 0) {
            const { data: typesData } = await supabase
              .from('humor_flavor_step_types')
              .select('*')
              .in('id', stepTypeIds);

            if (typesData) {
              stepTypesMap = typesData.reduce((acc, t: any) => {
                acc[t.id] = t.name || t.type || t.slug || `Type ${t.id}`;
                return acc;
              }, {} as Record<number, string>);
            }
          }

        } else if (stepsError) {
          console.error("Error fetching step details", stepsError);
        }
      }

      // Step 3: Merge data
      modelResponses = responses.map(r => {
        const stepDetail = r.humor_flavor_step_id ? stepDetailsMap[r.humor_flavor_step_id] : null;
        return {
          ...r,
          humor_flavor_steps: stepDetail
        };
      });

      // Step 4: Sort manually by order_by from the joined table
      modelResponses.sort((a: any, b: any) => {
        const orderA = a.humor_flavor_steps?.order_by || 0;
        const orderB = b.humor_flavor_steps?.order_by || 0;
        // Fallback to created_datetime if order is the same
        if (orderA === orderB) {
          return new Date(a.created_datetime_utc).getTime() - new Date(b.created_datetime_utc).getTime();
        }
        return orderA - orderB;
      });
    }
  }

  // Handle image URL (array or object)
  const imageUrl = Array.isArray(caption.images)
    ? caption.images[0]?.url
    : (caption.images as any)?.url;

  // Handle profile email
  const userEmail = Array.isArray(caption.profiles)
    ? caption.profiles[0]?.email
    : (caption.profiles as any)?.email;

  // Handle flavor slug
  const flavorSlug = Array.isArray(caption.humor_flavors)
    ? caption.humor_flavors[0]?.slug
    : (caption.humor_flavors as any)?.slug;

  // Construct fallback URL with preserved search params
  const currentParams = new URLSearchParams();
  if (resolvedSearchParams.flavor) currentParams.set('flavor', resolvedSearchParams.flavor);
  if (resolvedSearchParams.page) currentParams.set('page', resolvedSearchParams.page);
  const queryString = currentParams.toString();
  const fallbackUrl = `/captions${queryString ? `?${queryString}` : ''}`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <BackButton fallbackUrl={fallbackUrl} label="Back to Captions" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Context Column */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="bg-gray-100 dark:bg-gray-900 overflow-hidden flex items-center justify-center border-b border-gray-200 dark:border-gray-700 min-h-[300px]">
                {imageUrl ? (
                  <img src={imageUrl} alt="Context" className="w-full h-auto object-contain max-h-[400px]" />
                ) : (
                  <div className="flex flex-col items-center text-gray-400 dark:text-gray-500 p-8 text-center">
                    <span>No image available</span>
                  </div>
                )}
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Generated Caption</h3>
                  <p className="text-xl font-serif text-gray-900 dark:text-white italic">
                    "{caption.content}"
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Flavor:</span>
                    {flavorSlug ? (
                      <Link href={`/flavors`} className="font-semibold text-purple-600 hover:text-purple-800 dark:text-purple-400 hover:underline bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded">
                        {flavorSlug}
                      </Link>
                    ) : (
                      <span className="text-gray-900 dark:text-white font-medium">{caption.humor_flavor_id || 'None'}</span>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Author:</span>
                    <span className="text-gray-900 dark:text-white font-medium truncate max-w-[150px]">{userEmail || caption.profile_id}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Likes:</span>
                    <div className="flex items-center text-pink-500 font-bold">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                      {caption.like_count}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Date:</span>
                    <span className="text-gray-900 dark:text-white font-medium">{new Date(caption.created_datetime_utc).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Prompt Chain Execution Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex flex-col mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Prompt Chain Outputs
                </h2>
                <div className="text-gray-600 dark:text-gray-400">
                  {modelResponses.length} {modelResponses.length === 1 ? 'response' : 'responses'} from prompt chain <Link href={`/prompt-chains/${caption.llm_prompt_chain_id}`} className="text-blue-600 dark:text-blue-400 hover:underline">#{caption.llm_prompt_chain_id}</Link>.
                </div>
              </div>

              {debugError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 text-red-800 dark:text-red-400 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold mb-1">Database Query Error</h3>
                    <pre className="text-xs font-mono whitespace-pre-wrap">{JSON.stringify(debugError, null, 2)}</pre>
                  </div>
                </div>
              )}

              {!caption.llm_prompt_chain_id ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                  <p>No prompt chain was recorded for this caption.</p>
                  <p className="text-sm mt-2">This might be an older caption generated before tracing was enabled.</p>
                </div>
              ) : modelResponses.length === 0 && !debugError ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                  <p>Prompt chain ID found, but no response steps were recorded.</p>
                  <p className="text-sm mt-2">This could be because the response tables were cleared, or the relation failed to fetch.</p>
                </div>
              ) : (
                <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 dark:before:via-gray-600 before:to-transparent">
                  {modelResponses.map((step, index) => {
                    // Extract data safely based on potential array wraps
                    const modelObj = Array.isArray(step.llm_models) ? step.llm_models[0] : step.llm_models;
                    const modelName = modelObj?.name || `Model ID: ${step.llm_model_id}`;
                    const providerModelId = modelObj?.provider_model_id || '';

                    const stepObj = step.humor_flavor_steps;
                    const stepOrder = stepObj?.order_by || index + 1;
                    const stepDescription = stepObj?.description || '';
                    const stepTypeName = stepObj?.humor_flavor_step_type_id ? stepTypesMap[stepObj.humor_flavor_step_type_id] : 'General';

                    // Try to parse JSON response for better display
                    let parsedResponse = null;
                    let isArray = false;
                    try {
                      if (step.llm_model_response && (step.llm_model_response.startsWith('{') || step.llm_model_response.startsWith('['))) {
                        parsedResponse = JSON.parse(step.llm_model_response);
                        if (Array.isArray(parsedResponse)) {
                          isArray = true;
                        } else if (parsedResponse.choices?.[0]?.message?.content) {
                          try {
                            const innerContent = JSON.parse(parsedResponse.choices[0].message.content);
                            if (Array.isArray(innerContent)) {
                              parsedResponse = innerContent;
                              isArray = true;
                            } else {
                              parsedResponse = parsedResponse.choices[0].message.content;
                            }
                          } catch {
                            parsedResponse = parsedResponse.choices[0].message.content;
                          }
                        }
                      }
                    } catch (e) {
                      // Keep raw
                    }

                    return (
                      <div key={step.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden relative">
                        {/* Connecting Line for Timeline effect - only show if not the last item */}
                        {index !== modelResponses.length - 1 && (
                            <div className="absolute left-6 top-16 bottom-[-2rem] w-0.5 bg-gray-200 dark:bg-gray-700 z-0 hidden md:block"></div>
                        )}

                        {/* Step Header */}
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 border-b border-gray-200 dark:border-gray-700 flex items-start gap-4 relative z-10">
                           <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm shrink-0 shadow-sm">
                             {index + 1}
                           </div>
                           <div className="flex-grow">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                  Step {stepOrder} - {stepTypeName}
                                </h3>
                                <Link href={`/llm-responses/${step.id}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                                  View Raw Log
                                </Link>
                              </div>
                              {stepDescription && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{stepDescription}</p>
                              )}

                              {/* Step Metadata */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-3">
                                <div>
                                  <div className="text-gray-500 dark:text-gray-400 font-medium mb-1">Order</div>
                                  <div className="text-gray-900 dark:text-white font-mono">{stepOrder}</div>
                                </div>
                                <div>
                                  <div className="text-gray-500 dark:text-gray-400 font-medium mb-1">Model</div>
                                  <div className="text-gray-900 dark:text-white font-mono">
                                    {modelName} <span className="text-gray-400 text-xs block">({providerModelId})</span>
                                  </div>
                                </div>
                                <div>
                                  <div className="text-gray-500 dark:text-gray-400 font-medium mb-1">Temperature</div>
                                  <div className="text-gray-900 dark:text-white font-mono">{step.llm_temperature != null ? step.llm_temperature.toFixed(2) : 'Default'}</div>
                                </div>
                                <div>
                                  <div className="text-gray-500 dark:text-gray-400 font-medium mb-1">Processing Time</div>
                                  <div className="text-gray-900 dark:text-white font-mono">{step.processing_time_seconds}s</div>
                                </div>
                              </div>
                           </div>
                        </div>

                        {/* Step Content */}
                        <div className="p-4 space-y-6 pl-4 md:pl-16 relative z-10">

                          {step.llm_system_prompt && (
                            <div>
                              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2">System prompt</h4>
                              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                                <p className="text-sm text-gray-800 dark:text-gray-300 font-mono whitespace-pre-wrap leading-relaxed">
                                  {step.llm_system_prompt}
                                </p>
                              </div>
                            </div>
                          )}

                          <div>
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2">User prompt</h4>
                            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                              <p className="text-sm text-gray-800 dark:text-gray-300 font-mono whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                                {step.llm_user_prompt}
                              </p>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Model response</h4>
                            <div className="bg-green-50 dark:bg-green-900/10 p-3 rounded-lg border border-green-100 dark:border-green-900/30">
                              {isArray ? (
                                <ul className="list-disc pl-4 space-y-1">
                                  {(parsedResponse as any[]).map((item, i) => (
                                    <li key={i} className="text-sm font-serif text-gray-800 dark:text-gray-200">
                                      {typeof item === 'string' ? `"${item}"` : (
                                        <pre className="inline-block bg-white dark:bg-gray-900 p-2 rounded text-xs font-mono text-gray-700 dark:text-gray-300 w-full mt-1 overflow-x-auto">
                                          {JSON.stringify(item, null, 2)}
                                        </pre>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <pre className="text-sm text-green-900 dark:text-green-300 font-mono whitespace-pre-wrap max-h-96 overflow-y-auto">
                                  {typeof parsedResponse === 'string' ? parsedResponse : (parsedResponse ? JSON.stringify(parsedResponse, null, 2) : step.llm_model_response)}
                                </pre>
                              )}
                            </div>
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 flex items-center gap-2 select-none outline-none">
                  <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  View Raw Caption Data
                </summary>
                <div className="mt-4">
                  <pre className="bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-300 p-4 rounded-lg overflow-x-auto text-xs border border-gray-200 dark:border-gray-700">
                    {JSON.stringify(caption, null, 2)}
                  </pre>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
