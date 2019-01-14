import {Meeting} from '../shared/models/meeting';

export class ObjectFilter {

  private fields: Set<string>;
  private includeMode: boolean;

  private constructor(fields: string[], includeMode: boolean) {
    this.fields = new Set(fields);
    this.includeMode = includeMode;
  }

  public static exclude(fields: string[]) {
    return new ObjectFilter(fields, false);
  }

  public static include(fields: string[]) {
    return new ObjectFilter(fields, true);
  }


  public filter<T>(obj: T): T {
    const filtered: T = {} as T;
    Object.entries(obj).forEach((entry) => {
      if (this.includeMode && this.fields.has(entry[0])
        || !this.includeMode && !this.fields.has(entry[0])
      ) {
        filtered[entry[0]] = entry[1];
      }
    });
    return filtered;
  }
}
