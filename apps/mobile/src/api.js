const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:8010";

export async function requestTryOn(personImageUrl, stylePrompt, category) {
  const response = await fetch(`${API_BASE_URL}/v1/try-on/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      person_image_url: personImageUrl,
      style_prompt: stylePrompt,
      category,
    }),
  });
  if (!response.ok) throw new Error("Failed to request try-on");
  return response.json();
}

export async function fetchTryOnResult(jobId) {
  const response = await fetch(`${API_BASE_URL}/v1/try-on/${jobId}`);
  if (!response.ok) throw new Error("Failed to fetch try-on result");
  return response.json();
}
