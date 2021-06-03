import "https://unpkg.com/mocha@5.2.0/mocha.js"; /* globals mocha */
import "https://unpkg.com/chai@4.1.2/chai.js"; /* globals chai */
import "https://unpkg.com/sinon@6.1.5/pkg/sinon.js"; /* globals sinon */

import * as EnvironmentalOptions from "../EnvironmentalOptions.js";

describe("options module: AutomaticSettings.EnvironmentalOptions", function () {
    describe("isMobile()", function () {
        it("returns true as browser is a mobile browser", async function () {
            const result = await EnvironmentalOptions.isMobile();

            chai.assert.isTrue(result);
        });
    });

    describe("isMozilla()", function () {
        it("returns true as browser is a Mozilla browser", async function () {
            const result = await EnvironmentalOptions.isMozilla();

            chai.assert.isTrue(result);
        });
    });

    describe("isFirefox()", function () {
        it("returns true as browser is a Mozilla Firefox", async function () {
            const result = await EnvironmentalOptions.isFirefox();

            chai.assert.isTrue(result);
        });
    });
});
