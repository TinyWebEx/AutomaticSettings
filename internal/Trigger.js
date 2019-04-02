/**
 * Load, save and apply options to HTML options page.
 *
 * @public
 * @module AutomaticSettings/Trigger
 */

// common modules
import * as HtmlMod from "./HtmlModification.js";
import * as OptionsModel from "./OptionsModel.js";

/**
 * Denotes a result if no triggers have been executed.
 *
 * @package
 * @var {Symbol} NO_TRIGGERS_EXECUTED
 */
export const NO_TRIGGERS_EXECUTED = Symbol("noTriggersExecuted");

/**
 * Denotes a result if the override says saving/loading should be continued.
 *
 * @package
 * @var {Symbol} CONTINUE_RESULT
 */
export const CONTINUE_RESULT = Symbol("continueWithResult");

/**
 * Denotes to run all the currently registered save trigger.
 *
 * These do not include the triggers that override the save functions.
 *
 * @public
 * @var {Symbol} RUN_ALL_SAFE_TRIGGER
 */
const RUN_ALL_SAVE_TRIGGER = Symbol("runAllSafeTrigger");

const triggers = {
    onSave: [],
    overrideSave: [],
    overrideLoad: [],
    onChange: [],
    onUpdate: [],
    onBeforeLoad: [],
    onAfterLoad: []
};

/**
 * Trigger to run when an option is saved.
 *
 * @async
 * @callback saveTrigger
 * @param {Object} optionValue the value of the changed option
 * @param {string} option the name of the option that has been changed
 * @param {Event} event the event (input or change) that triggered saving
 *                      (may not always be defined, e.g. when loading)
 * @return {Promise} optionally, to use await
 */

/**
 * Trigger to run when saving is overwritten.
 *
 * You can call {@link overrideContinue()} at the end and return it's
 * return value (in a Promise), if you want to continue saving some data.
 * Otherwise you need to save all the data by yourself.
 *
 * @async
 * @callback overrideSave
 * @param {Object} param
 * @param {Object} param.optionValue the value of the changed option
 * @param {string} param.option the name of the option that has been changed
 * @param {Array} param.saveTriggerValues all values returned by potentially
 *                                          previously run save triggers
 * @param {Event} param.event the event (input or change) that triggered saving
 * @returns {Promise} recommend
 * @throws {Error} if saving e.g. fails, this will automatically trigger a generic
 *                  error to be shown in the UI
 */

/**
 * Trigger to run when loading is overwritten.
 *
 * You can call {@link overrideContinue()} at the end and return it's
 * return value (in a Promise), if you want to continue loading some data.
 * Otherwise you need to load all the data by yourself and apply it to the
 * HTML file.
 * Note: You should avoid using this together with option groups. Manually
 * handling them can be complex, because e.g. this function may be called
 * multiple times.
 *
 * @async
 * @callback overrideLoad
 * @param {Object} param
 * @param {Object} param.optionValue the value of the option to be loaded
 * @param {string} param.option the name of the option that has been changed
 * @param {HTMLElement} param.elOption where the data is supposed to be loaded
 *                     into
 * @param {Object} param.optionValues result of a storage.[…].get call, which
 *                  contains the values that should be applied to the file
 *                  Please prefer "optionValue" instead of this, as this may not
 *                  always contain a value here.
 * @returns {Promise} recommend
 * @throws {Error}
 */

/**
 * Executes special handling for applying certain settings.
 *
 * E.g. when a setting is saved, it executes to apply some options live, so the
 * user immediately sees the change or the change is immediately applied.
 * If no parameters are passed, this gets and applies all options.
 *
 * @protected
 * @function
 * @param  {string} [option]
 * @param  {Object} [optionValue] will be automatically retrieved, if not given
 * @param {Event} [event] the event (input or change) that triggered saving
 * @returns {Promise}
 * @see {@link saveTrigger}
 */
