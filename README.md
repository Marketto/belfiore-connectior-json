# belfiore-connector-json

**Belfiore datasource connector: embedded dataset**
Best for embedded FE usage

[![NPM Version](https://img.shields.io/npm/v/@marketto/belfiore-connector-json.svg)](https://www.npmjs.com/package/@marketto/belfiore-connector-json)
[![NPM Downloads](https://img.shields.io/npm/dm/@marketto/belfiore-connector-json.svg)](https://www.npmjs.com/package/@marketto/belfiore-connector-json)
[![LICENSE](https://img.shields.io/badge/licese-MIT-gold.svg)](https://github.com/Marketto/belfiore-connector-json/blob/master/LICENSE)
[![Blog](https://img.shields.io/badge/blog-marketto-blue.svg)](http://blog.marketto.it)
[![Buy me a coffee](https://img.shields.io/badge/Ko--fi-donate-blueviolet)](https://ko-fi.com/marketto)

## 🖋️ WRITE YOUR OWN CONNECTOR

Not the **BelfioreConnector** you are looking for?

[**@marketto/belfiore-connector**](https://www.npmjs.com/package/@marketto/belfiore-connector): Abstract class & interfaces to write your own connector

## 🔌 INSTALLATION

### NPM

```{r, engine='bash', global_install}
npm i -s @marketto/belfiore-connector-json
```

### Script

```html
<script src="https://unpkg.com/@marketto/belfiore-connector-json/dist/belfiore-connector-json.bundle.min.js"></script>
```

## 🔧 USAGE

### CJS

```javascript
const BelfioreConnector = require("@marketto/belfiore-connector-json");
```

### MJS & TypeScript

```javascript
import BelfioreConnector from "@marketto/belfiore-connector-json";
```

## INITIALIZATION

### Static List

```javascript
const belfioreConnector = new BelfioreConnector(myPlaceList);
```

### Async function to retrieve data

```javascript
// Passing a function to download place list and options to set the life time to 10 minutes
// When needed the function will be called and results cached for the set life time
// null / undefined = forever, 0 expire after every single usage
const belfioreConnector = new BelfioreConnector(
	() => fetch(url).then((response) => response.json()),
	{ lifeTimeSec: 600 }
);
```

## 📖 [DOCUMENTATION](https://marketto.github.io/belfiore-connector-json/)

## 📙 [CHANGELOG](CHANGELOG.MD)

## 🔃 Compatibility

- [x] NodeJs
- [x] Chrome
- [x] Firefox
- [x] Edge

## ✋ DISCLAMER

All names, informations, and fiscal codes used in this README and all unit tests are fictitious.
No identification with actual persons (living or deceased) is intended or should be inferred

## 📜 [LICENSE: MIT](LICENSE)

## 📚 ASSETS LICENSES AND AUTHORS

- Cities List of Values: [CC BY 4.0](asset/MINISTERO_DELL_INTERNO.LICENSE) Ministero dell'interno
- Cities List of Values: [CC BY 4.0](asset/AGENZIA_DELLE_ENTRATE.LICENSE) Agenzia delle Entrate
- Countries List of Values: [CC BY 3.0](asset/ISTITUTO_NAZIONALE_DI_STATISTICA.LICENSE) Istituto nazionale di statistica

## 📝 AUTHOR

[Marco Ricupero](mailto:marco.ricupero@gmail.com)
