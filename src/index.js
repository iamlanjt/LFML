import chalk from "chalk"
import { program } from "commander"
import { existsSync, readFileSync, writeFileSync } from "fs"
import { basename, join } from "path"
import { cwd } from "process"

// Constants
// faux-module manifest file name
export const FMOD_MANIFEST_FILE = "fmod_manifest.json"

program.
	option('-t, --target <target>', 'Specify the target directory')
	.option('-n, --nocolor', 'Supply flag to disable terminal colors (support for terminals without color support)')
	.parse(process.argv)

const args = program._optionValues
const path = args.target ?? cwd()

const manifestFilePath = join(path, FMOD_MANIFEST_FILE)
if (!existsSync(manifestFilePath)) {
	throw new Error(`Manifest file at '${join(path, FMOD_MANIFEST_FILE)}' does not exist.`)
}

const manifest = JSON.parse(readFileSync(manifestFilePath))
let mutableSource = readFileSync(join(path, manifest.importingFile)).toString()

const targetIncludeRegex = /%include \[(?<importName>.*)\]/
let lastMatch = targetIncludeRegex.exec(mutableSource)
let numImports = 0
let importTraceback = []

const fileErr = (nI) => {
	throw new Error(`Failed importing file ${nI + 1}: Requested file does not exist or is unreachable.`)
}

// Resolve color options
const nocolorFlag = args.nocolor === undefined 
const _unchanged = (s)=>{return s}
const RED = nocolorFlag ? chalk.red : _unchanged
const GREEN = nocolorFlag ? chalk.green : _unchanged

while (lastMatch !== null) {
	const importFile = lastMatch.groups.importName
	let openFile
	let filePath
	try {
		filePath = join(path, importFile)
		openFile = readFileSync(join(path, importFile))
	} catch (err) {}
	// TODO: Clean up this mess...
	if (!openFile) {
		// Requested file does not exist; attempt to find it in the global `modulesDir` config from the manifest
		if (manifest.modulesDir) {
			try {
				filePath = join(path, manifest.modulesDir, importFile)
				openFile = readFileSync(join(path, manifest.modulesDir, importFile))
			} catch (err) {}
			if (!openFile) {
				fileErr(numImports)
			}
		} else {
			fileErr(numImports)
		}
	}

	const contentsRegex = /HAI\s+\d+(\.\d+)?\s+(?<contents>[\s\S]+?)\s+KTHXBYE/
	const match = openFile.toString().match(contentsRegex)
	if (match === null || match.groups.contents === undefined) {
		throw new Error('Could not match any code for import ' + numImports + 1)
	}

	mutableSource = mutableSource.replace(targetIncludeRegex, match.groups.contents)
	lastMatch = targetIncludeRegex.exec(mutableSource)
	importTraceback.push(filePath)
	numImports += 1
}
let jobFinishedTable = "\n"
for (const f of importTraceback) {
	jobFinishedTable += GREEN(f) + "\n"
}
console.log(`Job finished with ${numImports} file(s) imported.\nFile sources:\n ${jobFinishedTable}`)
writeFileSync(join(path, manifest.outDir, basename(manifest.importingFile)), mutableSource)