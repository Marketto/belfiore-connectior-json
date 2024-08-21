import moment, { Moment } from "moment";
import BelfioreConnectorConfig from "../types/belfiore-connector-config.type";
import {
	BelfioreAbstractConnector,
	BelfiorePlace,
	MultiFormatDate,
} from "@marketto/belfiore-connector";

/**
 * Handler for cities and countries Dataset
 */
export default class BelfioreConnector extends BelfioreAbstractConnector {
	private placesRetrieverFn?: () => Promise<BelfiorePlace[]>;
	private placesCache?: readonly BelfiorePlace[];
	private placeExpirationDateTime?: Date;
	private lifeTimeSec?: number;
	private toDate: Moment | undefined;
	private fromDate: Moment | undefined;
	private codeMatcher: RegExp | undefined;
	private province: string | undefined;

	private filterByParams(
		places: BelfiorePlace[],
		params?: {
			toDate?: Moment | undefined;
			fromDate?: Moment | undefined;
			codeMatcher?: RegExp | undefined;
			province?: string | undefined;
		}
	): BelfiorePlace[] {
		let filteredPlaces = [...places];
		// Code Matcher
		if (params?.codeMatcher) {
			filteredPlaces = filteredPlaces.filter(({ belfioreCode }) =>
				params?.codeMatcher?.test(belfioreCode)
			);
		}

		// Province
		if (params?.province) {
			const ucProvince = params?.province?.toUpperCase();
			filteredPlaces = filteredPlaces.filter(
				({ province }) => ucProvince === province?.toUpperCase()
			);
		}

		// Foundation Date
		if (params?.fromDate) {
			filteredPlaces = filteredPlaces.filter(
				({ creationDate }) =>
					!creationDate || params?.fromDate?.isSameOrAfter(creationDate, "day")
			);
		}

		// Expiration Date
		if (params?.toDate) {
			filteredPlaces = filteredPlaces.filter(
				({ expirationDate }) =>
					!expirationDate ||
					params?.toDate?.isSameOrBefore(expirationDate, "day")
			);
		}

		return filteredPlaces;
	}

