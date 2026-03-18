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
