export const PRIMITIVE_TYPES_MAP = new Map<string, string>([
  ['http://hl7.org/fhirpath/System.String', 'string'],
  ['uri', 'string'],
  ['url', 'string'],
  ['id', 'string'],
  ['uuid', 'string'],
  ['code', 'string'],
  ['date', 'string'],
  ['dateTime', 'string'],
  ['canonical', 'string'],
  ['markdown', 'string'],
  ['instant', 'string'],
  ['integer', 'number'],
  ['decimal', 'number'],
  ['unsignedInt', 'number'],
  ['positiveInt', 'number'],
  ['base64Binary', 'string'],
  ['instant', 'string'],
  ['time', 'string'],
  ['oid', 'string'],

  /* other types */
  ['xhtml', 'string'],
])

export const PRIMITIVE_TYPES = [
  'string',
  'boolean',
  'number',
  'unknown'
]

export const EXPORTS_ORDER = [
  'Resource',
  'DomainResource',
  'Element',
  'BackboneElement',
  'Quantity'
]

export const DEFAULT_STRUCTURE_DEFINITION_FILENAME = 'structure-definition.json';

export const DEFAULT_NAMESPACE = 'Fhir';