export async function runSaveTrigger(option, optionValue, event = {}) {
    // create object in case event is empty
    event = event || {};

    if (option === undefined) {
        console.info("run all save triggers");

        const promises = [];
        for (const trigger of triggers.onSave) {
            const option = trigger.option;
            const optionValue = await OptionsModel.getOption(option);

            promises.push(trigger.triggerFunc(optionValue, option, event));
        }
        return Promise.all(promises);
    }

    // get option value, if needed
    if (optionValue === undefined) {
        optionValue = await OptionsModel.getOption(option);
    }

    console.info("runSaveTrigger:", option, optionValue, event);

    // run all registered triggers for that option
    const promises = [];
    for (const trigger of triggers.onSave.filter((trigger) => trigger.option === option)) {
        promises.push(trigger.triggerFunc(optionValue, option, event));
    }
    return Promise.all(promises);
}

/**
 * Executes special handling for applying certain settings.
 *
 * E.g. when a setting is saved, it executes to apply some options live, so the
 * user immediately sees the change or the change is immediately applied.
 * If no parameters are passed, this gets and applies all options.
 *
 * @protected
 * @function
 * @param  {string} option
 * @param  {Object} optionValue
 * @param  {Array} saveTriggerValues value returned by potentially run safe triggers
 * @param {Event} [event] the event (input or change) that triggered saving
 * @returns {Promise}
 * @see {@link overrideSave}
 */
export async function runOverrideSave(option, optionValue, saveTriggerValues, event = {}) {
    // run all registered triggers for that option
    const allRegisteredOverrides = triggers.overrideSave.filter((trigger) => trigger.option === option);
    if (allRegisteredOverrides.length === 0) {
        return Promise.resolve(NO_TRIGGERS_EXECUTED);
    }

    console.info("runOverrideSave:", `${allRegisteredOverrides.length}x`, option, optionValue, saveTriggerValues, event);

    // default event parameter to empty object
    event = event || {};

    let result;
    for (const trigger of allRegisteredOverrides) {
        result = await trigger.triggerFunc({
            option,
            optionValue,
            saveTriggerValues,
            event
        });

        // destructure data, if it has been returned, so next call can
        // potentially also use it
        if (result.command === CONTINUE_RESULT) {
            ( {option = option, optionValue = optionValue} = result.data );
        }
    }
    return result;
}

/**
 * Call this and return the return value if you want to continue saving or
 * loading some data in the {@link overrideSave} or {@link overrideLoad}
 * trigger at the end.
 *
 * If you return any other value, it is expected that you saved all the data
 * on your own.
 *
 * @public
 * @function
 * @param  {Object} [optionValue] if omitted, the original option value will be used
 * @param  {string} [option] if omitted, the current option name wil be used
 * @param  {HTMLElement} [elOption] overwrite HTML element to modify, only
 *                                  possible when this is called from a load
 *                                  overwrite trigger.
 * @returns {Object}
 */
function overrideContinue(optionValue, option, elOption) {
    // This can later be upgraded to return a proper Promise via Promise.resolve(),
    // but it does not seem neccessary right now.
    return {
        command: CONTINUE_RESULT,
        data: {
            option,
            optionValue,
            elOption
        }
    };
}

/**
* Executes special handling for loading/applying certain settings.
*
* @protected
* @function
* @param  {string} option
* @param  {Object} optionValue
* @param {HTMLElement} elOption where the data is supposed to be loaded
*                     into
* @param {Object} optionValues result of a storage.[…].get call, which
*                  contains the values that should be applied to the file
* @returns {Promise}
* @see {@link overrideLoad}
*/
export async function runOverrideLoad(option, optionValue, elOption, optionValues) {
    // run all registered triggers for that option
    const allRegisteredOverrides = triggers.overrideLoad.filter((trigger) => trigger.option === option);
    if (allRegisteredOverrides.length === 0) {
        return Promise.resolve(NO_TRIGGERS_EXECUTED);
    }

    console.info("runOverrideLoad:", `${allRegisteredOverrides.length}x`, option, optionValue);

    let result;
    for (const trigger of allRegisteredOverrides) {
        result = await trigger.triggerFunc({
            option,
            optionValue,
            elOption,
            optionValues
        });

        // destructure data, if it has been returned, so next call can
        // potentially also use it
        if (result.command === CONTINUE_RESULT) {
            ( {option = option, optionValue = optionValue, elOption = elOption} = result.data );
        }
    }
    return result;
}

