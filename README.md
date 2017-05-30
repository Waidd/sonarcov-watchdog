# Sonar Coverage Watchdog

Parse lcov report and compare coverage value with sonar measures. Exit 1 if coverage drops.

## Requirements

- node >= 6
- sonarcube ~= 5.6.1 (Not tested with other versions, API may be different)


## Installation

```bash
npm install sonarcov-watchdog --save
```

Or add it to your package.json

## Usage

```bash
$ sonarcov-watchdog --help

  Usage: sonarcov-watchdog [options] [sonar-url [sonar-api-token]]

  Parse lcov report and compare coverage value with sonar measures. Exit 1 if coverage drops.
  Sonar url and api token must be provided by arguments or by environment variables SONAR_URL and SONAR_API_TOKEN.

  Options:

    -h, --help                 output usage information
    -V, --version              output the version number
    --coverage-path <path>     change the lcov path (default to ./coverage/lcov.info)
    --sonar-properties <path>  change the sonar-project.properties (default to ./sonar-project.properties
    --increase-only            exit 1 if coverage drops or remains equal
```

## Exemple

```bash
$ sonarcov-watchdog https://my.sonar.instance.site.com mysecrettoken
Current coverage is +0% from master
Value is stable, fair enough.
$ echo $?
0
```

```bash
$ sonarcov-watchdog https://my.sonar.instance.site.com mysecrettoken
Current coverage is -3.3% from master
Value has decreased, try again !
$ echo $?
1
```
