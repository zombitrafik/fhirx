import { CompilerTypes } from '../compiler.interfaces';
import { AbstractElementModel } from './abstract-element.model';
import { CompilerUtils } from '../compiler.utils';

export class BackboneModel extends AbstractElementModel {
  private children: CompilerTypes.ElementModel[] = [];

  public setChildren(children: CompilerTypes.ElementModel[]): void {
    this.children = children;
  }

  public getChildren(): CompilerTypes.ElementModel[] {
    return this.children;
  }

  public getDescription(): string {
    return this.element.definition || '';
  }

  public getDependencies(): Set<string> {
    const dependencies = new Set<string>();

    const propertyType = this.element.path.split('.').map(v => CompilerUtils.capitalize(v)).join('');

    dependencies.add(propertyType);

    return dependencies;
  }

  protected get propertyName(): string {
    const paths = this.element.path.split('.');
    return paths[paths.length - 1];
  }

  protected get propertyTypes(): string[] {
    const type = this.element.path.split('.').map(v => CompilerUtils.capitalize(v)).join('');
    return [type];
  }
}
