'use client';

import { useState, useEffect } from 'react';
import { testFlavorGeneration, fetchImagesForSet } from './actions';
import { Play, Loader2, CheckCircle2, AlertCircle, TestTube2, Image as ImageIcon } from 'lucide-react';

type Flavor = { id: number; slug: string; description: string };
type ImageSet = { id: number; slug: string; description: string };
type Image = { id: string; url: string };

type Props = {
  flavors: Flavor[];
  imageSets: ImageSet[];
  defaultImages: Image[];
};

export default function TesterClient({ flavors, imageSets, defaultImages }: Props) {
  const [selectedSet, setSelectedSet] = useState<number | 'recent'>('recent');
  const [currentImages, setCurrentImages] = useState<Image[]>(defaultImages);
  const [loadingImages, setLoadingImages] = useState(false);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFlavor, setSelectedFlavor] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch images when set changes
  useEffect(() => {
    async function loadImages() {
      if (selectedSet === 'recent') {
        setCurrentImages(defaultImages);
        setSelectedImage(null);
        return;
      }

      setLoadingImages(true);
      setSelectedImage(null); // Reset selection when changing set
      try {
        const images = await fetchImagesForSet(selectedSet as number);
        setCurrentImages(images as any);
      } catch (err) {
        console.error("Failed to fetch images for set:", err);
        setCurrentImages([]);
      } finally {
        setLoadingImages(false);
      }
    }

    loadImages();
  }, [selectedSet, defaultImages]);

  const handleTest = async () => {
    if (!selectedImage || !selectedFlavor) return;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const data = await testFlavorGeneration(selectedImage, selectedFlavor);
      setResults(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const getSelectedImageUrl = () => {
    return currentImages.find(img => img.id === selectedImage)?.url;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Configuration Column */}
      <div className="lg:col-span-1 space-y-6">

        {/* Step 1: Dataset Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
            Select Data Set
          </h2>
          <select
            value={selectedSet}
            onChange={(e) => setSelectedSet(e.target.value === 'recent' ? 'recent' : parseInt(e.target.value))}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="recent">Recent Uploads (Default)</option>
            {imageSets.map(set => (
              <option key={set.id} value={set.id}>{set.slug}</option>
            ))}
          </select>
        </div>

        {/* Step 2: Image Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
            Select Image
          </h2>

          {loadingImages ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          ) : currentImages.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No images found in this set.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto p-2 border border-gray-100 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50">
              {currentImages.map((img) => (
                <div
                  key={img.id}
                  onClick={() => setSelectedImage(img.id)}
                  className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all aspect-square ${selectedImage === img.id ? 'border-blue-500 shadow-md transform scale-95' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'}`}
                >
                  <img src={img.url} alt="Test" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Step 3: Flavor Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span>
            Select Flavor
          </h2>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
            {flavors.map((flavor) => (
              <label
                key={flavor.id}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedFlavor === flavor.id ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
              >
                <input
                  type="radio"
                  name="flavor"
                  value={flavor.id}
                  checked={selectedFlavor === flavor.id}
                  onChange={() => setSelectedFlavor(flavor.id)}
                  className="mt-1 text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white text-sm">{flavor.slug}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{flavor.description || 'No description'}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Step 4: Run */}
        <button
          onClick={handleTest}
          disabled={!selectedImage || !selectedFlavor || loading}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <><Loader2 className="h-5 w-5 animate-spin" /> Generating...</>
          ) : (
            <><Play className="h-5 w-5 fill-current" /> Run Pipeline</>
          )}
        </button>

      </div>

      {/* Results Column */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 min-h-[500px] flex flex-col">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
            Pipeline Results
          </h2>

          {!selectedImage && !results && !loading && !error && (
            <div className="flex-grow flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
              <TestTube2 className="h-16 w-16 mb-4 opacity-50" />
              <p>Select an image and flavor to begin testing.</p>
            </div>
          )}

          {loading && (
            <div className="flex-grow flex flex-col items-center justify-center text-blue-500">
              <Loader2 className="h-12 w-12 animate-spin mb-4" />
              <p className="font-medium animate-pulse">Running prompt chain...</p>
              <p className="text-sm text-gray-500 mt-2">This may take 10-30 seconds depending on the model.</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-400 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold mb-1">Pipeline Error</h3>
                <p className="text-sm font-mono whitespace-pre-wrap">{error}</p>
              </div>
            </div>
          )}

          {results && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span className="font-semibold">Successfully generated {results.length} captions!</span>
              </div>

              {/* Context display */}
              <div className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="w-24 h-24 shrink-0 rounded-md overflow-hidden bg-gray-200">
                   <img src={getSelectedImageUrl()} alt="Input" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Used Flavor</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {flavors.find(f => f.id === selectedFlavor)?.slug}
                  </p>
                </div>
              </div>

              {/* Captions List */}
              <div className="space-y-4">
                {results.map((caption: any, idx: number) => (
                  <div key={idx} className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                    <p className="text-xl font-serif text-gray-800 dark:text-gray-200 italic pl-3 leading-relaxed">
                      "{caption.content || caption}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
