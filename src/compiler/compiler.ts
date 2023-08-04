import { CompilerTypes } from './compiler.interfaces';
import fs from 'fs';
import path from 'path';
import { CompilerUtils } from './compiler.utils';
import { BackboneModel } from './models/backbone.model';
import { PlainModel } from './models/plain.model';
import { UnionModel } from './models/union.model';
import { RecursiveReferenceModel } from './models/recursive-reference.model';
import {
  DEFAULT_NAMESPACE,
  DEFAULT_STRUCTURE_DEFINITION_FILENAME,
  EXPORTS_ORDER,
} from './compiler.consts';
import * as prettier from 'prettier';
import { ResourceClassTemplate } from './templates/resource-class.template';
import { InjectorTemplate } from './templates/injector.template';
import { IndexTemplate } from './templates/index.template';
import { InternalTemplate } from './templates/internal.template';
import { AbstractModelTemplate } from './templates/abstract-model.template';
import { PatchedInternalTemplate } from './templates/patched-internal.template';
import { PATCHED_INDEX_TEMPLATE_DEPENDENCY_TYPE } from './compiler.enums';

export class Compiler {
  private resourceTypeDefinitions: CompilerTypes.ResourceTypeDefinition[] = [];

  constructor(
    private readonly config: CompilerTypes.Config,
    private readonly rootDir: string
  ) {
  }

  public async load(): Promise<void> {
    if (typeof this.config.load !== 'function') {
      console.error(`Invalid 'load' method provided.`);
      process.exit();
    }

    const structureDefinitionFolder = path.resolve(this.rootDir, this.config.structureDefinition.path);

    if (!fs.existsSync(structureDefinitionFolder)) {
      fs.mkdirSync(structureDefinitionFolder, {recursive: true});
    }

    const structureDefinition = await this.config.load();

    fs.writeFileSync(path.resolve(structureDefinitionFolder, this.structureDefinitionFilename), JSON.stringify(structureDefinition));
  }

  public async compile(): Promise<void> {
    if (typeof this.config.structureDefinition.path !== 'string') {
      console.error('Invalid config property `structureDefinition.path`. It should be a path to an existing folder.');
      process.exit();
    }

    const structureDefinitionPath = path.resolve(this.rootDir, this.config.structureDefinition.path, this.structureDefinitionFilename);
    if (!fs.existsSync(structureDefinitionPath)) {
      console.error(`Structure definition file is not found at ${structureDefinitionPath}.`);
      process.exit();
    }
    const outputPath = path.resolve(this.rootDir, this.config.outputPath);
    if (!fs.existsSync(outputPath)) {
      console.error(`Output folder is not found at ${outputPath}.`);
      process.exit();
    }

    const structureDefinition = JSON.parse(fs.readFileSync(structureDefinitionPath, 'utf8')) as CompilerTypes.Entry[];

    this.resourceTypeDefinitions = [];

    const entries = structureDefinition.filter(entry => entry.resource.type === entry.resource.id && entry.resource.kind !== 'primitive-type');

    await Promise.all(entries.map(entry => {
      const elements = this.getResourceElements(entry.resource);
      const baseClass = this.getResourceBaseClass(entry.resource);
      return this.writeClassDefinition(entry.resource.id, entry.resource.description, entry.resource.abstract, baseClass, elements);
    }));

    EXPORTS_ORDER.forEach((exportOrder, index) => {
      const definitionIndex = this.resourceTypeDefinitions.findIndex(d => d.name === exportOrder);

      if (definitionIndex !== -1) {
        const definition = this.resourceTypeDefinitions[definitionIndex];
        this.resourceTypeDefinitions.splice(definitionIndex, 1);
        this.resourceTypeDefinitions.splice(index, 0, definition);
      }
    })

    await Promise.all([
      this.writeAbstractModelClass(),
      this.writeInternalImportsDefinition(),
      this.writeIndexDefinition(),
      this.writeInjectorDefinition()
    ]);
  }

