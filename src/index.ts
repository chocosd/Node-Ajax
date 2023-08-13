import * as https from "https";
import { Observable } from "rxjs";

export type NodeAjaxOptions<TOptions = any> = {
  url: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: TOptions;
  contentType?: "json" | "text" | "form";
  timeout?: number;
};

export function NodeAjax<T>(options: NodeAjaxOptions): Observable<T> {
  return new Observable<T>((observer) => {
    const urlObj = new URL(options.url);

    let requestBody: string | undefined;
    const timeout: number = options.timeout || 5000;

    if (options.body) {
      // Default to 'json' if contentType is not provided
      const contentType = options.contentType || "json";

      switch (contentType) {
        case "json":
          options.headers = {
            ...options.headers,
            ["Content-Type"]: "application/json",
          };
          requestBody = JSON.stringify(options.body);
          break;
        case "form":
          options.headers = {
            ...options.headers,
            ["Content-Type"]: "application/x-www-form-urlencoded",
          };
          requestBody = Object.keys(options.body)
            .map(
              (key) =>
                encodeURIComponent(key) +
                "=" +
                encodeURIComponent(options.body![key])
            )
            .join("&");
          break;
        case "text":
          options.headers = {
            ...options.headers,
            ["Content-Type"]: "text/plain",
          };
          requestBody = options.body as string;
          break;
        default:
          observer.error(new Error("Unsupported content type"));
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
