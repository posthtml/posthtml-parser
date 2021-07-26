import { Position } from '../types/index.d';

export class LocationTracker {
  private readonly source: string;
  private lastPosition: Position;
  private lastIndex: number;

  constructor(source: string) {
    this.source = source;
    this.lastPosition = {
      line: 1,
      column: 1
    };

    this.lastIndex = 0;
  }

  getPosition(index: number): Position {
    if (index < this.lastIndex) {
      throw new Error('Source indices must be monotonic');
    }

    while (this.lastIndex < index) {
      if (this.source.charCodeAt(this.lastIndex) === /* \n */ 10) {
        this.lastPosition.line++;
        this.lastPosition.column = 1;
      } else {
        this.lastPosition.column++;
      }

      this.lastIndex++;
    }

    return {
      line: this.lastPosition.line,
      column: this.lastPosition.column
    };
  }
}
