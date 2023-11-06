import { program } from "commander"
import { existsSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"
import { cwd } from "process"

// Constants
// faux-module manifest file name
export const FMOD_MANIFEST_FILE = "fmod_manifest.json"

program.
	option('-t, --target <target>', 'Specify the target directory')
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

while (lastMatch !== null) {
	const importFile = lastMatch.groups.importName
	let openFile
	try {
		openFile = readFileSync(join(path, importFile))
	} catch (err) {}
	if (!openFile) {
		throw new Error(`Failed importing file ${numImports + 1}: Requested file does not exist or is unreachable.`)
	}

	const contentsRegex = /HAI\s+\d+(\.\d+)?\s+(?<contents>[\s\S]+?)\s+KTHXBYE/
	const match = openFile.toString().match(contentsRegex)
	if (match === null || match.groups.contents === undefined) {
		throw new Error('Could not match any code for import ' + numImports + 1)
	}

	mutableSource = mutableSource.replace(targetIncludeRegex, match.groups.contents)
	lastMatch = targetIncludeRegex.exec(mutableSource)
	numImports += 1
}
console.log(`Finished joining ${numImports} file(s).`)
console.log(`Attempting to write buffer to out file directory (${join(path, manifest.outDir)})...`)
writeFileSync(join(path, manifest.outDir, manifest.importingFile), mutableSource)