import { CompilerTypes } from '../compiler.interfaces';
import { CompilerUtils } from '../compiler.utils';

export abstract class AbstractElementModel {
  constructor(
    protected readonly element: CompilerTypes.Element,
  ) {
  }

  public abstract getDependencies(): Set<string>

  public getPropertyInfo(): CompilerTypes.ResourceClassTemplateProperty {
    return {
      isArray: this.isArray,
      isOptional: this.isOptional,
      types: this.propertyTypes,
      description: this.propertyDescription,
      propertyName: this.propertyName
    }
  }

  public get hasInjectorDependency(): boolean {
    return this.propertyTypes.includes('Resource');
  }

  protected abstract get propertyTypes(): string[];

  protected abstract get propertyName(): string;

  public getClassName(): string {
    const paths = this.element.path.split('.');

    return paths.map(CompilerUtils.capitalize).join('');
  }

  protected get isArray(): boolean {
    return this.element.max === '*';
  }

  protected get isOptional(): boolean {
    return this.element.min === 0;
  }

  protected get propertyDescription(): CompilerTypes.ResourceClassTemplatePropertyDescription {
    return {
      definition: this.element.definition,
      short: this.element.short,
      comment: this.element.comment
    }
  }
}
