# Template Rush Project

## Instantiating It

TODO

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
