const fs = require('fs')
const path = require('path')
const _ = require('lodash')
const glob = require('glob')
const sortDeepObjectArrays = require('sort-deep-object-arrays')
const process = require('process')

const configFile = './i18ngen.config.js'
const parsers = [
  {
    regexp: /\$t\(\s*\'(\S*)\'\s*\)/gm,
    replacement: /^\$T/,
    replace: '$t'
  },
  {
    regexp: /\$tc\(\s*\'(\S*)\',.*\)/gm,
    replacement: /^\$TC/,
    replace: '$tc'
  },
  {
    regexp: /i18n\.t\(\s*\'(\S*)\'\s*\)/gm,
    replacement: /^I18N\.T/,
    replace: 'i18n.t'
  },
]

const defaultConfig = require(path.resolve(__dirname, 'default.config.js'))
const userConfig = require(path.resolve(process.cwd(), configFile))
const config = _.merge(defaultConfig, userConfig)

let filesToParse = []

_.map(config.folders, (folder) => {
  const f = path.resolve(process.cwd(), folder)
  let results = glob.sync(folder, {})
  filesToParse.push(results)
})

filesToParse = _.flatten(...filesToParse)

console.log(filesToParse)
let results = []

for (let i = 0; i < filesToParse.length; i++) {
  let file = process.cwd() + '/' + filesToParse[i]
  let text = fs.readFileSync(file, 'utf8')

  let matches
  let toReplace = []
  for (let index in parsers) {
    const parser = parsers[index]
    const regex = new RegExp(parser.regexp)
    while ((matches = regex.exec(text)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (matches.index === regex.lastIndex) {
        regex.lastIndex++
      }

      let group = _.nth(matches, 0)
      let value = _.nth(matches, 1)

      if (config.overrideSource) {
        if (value !== value.toUpperCase()) {
          value = value.toUpperCase()

          toReplace.push({
            from: group,
            to: group.toUpperCase().replace(parser.replacement, parser.replace)
          })
        }
      }

      // The result can be accessed through the `matches`-variable.
      matches.forEach((match, groupIndex) => {
        if (groupIndex === 1) {
          results.push(match)
        }
      })
    }
  }

  if (config.overrideSource) {
    _.each(toReplace, (group) => {
      text = text.replace(group.from, group.to)
    })

    fs.writeFileSync(file, text, 'utf8')
  }
}

function stringToObject (str, val, obj) {
  let currentObj = obj
  let keys = str.split('.')

  if (keys.length === 1) {
    return currentObj[keys[0]] = val
  }

  let i, l = Math.max(1, keys.length - 1)
  let key

  for (i = 0; i < l; ++i) {
    key = keys[i]
    currentObj[key] = currentObj[key] || {}
    currentObj = currentObj[key]
  }

  currentObj[keys[i]] = val
  delete obj[str]
}

let data = _.uniq(results)

// console.log(results)

let jsonData = {}

if (config.flat) {
  _.each(data, (item) => {
    jsonData[item] = 'TO_BE_TRANSLATED'
  })
} else {
  _.each(data, (item) => {
    stringToObject(item, 'TO_BE_TRANSLATED', jsonData)
  })
}

_.each(config.languages, (lang) => {
  let file = path.resolve(process.cwd() + '/' + config.outputFolder, lang + '.json')
  let json = JSON.parse(fs.readFileSync(file, 'utf8'))
  json = _.merge(jsonData, json)

  const jsonSorted = sortDeepObjectArrays(json)
  fs.writeFileSync(file, JSON.stringify(jsonSorted, null, 4), 'utf8')
})




