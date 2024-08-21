/**
 * @marketto/belfiore-connector-json 1.0.0
 * Copyright (c) 2019-2024, Marco Ricupero <marco.ricupero@gmail.com>
 * License: MIT
 * ============================================================
 * CITIES_COUNTRIES uses material from the following authors:
 * Agenzia delle Entrate             -   License: CC-BY 4.0
 * Istituto nazionale di Statistica  -   License: CC-BY 3.0
 * Ministero dell'Interno            -   License: CC-BY 4.0
 */

'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var moment = require('moment');
var belfioreConnector = require('@marketto/belfiore-connector');

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise */


function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, [])).next());
    });
}

/**
 * Handler for cities and countries Dataset
 */
class BelfioreConnector extends belfioreConnector.BelfioreAbstractConnector {
    filterByParams(places, params) {
        var _a;
        let filteredPlaces = [...places];
        // Code Matcher
        if (params === null || params === void 0 ? void 0 : params.codeMatcher) {
            filteredPlaces = filteredPlaces.filter(({ belfioreCode }) => { var _a; return (_a = params === null || params === void 0 ? void 0 : params.codeMatcher) === null || _a === void 0 ? void 0 : _a.test(belfioreCode); });
        }
        // Province
        if (params === null || params === void 0 ? void 0 : params.province) {
            const ucProvince = (_a = params === null || params === void 0 ? void 0 : params.province) === null || _a === void 0 ? void 0 : _a.toUpperCase();
            filteredPlaces = filteredPlaces.filter(({ province }) => ucProvince === (province === null || province === void 0 ? void 0 : province.toUpperCase()));
        }
        // Foundation Date
        if (params === null || params === void 0 ? void 0 : params.fromDate) {
            filteredPlaces = filteredPlaces.filter(({ creationDate }) => { var _a; return !creationDate || ((_a = params === null || params === void 0 ? void 0 : params.fromDate) === null || _a === void 0 ? void 0 : _a.isSameOrAfter(creationDate, "day")); });
        }
        // Expiration Date
        if (params === null || params === void 0 ? void 0 : params.toDate) {
            filteredPlaces = filteredPlaces.filter(({ expirationDate }) => {
                var _a;
                return !expirationDate ||
                    ((_a = params === null || params === void 0 ? void 0 : params.toDate) === null || _a === void 0 ? void 0 : _a.isSameOrBefore(expirationDate, "day"));
            });
        }
        return filteredPlaces;
    }
    getPlaces() {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof this.placesRetrieverFn === "function" &&
                ((this.placeExpirationDateTime instanceof Date &&
                    new Date().getTime() - this.placeExpirationDateTime.getTime() >= 0) ||
                    !this.placesCache)) {
                const allPlaces = yield this.placesRetrieverFn();
                if (typeof this.lifeTimeSec === "number" && !isNaN(this.lifeTimeSec)) {
                    this.placeExpirationDateTime = moment()
                        .add(this.lifeTimeSec, "seconds")
                        .toDate();
                }
                const filteredPlaces = this.filterByParams(allPlaces, {
                    codeMatcher: this.codeMatcher,
                    province: this.province,
                    fromDate: this.fromDate,
                    toDate: this.toDate,
                });
                this.placesCache = Object.freeze(filteredPlaces);
            }
            return [...(this.placesCache || [])];
        });
    }
    parseProvinces() {
        return __awaiter(this, void 0, void 0, function* () {
            const places = yield this.getPlaces();
            return [...new Set(places.map(({ province }) => province))]
                .sort()
                .filter(Boolean);
        });
    }
    constructor(placesOrFnOrOptions, options) {
        super();
        /**
         * Returns a Proxied version of Belfiore which filters results by given date
         * @param date Target date to filter places active only for the given date
         * @returns Belfiore instance filtered by active date
         * @public
         */
        this.active = (date = moment()) => new BelfioreConnector({
            placesRetrieverFn: this.placesRetrieverFn,
            placesCache: this.placesCache,
            placeExpirationDateTime: this.placeExpirationDateTime,
            lifeTimeSec: this.lifeTimeSec,
            codeMatcher: this.codeMatcher,
            province: this.province,
            fromDate: moment(date),
            toDate: moment(date),
        });
        /**
         * Returns a Proxied version of Belfiore which filters results by given date ahead
         * @param date Target date to filter places active only for the given date
         * @returns Belfiore instance filtered by active date
         * @public
         */
        this.from = (date = moment()) => new BelfioreConnector({
            placesRetrieverFn: this.placesRetrieverFn,
            placesCache: this.placesCache,
            placeExpirationDateTime: this.placeExpirationDateTime,
            lifeTimeSec: this.lifeTimeSec,
            codeMatcher: this.codeMatcher,
            province: this.province,
            fromDate: moment(date),
            toDate: this.toDate,
        });
        /**
         * Returns a Belfiore instance filtered by the given province
         * @param code Province Code (2 A-Z char)
         * @returns Belfiore instance filtered by province code
         * @public
         */
        this.byProvince = (code) => {
            if (typeof code !== "string" || !/^[A-Z]{2}$/u.test(code)) {
                return;
            }
            return new BelfioreConnector({
                placesRetrieverFn: this.placesRetrieverFn,
                placesCache: this.placesCache,
                placeExpirationDateTime: this.placeExpirationDateTime,
                lifeTimeSec: this.lifeTimeSec,
                codeMatcher: undefined,
                province: code,
                fromDate: this.fromDate,
                toDate: this.toDate,
            });
        };
        if ((options === null || options === void 0 ? void 0 : options.codeMatcher) && (options === null || options === void 0 ? void 0 : options.province)) {
            throw new Error("Both codeMatcher and province were provided to Bolfiore, only one is allowed");
        }
        if ((options === null || options === void 0 ? void 0 : options.toDate) && !(options === null || options === void 0 ? void 0 : options.fromDate)) {
            throw new Error("Parameter fromDate is mandatory passing toDate");
        }
        let placesCache = undefined;
        if (typeof placesOrFnOrOptions === "function") {
            this.placesRetrieverFn = placesOrFnOrOptions;
            this.lifeTimeSec = options === null || options === void 0 ? void 0 : options.lifeTimeSec;
        }
        else if (Array.isArray(placesOrFnOrOptions)) {
            placesCache = placesOrFnOrOptions;
        }
        else if (typeof placesOrFnOrOptions === "object" &&
            (placesOrFnOrOptions.placesRetrieverFn || placesOrFnOrOptions.placesCache)) {
            this.placesRetrieverFn = placesOrFnOrOptions.placesRetrieverFn;
            placesCache = placesOrFnOrOptions.placesCache;
            this.placeExpirationDateTime =
                placesOrFnOrOptions.placeExpirationDateTime;
            this.lifeTimeSec = placesOrFnOrOptions.lifeTimeSec;
            this.toDate = placesOrFnOrOptions.toDate;
            this.fromDate = placesOrFnOrOptions.fromDate;
            this.codeMatcher = placesOrFnOrOptions.codeMatcher;
            this.province = placesOrFnOrOptions.province;
        }
        else {
            throw new Error("Invalid initialized, retriver functio, array of places or BelfioreConnector instance needed as first parameter");
        }
        this.fromDate = this.fromDate || (options === null || options === void 0 ? void 0 : options.fromDate);
        this.toDate = this.toDate || (options === null || options === void 0 ? void 0 : options.toDate);
        this.codeMatcher = this.codeMatcher || (options === null || options === void 0 ? void 0 : options.codeMatcher);
        this.province = this.province || (options === null || options === void 0 ? void 0 : options.province);
        if (placesCache) {
            const filteredPlaces = this.filterByParams([...placesCache], {
                codeMatcher: this.codeMatcher,
                province: this.province,
                fromDate: this.fromDate,
                toDate: this.toDate,
            });
            this.placesCache = Object.freeze(filteredPlaces);
        }
    }
    /**
     * Return belfiore places list
     */
    toArray() {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.getPlaces()).map((place) => (Object.assign({}, place)));
        });
    }
    get provinces() {
        return new Promise((resolve) => {
            if (this.province) {
                resolve([this.province]);
            }
            else if (this.codeMatcher !== this.COUNTRY_CODE_MATCHER) {
                this.parseProvinces().then(resolve);
            }
            else {
                resolve([]);
            }
        });
    }
    /**
     * @description Search places matching given name
     */
    searchByName(name) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!name || typeof name !== "string") {
                return null;
            }
            const nameMatcher = new RegExp(name, "i");
            return (yield this.getPlaces()).filter((place) => nameMatcher.test(place.name));
        });
    }
    /**
     * @description Find place matching given name, retuns place object if provided name match only 1 result
     */
    findByName(name) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!name || typeof name !== "string") {
                return null;
            }
            const nameMatcher = new RegExp(`^${name}$`, "i");
            return ((yield this.getPlaces()).find((place) => nameMatcher.test(place.name)) ||
                null);
        });
    }
    /**
     * @description Retrieve Place by Belfiore Code
     */
    findByCode(belfioreCode) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.BELFIORE_CODE_MATCHER.test(belfioreCode)) {
                return null;
            }
            const lcBelfioreCode = belfioreCode.toUpperCase();
            return ((yield this.getPlaces()).find((place) => { var _a; return lcBelfioreCode === ((_a = place === null || place === void 0 ? void 0 : place.belfioreCode) === null || _a === void 0 ? void 0 : _a.toUpperCase()); }) || null);
        });
    }
    /**
     * Returns a Proxied version of Belfiore which filters results by place type
     */
    get cities() {
        if (this.codeMatcher && this.codeMatcher !== this.CITY_CODE_MATCHER) {
            return undefined;
        }
        return new BelfioreConnector({
            placesRetrieverFn: this.placesRetrieverFn,
            placesCache: this.placesCache,
            placeExpirationDateTime: this.placeExpirationDateTime,
            lifeTimeSec: this.lifeTimeSec,
            codeMatcher: this.CITY_CODE_MATCHER,
            province: undefined,
            fromDate: this.fromDate,
            toDate: this.toDate,
        });
    }
    /**
     * Returns a Proxied version of Belfiore which filters results by place type
     */
    get countries() {
        if ((this.codeMatcher && this.codeMatcher !== this.COUNTRY_CODE_MATCHER) ||
            this.province) {
            return undefined;
        }
        return new BelfioreConnector({
            placesRetrieverFn: this.placesRetrieverFn,
            placesCache: this.placesCache,
            placeExpirationDateTime: this.placeExpirationDateTime,
            lifeTimeSec: this.lifeTimeSec,
            codeMatcher: this.COUNTRY_CODE_MATCHER,
            province: undefined,
            fromDate: this.fromDate,
            toDate: this.toDate,
        });
    }
}

exports.BelfioreConnector = BelfioreConnector;
exports.default = BelfioreConnector;
