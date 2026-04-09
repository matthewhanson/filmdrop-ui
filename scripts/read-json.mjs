import fs from 'node:fs'

export function readJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch (error) {
    throw new Error(`Unable to read JSON from ${filePath}: ${error.message}`)
  }
}
