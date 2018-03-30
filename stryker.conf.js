module.exports = function(config){
  config.set({
    files: [
      { pattern: "**/node_modules/jest-preset-angular/preprocessor.js"  }, // Commenting this line results in a jest error
      {
        pattern: "**/components/**/*.ts",
        mutated: true,
        included: false
      }
    ],
    tsconfigFile: 'tsconfig.json',
    mutator: 'typescript',
    transpilers: [
        'typescript'
    ],
    testRunner: 'jest',
    reporter: ['progress', 'clear-text', 'dots', 'html', 'event-recorder'],
    coverageAnalysis: 'off',
    plugins: ['stryker-jest-runner', 'stryker-html-reporter', 'stryker-typescript']
  });
}