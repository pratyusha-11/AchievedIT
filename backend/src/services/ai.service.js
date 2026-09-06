// Certificate detail extraction via Groq (qwen/qwen3.6-27b — multimodal, JSON mode).
// GROQ_API_KEY stays server-side only.

const SYSTEM_PROMPT = `You are extracting structured metadata from a certificate image for a student's achievement tracker.
Return ONLY a raw JSON object, no markdown fences, no preamble, matching exactly this shape:
{
  "title": string,
  "organizer": string,
  "eventType": "hackathon" | "workshop" | "competition" | "online_course" | "seminar" | "internship" | "other",
  "mode": "online" | "offline",
  "startDate": string|null,
  "endDate": string|null,
  "position": "winner" | "runner_up" | "finalist" | "participant" | "completion",
  "domainTags": string[],
  "credentialUrl": string|null,
  "description": string
}
Dates must be ISO format YYYY-MM-DD. If a field cannot be determined from the image, use null (or "other"/"offline"/"participant" for enum fields, or [] for tags). Never invent specific facts you cannot see.`;

const MODEL = process.env.GROQ_MODEL || 'llama-3.2-11b-vision-preview';

async function extractCertificateDetails(base64Image, mediaType = 'image/jpeg') {
  const cleanMediaType = mediaType.includes('png') ? 'image/png' : 'image/jpeg';
  const apiKey = (process.env.GROQ_API_KEY || '').trim();

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: MODEL,
      response_format: { type: 'json_object' },
      temperature: 0.1,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract the certificate details from this image as the specified JSON object.' },
            { type: 'image_url', image_url: { url: `data:${cleanMediaType};base64,${base64Image}` } }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errBody}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('No response from extraction model');

  // Extract JSON object safely even if wrapped in markdown fences or commentary
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  const toParse = jsonMatch ? jsonMatch[0] : content.replace(/```json|```/g, '').trim();
  return JSON.parse(toParse);
}

module.exports = { extractCertificateDetails };
