import { requireAdmin } from '@/utils/auth';
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Box } from 'lucide-react';

export default async function CaptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const supabase = await createClient();
  const { id } = await params;

  const { data: caption, error } = await supabase
    .from('captions')
    .select(`
      *,
      images (
        url
      ),
      profiles (
        email
      ),
      humor_flavors (
        slug
      )
    `)
    .eq('id', id)
    .single();

  if (error || !caption) {
    notFound();
  }

  // Fetch associated LLM model responses if a chain ID exists
  let modelResponses: any[] = [];
  if (caption.llm_prompt_chain_id) {
    const { data: responses, error: responsesError } = await supabase
      .from('llm_model_responses')
      .select(`
        id,
        llm_model_id,
        llm_user_prompt,
        llm_model_response,
        processing_time_seconds,
        created_datetime_utc,
        llm_models (
          name
        )
      `)
      .eq('llm_prompt_chain_id', caption.llm_prompt_chain_id)
      .order('created_datetime_utc', { ascending: true }); // Order by step execution time

    if (!responsesError && responses) {
      modelResponses = responses;
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <Link href="/captions" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-2 font-medium">
            <ArrowLeft className="h-4 w-4" /> Back to Captions
          </Link>
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
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Box className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Prompt Chain Execution
                </h2>
                {caption.llm_prompt_chain_id && (
                  <span className="text-xs font-mono bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">
                    Chain ID: {caption.llm_prompt_chain_id}
                  </span>
                )}
              </div>

              {!caption.llm_prompt_chain_id ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                  <p>No prompt chain was recorded for this caption.</p>
                  <p className="text-sm mt-2">This might be an older caption generated before tracing was enabled.</p>
                </div>
              ) : modelResponses.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                  <p>Prompt chain ID found, but no response steps were recorded.</p>
                </div>
              ) : (
                <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 dark:before:via-gray-600 before:to-transparent">
                  {modelResponses.map((step, index) => {
                    const modelName = Array.isArray(step.llm_models)
                      ? step.llm_models[0]?.name
                      : (step.llm_models as any)?.name;

                    // Try to parse JSON response for better display
                    let parsedResponse = null;
                    let isArray = false;
                    try {
                      if (step.llm_model_response && (step.llm_model_response.startsWith('{') || step.llm_model_response.startsWith('['))) {
                        parsedResponse = JSON.parse(step.llm_model_response);
                        if (Array.isArray(parsedResponse)) {
                          isArray = true;
                        } else if (parsedResponse.choices?.[0]?.message?.content) {
                          // Try to parse the content string if it's stringified JSON
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
                      <div key={step.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-gray-800 bg-blue-500 text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow font-bold text-sm z-10">
                          {index + 1}
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-shadow hover:shadow-md">
                          <div className="flex justify-between items-start mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">
                            <span className="font-bold text-gray-900 dark:text-white text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                              {modelName || `Model ID: ${step.llm_model_id}`}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                              {step.processing_time_seconds}s
                            </span>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Prompt Snapshot</div>
                              <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 max-h-32 overflow-y-auto border border-gray-100 dark:border-gray-800">
                                <p className="text-xs font-mono text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                                  {step.llm_user_prompt?.length > 300
                                    ? step.llm_user_prompt.substring(0, 300) + '...'
                                    : step.llm_user_prompt}
                                </p>
                              </div>
                            </div>

                            <div>
                              <div className="text-xs font-semibold text-green-600 dark:text-green-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                                Output
                                <Link href={`/llm-responses/${step.id}`} className="text-[10px] text-blue-500 hover:underline lowercase normal-case">view full raw log ↗</Link>
                              </div>
                              <div className="bg-green-50 dark:bg-green-900/10 rounded p-3 max-h-64 overflow-y-auto border border-green-100 dark:border-green-900/30">
                                {isArray ? (
                                  <ul className="list-disc pl-4 space-y-1">
                                    {(parsedResponse as string[]).map((item, i) => (
                                      <li key={i} className="text-sm font-serif text-gray-800 dark:text-gray-200">"{item}"</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-sm font-serif text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                                    {typeof parsedResponse === 'string' ? parsedResponse : (parsedResponse ? JSON.stringify(parsedResponse, null, 2) : step.llm_model_response)}
                                  </p>
                                )}
                              </div>
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
