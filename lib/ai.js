// Optional AI helper. Set ANTHROPIC_API_KEY (and optionally ANTHROPIC_MODEL) to switch it on.
export const aiEnabled = () => Boolean(process.env.ANTHROPIC_API_KEY);

export async function askAi(system, prompt, maxTokens = 900) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5',
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: prompt }],
    }),
    signal: AbortSignal.timeout(45000),
  });
  if (!res.ok) throw new Error(`AI request failed (${res.status})`);
  const data = await res.json();
  return (data.content || []).map((c) => c.text || '').join('').trim();
}
