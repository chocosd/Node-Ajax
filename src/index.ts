import * as https from "https";
import { Observable } from "rxjs";

export type NodeAjaxOptions<TOptions = any> = {
  url: string;
  method?: HttpMethods;
  headers?: Record<string, string>;
  body?: TOptions;
  contentType?: "json" | "text" | "form";
  timeout?: number;
  params?: Record<string, string | number | boolean>;
};

export type HttpMethods = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

function handleContentType<T>(
  contentType: string | undefined,
  body: T | undefined,
  headers: Record<string, string> | undefined
): [Record<string, string> | undefined, string | undefined] {
  if (!body) return [headers, undefined];

  switch (contentType || "json") {
    case "json":
      return [
        { ...headers, "Content-Type": "application/json" },
        JSON.stringify(body),
      ];
    case "form":
      return [
        { ...headers, "Content-Type": "application/x-www-form-urlencoded" },
        new URLSearchParams(stringifyValues(body)).toString(),
      ];
    case "text":
      return [{ ...headers, "Content-Type": "text/plain" }, body as string];
    default:
      throw new Error("Unsupported content type");
  }
}

const stringifyValues = (obj: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, String(value)])
  );

function nodeAjax<T>(options: NodeAjaxOptions<T>): Observable<T> {
  return new Observable<T>((observer) => {
    const urlObj = new URL(options.url);
    const timeout: number = options.timeout || 5000;
    let requestBody: any;

    // Append query parameters if present
    if (options.params) {
      for (const [key, value] of Object.entries(options.params)) {
        urlObj.searchParams.append(key, value.toString());
      }
    }

    if (options.body) {
      // Default to 'json' if contentType is not provided
      const contentType = options.contentType || "json";

      try {
        [options.headers, requestBody] = handleContentType<T>(
          contentType,
          options.body,
          options.headers
        );
      } catch (error) {
        observer.error(error);
        return;
      }

      if (requestBody && options.headers) {
        options.headers["Content-Length"] =
          Buffer.byteLength(requestBody).toString();
      }
    }

    const requestOptions: https.RequestOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || "GET",
      headers: options.headers,
    };

    const request = https.request(requestOptions, (response) => {
      let data = "";

      response.on("data", (chunk) => {
        data += chunk;
      });

      // Error handling for response status code
      if (response.statusCode && response.statusCode >= 400) {
        const message = data ? JSON.parse(data).message : undefined;
        observer.error({
          status: response.statusCode,
          message: message || "An error occurred",
        });
        return;
      }

      response.on("end", () => {
        try {
          const parsedData = JSON.parse(data) as T;
          observer.next(parsedData);
          observer.complete();
        } catch (err) {
          observer.error(err);
        }
      });
    });

    // Set the timeout if specified
    request.setTimeout(timeout, () => {
      observer.error(new Error("Request timed out"));
      request.destroy();
    });

    if (requestBody) {
      request.write(requestBody);
    }
    request.on("error", (err) => observer.error(err));

    request.end();
  });
}

export class NodeAjax {
  protected method: HttpMethods;

  constructor(public Method: HttpMethods = "GET") {
    this.method = Method;
  }

  static get<TConfig>(
    url: string,
    options?: Omit<NodeAjaxOptions<TConfig>, "url" | "body">
  ): Observable<TConfig> {
    const instance = new NodeAjax("GET");
    return instance.request<TConfig>(url, options);
  }

  static post<TConfig>(
    url: string,
    body: TConfig,
    options?: Omit<NodeAjaxOptions<TConfig>, "url" | "body">
  ): Observable<TConfig> {
    const instance = new NodeAjax("POST");
    return instance.request<TConfig>(url, body, options);
  }

  static patch<TConfig>(
    url: string,
    body: TConfig,
    options?: Omit<NodeAjaxOptions<TConfig>, "url" | "body">
  ): Observable<TConfig> {
    const instance = new NodeAjax("PATCH");
    return instance.request<TConfig>(url, body, options);
  }

  static put<TConfig>(
    url: string,
    body: TConfig,
    options?: Omit<NodeAjaxOptions<TConfig>, "url" | "body">
  ): Observable<TConfig> {
    const instance = new NodeAjax("PUT");
    return instance.request<TConfig>(url, body, options);
  }

  static delete<TConfig>(
    url: string,
    options?: Omit<NodeAjaxOptions<TConfig>, "url" | "body">
  ): Observable<TConfig> {
    const instance = new NodeAjax("DELETE");
    return instance.request<TConfig>(url, options);
  }

  protected request<TConfig>(url: string): Observable<TConfig>;
  protected request<TConfig>(url: string, body?: TConfig): Observable<TConfig>;
  protected request<TConfig>(
    url: string,
    options?: Partial<NodeAjaxOptions<TConfig>>
  ): Observable<TConfig>;
  protected request<TConfig>(
    url: string,
    body?: TConfig,
    options?: Partial<NodeAjaxOptions<TConfig>>
  ): Observable<TConfig>;
  protected request<TConfig>(
    url: string,
    body?: TConfig,
    options?: Partial<NodeAjaxOptions<TConfig>>
  ): Observable<TConfig> {
    return nodeAjax({
      ...(options && { options }),
      url,
      ...(body && { body }),
      method: this.method,
    });
  }
}
