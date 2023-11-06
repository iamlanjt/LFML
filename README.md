# Lolcode Faux-Module Loader
LFML is an implementation of assembly-like includes for the Lolcode language.

# Current State
LFML is not currently finished, and not all manifest options work. Contributions are welcomed and are appreciated.

# Installation
1) Clone this repo
2) Run `npm install`

# Usage
1) Create a file named `fmod_manifest.json` inside of your desired project directory
2) Use the following template for your manifest file:
```json
{
	"importingFile": "./main.lol", // The lolcode file you wish to include modules into
	"outDir": "./final", // The direcotry LFML will dump the final code into
	"targetFiles": [
		"./modules/*.lol" // To be implemented
	],
	"options": {} // To be implemented
}
```
3) `src/index.js` usage:
```bash
node index.js
	-t | --target
	   ~ The target dir to run in
	   ~ Default: `./`
```