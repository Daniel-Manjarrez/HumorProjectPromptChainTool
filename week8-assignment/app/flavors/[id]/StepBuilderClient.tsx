'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GripVertical, Plus, Pencil, Trash2, Code2 } from 'lucide-react';
import { createStep, updateStep, deleteStep, reorderSteps } from '../actions';

type Step = {
  id: number;
  humor_flavor_id: number;
  order_by: number;
  llm_temperature: number | null;
  llm_input_type_id: number;
  llm_output_type_id: number;
  llm_model_id: number;
  humor_flavor_step_type_id: number;
  llm_system_prompt: string | null;
  llm_user_prompt: string | null;
  description: string | null;
};

type Lookup = { id: number; name: string; type?: string; slug?: string };
type ModelLookup = { id: number; name: string; is_temperature_supported: boolean };

type Props = {
  flavorId: number;
  initialSteps: Step[];
  lookups: {
    inputTypes: Lookup[];
    outputTypes: Lookup[];
    models: ModelLookup[];
    stepTypes: Lookup[];
  };
};

export default function StepBuilderClient({ flavorId, initialSteps, lookups }: Props) {
  const [steps, setSteps] = useState<Step[]>(initialSteps);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<Step | null>(null);
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Default form state
  const defaultForm = {
    humor_flavor_id: flavorId,
    humor_flavor_step_type_id: lookups.stepTypes[0]?.id || 1,
    llm_model_id: lookups.models[0]?.id || 1,
    llm_input_type_id: lookups.inputTypes[0]?.id || 1,
    llm_output_type_id: lookups.outputTypes[0]?.id || 1,
    llm_temperature: 1.0,
    llm_system_prompt: '',
    llm_user_prompt: '',
    description: '',
  };

  const [formData, setFormData] = useState<any>(defaultForm);

  useEffect(() => {
    setIsClient(true);
    setSteps(initialSteps);
  }, [initialSteps]);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    if (sourceIndex === destinationIndex) return;

    // Optimistic UI update
    const newSteps = Array.from(steps);
    const [reorderedItem] = newSteps.splice(sourceIndex, 1);
    newSteps.splice(destinationIndex, 0, reorderedItem);

    // Update local order_by for UI consistency before refresh
    const updatedSteps = newSteps.map((s, i) => ({ ...s, order_by: i + 1 }));
    setSteps(updatedSteps);

    try {
      const orderedIds = updatedSteps.map(s => s.id);
      await reorderSteps(flavorId, orderedIds);
    } catch (e: any) {
      alert('Failed to reorder: ' + e.message);
      setSteps(initialSteps); // revert
    }
  };

  const handleOpenCreate = () => {
    setEditingStep(null);
    setFormData({ ...defaultForm, order_by: steps.length + 1 });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (step: Step) => {
    setEditingStep(step);
    setFormData({
      ...step,
      llm_temperature: step.llm_temperature ?? 1.0,
      llm_system_prompt: step.llm_system_prompt || '',
      llm_user_prompt: step.llm_user_prompt || '',
      description: step.description || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this step?')) return;
    try {
      await deleteStep(id, flavorId);
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const getModelName = (id: number) => lookups.models.find(m => m.id === id)?.name || 'Unknown';

  const getStepTypeName = (id: number) => {
    const found = lookups.stepTypes.find(t => t.id === id);
    if (found) return found.name || found.type || found.slug || `Type ${id}`;
    return `Type ${id}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Clean up payload
    const payload = { ...formData };
    if (payload.llm_temperature === '') payload.llm_temperature = null;

    try {
      if (editingStep) {
        await updateStep(editingStep.id, payload);
      } else {
        await createStep(payload);
      }
      setIsModalOpen(false);
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isClient) return null; // Prevent SSR mismatch with DragDropContext

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Pipeline Steps</h2>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add Step
        </button>
      </div>

      {steps.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
          <Code2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No steps defined</h3>
          <p className="text-gray-500 dark:text-gray-400">Add the first step to start building this humor flavor's pipeline.</p>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="steps-list">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-4"
              >
                {steps.map((step, index) => (
                  <Draggable key={step.id.toString()} draggableId={step.id.toString()} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`bg-white dark:bg-gray-800 rounded-xl border ${snapshot.isDragging ? 'border-blue-500 shadow-xl dark:border-blue-500' : 'border-gray-200 dark:border-gray-700 shadow-sm'} p-4 flex gap-4 transition-colors`}
                      >
                        <div
                          {...provided.dragHandleProps}
                          className="flex items-center justify-center cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                          <GripVertical />
                        </div>

                        <div className="flex-grow flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                          <div className="flex-grow max-w-full overflow-hidden">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold px-2 py-1 rounded-md shrink-0">
                                Step {index + 1} - {getStepTypeName(step.humor_flavor_step_type_id)}
                              </span>
                              <span className="text-xs font-mono text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded border border-purple-100 dark:border-purple-800/50">
                                via {getModelName(step.llm_model_id)}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 font-mono whitespace-pre-wrap line-clamp-3 bg-gray-50 dark:bg-gray-900/50 p-2 rounded border border-gray-100 dark:border-gray-800">
                              {step.description || step.llm_system_prompt || step.llm_user_prompt || 'No description'}
                            </div>
                          </div>

                          <div className="flex gap-2 shrink-0 self-start sm:self-center mt-2 sm:mt-0">
                            <button onClick={() => handleOpenEdit(step)} className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-800">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(step.id)} className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 bg-gray-50 dark:bg-gray-700/50 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 shrink-0">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingStep ? 'Edit Step' : 'Create New Step'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Step Type</label>
                  <select
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    value={formData.humor_flavor_step_type_id}
                    onChange={e => setFormData({...formData, humor_flavor_step_type_id: parseInt(e.target.value)})}
                  >
                    {lookups.stepTypes.map((t: any) => <option key={t.id} value={t.id}>{t.name || t.type || t.slug || `Type ${t.id}`}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Model</label>
                  <select
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    value={formData.llm_model_id}
                    onChange={e => setFormData({...formData, llm_model_id: parseInt(e.target.value)})}
                  >
                    {lookups.models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Input Type</label>
                  <select
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    value={formData.llm_input_type_id}
                    onChange={e => setFormData({...formData, llm_input_type_id: parseInt(e.target.value)})}
                  >
                    {lookups.inputTypes.map((t: any) => <option key={t.id} value={t.id}>{t.name || t.type || `Type ${t.id}`}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Output Type</label>
                  <select
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    value={formData.llm_output_type_id}
                    onChange={e => setFormData({...formData, llm_output_type_id: parseInt(e.target.value)})}
                  >
                    {lookups.outputTypes.map((t: any) => <option key={t.id} value={t.id}>{t.name || t.type || `Type ${t.id}`}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 flex justify-between">
                  <span>Temperature</span>
                  <span className="text-blue-600 font-mono bg-blue-50 dark:bg-blue-900/30 px-2 rounded">{formData.llm_temperature}</span>
                </label>
                <input
                  type="range"
                  min="0" max="2" step="0.1"
                  className="w-full accent-blue-600"
                  value={formData.llm_temperature || 1.0}
                  onChange={e => setFormData({...formData, llm_temperature: parseFloat(e.target.value)})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Description (Internal note)</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="e.g. Extract visual elements"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">System Prompt</label>
                <textarea
                  rows={4}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-sm leading-relaxed"
                  value={formData.llm_system_prompt}
                  onChange={e => setFormData({...formData, llm_system_prompt: e.target.value})}
                  placeholder="You are an expert at..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">User Prompt Template</label>
                <textarea
                  rows={4}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-sm leading-relaxed"
                  value={formData.llm_user_prompt}
                  onChange={e => setFormData({...formData, llm_user_prompt: e.target.value})}
                  placeholder="Analyze this image and..."
                />
              </div>

            </form>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
              >
                {loading ? 'Saving...' : 'Save Step'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
