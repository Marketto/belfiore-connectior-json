import { IBelfioreConnectorBaseConfig, IBelfioreConnectorProvinceConfig, IBelfioreConnectorMatcherConfig, BelfioreAbstractConnector, BelfiorePlace, MultiFormatDate } from '@marketto/belfiore-connector';
export * from '@marketto/belfiore-connector';

type BelfioreConnectorConfig = (IBelfioreConnectorBaseConfig | IBelfioreConnectorProvinceConfig | IBelfioreConnectorMatcherConfig) & {
    lifeTimeSec?: number;
} & ({} | {
    fromDate: never;
    toDate: never;
});

/**
 * Handler for cities and countries Dataset
 */
declare class BelfioreConnector extends BelfioreAbstractConnector {
    private placesRetrieverFn?;
    private placesCache?;
    private placeExpirationDateTime?;
    private lifeTimeSec?;
    private toDate;
    private fromDate;
    private codeMatcher;
    private province;
    private filterByParams;
    private getPlaces;
    private parseProvinces;
    constructor(options: BelfioreConnectorConfig & ({
        placesRetrieverFn: () => Promise<BelfiorePlace[]>;
        placesCache?: readonly BelfiorePlace[];
        placeExpirationDateTime?: Date;
        lifeTimeSec?: number;
    } | {
        placesRetrieverFn?: never | undefined;
        placesCache: readonly BelfiorePlace[];
        placeExpirationDateTime?: never | undefined;
        lifeTimeSec?: never | undefined;
    }));
    constructor(placesOrRetrieverFn: BelfiorePlace[] | (() => Promise<BelfiorePlace[]>), options?: BelfioreConnectorConfig);
    /**
     * Return belfiore places list
     */
    toArray(): Promise<BelfiorePlace[]>;
    get provinces(): Promise<string[]>;
    /**
     * @description Search places matching given name
     */
    searchByName(name: string): Promise<BelfiorePlace[] | null>;
    /**
     * @description Find place matching given name, retuns place object if provided name match only 1 result
     */
    findByName(name: string): Promise<BelfiorePlace | null>;
    /**
     * @description Retrieve Place by Belfiore Code
     */
    findByCode(belfioreCode: string): Promise<BelfiorePlace | null>;
    /**
     * Returns a Proxied version of Belfiore which filters results by given date
     * @param date Target date to filter places active only for the given date
     * @returns Belfiore instance filtered by active date
     * @public
     */
    active: (date?: MultiFormatDate) => BelfioreConnector;
    /**
     * Returns a Proxied version of Belfiore which filters results by given date ahead
     * @param date Target date to filter places active only for the given date
     * @returns Belfiore instance filtered by active date
     * @public
     */
    from: (date?: MultiFormatDate) => BelfioreConnector;
    /**
     * Returns a Belfiore instance filtered by the given province
     * @param code Province Code (2 A-Z char)
     * @returns Belfiore instance filtered by province code
     * @public
     */
    byProvince: (code: string) => BelfioreConnector | undefined;
    /**
     * Returns a Proxied version of Belfiore which filters results by place type
     */
    get cities(): BelfioreConnector | undefined;
    /**
     * Returns a Proxied version of Belfiore which filters results by place type
     */
    get countries(): BelfioreConnector | undefined;
}

export { BelfioreConnector, BelfioreConnector as default };
