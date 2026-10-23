type Choice = { active: string; fallback: string }

export async function attempt<T>(choice: Choice, call: (model: string) => Promise<T>) {
  try {
    return await call(choice.active)
  } catch (error) {
    if (!choice.fallback || choice.fallback === choice.active) throw error
    return call(choice.fallback)
  }
}