  public async patchResources(): Promise<void> {
    const extensionsPath = this.extensionsPath;
    if (!fs.existsSync(extensionsPath)) {
      console.error(`Extensions folder is not found at ${extensionsPath}.`);
      process.exit();
    }
    const outputPath = this.outputPath;
    if (!fs.existsSync(outputPath)) {
      console.error(`Output folder is not found at ${outputPath}.`);
      process.exit();
    }

    const resourcesPath = this.outputResourcesPath;

    const resources = fs.readdirSync(resourcesPath).map(filename => {
      const name = filename.split('.')[0];
      return CompilerUtils.capitalize(CompilerUtils.dashToCamelCase(name));
    });

    const extensions = fs.readdirSync(extensionsPath).map(filename => {
      const name = filename.split('.')[0];
      return CompilerUtils.capitalize(CompilerUtils.dashToCamelCase(name));
    });

    const internal = resources.filter(resource => !extensions.includes(resource));

    const templateData: CompilerTypes.PatchedInternalTemplate = {
      dependencies: [
        ...internal.map(name => {
          return {
            name,
            type: PATCHED_INDEX_TEMPLATE_DEPENDENCY_TYPE.INTERNAL
          }
        }),
        ...extensions.map(name => {
          return {
            name,
            type: PATCHED_INDEX_TEMPLATE_DEPENDENCY_TYPE.EXTENSION
          }
        })
      ]
    };

    EXPORTS_ORDER.forEach((exportOrder, index) => {
      const definitionIndex = templateData.dependencies.findIndex(d => d.name === exportOrder);

      if (definitionIndex !== -1) {
        const definition = templateData.dependencies[definitionIndex];
        templateData.dependencies.splice(definitionIndex, 1);
        templateData.dependencies.splice(index, 0, definition);
      }
    });

    const template = new PatchedInternalTemplate(templateData);

    const code = template.render();
    const formatted = await this.formatCode(code);

    fs.writeFileSync(path.resolve(this.outputPath, './internal.ts'), formatted);
  }

  private get structureDefinitionFilename(): string {
    return this.config.structureDefinition.filename || DEFAULT_STRUCTURE_DEFINITION_FILENAME;
  }

  private get outputPath(): string {
    return path.resolve(this.rootDir, this.config.outputPath);
  }

  private get outputResourcesPath(): string {
    return path.resolve(this.outputPath, 'resources');
  }

  private get extensionsPath(): string {
    return path.resolve(this.outputPath, 'extensions');
  }

