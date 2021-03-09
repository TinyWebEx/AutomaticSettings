/**
* Adjusts options page for browser or system (mobile/Android) compatibility.
 *
 * Notice: You can include this asyncronously even when the whole DOM is not parsed yet.
 * It only accesses the body tag and that is very likely available as it's likely one of
 * the first HTML tags that is written and this script is obviously included afterwards
 * in the head tag.
 * This prevents unnecessary flackering when the CSS is added and the browser needs to
 * re-parse/render the HTML.
 *
 * @public
 * @module MobileOptions
 */

/**
 * Returns whether the current runtime is a mobile one (true) or not (false).
 *
 * @private
 * @returns {Promise<bool>}
 */
async function isMobile() {
    const platformInfo = await browser.runtime.getPlatformInfo();

    return platformInfo.os === "android";
}

/**
* Returns whether the current browser is Firefox.
*
* @private
* @returns {Promise<bool>}
*/
async function isFirefox() {
    const browserInfo = await browser.runtime.getBrowserInfo();

    return browserInfo.name === "Firefox";
}

/**
 * Initalize this module.
 *
 * Currently this just adds a CSS class.
 * You can e.g. use this to disable all incompatible options on mobile devices.
 *
 * @public
 * @returns {Promise}
 */
export function init() {
    isMobile().then((isCurrentlyMobile) => {
        if (!isCurrentlyMobile) {
            return;
        }
        document.querySelector("body").classList.add("mobile");
    });
    isFirefox().then((isCurrentlyFirefox) => {
        if (!isCurrentlyFirefox) {
            return;
        }
        document.querySelector("body").classList.add("firefox");
    });

    return Promise.all([isMobile, isFirefox]);
}
