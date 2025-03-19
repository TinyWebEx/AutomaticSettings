/**
 * Any APIs to allow external modiifications of the internal state of this module.
 *
 * @public
 * @module AutomaticSettings
 */

import * as HtmlMod from "./HtmlModification.js";
import * as DomModel from "./DomModel.js";
import * as LoadAndSave from "./LoadAndSave.js";

/**
 * Set an option from the outside.
 *
 * This sets the visible option and saves it, so the state is consistent.
 * It also always triggers any registered triggers.
 *
 * @public
 * @param  {string} option option to change
 * @param  {Object} optionValue the value to set
 * @param  {Object} [optionGroup] the option group of the setting
 * @returns {Promise}
 */
export async function setOption(option, optionValue, optionGroup) {
    const elOption = DomModel.getElementFromOptionId(option);
    optionGroup = optionGroup || DomModel.getOptionGroup(elOption);

    if (optionGroup) {
        await DomModel.getHtmlElementsOfOptionsGroup(optionGroup).map((elCurrentOption) => {
            const currOption = HtmlMod.getOptionIdFromElement(elCurrentOption);
            LoadAndSave.applyOption(currOption, optionGroup, elCurrentOption, { option: optionValue });
        });
    } else {
        // apply HTML
        await LoadAndSave.applyOption(option, optionGroup, elOption, { option: optionValue });
        // now trigger saving of modified values
        LoadAndSave.saveOption({target: elOption});
    }
}
