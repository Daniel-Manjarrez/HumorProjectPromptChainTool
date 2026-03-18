'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// --- HUMOR FLAVORS ---

export async function createFlavor(data: { slug: string, description?: string }) {
  const supabase = await createClient()
  const { error } = await supabase.from('humor_flavors').insert(data)
  if (error) throw new Error(error.message)
  revalidatePath('/flavors')
}

export async function updateFlavor(id: number, data: { slug: string, description?: string }) {
  const supabase = await createClient()
  const { error } = await supabase.from('humor_flavors').update(data).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/flavors')
  revalidatePath(`/flavors/${id}`)
}

export async function deleteFlavor(id: number) {
  const supabase = await createClient()
  const { error } = await supabase.from('humor_flavors').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/flavors')
}

// --- HUMOR FLAVOR STEPS ---

export async function createStep(data: any) {
  const supabase = await createClient()
  const { error } = await supabase.from('humor_flavor_steps').insert(data)
  if (error) throw new Error(error.message)
  revalidatePath(`/flavors/${data.humor_flavor_id}`)
}

export async function updateStep(id: number, data: any) {
  const supabase = await createClient()
  const { error } = await supabase.from('humor_flavor_steps').update(data).eq('id', id)
  if (error) throw new Error(error.message)
  if (data.humor_flavor_id) {
    revalidatePath(`/flavors/${data.humor_flavor_id}`)
  }
}

export async function deleteStep(id: number, flavorId: number) {
  const supabase = await createClient()
  const { error } = await supabase.from('humor_flavor_steps').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/flavors/${flavorId}`)
}

export async function reorderSteps(flavorId: number, orderedStepIds: number[]) {
  const supabase = await createClient()

  // Update each step's order_by based on its index in the array
  // In a production app, a stored procedure is better for bulk updates,
  // but this loop works fine for a small number of steps.
  for (let i = 0; i < orderedStepIds.length; i++) {
    const { error } = await supabase
      .from('humor_flavor_steps')
      .update({ order_by: i + 1 }) // Assuming 1-based ordering
      .eq('id', orderedStepIds[i])

    if (error) throw new Error(`Failed to update order for step ${orderedStepIds[i]}`)
  }

  revalidatePath(`/flavors/${flavorId}`)
}
