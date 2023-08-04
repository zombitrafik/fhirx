import { CompilerTypes } from '../compiler.interfaces';

export class InternalTemplate {
  constructor(private readonly data: CompilerTypes.InternalTemplate) {
  }

  public render(): string {
    const output: string[] = [];
    
    this.data.dependencies.forEach(dependency => {
      output.push(`export * from '${dependency}';`);
    });

    return output.join('\n');
  }
}
