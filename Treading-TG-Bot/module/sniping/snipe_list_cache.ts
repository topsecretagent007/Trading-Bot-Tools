import path from 'path';

export class SnipeListCache {
  private snipeList: string[] = [];
  private fileLocation = path.join(__dirname, '../snipe-list.txt');

  public isInList(mint: string) {
    return this.snipeList.includes(mint);
  }

}
