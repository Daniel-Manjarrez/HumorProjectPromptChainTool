'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Layers, Plus, Pencil, Trash2, Settings2 } from 'lucide-react';
import { createFlavor, updateFlavor, deleteFlavor } from './actions';

type Flavor = {
  id: number;
  slug: string;
  description: string;
  step_count: number;
};

export default function FlavorListClient({ initialFlavors }: { initialFlavors: Flavor[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFlavor, setEditingFlavor] = useState<Flavor | null>(null);
  const [formData, setFormData] = useState({ slug: '', description: '' });
  const [loading, setLoading] = useState(false);

  const handleOpenCreate = () => {
    setEditingFlavor(null);
    setFormData({ slug: '', description: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (flavor: Flavor) => {
    setEditingFlavor(flavor);
    setFormData({ slug: flavor.slug, description: flavor.description || '' });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this flavor? All its steps will also be deleted.')) return;
    try {
      await deleteFlavor(id);
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingFlavor) {
        await updateFlavor(editingFlavor.id, formData);
      } else {
        await createFlavor(formData);
      }
      setIsModalOpen(false);
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Layers className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            Humor Flavors
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage the core styles and their underlying prompt pipelines.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-sm"
        >
          <Plus className="h-4 w-4" />
          New Flavor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {initialFlavors.map((flavor) => (
          <div key={flavor.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 flex flex-col h-full hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate" title={flavor.slug}>
                {flavor.slug}
              </h3>
              <div className="flex gap-2">
                <button onClick={() => handleOpenEdit(flavor)} className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="Edit Metadata">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(flavor.id)} className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors" title="Delete Flavor">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 flex-grow line-clamp-3">
              {flavor.description || <span className="italic text-gray-400">No description provided.</span>}
            </p>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {flavor.step_count} {flavor.step_count === 1 ? 'Step' : 'Steps'}
              </div>
              <Link
                href={`/flavors/${flavor.id}`}
                className="flex items-center gap-2 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 font-semibold"
              >
                <Settings2 className="h-4 w-4" />
                Build Chain
              </Link>
            </div>
          </div>
        ))}
        {initialFlavors.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
            No humor flavors found. Create one to get started!
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingFlavor ? 'Edit Flavor' : 'Create New Flavor'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Slug (Name) <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. gen-z-sarcasm"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-shadow"
                  value={formData.slug}
                  onChange={e => setFormData({ ...formData, slug: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe what this flavor aims to generate..."
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-shadow"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium transition-colors"
                >
                  {loading ? 'Saving...' : 'Save Flavor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
