module.exports = {
  outputFolder: 'src/lang',
  flat: false,  // true / false
  removeUnused: false, // true | false
  overrideSource: false, // false, uppercase, lowercase
  languages: [
    'en'
  ],
  mode: 'vue', // vue | angular | react | custom
  folders: [
    'src/*.vue',
    'src/*.js'
  ],
  extra: [
  ]
}
