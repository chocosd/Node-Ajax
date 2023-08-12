import { Observable } from "rxjs";
export type NodeAjaxOptions = {
  url: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: any;
  contentType?: "json" | "text" | "form";
  timeout?: number;
};
export declare function NodeAjax<T>(options: NodeAjaxOptions): Observable<T>;
