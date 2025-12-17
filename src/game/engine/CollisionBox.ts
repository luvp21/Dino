/**
 * Collision Box class for precise hitbox detection
 */
export class CollisionBox {
  constructor(
    public x: number,
    public y: number,
    public width: number,
    public height: number
  ) {}

  static compare(box1: CollisionBox, box2: CollisionBox): boolean {
    return (
      box1.x < box2.x + box2.width &&
      box1.x + box1.width > box2.x &&
      box1.y < box2.y + box2.height &&
      box1.y + box1.height > box2.y
    );
  }

  clone(): CollisionBox {
    return new CollisionBox(this.x, this.y, this.width, this.height);
  }
}