/**
 * Trigger to run when "trigger-on-update" is set.
 *
 * This triggers when the value has been changed in any way.
 * Internally this binds to the "input" event.
 *
 * @async
 * @callback onUpdateTrigger
 * @param {any} optionValue the value of the changed option
 * @param {string} option the name of the option that has been changed
 * @param {Event} event the original event
 * @return {Promise} optionally, to use await
 */

/**
 * Trigger to run when "trigger-on-change" is set.
 *
 * @async
 * @callback onChangeTrigger
 * @param {any} optionValue the value of the changed option
 * @param {string} option the name of the option that has been changed
 * @param {Event} event the original event
 * @return {Promise} optionally, to use await
 */

/**
 * Triggered by "trigger-on-…" classes.
 *
 * Can be used to do do some stuff per option, but do not save the option in
 * contrast to when {@link applyOptionLive()} is usually called.
 * It either runs {@link onUpdateTrigger} or {@link onChangeTrigger}.
 *
 * @protected
 * @function
 * @param  {Event} event
 * @returns {void}
 * @throws {TypeError}
 */
export function runHtmlEventTrigger(event) {
    const elOption = event.target;

    const [option, optionValue] = HtmlMod.getIdAndOptionsFromElement(elOption);

    // get trigger type by event type
    let triggerType;
    switch (event.type) {
    case "input":
        triggerType = "onUpdate";
        break;
    case "change":
        triggerType = "onChange";
        break;
    default:
        throw new TypeError("invalid event type attached");
    }

    // run all registered triggers for that option
    const promises = [];
    for (const trigger of triggers[triggerType].filter((trigger) => trigger.option === option)) {
        promises.push(trigger.triggerFunc(optionValue, option, event));
    }
    return Promise.all(promises);
}

/**
 * Trigger that runs before new options are loaded.
 *
 * This trigger is executed before the options are loaded. You can e.g. use it to
 * reset some display styles that may have been changed by one of your other
 * callbacks, as this is e.g. also called when the user manually resets the options.
 * (i.e. they are reloaded then).
 *
 * @async
 * @callback beforeLoadTrigger
 * @return {Promise} optionally, to use await
 */

/**
 * Trigger that runs after new options have been loaded.
 *
 * This trigger is executed after the options have been loaded.
 *
 * @async
 * @callback afterLoadTrigger
 * @return {Promise} optionally, to use await
 */

/**
 * Exeutes the trigger that runs before the settings options are (re)loaded.
 *
 * @protected
 * @function
 * @returns {Promise}
 * @see {@link beforeLoadTrigger}
 */
export function runBeforeLoadTrigger() {
    console.info("runBeforeLoadTrigger");

    // run all registered triggers for that option
    const promises = [];
    for (const trigger of triggers.onBeforeLoad) {
        promises.push(trigger.triggerFunc());
    }
    return Promise.all(promises);
}

/**
 * Exeutes the trigger that runs after the settings options have been (re)loaded.
 *
 * @protected
 * @function
 * @returns {Promise}
 * @see {@link afterLoadTrigger}
 */
export function runAfterLoadTrigger() {
    console.info("runAfterLoadTrigger");

    // run all registered triggers for that option
    const promises = [];
    for (const trigger of triggers.onAfterLoad) {
        promises.push(trigger.triggerFunc());
    }
    return Promise.all(promises);
}

/**
 * Registers a trigger of any type.
 *
 * @private
 * @function
 * @param  {string} triggerType
 * @param  {string} optionTrigger
 * @param  {function} callback
 * @returns {void}
 */
function registerTrigger(triggerType, optionTrigger, callback) {
    triggers[triggerType].push({
        option: optionTrigger,
        triggerFunc: callback
    });
}

/**
 * Registers a save trigger.
 *
 * The trigger get the values (optionValue, option) passed as parameters.
 * See {@link saveTrigger} for details.
 *
 * @public
 * @function
 * @param  {string} optionTrigger
 * @param  {saveTrigger} callback
 * @returns {void}
 */
