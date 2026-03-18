import { getApiBaseUrl, readAccessToken } from "@/lib/auth";

export type FavoriteProductItem = {
  id: string;
  sku_id_default: string;
  title: string;
  category_label: string | null;
  sale_price: number | null;
  image_url: string | null;
  product_url: string | null;
  description_text: string | null;
  recommendation_reason: string | null;
  specs: Record<string, string>;
  source_page: string | null;
  created_at: string;
};

export type FavoriteProductCreateInput = {
  sku_id_default: string;
  title: string;
  category_label?: string | null;
  sale_price?: number | null;
  image_url?: string | null;
  product_url?: string | null;
  description_text?: string | null;
  recommendation_reason?: string | null;
  specs?: Record<string, string>;
  source_page?: string | null;
};

function buildAuthHeaders() {
  const token = readAccessToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchFavoriteProducts(): Promise<FavoriteProductItem[]> {
  const response = await fetch(`${getApiBaseUrl()}/favorites/products`, {
    headers: buildAuthHeaders(),
  });
  const payload = await parseJsonResponse<{ items: FavoriteProductItem[] }>(
    response,
    "Could not load your favorites.",
  );
  return payload.items;
}

export async function createFavoriteProduct(
  payload: FavoriteProductCreateInput,
): Promise<FavoriteProductItem> {
  const response = await fetch(`${getApiBaseUrl()}/favorites/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });
  return parseJsonResponse<FavoriteProductItem>(response, "Could not save this product to favorites.");
}

export async function deleteFavoriteProduct(skuIdDefault: string): Promise<void> {
  const response = await fetch(`${getApiBaseUrl()}/favorites/products/${encodeURIComponent(skuIdDefault)}`, {
    method: "DELETE",
    headers: buildAuthHeaders(),
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");
    const payload = isJson ? ((await response.json()) as unknown) : null;
    if (payload && typeof payload === "object" && "detail" in payload && typeof payload.detail === "string") {
      throw new Error(payload.detail);
    }
    throw new Error("Could not remove this favorite.");
  }
}

async function parseJsonResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? ((await response.json()) as unknown) : null;

  if (!response.ok) {
    if (payload && typeof payload === "object" && "detail" in payload && typeof payload.detail === "string") {
      throw new Error(payload.detail);
    }
    throw new Error(fallbackMessage);
  }

  if (!payload) {
    throw new Error(fallbackMessage);
  }

  return payload as T;
}
