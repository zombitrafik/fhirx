import { AbstractElementModel } from './abstract-element.model';
import { CompilerUtils } from '../compiler.utils';

export class RecursiveReferenceModel extends AbstractElementModel {
  public getDependencies(): Set<string> {
    const dependencies = new Set<string>();

    const contentReference = this.element.contentReference!;
    const propertyType = contentReference.replace('#', '').split('.').map(CompilerUtils.capitalize).join('');

    dependencies.add(propertyType);

    return dependencies;
  }

  protected get propertyName(): string {
    const paths = this.element.path.split('.');
    return paths[paths.length - 1];
  }

  protected get propertyTypes(): string[] {
    const contentReference = this.element.contentReference!;
    const type = contentReference.replace('#', '').split('.').map(CompilerUtils.capitalize).join('');
    return [type];
  }
}
