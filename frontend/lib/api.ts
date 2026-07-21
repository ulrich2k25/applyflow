const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const AUTH_UNAUTHORIZED_EVENT =
  "applyflow:unauthorized";

interface ApiErrorBody {
  message?: string | string[];
}

interface ApiRequestOptions extends RequestInit {
  token?: string;
}

function isApiErrorBody(
  value: unknown,
): value is ApiErrorBody {
  return (
    typeof value === "object" &&
    value !== null &&
    "message" in value
  );
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  if (!API_URL) {
    throw new Error(
      "NEXT_PUBLIC_API_URL n’est pas configurée.",
    );
  }

  const { token, headers, ...requestOptions } =
    options;

  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...requestOptions,
      headers: {
        Accept: "application/json",
        ...(requestOptions.body instanceof FormData
          ? {}
          : {
              "Content-Type": "application/json",
            }),
        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),
        ...headers,
      },
    },
  );

  if (!response.ok) {
    if (
      response.status === 401 &&
      typeof window !== "undefined"
    ) {
      window.dispatchEvent(
        new Event(AUTH_UNAUTHORIZED_EVENT),
      );
    }

    const errorBody: unknown = await response
      .json()
      .catch(() => null);

    let message = "Une erreur est survenue.";

    if (
      isApiErrorBody(errorBody) &&
      errorBody.message
    ) {
      message = Array.isArray(errorBody.message)
        ? errorBody.message.join(" ")
        : errorBody.message;
    }

    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
