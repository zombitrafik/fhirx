import { AbstractElementModel } from './abstract-element.model';
import { CompilerUtils } from '../compiler.utils';

export class UnionModel extends AbstractElementModel {
  public getDependencies(): Set<string> {
    const dependencies = new Set<string>();

    const types = CompilerUtils.getNonPrimitiveTypes(CompilerUtils.parseTypes(this.element.type || []));

    types.forEach(type => {
      dependencies.add(type);
    });

    return dependencies;
  }

  protected override get isArray(): boolean {
    return false;
  }

  protected get propertyName(): string {
    const paths = this.element.path.split('.');
    return paths[paths.length - 1].replace('[x]', '');
  }

  protected get propertyTypes(): string[] {
    return CompilerUtils.parseTypes(this.element.type || []);
  }
}
