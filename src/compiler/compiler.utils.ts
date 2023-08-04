import { CompilerTypes } from './compiler.interfaces';
import { PRIMITIVE_TYPES, PRIMITIVE_TYPES_MAP } from './compiler.consts';

export namespace CompilerUtils {
  export const camelCaseToDash = (input: string): string => {
    return input.replace(/[A-Z]/g, (match, offset) => (offset > 0 ? '-' : '') + match.toLowerCase())
  }

  export const dashToCamelCase = (input: string): string => {
    return input.replace(/-([a-z])/g, function (g) {
      return g[1].toUpperCase();
    });
  }

  export const camelCaseToUpperSnakeCase = (input: string): string => {
    return input.replace(/\.?([A-Z]+)/g, function (x, y) {
      return '_' + y
    }).replace(/^_/, '').toUpperCase();
  }

  export const capitalize = (input: string): string => {
    return input.charAt(0).toUpperCase() + input.slice(1);
  }

  export const parseTypes = (types: CompilerTypes.ElementType[]): string[] => {
    return unique(types.map(type => {
      return PRIMITIVE_TYPES_MAP.get(type.code) || type.code;
    }));
  }

  export const getNonPrimitiveTypes = (types: string[]): string[] => {
    return types.filter(type => !isPrimitiveType(type));
  }

  export const unique = <T>(input: T[]): T[] => {
    return input.filter((value, index, array) => array.indexOf(value) === index);
  }

  export const isPrimitiveType = (type: string): boolean => {
    return PRIMITIVE_TYPES.indexOf(type) !== -1;
  }
}