function registerSave(optionTrigger, callback) {
    registerTrigger("onSave", optionTrigger, callback);
}

/**
 * Registers an update trigger.
 *
 * This trigger is executed, when the option value is updated by the user, and thus, usually
 * saved. However, it does not get the new value yet.
 * The trigger get the values (optionValue, option, event) passed as parameters.
 *
 * @public
 * @function
 * @param  {string} optionTrigger
 * @param  {onUpdateTrigger} callback
 * @returns {void}
 */
function registerUpdate(optionTrigger, callback) {
    registerTrigger("onUpdate", optionTrigger, callback);
}

/**
 * Registers an change trigger.
 *
 * This trigger is executed, when the option value is changed by the user, but not
 * (necessarily) saved. Internally, it binds to the "input" event.
 *
 * @public
 * @function
 * @param  {string} optionTrigger
 * @param  {onChangeTrigger} callback
 * @returns {void}
 */
function registerChange(optionTrigger, callback) {
    registerTrigger("onChange", optionTrigger, callback);
}

/**
 * Registers a save trigger for special handling when saving an option.
 *
 * The trigger get the values (optionValue, option) passed as parameters.
 * See {@link overrideSave} for details.
 * Usually there should only be one of these triggers.
 *
 * @public
 * @function
 * @param  {string} optionTrigger
 * @param  {overrideSave} callback
 * @returns {void}
 */
function addCustomSaveOverride(optionTrigger, callback) {
    registerTrigger("overrideSave", optionTrigger, callback);
}

/**
 * Registers a load trigger for special handling when loading an option.
 *
 * The trigger get the values (optionValue, option, …) passed as parameters.
 * See {@link overrideLoad} for details.
 * Usually there should only be one of these triggers.
 *
 * @public
 * @function
 * @param  {string} optionTrigger
 * @param  {overrideLoad} callback
 * @returns {void}
 */
function addCustomLoadOverride(optionTrigger, callback) {
    registerTrigger("overrideLoad", optionTrigger, callback);
}

/**
 * Registers an beforeLoad trigger.
 *
 * This trigger is executed before the options are loaded. You can e.g. use it to
 * reset some display styles that may have been changed by one of your other
 * callbacks, as this is e.g. also called when the user manually resets the options.
 * (i.e. they are reloaded then).
 *
 * @public
 * @function
 * @param  {beforeLoadTrigger} callback
 * @returns {void}
 */
function registerBeforeLoad(callback) {
    triggers.onBeforeLoad.push({
        triggerFunc: callback
    });
}

/**
 * Registers an afterLoad trigger.
 *
 * This trigger is executed after the options have been loaded.
 * You can pass the special option {@link RUN_ALL_SAFE_TRIGGER} to this to register
 * a trigger for all the triggers registered via {@link registerSave}.
 * This is a common scenario when you modify your GUI in the save triggers and want
 * it to be up-to-date/displayed correctly when the options page is first opened/the
 * options are loaded.
 *
 * @public
 * @function
 * @param  {afterLoadTrigger|RUN_ALL_SAFE_TRIGGER} callback
 * @returns {void}
 */
function registerAfterLoad(callback) {
    if (callback === RUN_ALL_SAVE_TRIGGER) {
        callback = runSaveTrigger;
    }

    triggers.onAfterLoad.push({
        triggerFunc: callback
    });
}

/**
 * Reset all registered triggers/callbacks.
 *
 * @public
 * @function
 * @returns {void}
 */
function unregisterAll() {
    triggers.onSave = [];
    triggers.overrideSave = [];
    triggers.overrideLoad = [];
    triggers.onChange = [];
    triggers.onUpdate = [];
    triggers.onBeforeLoad = [];
    triggers.onAfterLoad = [];
}

// export @public functions to be used as a public API as defaults
export default {
    RUN_ALL_SAVE_TRIGGER,
    overrideContinue,
    registerTrigger,
    registerSave,
    addCustomSaveOverride,
    addCustomLoadOverride,
    registerUpdate,
    registerChange,
    registerBeforeLoad,
    registerAfterLoad,
    unregisterAll
};
