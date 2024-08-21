import {
	IBelfioreConnectorBaseConfig,
	IBelfioreConnectorMatcherConfig,
	IBelfioreConnectorProvinceConfig,
} from "@marketto/belfiore-connector";

type BelfioreConnectorConfig = (
	| IBelfioreConnectorBaseConfig
	| IBelfioreConnectorProvinceConfig
	| IBelfioreConnectorMatcherConfig
) & { lifeTimeSec?: number } & ({} | { fromDate: never; toDate: never });

export default BelfioreConnectorConfig;
