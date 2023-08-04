import { AbstractElementModel } from './abstract-element.model';
import { CompilerUtils } from '../compiler.utils';

export class PlainModel extends AbstractElementModel {
  public getDependencies(): Set<string> {
    const dependencies = new Set<string>();

    const types = CompilerUtils.getNonPrimitiveTypes(CompilerUtils.parseTypes(this.element.type || []));

    types.forEach(type => {
      dependencies.add(type);
    });

    return dependencies;
  }

  protected get propertyName(): string {
    const paths = this.element.path.split('.');
    return paths[paths.length - 1];
  }

  protected get propertyTypes(): string[] {
    const types = CompilerUtils.parseTypes(this.element.type || []);
    const type = types[0] || 'unknown';
    return [type];
  }

}
