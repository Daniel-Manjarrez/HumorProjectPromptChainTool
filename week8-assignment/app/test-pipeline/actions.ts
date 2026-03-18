'use server'

import { createClient } from '@/utils/supabase/server'

const API_BASE = 'https://api.almostcrackd.ai'

async function getAuthToken() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Not authenticated')
  }

  return session.access_token
}

export async function testFlavorGeneration(imageId: string, humorFlavorId: number) {
  const token = await getAuthToken()

  const response = await fetch(`${API_BASE}/pipeline/generate-captions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageId,
      humorFlavorId
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to generate: ${response.status} ${errorText}`)
  }

  return await response.json()
}

export async function fetchImagesForSet(setId: number) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('study_image_set_image_mappings')
    .select(`
      images (
        id,
        url
      )
    `)
    .eq('study_image_set_id', setId)

  if (error) {
    throw new Error(error.message)
  }

  // Clean up the nested structure and filter out any nulls
  const processedImages = data
    .map(mapping => mapping.images)
    // Handle potential array returns from Supabase joins
    .map(img => Array.isArray(img) ? img[0] : img)
    .filter(img => img && img.url)

  return processedImages
}
