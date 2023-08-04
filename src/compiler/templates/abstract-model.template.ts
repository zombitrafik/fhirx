export class AbstractModelTemplate {
  public render(): string {
    return `

    export abstract class AbstractModel {
      public readonly resourceType: string = 'AbstractModel';

      protected readonly model: Record<string, any> = {};

      constructor(source?: Record<string, any>) {
      }

      protected deletePropertiesByPrefix(prefix: string): void {
        const keys = Object.keys(this.model);
        keys.forEach(key => {
          if (key.startsWith(prefix)) {
            delete this.model[key];
          }
        })
      }

      protected getValueByPropertyPrefix(prefix: string): any {
        const keys = Object.keys(this.model);
        for (let i = 0; i < keys.length; i++) {
          if (keys[i].startsWith(prefix)) {
            return this.model[keys[i]];
          }
        }
        return null;
      }

      protected set(propertyName: string, value: unknown): void {
        this.model[propertyName] = value;
      }

      protected add(propertyName: string, value: unknown): void {
        if (!(this.model[propertyName] instanceof Array)) {
          this.model[propertyName] = [];
        }
        (this.model[propertyName] as []).push(value as never);
      }

      protected get(propertyName: string): any {
        return this.model[propertyName];
      }

      public toPlainObject(): Record<string, any> {
        return JSON.parse(JSON.stringify(this.model));
      }

      public toJSON(): Record<string, any> {
       return this.model;
      }
    }

    `;
  }
}
