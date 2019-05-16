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

* Update `gulp-typescript` so that the `incremental` flag in `tsconfig-base.json`
  will actually work
