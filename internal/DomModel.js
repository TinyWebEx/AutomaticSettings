/**
 * Get data from the options as specified in the HTML/DOM.
 *
 * Thus, this is a model that uses the DOM as it's data source.
 *
 * @public
 * @module AutomaticSettings
 */

/**
 * Get the name of the option from an element.
 *
 * @package
 * @param {string} option
 * @returns {HTMLElement}
 */
export function getElementFromOptionId(option) {
    return document.querySelector(`[name=${option}]`);
}

/**
 * Get the option group from an HTMLElement.
 *
 * @package
 * @param {HTMLElement} elOption
 * @returns {string}
 */
export function getOptionGroup(elOption) {
    return elOption.dataset.optiongroup || null;
}

/**
 * Get all the HTML elements of an option group..
 *
 * @package
 * @param {string} optionGroup
 * @returns {string}
 */
export function getHtmlElementsOfOptionsGroup(optionGroup) {
    return document.querySelectorAll(`[data-optiongroup=${optionGroup}]`);
}