  private async writeClassDefinition(name: string, description: string, isAbstract: boolean, baseClass: string, elements: CompilerTypes.ElementModel[]): Promise<void> {
    const dependencies = new Set<string>([baseClass]);
    elements.forEach(element => {
      const elementDependencies = element.getDependencies();
      elementDependencies.forEach(elementDependency => {
        dependencies.add(elementDependency);
      });
    });
    /* remove self dependency */
    dependencies.delete(name);

    const internalDependencies = [...dependencies.values()].filter(dependency => dependency !== 'AbstractModel');
    const injectorDependency = elements.some(element => element.hasInjectorDependency);

    const template = new ResourceClassTemplate({
      internalDependencies: internalDependencies,
      abstractModelDependency: baseClass === 'AbstractModel',
      injectorDependency: injectorDependency,
      className: name,
      baseClass: baseClass,
      abstract: isAbstract,
      description: description,
      properties: elements.map(element => element.getPropertyInfo())
    });

    const code = template.render();
    const formatted = await this.formatCode(code);

    const fileName = CompilerUtils.camelCaseToDash(name);
    const folder = this.outputResourcesPath;
    const filePath = path.resolve(folder, `./${fileName}.ts`)

    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, {recursive: true});
    }
    fs.writeFileSync(filePath, formatted);

    this.resourceTypeDefinitions.push({
      name,
      filePath: `./resources/${fileName}`
    });

    const backboneElements: BackboneModel[] = elements.filter(element => {
      return element instanceof BackboneModel;
    }) as BackboneModel[];

    await Promise.all(backboneElements.map(element => {
      return this.writeClassDefinition(element.getClassName(), element.getDescription(), false, 'BackboneElement', element.getChildren())
    }))
  }

  private getResourceElements(resource: CompilerTypes.Resource): CompilerTypes.ElementModel[] {
    const elementModels: CompilerTypes.ElementModel[] = [];

    const visitedPaths = new Set<string>();

    const rootElements = resource.snapshot.element.filter(element => element.path.startsWith(`${resource.id}.`));

    const elementsVisitor = (elements: CompilerTypes.Element[], dest: CompilerTypes.ElementModel[]): void => {
      elements.forEach(element => {
        if (visitedPaths.has(element.path)) {
          return;
        }
        visitedPaths.add(element.path);

        /* skip properties from base class */
        if (element.base?.path !== element.path) {
          return;
        }

        const isBackbone = element.type?.some(type => type.code === 'BackboneElement' || type.code === 'Element');
        const isUnion = element.path.endsWith('[x]');
        const isRecursiveReference = element.contentReference?.startsWith('#');

        if (isBackbone) {
          const backboneChildren = rootElements.filter(rootElement => {
            const prefix = `${element.path}.`;

            return rootElement.path.startsWith(prefix);
          });

          const backboneChildrenModels: CompilerTypes.ElementModel[] = [];

          const backboneModel = new BackboneModel(element);

          elementsVisitor(backboneChildren, backboneChildrenModels);

          backboneModel.setChildren(backboneChildrenModels);
          dest.push(backboneModel)
        } else if (isUnion) {
          dest.push(new UnionModel(element));
        } else if (isRecursiveReference) {
          dest.push(new RecursiveReferenceModel(element));
        } else {
          dest.push(new PlainModel(element));
        }
      });
    }

    elementsVisitor(rootElements, elementModels);

    return elementModels;
  }

  private getResourceBaseClass(resource: CompilerTypes.Resource): string {
    const parts = resource.baseDefinition?.split('/') || [];
    return parts[parts.length - 1] || 'AbstractModel';
  }

  private async writeIndexDefinition(): Promise<void> {
    const namespaceName = this.config.namespace || DEFAULT_NAMESPACE;

    const template = new IndexTemplate({
      namespace: namespaceName,
      resources: this.resourceTypeDefinitions.map(definition => definition.name),
    });
    const code = template.render();
    const formatted = await this.formatCode(code);

    const filename = CompilerUtils.camelCaseToDash(namespaceName);

    fs.writeFileSync(path.resolve(this.outputPath, `./${filename}.ts`), formatted);
  }

  private async writeInjectorDefinition(): Promise<void> {
    const template = new InjectorTemplate();
    const code = template.render();
    const formatted = await this.formatCode(code);
    fs.writeFileSync(path.resolve(this.outputPath, './injector.ts'), formatted);
  }

  private async writeInternalImportsDefinition(): Promise<void> {
    const template = new InternalTemplate({
      dependencies: this.resourceTypeDefinitions.map(definition => definition.filePath)
    })
    const code = template.render();
    const formatted = await this.formatCode(code);

    fs.writeFileSync(path.resolve(this.outputPath, './internal.ts'), formatted);
  }

  private async writeAbstractModelClass(): Promise<void> {
    const template = new AbstractModelTemplate()
    const code = template.render();
    const formatted = await this.formatCode(code);

    fs.writeFileSync(path.resolve(this.outputPath, './abstract.model.ts'), formatted);
  }

  private formatCode(code: string): Promise<string> {
    return prettier.format(code, {
      parser: 'typescript',
      printWidth: 140,
      tabWidth: 2,
      trailingComma: 'all',
      insertPragma: false,
      singleQuote: true,
      arrowParens: 'avoid',
      bracketSameLine: true,
    });
  }
}
