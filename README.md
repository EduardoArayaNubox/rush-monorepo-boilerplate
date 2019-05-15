# Template Rush Project

## Instantiating It

TODO

### Enabling CI

* TODO

### Adding new packages

* If your new package doesn't need "resource" style files (anything other
  than `.ts` sources) copied to its `dist` dir, then use `common` as a
  template so that you use `tsc` directly and get incremental builds.
* If your new pacakge uses loopback, use `service` as a template (you will
  almost certainly have resource files)
* Update `.6mon.json`

## What It Provides

TODO

## TODO

* Remove `@sixriver/wis-common` dependency
  * This pulls in a bunch of Loopback 4 helper classes from there,
      which really should be split out into a different package.
* Move shared code to a shared package
  * Like with the `wis-common` issue, several classes that are copied here should be put in one or more shared locations
  * `DbMigrateBooter`
  * `JsonSchema4Validator`
  * `Validator`
  * `ObjectIdModel`
  * `DataSourceUrlBuilder`
  * `JsonSchema4ValidatorProvider`
  * `MinimalLogWrapperProvider`
  * `ServiceDirectoryProvider`
    * This one needs to be shared as the split version that can provide both
      internal and external directories.
* Update `gulp-typescript` so that the `incremental` flag in `tsconfig-base.json`
  will actually work
