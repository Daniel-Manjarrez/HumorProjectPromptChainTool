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

export async function duplicateFlavor(id: number) {
  const supabase = await createClient()

  // 1. Fetch original flavor
  const { data: originalFlavor, error: flavorError } = await supabase
    .from('humor_flavors')
    .select('*')
    .eq('id', id)
    .single()

  if (flavorError || !originalFlavor) throw new Error("Could not find original flavor")

  // 2. Insert new flavor (with 'copy' appended to slug)
  let newSlug = `${originalFlavor.slug}-copy`
  let counter = 1
  let isUnique = false

  // Ensure unique slug
  while (!isUnique) {
    const { data: existing } = await supabase.from('humor_flavors').select('id').eq('slug', newSlug).single()
    if (existing) {
      newSlug = `${originalFlavor.slug}-copy-${counter}`
      counter++
    } else {
      isUnique = true
    }
  }

  const { data: newFlavor, error: insertError } = await supabase
    .from('humor_flavors')
    .insert({
      slug: newSlug,
      description: originalFlavor.description ? `${originalFlavor.description} (Copy)` : 'Copy',
    })
    .select()
    .single()

  if (insertError || !newFlavor) throw new Error("Failed to create duplicated flavor")

  // 3. Fetch original steps
  const { data: originalSteps, error: stepsError } = await supabase
    .from('humor_flavor_steps')
    .select('*')
    .eq('humor_flavor_id', id)
    .order('order_by', { ascending: true })

  if (stepsError) throw new Error("Failed to fetch original steps")

  // 4. Duplicate steps for the new flavor
  if (originalSteps && originalSteps.length > 0) {
    const newSteps = originalSteps.map(step => {
      const { id: _removedId, created_datetime_utc: _removedDate, ...stepData } = step
      return {
        ...stepData,
        humor_flavor_id: newFlavor.id
      }
    })

    const { error: insertStepsError } = await supabase
      .from('humor_flavor_steps')
      .insert(newSteps)

    if (insertStepsError) throw new Error("Failed to duplicate steps: " + insertStepsError.message)
  }

  revalidatePath('/flavors')
  return newFlavor.id
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