	private async getPlaces(): Promise<BelfiorePlace[]> {
		if (
			typeof this.placesRetrieverFn === "function" &&
			((this.placeExpirationDateTime instanceof Date &&
				new Date().getTime() - this.placeExpirationDateTime.getTime() >= 0) ||
				!this.placesCache)
		) {
			const allPlaces = await this.placesRetrieverFn();
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
	}

	private async parseProvinces(): Promise<string[]> {
		const places = await this.getPlaces();
		return [...new Set(places.map(({ province }) => province))]
			.sort()
			.filter(Boolean) as string[];
	}

	constructor(
		options: BelfioreConnectorConfig &
			(
				| {
						placesRetrieverFn: () => Promise<BelfiorePlace[]>;
						placesCache?: readonly BelfiorePlace[];
						placeExpirationDateTime?: Date;
						lifeTimeSec?: number;
				  }
				| {
						placesRetrieverFn?: never | undefined;
						placesCache: readonly BelfiorePlace[];
						placeExpirationDateTime?: never | undefined;
						lifeTimeSec?: never | undefined;
				  }
			)
	);
	constructor(
		placesOrRetrieverFn: BelfiorePlace[] | (() => Promise<BelfiorePlace[]>),
		options?: BelfioreConnectorConfig
	);
	constructor(
		placesOrFnOrOptions:
			| BelfiorePlace[]
			| (() => Promise<BelfiorePlace[]>)
			| (BelfioreConnectorConfig & {
					placesRetrieverFn?: () => Promise<BelfiorePlace[]>;
					placesCache?: readonly BelfiorePlace[];
					placeExpirationDateTime?: Date;
					lifeTimeSec?: number;
			  }),
		options?: BelfioreConnectorConfig
	) {
		super();
		if (options?.codeMatcher && options?.province) {
			throw new Error(
				"Both codeMatcher and province were provided to Bolfiore, only one is allowed"
			);
		}

		if (options?.toDate && !options?.fromDate) {
			throw new Error("Parameter fromDate is mandatory passing toDate");
		}

		let placesCache: BelfiorePlace[] | readonly BelfiorePlace[] | undefined =
			undefined;

		if (typeof placesOrFnOrOptions === "function") {
			this.placesRetrieverFn = placesOrFnOrOptions;
			this.lifeTimeSec = options?.lifeTimeSec;
		} else if (Array.isArray(placesOrFnOrOptions)) {
			placesCache = placesOrFnOrOptions;
		} else if (
			typeof placesOrFnOrOptions === "object" &&
			(placesOrFnOrOptions.placesRetrieverFn || placesOrFnOrOptions.placesCache)
		) {
			this.placesRetrieverFn = placesOrFnOrOptions.placesRetrieverFn;
			placesCache = placesOrFnOrOptions.placesCache;
			this.placeExpirationDateTime =
				placesOrFnOrOptions.placeExpirationDateTime;
			this.lifeTimeSec = placesOrFnOrOptions.lifeTimeSec;
			this.toDate = placesOrFnOrOptions.toDate;
			this.fromDate = placesOrFnOrOptions.fromDate;
			this.codeMatcher = placesOrFnOrOptions.codeMatcher;
			this.province = placesOrFnOrOptions.province;
		} else {
			throw new Error(
				"Invalid initialized, retriver functio, array of places or BelfioreConnector instance needed as first parameter"
			);
		}

		this.fromDate = this.fromDate || options?.fromDate;
		this.toDate = this.toDate || options?.toDate;
		this.codeMatcher = this.codeMatcher || options?.codeMatcher;
		this.province = this.province || options?.province;

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
	public async toArray(): Promise<BelfiorePlace[]> {
		return (await this.getPlaces()).map((place) => ({
			...place,
		})) as BelfiorePlace[];
	}

	public get provinces(): Promise<string[]> {
		return new Promise((resolve) => {
			if (this.province) {
				resolve([this.province]);
			} else if (this.codeMatcher !== this.COUNTRY_CODE_MATCHER) {
				this.parseProvinces().then(resolve);
			} else {
				resolve([]);
			}
		});
	}

	/**
	 * @description Search places matching given name
	 */
	public async searchByName(name: string): Promise<BelfiorePlace[] | null> {
		if (!name || typeof name !== "string") {
			return null;
		}
		const nameMatcher = new RegExp(name, "i");

		return (await this.getPlaces()).filter((place) =>
			nameMatcher.test(place.name)
		);
	}

	/**
	 * @description Find place matching given name, retuns place object if provided name match only 1 result
	 */
	public async findByName(name: string): Promise<BelfiorePlace | null> {
		if (!name || typeof name !== "string") {
			return null;
		}
		const nameMatcher = new RegExp(`^${name}$`, "i");
		return (
			(await this.getPlaces()).find((place) => nameMatcher.test(place.name)) ||
			null
		);
	}

	/**
	 * @description Retrieve Place by Belfiore Code
	 */
	public async findByCode(belfioreCode: string): Promise<BelfiorePlace | null> {
		if (!this.BELFIORE_CODE_MATCHER.test(belfioreCode)) {
			return null;
		}
		const lcBelfioreCode = belfioreCode.toUpperCase();
		return (
			(await this.getPlaces()).find(
				(place) => lcBelfioreCode === place?.belfioreCode?.toUpperCase()
			) || null
		);
	}

	/**
	 * Returns a Proxied version of Belfiore which filters results by given date
	 * @param date Target date to filter places active only for the given date
	 * @returns Belfiore instance filtered by active date
	 * @public
	 */
	public active = (date: MultiFormatDate = moment()): BelfioreConnector =>
		new BelfioreConnector({
			placesRetrieverFn: this.placesRetrieverFn,
			placesCache: this.placesCache,
			placeExpirationDateTime: this.placeExpirationDateTime,
			lifeTimeSec: this.lifeTimeSec,
			codeMatcher: this.codeMatcher,
			province: this.province,
			fromDate: moment(date),
			toDate: moment(date),
		} as any);

	/**
	 * Returns a Proxied version of Belfiore which filters results by given date ahead
	 * @param date Target date to filter places active only for the given date
	 * @returns Belfiore instance filtered by active date
	 * @public
	 */
	public from = (date: MultiFormatDate = moment()): BelfioreConnector =>
		new BelfioreConnector({
			placesRetrieverFn: this.placesRetrieverFn,
			placesCache: this.placesCache,
			placeExpirationDateTime: this.placeExpirationDateTime,
			lifeTimeSec: this.lifeTimeSec,
			codeMatcher: this.codeMatcher,
			province: this.province,
			fromDate: moment(date),
			toDate: this.toDate,
		} as any);

	/**
	 * Returns a Belfiore instance filtered by the given province
	 * @param code Province Code (2 A-Z char)
	 * @returns Belfiore instance filtered by province code
	 * @public
	 */
	public byProvince = (code: string): BelfioreConnector | undefined => {
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
		} as any);
	};

	/**
	 * Returns a Proxied version of Belfiore which filters results by place type
	 */
	public get cities(): BelfioreConnector | undefined {
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
		} as any);
	}

	/**
	 * Returns a Proxied version of Belfiore which filters results by place type
	 */
	public get countries(): BelfioreConnector | undefined {
		if (
			(this.codeMatcher && this.codeMatcher !== this.COUNTRY_CODE_MATCHER) ||
			this.province
		) {
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
		} as any);
	}
}
