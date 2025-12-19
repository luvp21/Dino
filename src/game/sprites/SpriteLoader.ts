// Sprite sheet loader and cache manager

export class SpriteLoader {
  private static cache: Map<string, HTMLImageElement> = new Map();
  private static loadingPromises: Map<string, Promise<HTMLImageElement>> = new Map();

  /**
   * Load a sprite sheet image and cache it
   */
  static async load(src: string): Promise<HTMLImageElement> {
    // Return cached image if available
    if (this.cache.has(src)) {
      return this.cache.get(src)!;
    }

    // Return existing promise if already loading
    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src)!;
    }

    // Create new loading promise
    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.cache.set(src, img);
        this.loadingPromises.delete(src);
        resolve(img);
      };
      img.onerror = () => {
        this.loadingPromises.delete(src);
        reject(new Error(`Failed to load sprite: ${src}`));
      };
      img.src = src;
    });

    this.loadingPromises.set(src, promise);
    return promise;
  }

}
