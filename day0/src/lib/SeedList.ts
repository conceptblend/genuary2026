export class SeedList {
  private list = [];
  private cursor = 0;
  constructor(seed?) {
    this.list = [];
    if (undefined === seed) return;
    this.add(seed);
  }
  add(seed) {
    this.list.push(seed);
    this.cursor = this.list.length - 1;
  }
  remove() {
    this.list.pop();
    this.cursor = this.list.length - 1;
  }
  next() {
    this.cursor = Math.min(this.cursor + 1, this.list.length - 1);
    console.log(this.cursor, this.list.length);
    return this.list[this.cursor];
  }
  previous() {
    this.cursor = Math.max(this.cursor - 1, 0);
    console.log(this.cursor);
    return this.list[this.cursor];
  }
}
