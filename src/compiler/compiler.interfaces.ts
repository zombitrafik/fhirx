import { BackboneModel } from './models/backbone.model';
import { PlainModel } from './models/plain.model';
import { UnionModel } from './models/union.model';
import { RecursiveReferenceModel } from './models/recursive-reference.model';
import { PATCHED_INDEX_TEMPLATE_DEPENDENCY_TYPE } from './compiler.enums';

export namespace CompilerTypes {
  export interface Config {
    load?: () => Promise<any>;
    structureDefinition: {
      path: string;
      filename?: string;
    }
    outputPath: string;
    namespace?: string;
  }

  export interface Entry {
    resource: Resource;
  }

  export interface Resource {
    id: string;
    type: string;
    kind: 'resource' | 'primitive-type' | 'complex-type';
    description: string;
    abstract: boolean;
    baseDefinition: string;
    snapshot: Snapshot;
  }

  export interface Snapshot {
    element: Element[];
  }

  export interface Element {
    id: string;
    path: string;
    base?: {
      path: string;
    };
    contentReference?: string; /* for recursive type reference e.g. #PlanDefinition.action */
    short: string;
    definition: string;
    comment: string;
    min: number;
    max: '1' | '*' | '0';
    type?: ElementType[];
    binding?: unknown; /* TODO not implemented */
  }

  export interface ElementType {
    code: string;
    targetProfile?: string[]; // used for Reference type
  }

  export type ElementModel = BackboneModel | PlainModel | UnionModel | RecursiveReferenceModel;

  export interface ResourceTypeDefinition {
    name: string;
    filePath: string;
  }

  export interface ResourceClassTemplate {
    internalDependencies: string[];
    injectorDependency: boolean;
    abstractModelDependency: boolean;
    className: string;
    baseClass: string;
    abstract: boolean;
    description: string;
    properties: ResourceClassTemplateProperty[];
  }

  export interface ResourceClassTemplateProperty {
    isArray: boolean;
    propertyName: string;
    isOptional: boolean;
    types: string[];
    description: ResourceClassTemplatePropertyDescription;
  }

  export interface ResourceClassTemplatePropertyDescription {
    definition?: string;
    short?: string;
    comment?: string;
  }

  export interface InternalTemplate {
    dependencies: string[];
  }

  export interface PatchedInternalTemplate {
    dependencies: {
      type: PATCHED_INDEX_TEMPLATE_DEPENDENCY_TYPE;
      name: string;
    }[];
  }

  export interface IndexTemplate {
    namespace: string;
    resources: string[];
  }
}
