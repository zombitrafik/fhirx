import { CompilerTypes } from '../compiler.interfaces';
import { CompilerUtils } from '../compiler.utils';

export class IndexTemplate {
  constructor(private readonly data: CompilerTypes.IndexTemplate) {
  }

  public render(): string {
    const output: string[] = [];

    output.push(`import {`);

    this.data.resources.forEach(resource => {
      output.push(`${resource} as _${resource},`);
    });

    output.push(`} from './internal';`);

    output.push(`export namespace ${this.data.namespace} {`);

    this.data.resources.forEach(resource => {
      output.push(`export class ${resource} extends _${resource} {}`);
    });

    output.push('export enum RESOURCE_TYPE {');
    this.data.resources.forEach(resource => {
      output.push(`${CompilerUtils.camelCaseToUpperSnakeCase(resource)} = '${resource}',`)
    });
    output.push('}');

    output.push('}');

    return output.join('\n');
  }
}
