# Warehouse Integration Service

[![CircleCI](https://circleci.com/gh/6RiverSystems/wis/tree/develop.svg?style=svg&circle-token=23a0f02161e4587e91d28a624c12056c172db6ab)](https://circleci.com/gh/6RiverSystems/wis/tree/develop)

## Developer Guide

Pre-requisite: npm i -g @microsoft/rush

* rush update
-> Run this whenever you modify package.json

* rush install
-> The equivalent of `npm install && npm link` (linking all project inter-dependencies)
-> Run this whenever you do a `git pull`

* rush build
-> Will build all your source code

* rush test
-> Run all tests... hopefully?

* You can also run regular npm scripts from inside your specific project
** (Except `npm install` might not work so well)
