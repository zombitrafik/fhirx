import { CompilerTypes } from '../compiler.interfaces';
import { CompilerUtils } from '../compiler.utils';
import { PATCHED_INDEX_TEMPLATE_DEPENDENCY_TYPE } from '../compiler.enums';

export class PatchedInternalTemplate {
  constructor(private readonly data: CompilerTypes.PatchedInternalTemplate) {
  }

  public render(): string {
    const output: string[] = [];

    this.data.dependencies.forEach(({type, name}) => {
      if (type === PATCHED_INDEX_TEMPLATE_DEPENDENCY_TYPE.INTERNAL) {
        output.push(`export * from './resources/${CompilerUtils.camelCaseToDash(name)}';`);
      } else {
        output.push(`export { ${name}Extension as ${name} } from './extensions/${CompilerUtils.camelCaseToDash(name)}.extension'`);
      }
    });

    return output.join('\n');
  }
}
