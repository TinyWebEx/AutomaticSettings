/**
 * Load, save and apply options to HTML options page.
 *
 * @public
 * @module AutomaticSettings
 * @requires AutomaticSettings/Trigger
 */

// import and expose module parts
export { default as Trigger } from "./internal/Trigger.js";
export * from "./internal/LoadAndSave.js";
export * from "./internal/ExternalModification.js";
export { setDefaultOptionProvider } from "./internal/OptionsModel.js";
