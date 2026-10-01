// Mermaid instantiates this class only when an ELK layout is requested.
export default class ELK {
  layout(_graph: unknown, _options?: unknown): Promise<never> {
    return Promise.reject(new Error("ELK layout is not available in Folio builds"));
  }
}
