# TinyWebEx AutomaticSettings

A simple module that allows you to specify your add-on settings in HTML-only, so you can focus on adding settings and not care about how to load and save them.
It is also designed to be used with settings pages that save their settings automatically. There is no need for an "OK" button or so. However, it is flexible enough to allow you to not use this feature.

## Usage

It mostly just works with some additions to your HTML code. The HTML code itself can be quite flexible then:

* `class="setting"` attached to an `input` HTML tag enables handling of this setting. It is thus required.
* The name (`name="greatSettingsNum"`) must be properly specified and is used. 
* Add a class via `class="save-on-change"` if the setting should be automatically saved when it is ["changed"/updated]().
* Otherwise add `class="save-on-input"` if the setting should be automatically saved when it the [input event]() is triggered. This is e.g. useful when the simple change of an element is not enough to trigger a save. See the examples below on where that may be useful.

## Examples

Obviously the examples below are minimal examples. Please anyway use proper HTML markup with `label` and such things. This has just nothing to do with this add-on. :)

### Checkbox

This e.g. changes a boolean (true/false) setting as `isEnabledSetting`:

```html
<input class="setting save-on-change" type="checkbox" id="idForCss" name="isEnabledSetting">
```

### Number

This e.g. changes a numeric value setting as `greatSettingsNum`:

```html
<input class="setting save-on-change" id="testSetting" name="greatSettingsNum" type="number">
```

(This [example is taken from the unit tests](tests/automaticSettings.tests.js#225), BTW.)

## API note

Everything in the `internal` dir is considered to be an internal module/file and thus not be considered to be an API under _semantic versioning_. That means the API there can change at any time, do _not_ import anything from there!
