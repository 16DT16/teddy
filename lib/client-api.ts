export class ApiError extends Error {
  status: number;
  retryable: boolean;

  constructor(
    message: string,
    status = 0,
    retryable = false,
  ) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.retryable = retryable;
  }
}

type FetchJsonOptions = RequestInit & {
  timeoutMs?: number;
};

function getHumanMessage(
  status: number,
  fallback?: string,
) {
  if (status === 401) {
    return "የመግቢያ ፍቃድዎ አልቋል። እባክዎ እንደገና ይግቡ።";
  }

  if (status === 403) {
    return "ይህን መረጃ ለማየት ፍቃድ የለዎትም።";
  }

  if (status === 404) {
    return fallback || "የተጠየቀው መረጃ አልተገኘም።";
  }

  if (status === 408 || status === 504) {
    return "ግንኙነቱ ዘግይቷል። ያለው መረጃ እንዳለ ተጠብቋል።";
  }

  if (status >= 500) {
    return "ከሰርቨሩ ጋር ጊዜያዊ የግንኙነት ችግር አለ። መረጃው በራሱ እንደገና ይሞከራል።";
  }

  return fallback || "ጥያቄውን ማጠናቀቅ አልተቻለም።";
}

export async function fetchJson<T>(
  url: string,
  options: FetchJsonOptions = {},
): Promise<T> {
  const {
    timeoutMs = 12000,
    signal: externalSignal,
    ...fetchOptions
  } = options;

  const controller = new AbortController();

  const timeout = window.setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  function abortFromExternalSignal() {
    controller.abort();
  }

  externalSignal?.addEventListener(
    "abort",
    abortFromExternalSignal,
    { once: true },
  );

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...fetchOptions.headers,
      },
    });

    const contentType =
      response.headers.get("content-type") || "";

    const text = await response.text();

    let data: any = {};

    if (
      text.trim() &&
      contentType.includes("application/json")
    ) {
      try {
        data = JSON.parse(text);
      } catch {
        data = {};
      }
    }

    if (!response.ok) {
      const retryable =
        response.status === 408 ||
        response.status === 429 ||
        response.status >= 500;

      throw new ApiError(
        getHumanMessage(
          response.status,
          typeof data?.error === "string"
            ? data.error
            : undefined,
        ),
        response.status,
        retryable,
      );
    }

    if (
      text.trim() &&
      !contentType.includes("application/json")
    ) {
      throw new ApiError(
        "ሰርቨሩ ያልተጠበቀ ምላሽ ሰጥቷል።",
        response.status,
        true,
      );
    }

    return data as T;
  } catch (error) {
    if (
      error instanceof DOMException &&
      error.name === "AbortError"
    ) {
      if (externalSignal?.aborted) {
        throw error;
      }

      throw new ApiError(
        "ግንኙነቱ ዘግይቷል። ያለው መረጃ እንዳለ ተጠብቋል።",
        408,
        true,
      );
    }

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      navigator.onLine
        ? "ከሰርቨሩ ጋር መገናኘት አልተቻለም። በራሱ እንደገና ይሞከራል።"
        : "የኢንተርኔት ግንኙነት የለም። ግንኙነቱ ሲመለስ መረጃው ይታደሳል።",
      0,
      true,
    );
  } finally {
    window.clearTimeout(timeout);

    externalSignal?.removeEventListener(
      "abort",
      abortFromExternalSignal,
    );
  }
}