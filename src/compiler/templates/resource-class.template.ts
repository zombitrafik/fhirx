import { CompilerTypes } from '../compiler.interfaces';
import { CompilerUtils } from '../compiler.utils';
import pluralize from 'pluralize';

export class ResourceClassTemplate {
  constructor(
    private readonly data: CompilerTypes.ResourceClassTemplate
  ) {
  }

  public render(): string {
    return `
    ${this.renderImports()}

    ${this.renderClassDescription()}
    export class ${this.data.className} extends ${this.data.baseClass} {
      public override readonly resourceType: string = '${this.data.className}';

      constructor(source?: Record<string, any>) {
        super(source);

        if (typeof source !== 'undefined') {
          Object.keys(source).forEach(key => {
            const value = source[key];

            switch (key) {
              ${this.renderDeserialization()}
              default: {
                break;
              }
            }
          });
        }
      }

      ${this.renderProperties()}
    }
    `;
  }

  private renderDeserialization(): string {
    const output: string[] = [];

    this.data.properties.forEach(property => {
      const {propertyName, isArray} = property;

      if (property.types.length > 1) {
        /* UnionModel */
        property.types.forEach(type => {
          output.push(`case '${propertyName}${CompilerUtils.capitalize(type)}': {`);
          output.push(this.renderDeserializationSetter(propertyName, type, isArray));
          output.push(' break;');
          output.push('}');
        });
      } else {
        const type = property.types[0];

        output.push(`case '${propertyName}': {`);
        output.push(this.renderDeserializationSetter(propertyName, type, isArray));
        output.push(' break;');
        output.push('}');
      }
    });

    return output.join('\n');
  }

  private renderDeserializationSetter(propertyName: string, type: string, isArray: boolean): string {
    const output: string[] = [];

    const isPrimitiveType = CompilerUtils.isPrimitiveType(type);
    const setterName = CompilerUtils.capitalize(propertyName);

    if (isArray) {
      output.push('for (let i = 0; i < value.length; i++) {');
      if (isPrimitiveType) {
        output.push(`this.add${setterName}(value[i]);`);
      } else {
        if (type === 'Resource') {
          output.push(`const _class = Injector.get(value.resourceType);`);
          output.push(`if (_class === null) {`);
          output.push(` this.add${setterName}(new Resource(value));`);
          output.push(`} else {`);
          output.push(` this.add${setterName}(new _class(value));`);
          output.push('}');
        } else {
          output.push(`this.add${setterName}(new ${type}(value[i]));`);
        }
      }
      output.push('}');
    } else {
      if (isPrimitiveType) {
        output.push(`this.set${setterName}(value);`);
      } else {
        if (type === 'Resource') {
          output.push(`const _class = Injector.get(value.resourceType);`);
          output.push(`if (_class === null) {`);
          output.push(` this.set${setterName}(new Resource(value));`);
          output.push(`} else {`);
          output.push(` this.set${setterName}(new _class(value));`);
          output.push('}');
        } else {
          output.push(`this.set${setterName}(new ${type}(value));`)
        }
      }
    }

    return output.join('\n');
  }

  private renderImports(): string {
    const output: string[] = [];

    if (this.data.internalDependencies.length) {
      output.push('import {');

      this.data.internalDependencies.forEach(dependency => {
        output.push(`${dependency},`);
      });

      output.push(`} from '../internal';`);
    }

    if (this.data.injectorDependency) {
      output.push(`import {Injector} from '../injector';`);
    }

    if (this.data.abstractModelDependency) {
      output.push(`import { AbstractModel } from '../abstract.model';`);
    }

    return output.join('\n');
  }

  private renderClassDescription(): string {
    const output: string[] = [];

    output.push('/**');
    if (this.data.abstract) {
      output.push('* @abstract');
    }

    if (this.data.description) {
      output.push(`* @description ${this.data.description}`);
    }
    output.push('* */');

    return output.join('\n');
  }

  private renderProperties(): string {
    const output: string[] = [];

    this.data.properties.forEach(property => {
      output.push(this.renderPropertyDescription(property));
      output.push(this.renderPropertySetter(property));
      output.push(this.renderPropertyDescription(property));
      output.push(this.renderPropertyGetter(property));
    });

    return output.join('\n');
  }

  private renderPropertyDescription(property: CompilerTypes.ResourceClassTemplateProperty): string {
    const {short, definition, comment} = property.description;

    const output: string[] = [];

    if (short || definition || comment) {
      output.push('/**');
      if (short) {
        output.push(`* @description ${short}`);
      }
      if (definition) {
        output.push(`* @description ${definition}`);
      }
      if (comment) {
        output.push(`* @description ${comment}`);
      }
      output.push('* */');
    }
    return output.join('\n');
  }

  private renderPropertySetter(property: CompilerTypes.ResourceClassTemplateProperty): string {
    const output: string[] = [];

    const {isArray, propertyName, types} = property;

    const setterName = CompilerUtils.capitalize(propertyName);
    const setterType = types.join(' | ');

    if (isArray) {
      output.push(`public add${setterName}(_${propertyName}: ${setterType}): this {`);
      output.push(`this.add('${propertyName}', _${propertyName});`);
      output.push('return this;');
      output.push('}');
    } else {
      output.push(`public set${setterName}(_${propertyName}: ${setterType}): this {`);
      if (types.length > 1) {
        /* BackboneElement */
        output.push(`this.deletePropertiesByPrefix('${propertyName}');`);

        types.forEach((type, index) => {
          const first = index === 0;
          const condition = this.renderConditionByType(type, propertyName)
          output.push(`${first ? 'if' : 'else if'} (${condition}) {`);
          output.push(` this.set('${propertyName}${CompilerUtils.capitalize(type)}', _${propertyName});`);
          output.push('}');
        });
      } else {
        output.push(`this.set('${propertyName}', _${propertyName});`);
      }
      output.push('return this;');
      output.push('}');
    }

    return output.join('\n');
  }

  private renderPropertyGetter(property: CompilerTypes.ResourceClassTemplateProperty): string {
    const output: string[] = [];
    const {isArray, isOptional, propertyName, types} = property;

    const getterName = CompilerUtils.capitalize(propertyName);
    const getterType = types.join(' | ');

    if (isArray) {
      const pluralGetterName = pluralize(getterName);
      output.push(`public get${pluralGetterName}(): (${getterType})[] {`);
      output.push(` return this.get('${propertyName}') || []`);
      output.push('}');
    } else {
      output.push(`public get${getterName}(): ${getterType} ${isOptional ? '| null' : ''} {`);
      if (types.length > 1) {
        /* BackboneElement */
        if (isOptional) {
          output.push(`const value = this.getValueByPropertyPrefix('${propertyName}');`);
          output.push(`return typeof value === 'undefined' ? null : value;`);
        } else {
          output.push(`return this.getValueByPropertyPrefix('${propertyName}');`);
        }
      } else {
        if (isOptional) {
          output.push(`const value = this.get('${propertyName}');`);
          output.push(`return typeof value === 'undefined' ? null : value;`);
        } else {
          output.push(`return this.get('${propertyName}');`);
        }
      }
      output.push('}');
    }

    return output.join('\n');
  }

  private renderConditionByType(type: string, propertyName: string): string {
    if (CompilerUtils.isPrimitiveType(type)) {
      return `typeof _${propertyName} === '${type}'`;
    }
    return `_${propertyName} instanceof ${type}`;
  }
}
