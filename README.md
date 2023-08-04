<h1 align="left">Fhirx</h1>

<p align="left">Fhirx is a library to generate typescript classes from HL7 FHIR structure definition JSON file.</p>

<hr>

<p align="left">
  <a href="https://www.npmjs.com/fhirx">
    <img src="https://img.shields.io/npm/v/fhirx.svg?logo=npm&logoColor=fff&label=NPM+package&color=limegreen" alt="Fhirx on npm" />
  </a>
</p>

## Development setup

### Prerequisites

- Install [Node.js] which includes [Node Package Manager][npm]

### Setting up the project

Install Fhirx:

```
npm install --save-dev fhirx
```

Create `fhirx.config.js` file in the root of the project:

```js
module.exports = {}
```

Supported config properties:

| Property                       | Required | Type    | Default                   | Description                                                                                                                                                                      |
|:-------------------------------|:--------:|---------|:--------------------------|:---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `structureDefinition.path`     |   true   | string  |                           | You must provide a path to the folder where structure definition JSON file is stored.                                                                                            |
| `structureDefinition.filename` |  false   | string  | structure-definition.json | Allows you to change the default name of the structure definition JSON file.                                                                                                     |
| `outputPath`                   |   true   | string  |                           | You must provide a path to the folder where FHIR classes will be generated.                                                                                                      |
| `namespace`                    |  false   | string  | Fhir                      | Allows you to change the default name of the exported namespace.                                                                                                                 |
| `load`                         |  false   | Promise |                           | This field is optional, but required if you want to use CLI to fetch structure definition file. <br> The `load` function should return a valid Structure Definition JSON object. |

`fhirx.config.js` example:

```js
module.exports = {
  structureDefinition: {
    path: 'src/fhirx'
  },
  outputPath: 'src/fhirx/generated';
}
```

### CLI
To generate Fhir classes use the following command:

`fhirx --compile`

To patch Fhir classes use the following command:

`fhirx --patch-resources`

To load structure definition JSON file use the following command:

`fhirx --load-structure-definition`

## Usage

Considering that `outputPath: 'src/fhirx/generated'` and `namespace: 'Fhir'`:

```typescript
import {Fhir} from 'src/fhirx/generated/fhir';

export class Main {
  constructor() {
    const appointment = new Fhir.Appointment()
      .setStatus('pending')
      .setComment('comment')
      .setAppointmentType(
        new Fhir.CodeableConcept()
          .addCoding(
            new Fhir.Coding()
              .setCode('code')
              .setDisplay('display')
          )
          .addCoding(
            new Fhir.Coding()
              .setCode('code2')
              .setDisplay('display2')
          )
      )

    console.log(appointment.toPlainObject());
  }
}

```

### Serialization

Every model supports `.toPlainObject()` method that converts class instance to JavaScript Object. <br>
In addition, every model supports `.toJSON()` method, thus you can pass a class instance to request and it will be converted to the JSON automatically

### Deserialization

Every model accepts an object as the first argument in the constructor and recursively deserialize all the properties to class instances. <br>
Example:

```typescript
const appointment = new Fhir.Appointment({
  appointmentType: {
    coding: [
      {
        code: 'code',
        display: 'display'
      },
      {
        code: 'code2',
        display: 'display2'
      },
    ]
  }
});

console.log(appointment.getAppointmentType().getCodings()[1].getCode()); // code2
```


## Patching resources

You can extend generated classes to put more logic there. <br>
In order to do that you need to create `extensions` folder inside `outputPath` folder provided in the config. <br>
Put your extensions in `extensions` folder.

### Creating class extension

File name should match the class you want to extend and have a suffix `.extension.ts`. <br>
For example: `bundle.extension.ts`, `appointment.extension.ts`, `codeable-concept.extension.ts` etc. <br>

Extension class name should match the class name you want to extend and have a suffix `Extension`. <br>
For example: `BundleExtension`, `AppointmentExtension`, `CodeableConceptExtension` etc.

Class extension example:
```typescript
/* File path: [<outputPath>/extensions/bundle.extension.ts] */

import { Bundle } from '../resources/bundle';
import { Resource } from '../resources/resource';

export class BundleExtension extends Bundle {
  public findResources<T extends Resource>(resourceType: string): T[] {
    return this.getEntries()
      .filter(entry => entry.getResource()?.resourceType === resourceType)
      .map(entry => entry.getResource()) as T[];
  }

  public findResource<T extends Resource>(resourceType: string): T | null {
    const resources = this.findResources<T>(resourceType);
    return resources[0] || null;
  }
}
```

### Applying extensions

If a new extension(s) was added you need to run `fhirx --patch-resources` command, otherwise your changes won't be applied. <br>
Note: you <b>DO NOT</b> need to run `fhirx --patch-resources` if you're making changes to already existing extension. Although it won't break anything, but just useless.

## Loading structure definition from remote

Although, this is not a commonly used feature, but might be required in some cases :)


### Modify `fhirx.config.js`

```js
module.exports = {
    load: async () => {
        const response = await fetch('YOUR_URL');
        return response.json();
    },
    structureDefinition: {
        path: 'src/fhirx'
    },
    ...
}
```

### Run command

`fhirx --load-structure-definition`

## References

- [<b>HL7</b>FHIR][fhir]
- [StructureDefinition][fhir-structure-definition]

Like <b>Fhirx</b>? Give the repo a star ⭐

[fhir]: http://hl7.org/fhir/

[fhir-structure-definition]: https://build.fhir.org/structuredefinition.html

[node.js]: https://nodejs.org/

[npm]: https://www.npmjs.com/get-npm
