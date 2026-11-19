# Donaciones

La aplicación es una demostración local. Permite explorar campañas, crear
iniciativas, registrar donaciones simuladas y guardar comprobantes y novedades
en el navegador. Los datos se almacenan en `localStorage` y no se comparten
entre dispositivos ni usuarios. Los archivos de muestra se guardan localmente
y están limitados a 1 MB; no deben contener información sensible.

No se procesan pagos, no se verifican identidades ni se envían correos o
documentos a auditoría. Los registros y comprobantes son simulados. Firebase
y una pasarela de pago no están integrados.

Las imágenes y fuentes del diseño se cargan desde servicios externos. Algunas
imágenes originales de Stitch, incluido el logotipo, requieren permisos y pueden
no estar disponibles fuera de la cuenta que las creó.

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.2.7.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
