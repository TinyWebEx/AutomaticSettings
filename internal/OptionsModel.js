/**
 * Provides the data for the settings.
 *
 * @public
 * @module AutomaticSettings
 */

/**
 * This callback is called to retrieve the default value if it is not saved already.
 *
 * The callback is called with the option name in the same way
 * browser.storage.sync.get is called.
 * However, in contrast to browsers built-in functions, it will
 * never be called with an object or so, but only with a string.
 * This means only one option is retrieved at a time.
 *
 * @callback defaultOptionGetterCallback
 * @param {string} option
 * @return {Object}
 */
let defaultOptionGetter;

/**
 * Remembers options groups with each option to be able to aggreegate them, later.
 *
 * @private
 * @var {Object}
 */
let rememberedOptions;

/**
 * Resets all remembered options.
 *
 * It just cleans the whole {@link rememberedOptions}.
 *
 * @protected
 * @function
 * @returns {void}
 */
export function resetRememberedOptions() {
    rememberedOptions = {};
}

/**
 * Returns the whole option group based on the cached data.
 *
 * @protected
 * @param {string} optionGroupName
 * @function
 * @returns {void}
 */
export function getOptionGroup(optionGroupName) {
    let optionValue;

    // if options are cached/saved use them to prevent them from getting lost
    if (optionGroupName in rememberedOptions) {
        optionValue = rememberedOptions[optionGroupName];
    } else {
        // otherwise just init empty array
        optionValue = {};
    }

    return optionValue;
}

/**
 * Returns the sync option or falls back to the default option.
 *
 * @private
 * @param  {string} option string ob object ID
 * @param  {string|null} optionGroup optiom group, if it is used
 * @param  {Object|undefined} optionValues pre-loaded object values
 * @returns {Object|undefined}
 */
function getOptionGroupOrOption(option, optionGroup, optionValues) {
    let optionValue;

    // as value is present, get value from settings array
    if (optionGroup === null) {
        optionValue = optionValues[option];
    } else {
        const allOptionsInGroup = optionValues[optionGroup];
        optionValue = optionValues[optionGroup][option];

        // save options if needed
        if (optionGroup in rememberedOptions) {
            rememberedOptions[optionGroup] = allOptionsInGroup;
        }
    }

    return optionValue;
}

/**
 * Returns the option value if you give it a pre-fetched object of options.
 *
 * It basically handles the complexity behind option groups and automatically
 * fetches the default options, if needed.
 *
 * @protected
 * @param  {string} option string ob object ID
 * @param  {string|null} optionGroup optiom group, if it is used
 * @param  {Object|undefined} optionValues pre-loaded object values
 * @returns {Object|null}
 */
export function getOptionValueFromRequestResults(option, optionGroup, optionValues) {
    let optionValue;

    // need to start with true, to allow "concatenation"
    let shouldQueryDefault = true;

    if (optionGroup === null) {
        // do not get default, if it has already been passed directly
        shouldQueryDefault = shouldQueryDefault && !(option in optionValues);
    } else {
        shouldQueryDefault = shouldQueryDefault && (
            // do not get default, if it a group is loaded and the group has already been passed
            !(optionGroup in optionValues) ||
            // and the loaded values actually contains the value we want
            !(option in optionValues[optionGroup])
        );
    }

    // get default value if value is not passed
    if (shouldQueryDefault) {
        if (optionGroup === null) {
            optionValue = getDefaultOption(option);
        } else {
            optionValue = getDefaultOption(optionGroup)[option];
        }

        console.info("got default value for applying option", option, ":", optionValue);

        // if still no default value, try to use HTML defaults, i.e. do not set option
        if (optionValue === undefined) {
            return null;
        }
    } else {
        optionValue = getOptionGroupOrOption(option, optionGroup, optionValues);
    }

    return optionValue;
}

/**
 * Returns whether the default option provider is provided, so we can get some defaults.
 *
 * @private
 * @returns {boolean}
 */
function canGetDefaults() {
    return defaultOptionGetter !== null;
}

/**
 * Sets the callback for getting the default options.
 *
 * See {@link defaultOptionGetterCallback} for how the callback needs to
 * behave.
 * You need to call this function before the main init function of
 * AutomaticSettings. However, if you do not want to specify defaults
 * in JS, but just in HTML, you can pass "null" to this and it will not
 * try to request defaults.
 * Pass "undefined" to it to unset it.
 *
 * @public
 * @param {defaultOptionGetterCallback|null} defaultOptionCallback
 * @returns {void}
 */
export function setDefaultOptionProvider(defaultOptionCallback) {
    defaultOptionGetter = defaultOptionCallback;
}

/**
 * The actual function providing the default options.
 *
 * Returns "undefined" if default option provider is disabled.
 *
 * @package
 * @param {string} option
 * @returns {Object|undefined}
 */
export function getDefaultOption(option) {
    // just check if it is ready
    verifyItIsReady();

    if (!canGetDefaults()) {
        return undefined;
    }

    return defaultOptionGetter(option);
}

/**
 * Returns the sync option or falls back to the default option.
 *
 * @package
 * @param {string} option
 * @returns {Object|undefined}
 */
export async function getOption(option) {
    const optionValue = await browser.storage.sync.get(option);

    if (!(option in optionValue)) {
        return getDefaultOption(option);
    }

    return optionValue[option];
}

/**
 * Returns whether the module is ready yet.
 *
 * Usually throws if a bad error is found.
 *
 * @package
 * @returns {boolean}
 * @throws {Error}
 */
export function verifyItIsReady() {
    if (defaultOptionGetter === undefined) {
        throw new Error("Default option provider is not set. You need to call .setDefaultOptionProvider() before .init() to set it.");
    }

    return true;
}
