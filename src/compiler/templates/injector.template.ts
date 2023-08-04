export class InjectorTemplate {
  public render(): string {
    return `
      import * as internal from './internal';

      interface newable {
        new (...args: any[]): any;
      }

      export class Injector {
        public static get(name: string): newable | null {
          return internal[name] || null;
        }
      }
    `;
  }
}
