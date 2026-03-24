const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:8010";

export async function fetchProviderStatus() {
  const response = await fetch(`${API_BASE_URL}/v1/provider/status`);
  if (!response.ok) throw new Error("Failed to fetch provider status");
  return response.json();
}

export async function uploadPersonImage(imageUri) {
  const formData = new FormData();
  formData.append("image", {
    uri: imageUri,
    name: "person.jpg",
    type: "image/jpeg",
  });

  const response = await fetch(`${API_BASE_URL}/v1/try-on/upload`, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) throw new Error("Failed to upload image");
  return response.json();
}

export async function fetchCatalog(category, limit = 16) {
  const url = `${API_BASE_URL}/v1/catalog?category=${encodeURIComponent(category)}&limit=${limit}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch catalog");
  return response.json();
}

export async function requestTryOn(personImageUrl, stylePrompt, category, selectedProduct) {
  const body = {
    person_image_url: personImageUrl,
    style_prompt: stylePrompt,
    category,
  };
  if (selectedProduct) {
    body.selected_product = {
      id: selectedProduct.id,
      title: selectedProduct.title,
      brand: selectedProduct.brand,
      price: selectedProduct.price,
      currency: selectedProduct.currency || "INR",
      image_url: selectedProduct.image_url,
      purchase_url: selectedProduct.purchase_url,
      retailer: selectedProduct.retailer || null,
    };
  }
  const response = await fetch(`${API_BASE_URL}/v1/try-on/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error("Failed to request try-on");
  return response.json();
}

export async function fetchTryOnResult(jobId) {
  const response = await fetch(`${API_BASE_URL}/v1/try-on/${jobId}`);
  if (!response.ok) throw new Error("Failed to fetch try-on result");
  return response.json();
}
