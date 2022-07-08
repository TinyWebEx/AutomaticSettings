# TinyWebEx AutomaticSettings

A simple module that allows you to specify your add-on settings in HTML-only, so you can focus on adding settings and not care about how to load and save them. This means you do not have to write any custom JavaScript!  
It is also designed to be used with settings pages that save their settings automatically. There is no need for an "OK" button or similar confirmation after the user entered the data.

## Features
* supports ["managed options"](https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/storage/managed), i.e. loads options from the managed storage and marks them as "unchangable", i.e. disabled.
* can automatically load all options into your HTML
* can automatically save all options in a useful data format (number values are also saved as numbers, not strings)
* [saving multiple options grouped together in JS objects](#option-groups)
* [MessageHandler integration](https://github.com/TinyWebEx/MessageHandler), e.g. to show errors when saving or loading an option fails, or to show a message if some managed options are used.
* [can automatically let your reset button spring to live](#reset-button)
* [contains a useful CSS file for adjusting your options for the Photon design](#css)

## Usage

It mostly just works with some additions to your HTML code. The HTML code itself can be quite flexible then:

* `class="setting"` attached to an `input` HTML tag enables the loading of this setting. It is thus required.
* The [name attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Input#name) (e.g. `name="greatSettingsNum"`) must be properly specified and is used for saving the option in the `sync` storage. 
* Add a class via `class="save-on-change"` if the setting should be automatically saved when it is [changed](https://developer.mozilla.org/docs/Web/Events/change).
* Otherwise add `class="save-on-input"` if the setting should be automatically saved when it the [input event](https://developer.mozilla.org/docs/Web/Events/input) is triggered. This is e.g. useful when the simple change of an element is not enough to trigger a save. See the examples below on where that may be useful.
* You can optionally bind to different evens and validate entered data or overwrite loading and saving procedures via JavaScript.
* Note that input fields that are disabled are never saved and their input/update events are ignored. Managed options are set to this disabled state, so that these are ignored.

## Examples

Obviously the examples below are minimal examples. Please anyway use proper HTML markup with `label` and so on. You can add almost any elements anywhere. This has just nothing to do with this add-on. 🙂

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

### Select element

To select a single value and save it as `select`:

```html
<select id="selection" class="setting save-on-input" name="select" size="0">
    <option value="L">Low (7%)</option>
    <option value="M">Medium (15%)</option>
    <option value="Q">Quartile (25%)</option>
    <option value="H">High (30%)</option>
</select>
```

### Radio options

To create [radio buttons](https://developer.mozilla.org/docs/Web/HTML/Element/input/radio) you have follow some special handling.

```html
<fieldset id="sizeGroup" data-type="radiogroup" class="setting save-on-input">
    <legend>set mode</legend>
    <ul>
        <li>
            <input id="sizeOne" type="radio" name="sizeType" value="oneValue">
            <label for="sizeOne">Size one</label>
        </li>

        <li>
            <input id="sizeTwo" type="radio" name="sizeType" value="twoValue">
            <label for="sizeTwo">Size two</label>
        </li>

        <li>
            <input id="sizeThree" type="radio" name="sizeType" value="threeValue">
            <label for="sizeThree">Size three</label>
        </li>
    </ul>
</fieldset>
```

You have to:
* add `data-type="radiogroup"` to mark the container of the radio options as a radiogroup.
* if you use a `fieldset` you can bind the save trigger to this fieldset as shown above, or to each individual `input type="radio"`. It's just easy to forget one element if you specify it individually, that's why the behaviour shown above is recommended.
* Note, however, that it is always required to add the `setting` class to the container (i.e. `fieldset`), to enable the loading of this setting. Note that this is _not_ required for the indidual options.
  It can be useful, however, to prevent multiple triggers, if you e.g. have other options inside of the fieldset. These are e.g. also automatically triggered when a chield input is triggered, so this can lead to it being saved multiple times. This usually is not a (noteworthy) problem, but you can see it in the console log messages.

## Option groups

A usual use case is to save multiple options in a JavaScript object, i.e. something like this:
```js
groupName = {
  size: 170,
  sizeType: "auto",
  ignoreUserSize: true
};
```

This is natively supported by this add-on. Just add an attribute `data-optiongroup="groupName"` to all the options that you want to have grouped in an object. This can e.g. be useful if you have a [radio group](#radio-options) with sub-options that you want to have saved with the value of the radio buttons themselves.
For instance, the following HTML would result in the object shown above:
```html
<li>
    <fieldset id="sizeType" data-type="radiogroup" data-optiongroup="groupName" class="setting">
        <legend>set mode</legend>
        <ul>
            <li>
                <input id="sizeOne" type="radio" name="sizeType" value="auto" class="save-on-input">
                <label for="sizeOne">Size auto</label>

                <input class="setting save-on-input" type="number" data-optiongroup="groupName" name="size" id="partialSettingId">
                <span>px</span>
            </li>

            <li>
                <input id="sizeTwo" type="radio" name="sizeType" value="manual" class="save-on-input">
                <label for="sizeTwo">Size manual</label>
            </li>

            <li>
                <input id="sizeThree" type="radio" name="sizeType" value="whatever" class="save-on-input">
                <label for="sizeThree">Size whatever</label>
            </li>
        </ul>
    </fieldset>
</li>
<li>
    <input class="setting save-on-change" data-optiongroup="groupName" type="checkbox" name="ignoreUserSize" id="anotherOption">
</li>
```

## Loading the settings

To enable this plugin, you still a few lines of JavaScript - respectively one line:
```js
AutomaticSettings.init();
```

This does load the options and registers bindings etc.

Obviously you need to pay attention to the fact to only do this after the DOM has been loaded, i.e. [the script should be deferred](https://developer.mozilla.org/docs/Web/HTML/Element/script#attr-defer).

## Trigger

You can additionally intercept loading and saving some settings or check the validity or similar things of some settings via JavaScript. This is all done via `AutomaticSettings.Trigger`.
In most cases, you always pass the registration functions the name of the option to be saved as a string and the function that you want to register as a callback. Most triggers are valid for a single option, whose name you specify, in order to prevent that 
You can register as many triggers, as you want.

Generally, it is recommend to register all triggers _before_ calling the [`init` method](#loading-the-settings) of this module, but it also works to register triggers at any time.

### Update & Change trigger

You can use `AutomaticSettings.Trigger.registerUpdate` or `AutomaticSettings.Trigger.registerChange` to register a custom callback that is executed when the user updates (triggered by [input](https://developer.mozilla.org/docs/Web/Events/input)) or [changes](https://developer.mozilla.org/docs/Web/Events/change) an input option.

In both cases, you get the `optionValue` of the setting, the option name and the original event that triggered the request, so you can also find out the HTML element.

This is mostly useful if some options depend on each other (that happens often when using [option groups](#option-groups) e.g.), so you can interactively disable elements based on the user selection/input; or, if you want top verify the data the user entered and show some warnings or so.

Note however, that this way is separate from the whole loading & saving of the data, so you cannot prevent an invalid value from being saved or so, here. Do [overwrite the loading or saving behaviour](#overwriting-loading-and-saving-behaviour) if you want to do this.

Note that you need to add the additional classes `trigger-on-update` (for the update trigger/`registerUpdate`) or `trigger-on-change` (for the input trigger/`registerChange`) to the respective options, to make this feature work. Without it, the library does not bind to these elements.

### Save trigger

You can use `AutomaticSettings.Trigger.registerSave` to register a "save trigger" that is executed when an option is saved (actually directly before it is saved).
It is thus quite useful to automatically apply the option or send it to other parts of the browser extension, so they are notified that a the value of the option changed. This is a useful feature for your usability, because the `AutomaticSetings` module automatically saves all options, so they should also automatically be applied, so the user immediately sees the difference.

You can also use it to validate the input and cancel saving, you need to throw some errors then. Note that you should then show an appropriate error message yourself, as this error is not catched by the library - in contrast to everything else that happens afterwards, i.e. the saving of the option itself, e.g.

### Triggers before and after loading

When the triggers are used as expected, you usually get to one problem: Directly after your options have been loaded, you may see an inconsistent state, as your [save triggers](#save-trigger) did not yet run and no checks on the previously loaded data is done, etc.

To solve this, there is `AutomaticSettings.Trigger.registerAfterLoad`, which can be used to register a handler that is run after _all_ settings have been loaded. To make it easier to implement you can even pass it the special variable `AutomaticSettings.Trigger.RUN_ALL_SAVE_TRIGGER` that tells it to automatically execute all save triggers, you have registered. This is usually what you want. 🙂

Similarly there is `AutomaticSettings.Trigger.registerBeforeLoad` to let you execute stuff before any option is loaded.

### Overwriting loading and saving behavior

Sometimes it is needed to present data to the user in one way, but save it in another way. Thus, you need to manipulate how data is loaded or saved.
If [option groups](#option-groups) are not enough for you, you can use `AutomaticSettings.Trigger.addCustomLoadOverride` and `AutomaticSettings.Trigger.addCustomSaveOverride` to override the respective features.

As always in these triggers, you get some information about the option that is loaded/saved and can check that. However, in addition you can get the data returned by your [save trigger](#save-trigger) in `saveTriggerValues`, so you can re-use it.

In contrast to the [save triggers](#save-trigger) you can also actually influence/overwrite whether/how the value is loaded/saved. By default, the library assumes you now handle loading and saving by yourself, i.e. you need to interact with the HTML DOM (for loading) or the storage API (for saving) directly. By all means, you are overwriting the loading/saving process...  
However, you can also return a special value that is returned by `AutomaticSettings.Trigger.overrideContinue` to indicate you want to continue saving/loading, but use different data for it, i.e. you just modify the data to load/save. You just pass it the value you want to continue the process.

In the end, it can e.g. look like this:

```js
/**
 * Saves the option XY.
 *
 * @private
 * @param {Object} param
 * @param {Object} param.optionValue the value of the changed option
 * @param {string} param.option the name of the option that has been changed
 * @param {Array} param.saveTriggerValues all values returned by potentially
 *                                          previously run save triggers
 * @returns {Promise}
 */
function saveOptionXy(param) {
    // our proper data is saved in saveTriggerValues by previously run save trigger
    const newOption = param.saveTriggerValues[0];

    return AutomaticSettings.Trigger.overrideContinue(newOption);
}
```

## Reset button

Doc is TODO…

## CSS

In the file [`css/photonOptions.css`], there is a style for a Firefox/[Photon](https://design.firefox.com/photon/)-style appearance of the settings.

To be able to use the CSS file, you need to include the `common.css` from [`CommonCss`](https://github.com/TinyWebEx/CommonCss).

Here is the corresponding HTML, if you want to use it:
```html
<body>
  <form>
    <!-- begin each new section, with a section tag, a line separate each
    section from another
    -->
    <section>
      <!-- Each section should have a title. -->
      <h1>Section title</h1>
      <!-- Add options in unordered lists. (bullet points will not be shown)
      This is just for semantics.
      -->
      <ul>
        <!-- Each option is a "list item" -->
        <li>
          <!-- To put options in one line, add a line class. -->
          <div class="line">
            <!-- Your option, as explained before. -->
            <input class="setting save-on-change" type="checkbox" id="popupIconColored" name="popupIconColored">
            <label for="popupIconColored">Colored icon</label>
          </div>
          <!-- use the indent class to indent a line as per it's checkbox -->
          <div class="line indent">
            <!-- .helper-text displays a grey text for explaining an option -->
            <span class="helper-text">Shows a colored icon instead of the black/white icon in the toolbar.</span>
          </div>
        </li>
      </ul>
      
      <!-- You can use h2 headings to add even more structure. -->
      <h2>Subheading</h2>
      
      <!-- [...] -->
    </section>
  </form>
</body>

```

## Automatically disabling options

To automatically disable options depending on the environment, load the `EnvironmentalOptions.js` module and run `MobileOptions.init();`. You can even do that asynchronously with the `async` attribute at the `script` tag.

If you do so, you can use two CSS classes:
* You can use the CSS class `.mobile-incompatible` to mark options that are not compatible with Android/mobile devices. 
* You can use the CSS class `.firefox-only` to mark options that are only compatible with the Mozilla Firefox browser.  **This does _not_ include Thunderbird
* You can use the CSS class `.mozilla-only` to mark options that are only compatible with the Mozilla products like Mozilla Firefox and Thunderbird.

## API note

Everything in the `internal` dir is considered to be an internal module/file and thus not be considered to be an API under _semantic versioning_. That means the API there can change at any time, do _not_ import anything from there!
