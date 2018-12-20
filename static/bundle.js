(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const withDefaults = require('./with-defaults')
const DEFAULTS = require('./lib/defaults')

module.exports = withDefaults(null, DEFAULTS)

},{"./lib/defaults":2,"./with-defaults":11}],2:[function(require,module,exports){
const getUserAgent = require('universal-user-agent')

const version = require('../package.json').version
const userAgent = `octokit-endpoint.js/${version} ${getUserAgent()}`

module.exports = {
  method: 'GET',
  baseUrl: 'https://api.github.com',
  headers: {
    accept: 'application/vnd.github.v3+json',
    'user-agent': userAgent
  }
}

},{"../package.json":10,"universal-user-agent":28}],3:[function(require,module,exports){
module.exports = endpointWithDefaults

const merge = require('./merge')
const parse = require('./parse')

function endpointWithDefaults (defaults, route, options) {
  return parse(merge(defaults, route, options))
}

},{"./merge":4,"./parse":5}],4:[function(require,module,exports){
module.exports = defaultOptions

const merge = require('deepmerge')
const isPlainObject = require('is-plain-object')

const lowercaseKeys = require('./util/lowercase-keys')

function defaultOptions (defaults, route, options) {
  if (typeof route === 'string') {
    let [method, url] = route.split(' ')
    options = Object.assign(url ? { method, url } : { url: method }, options)
  } else {
    options = route || {}
  }

  // lowercase header names before merging with defaults to avoid duplicates
  options.headers = lowercaseKeys(options.headers)

  options = merge.all([defaults, options].filter(Boolean), { isMergeableObject: isPlainObject })

  return options
}

},{"./util/lowercase-keys":8,"deepmerge":24,"is-plain-object":25}],5:[function(require,module,exports){
module.exports = toRequestOptions

const urlTemplate = require('url-template')
const addQueryParameters = require('./util/add-query-parameters')
const extractUrlVariableNames = require('./util/extract-url-variable-names')
const omit = require('./util/omit')

function toRequestOptions (options) {
  // https://fetch.spec.whatwg.org/#methods
  let method = options.method.toUpperCase()

  // replace :varname with {varname} to make it RFC 6570 compatible
  let url = options.url.replace(/:([a-z]\w+)/g, '{+$1}')
  let headers = options.headers
  let body
  let parameters = omit(options, ['method', 'baseUrl', 'url', 'headers', 'request'])

  // extract variable names from URL to calculate remaining variables later
  const urlVariableNames = extractUrlVariableNames(url)

  url = urlTemplate.parse(url).expand(parameters)

  if (!/^http/.test(url)) {
    url = options.baseUrl + url
  }

  const omittedParameters = Object.keys(options).filter((option) => urlVariableNames.includes(option)).concat('baseUrl')
  const remainingParameters = omit(parameters, omittedParameters)

  // for GET/HEAD requests, set URL query parameters from remaining parameters
  // for PATCH/POST/PUT/DELETE requests, set request body from remaining parameters
  if (['GET', 'HEAD'].includes(method)) {
    url = addQueryParameters(url, remainingParameters)
  } else {
    if ('data' in remainingParameters) {
      body = remainingParameters.data
    } else {
      if (Object.keys(remainingParameters).length) {
        body = remainingParameters
      } else {
        headers['content-length'] = 0
      }
    }
  }

  // default content-type for JSON if body is set
  if (!headers['content-type'] && typeof body !== 'undefined') {
    headers['content-type'] = 'application/json; charset=utf-8'
  }

  // GitHub expects "content-length: 0" header for PUT/PATCH requests without body.
  // fetch does not allow to set `content-length` header, but we can set body to an empty string
  if (['PATCH', 'PUT'].includes(method) && typeof body === 'undefined') {
    body = ''
  }

  // Only return body/request keys if present
  return Object.assign(
    { method: method, url, headers },
    typeof body !== 'undefined' ? { body } : null,
    options.request ? { request: options.request } : null
  )
}

},{"./util/add-query-parameters":6,"./util/extract-url-variable-names":7,"./util/omit":9,"url-template":29}],6:[function(require,module,exports){
module.exports = addQueryParameters

function addQueryParameters (url, parameters) {
  const separator = /\?/.test(url) ? '&' : '?'
  const names = Object.keys(parameters)

  if (names.length === 0) {
    return url
  }

  return url + separator + names
    .map(name => {
      if (name === 'q') {
        return 'q=' + parameters.q.split('+')
          .map(encodeURIComponent)
          .join('+')
      }

      return `${name}=${encodeURIComponent(parameters[name])}`
    })
    .join('&')
}

},{}],7:[function(require,module,exports){
module.exports = extractUrlVariableName

const urlVariableRegex = /\{[^}]+\}/g
function extractUrlVariableName (url) {
  const matches = url.match(urlVariableRegex)

  if (!matches) {
    return []
  }

  return matches.map(removeNonChars).reduce((a, b) => a.concat(b), [])
}

function removeNonChars (variableName) {
  return variableName.replace(/^\W+|\W+$/g, '').split(/,/)
}

},{}],8:[function(require,module,exports){
module.exports = lowercaseKeys

function lowercaseKeys (object) {
  if (!object) {
    return {}
  }

  return Object.keys(object).reduce((newObj, key) => {
    newObj[key.toLowerCase()] = object[key]
    return newObj
  }, {})
}

},{}],9:[function(require,module,exports){
module.exports = omit

function omit (object, keysToOmit) {
  return Object.keys(object)
    .filter((option) => !keysToOmit.includes(option))
    .reduce((obj, key) => {
      obj[key] = object[key]
      return obj
    }, {})
}

},{}],10:[function(require,module,exports){
module.exports={
  "_from": "@octokit/endpoint",
  "_id": "@octokit/endpoint@3.1.1",
  "_inBundle": false,
  "_integrity": "sha512-KPkoTvKwCTetu/UqonLs1pfwFO5HAqTv/Ksp9y4NAg//ZgUCpvJsT4Hrst85uEzJvkB8+LxKyR4Bfv2X8O4cmQ==",
  "_location": "/@octokit/endpoint",
  "_phantomChildren": {},
  "_requested": {
    "type": "tag",
    "registry": true,
    "raw": "@octokit/endpoint",
    "name": "@octokit/endpoint",
    "escapedName": "@octokit%2fendpoint",
    "scope": "@octokit",
    "rawSpec": "",
    "saveSpec": null,
    "fetchSpec": "latest"
  },
  "_requiredBy": [
    "#USER",
    "/",
    "/@octokit/request"
  ],
  "_resolved": "https://registry.npmjs.org/@octokit/endpoint/-/endpoint-3.1.1.tgz",
  "_shasum": "ede9afefaa4d6b7584169e12346425c6fbb45cc3",
  "_spec": "@octokit/endpoint",
  "_where": "/Users/andymckay/sandboxes/github-utils",
  "author": {
    "name": "Gregor Martynus",
    "url": "https://github.com/gr2m"
  },
  "bugs": {
    "url": "https://github.com/octokit/endpoint.js/issues"
  },
  "bundleDependencies": false,
  "bundlesize": [
    {
      "path": "./dist/octokit-endpoint.min.js.gz",
      "maxSize": "3KB"
    }
  ],
  "dependencies": {
    "deepmerge": "3.0.0",
    "is-plain-object": "^2.0.4",
    "universal-user-agent": "^2.0.1",
    "url-template": "^2.0.8"
  },
  "deprecated": false,
  "description": "Turns REST API endpoints into generic request options",
  "devDependencies": {
    "chai": "^4.2.0",
    "compression-webpack-plugin": "^2.0.0",
    "coveralls": "^3.0.2",
    "cypress": "^3.1.0",
    "mkdirp": "^0.5.1",
    "mocha": "^5.2.0",
    "npm-run-all": "^4.1.3",
    "nyc": "^13.1.0",
    "semantic-release": "^15.10.3",
    "sinon-chai": "^3.2.0",
    "standard": "^12.0.1",
    "standard-markdown": "^5.0.1",
    "webpack": "^4.21.0",
    "webpack-bundle-analyzer": "^3.0.3",
    "webpack-cli": "^3.1.2"
  },
  "directories": {
    "test": "test"
  },
  "files": [
    "lib",
    "with-defaults.js"
  ],
  "homepage": "https://github.com/octokit/endpoint.js#readme",
  "keywords": [
    "octokit",
    "github",
    "api",
    "rest"
  ],
  "license": "MIT",
  "main": "index.js",
  "name": "@octokit/endpoint",
  "publishConfig": {
    "access": "public",
    "tag": "latest"
  },
  "release": {
    "publish": [
      "@semantic-release/npm",
      {
        "path": "@semantic-release/github",
        "assets": [
          "dist/*",
          "!dist/*.map.gz"
        ]
      }
    ]
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/octokit/endpoint.js.git"
  },
  "scripts": {
    "build": "npm-run-all build:*",
    "build:development": "webpack --mode development --entry . --output-library=Octokit --output=./dist/octokit-endpoint.js --profile --json > dist/bundle-stats.json",
    "build:production": "webpack --mode production --entry . --plugin=compression-webpack-plugin --output-library=Octokit --output-path=./dist --output-filename=octokit-endpoint.min.js --devtool source-map",
    "bundle-report": "webpack-bundle-analyzer dist/bundle-stats.json --mode=static --no-open --report dist/bundle-report.html",
    "coverage": "nyc report --reporter=html && open coverage/index.html",
    "coverage:upload": "nyc report --reporter=text-lcov | coveralls",
    "prebuild": "mkdirp dist/",
    "pretest": "standard && standard-markdown *.md",
    "semantic-release": "semantic-release",
    "test": "nyc mocha test/*-test.js",
    "test:browser": "cypress run --browser chrome"
  },
  "standard": {
    "globals": [
      "describe",
      "before",
      "beforeEach",
      "afterEach",
      "after",
      "it",
      "expect"
    ]
  },
  "version": "3.1.1"
}

},{}],11:[function(require,module,exports){
module.exports = withDefaults

const endpointWithDefaults = require('./lib/endpoint-with-defaults')
const merge = require('./lib/merge')
const parse = require('./lib/parse')

function withDefaults (oldDefaults, newDefaults) {
  const DEFAULTS = merge(oldDefaults, newDefaults)
  return Object.assign(endpointWithDefaults.bind(null, DEFAULTS), {
    DEFAULTS,
    defaults: withDefaults.bind(null, DEFAULTS),
    merge: merge.bind(null, DEFAULTS),
    parse
  })
}

},{"./lib/endpoint-with-defaults":3,"./lib/merge":4,"./lib/parse":5}],12:[function(require,module,exports){
const request = require('@octokit/request')
const getUserAgent = require('universal-user-agent')

const version = require('./package.json').version
const userAgent = `octokit-graphql.js/${version} ${getUserAgent()}`

const withDefaults = require('./lib/with-defaults')

module.exports = withDefaults(request, {
  method: 'POST',
  url: '/graphql',
  headers: {
    'user-agent': userAgent
  }
})

},{"./lib/with-defaults":15,"./package.json":16,"@octokit/request":17,"universal-user-agent":28}],13:[function(require,module,exports){
module.exports = class GraphqlError extends Error {
  constructor (request, response) {
    const message = response.data.errors[0].message
    super(message)

    Object.assign(this, response.data)
    this.request = request

    // Maintains proper stack trace (only available on V8)
    /* istanbul ignore next */
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

},{}],14:[function(require,module,exports){
module.exports = graphql

const GraphqlError = require('./error')

const NON_VARIABLE_OPTIONS = ['method', 'baseUrl', 'url', 'headers', 'request', 'query']

function graphql (request, query, options) {
  const requestOptions = {
    variables: {}
  }

  if (typeof query === 'string') {
    options = Object.assign({ query }, options)
  } else {
    options = query
  }

  Object.keys(options).forEach(key => {
    if (NON_VARIABLE_OPTIONS.includes(key)) {
      requestOptions[key] = options[key]
      return
    }

    requestOptions.variables[key] = options[key]
  })

  return request(requestOptions)
    .then(response => {
      if (response.data.data) {
        return response.data
      }

      throw new GraphqlError(requestOptions, response)
    })
}

},{"./error":13}],15:[function(require,module,exports){
module.exports = withDefaults

const graphql = require('./graphql')

function withDefaults (request, newDefaults) {
  const newRequest = request.defaults(newDefaults)
  const newApi = function (query, options) {
    return graphql(newRequest, query, options)
  }

  newApi.defaults = withDefaults.bind(null, newRequest)
  return newApi
}

},{"./graphql":14}],16:[function(require,module,exports){
module.exports={
  "_from": "@octokit/graphql",
  "_id": "@octokit/graphql@1.0.0",
  "_inBundle": false,
  "_integrity": "sha512-FCBRZ7rBWPNcr5HTH6Hoanfz/kCeOeYY2E6kgkPzvlxII/zjEt00jq7JTohf/8m+jWcvdCpJUrsJZN8DZUBS7A==",
  "_location": "/@octokit/graphql",
  "_phantomChildren": {},
  "_requested": {
    "type": "tag",
    "registry": true,
    "raw": "@octokit/graphql",
    "name": "@octokit/graphql",
    "escapedName": "@octokit%2fgraphql",
    "scope": "@octokit",
    "rawSpec": "",
    "saveSpec": null,
    "fetchSpec": "latest"
  },
  "_requiredBy": [
    "#USER",
    "/"
  ],
  "_resolved": "https://registry.npmjs.org/@octokit/graphql/-/graphql-1.0.0.tgz",
  "_shasum": "6fe48d6ae3a7d2c1e81f632d6d3dc394d4933762",
  "_spec": "@octokit/graphql",
  "_where": "/Users/andymckay/sandboxes/github-utils",
  "author": {
    "name": "Gregor Martynus",
    "url": "https://github.com/gr2m"
  },
  "bugs": {
    "url": "https://github.com/octokit/graphql.js/issues"
  },
  "bundleDependencies": false,
  "bundlesize": [
    {
      "path": "./dist/octokit-graphql.min.js.gz",
      "maxSize": "5KB"
    }
  ],
  "dependencies": {
    "@octokit/request": "^2.1.2"
  },
  "deprecated": false,
  "description": "GitHub GraphQL API client for browsers and Node",
  "devDependencies": {
    "chai": "^4.2.0",
    "compression-webpack-plugin": "^2.0.0",
    "coveralls": "^3.0.2",
    "cypress": "^3.1.0",
    "fetch-mock": "^7.2.0",
    "mkdirp": "^0.5.1",
    "mocha": "^5.2.0",
    "npm-run-all": "^4.1.3",
    "nyc": "^13.1.0",
    "semantic-release": "^15.12.1",
    "simple-mock": "^0.8.0",
    "standard": "^12.0.1",
    "webpack": "^4.22.0",
    "webpack-bundle-analyzer": "^3.0.3",
    "webpack-cli": "^3.1.2"
  },
  "files": [
    "lib"
  ],
  "homepage": "https://github.com/octokit/graphql.js#readme",
  "keywords": [
    "octokit",
    "github",
    "api",
    "graphql"
  ],
  "license": "MIT",
  "main": "index.js",
  "name": "@octokit/graphql",
  "publishConfig": {
    "access": "public"
  },
  "release": {
    "publish": [
      "@semantic-release/npm",
      {
        "path": "@semantic-release/github",
        "assets": [
          "dist/*",
          "!dist/*.map.gz"
        ]
      }
    ]
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/octokit/graphql.js.git"
  },
  "scripts": {
    "build": "npm-run-all build:*",
    "build:development": "webpack --mode development --entry . --output-library=octokitGraphql --output=./dist/octokit-graphql.js --profile --json > dist/bundle-stats.json",
    "build:production": "webpack --mode production --entry . --plugin=compression-webpack-plugin --output-library=octokitGraphql --output-path=./dist --output-filename=octokit-graphql.min.js --devtool source-map",
    "bundle-report": "webpack-bundle-analyzer dist/bundle-stats.json --mode=static --no-open --report dist/bundle-report.html",
    "coverage": "nyc report --reporter=html && open coverage/index.html",
    "coverage:upload": "nyc report --reporter=text-lcov | coveralls",
    "prebuild": "mkdirp dist/",
    "pretest": "standard",
    "test": "nyc mocha test/*-test.js",
    "test:browser": "cypress run --browser chrome"
  },
  "standard": {
    "globals": [
      "describe",
      "before",
      "beforeEach",
      "afterEach",
      "after",
      "it",
      "expect"
    ]
  },
  "version": "1.0.0"
}

},{}],17:[function(require,module,exports){
const endpoint = require('@octokit/endpoint')
const getUserAgent = require('universal-user-agent')

const version = require('./package.json').version
const userAgent = `octokit-request.js/${version} ${getUserAgent()}`
const withDefaults = require('./lib/with-defaults')

module.exports = withDefaults(endpoint, {
  headers: {
    'user-agent': userAgent
  }
})

},{"./lib/with-defaults":22,"./package.json":23,"@octokit/endpoint":1,"universal-user-agent":28}],18:[function(require,module,exports){
// expose internally used `fetch` method for testing/mocking only
module.exports.fetch = require('node-fetch').default

},{"node-fetch":27}],19:[function(require,module,exports){
module.exports = getBufferResponse

function getBufferResponse (response) {
  return response.buffer()
}

},{}],20:[function(require,module,exports){
module.exports = class HttpError extends Error {
  constructor (message, statusCode, headers, request) {
    super(message)

    // Maintains proper stack trace (only available on V8)
    /* istanbul ignore next */
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }

    this.name = 'HttpError'
    this.status = statusCode
    Object.defineProperty(this, 'code', {
      get () {
        console.warn('`error.code` is deprecated, use `error.status`.')
        return statusCode
      }
    })
    this.headers = headers
    this.request = request
  }
}

},{}],21:[function(require,module,exports){
'use strict'

module.exports = request

const isPlainObject = require('is-plain-object')

const mockable = require('./fetch')
const getBuffer = require('./get-buffer-response')
const HttpError = require('./http-error')

function request (requestOptions) {
  if (isPlainObject(requestOptions.body) || Array.isArray(requestOptions.body)) {
    requestOptions.body = JSON.stringify(requestOptions.body)
  }

  let headers = {}
  let status

  return mockable.fetch(requestOptions.url, Object.assign({
    method: requestOptions.method,
    body: requestOptions.body,
    headers: requestOptions.headers,
    redirect: requestOptions.redirect
  }, requestOptions.request))

    .then(response => {
      status = response.status

      for (const keyAndValue of response.headers.entries()) {
        headers[keyAndValue[0]] = keyAndValue[1]
      }

      if (status === 204 || status === 205) {
        return
      }

      // GitHub API returns 200 for HEAD requsets
      if (requestOptions.method === 'HEAD') {
        if (status < 400) {
          return
        }

        throw new HttpError(response.statusText, status, headers, requestOptions)
      }

      if (status === 304) {
        requestOptions.url = response.headers.location
        throw new HttpError('Not modified', status, headers, requestOptions)
      }

      if (status >= 400) {
        return response.text()

          .then(message => {
            const error = new HttpError(message, status, headers, requestOptions)

            try {
              Object.assign(error, JSON.parse(error.message))
            } catch (e) {
              // ignore, see octokit/rest.js#684
            }

            throw error
          })
      }

      const contentType = response.headers.get('content-type')
      if (/application\/json/.test(contentType)) {
        return response.json()
      }

      if (!contentType || /^text\/|charset=utf-8$/.test(contentType)) {
        return response.text()
      }

      return getBuffer(response)
    })

    .then(data => {
      return {
        data,
        status,
        headers
      }
    })

    .catch(error => {
      if (error instanceof HttpError) {
        throw error
      }

      throw new HttpError(error.message, 500, headers, requestOptions)
    })
}

},{"./fetch":18,"./get-buffer-response":19,"./http-error":20,"is-plain-object":25}],22:[function(require,module,exports){
module.exports = withDefaults

const request = require('./request')

function withDefaults (oldEndpoint, newDefaults) {
  const endpoint = oldEndpoint.defaults(newDefaults)
  const newApi = function (route, options) {
    return request(endpoint(route, options))
  }

  newApi.endpoint = endpoint
  newApi.defaults = withDefaults.bind(null, endpoint)
  return newApi
}

},{"./request":21}],23:[function(require,module,exports){
module.exports={
  "_from": "@octokit/request@^2.1.2",
  "_id": "@octokit/request@2.2.0",
  "_inBundle": false,
  "_integrity": "sha512-4P9EbwKZ4xfyupVMb3KVuHmM+aO2fye3nufjGKz/qDssvdJj9Rlx44O0FdFvUp4kIzToy3AHLTOulEIDAL+dpg==",
  "_location": "/@octokit/request",
  "_phantomChildren": {},
  "_requested": {
    "type": "range",
    "registry": true,
    "raw": "@octokit/request@^2.1.2",
    "name": "@octokit/request",
    "escapedName": "@octokit%2frequest",
    "scope": "@octokit",
    "rawSpec": "^2.1.2",
    "saveSpec": null,
    "fetchSpec": "^2.1.2"
  },
  "_requiredBy": [
    "/@octokit/graphql"
  ],
  "_resolved": "https://registry.npmjs.org/@octokit/request/-/request-2.2.0.tgz",
  "_shasum": "f4b2d1ad7c4c8a0b148193610c912046961f8be5",
  "_spec": "@octokit/request@^2.1.2",
  "_where": "/Users/andymckay/sandboxes/github-utils/node_modules/@octokit/graphql",
  "author": {
    "name": "Gregor Martynus",
    "url": "https://github.com/gr2m"
  },
  "browser": {
    "./lib/get-request-agent.js": false,
    "./lib/request/get-buffer-response.js": "./lib/request/get-buffer-response-browser.js"
  },
  "bugs": {
    "url": "https://github.com/octokit/request.js/issues"
  },
  "bundleDependencies": false,
  "bundlesize": [
    {
      "path": "./dist/octokit-request.min.js.gz",
      "maxSize": "5KB"
    }
  ],
  "dependencies": {
    "@octokit/endpoint": "^3.0.0",
    "is-plain-object": "^2.0.4",
    "node-fetch": "^2.3.0",
    "universal-user-agent": "^2.0.1"
  },
  "deprecated": false,
  "description": "Send parameterized requests to GitHub’s APIs with sensible defaults in browsers and Node",
  "devDependencies": {
    "chai": "^4.2.0",
    "compression-webpack-plugin": "^2.0.0",
    "coveralls": "^3.0.2",
    "cypress": "^3.1.0",
    "fetch-mock": "^7.2.0",
    "mkdirp": "^0.5.1",
    "mocha": "^5.2.0",
    "npm-run-all": "^4.1.3",
    "nyc": "^13.1.0",
    "semantic-release": "^15.10.5",
    "simple-mock": "^0.8.0",
    "standard": "^12.0.1",
    "webpack": "^4.22.0",
    "webpack-bundle-analyzer": "^3.0.3",
    "webpack-cli": "^3.1.2"
  },
  "files": [
    "lib"
  ],
  "homepage": "https://github.com/octokit/request.js#readme",
  "keywords": [
    "octokit",
    "github",
    "api",
    "request"
  ],
  "license": "MIT",
  "main": "index.js",
  "name": "@octokit/request",
  "publishConfig": {
    "access": "public"
  },
  "release": {
    "publish": [
      "@semantic-release/npm",
      {
        "path": "@semantic-release/github",
        "assets": [
          "dist/*",
          "!dist/*.map.gz"
        ]
      }
    ]
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/octokit/request.js.git"
  },
  "scripts": {
    "build": "npm-run-all build:*",
    "build:development": "webpack --mode development --entry . --output-library=Octokit --output=./dist/octokit-request.js --profile --json > dist/bundle-stats.json",
    "build:production": "webpack --mode production --entry . --plugin=compression-webpack-plugin --output-library=Octokit --output-path=./dist --output-filename=octokit-request.min.js --devtool source-map",
    "bundle-report": "webpack-bundle-analyzer dist/bundle-stats.json --mode=static --no-open --report dist/bundle-report.html",
    "coverage": "nyc report --reporter=html && open coverage/index.html",
    "coverage:upload": "nyc report --reporter=text-lcov | coveralls",
    "prebuild": "mkdirp dist/",
    "pretest": "standard",
    "semantic-release": "semantic-release",
    "test": "nyc mocha test/*-test.js",
    "test:browser": "cypress run --browser chrome"
  },
  "standard": {
    "globals": [
      "describe",
      "before",
      "beforeEach",
      "afterEach",
      "after",
      "it",
      "expect"
    ]
  },
  "version": "2.2.0"
}

},{}],24:[function(require,module,exports){
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.deepmerge = factory());
}(this, (function () { 'use strict';

var isMergeableObject = function isMergeableObject(value) {
	return isNonNullObject(value)
		&& !isSpecial(value)
};

function isNonNullObject(value) {
	return !!value && typeof value === 'object'
}

function isSpecial(value) {
	var stringValue = Object.prototype.toString.call(value);

	return stringValue === '[object RegExp]'
		|| stringValue === '[object Date]'
		|| isReactElement(value)
}

// see https://github.com/facebook/react/blob/b5ac963fb791d1298e7f396236383bc955f916c1/src/isomorphic/classic/element/ReactElement.js#L21-L25
var canUseSymbol = typeof Symbol === 'function' && Symbol.for;
var REACT_ELEMENT_TYPE = canUseSymbol ? Symbol.for('react.element') : 0xeac7;

function isReactElement(value) {
	return value.$$typeof === REACT_ELEMENT_TYPE
}

function emptyTarget(val) {
	return Array.isArray(val) ? [] : {}
}

function cloneUnlessOtherwiseSpecified(value, options) {
	return (options.clone !== false && options.isMergeableObject(value))
		? deepmerge(emptyTarget(value), value, options)
		: value
}

function defaultArrayMerge(target, source, options) {
	return target.concat(source).map(function(element) {
		return cloneUnlessOtherwiseSpecified(element, options)
	})
}

function mergeObject(target, source, options) {
	var destination = {};
	if (options.isMergeableObject(target)) {
		Object.keys(target).forEach(function(key) {
			destination[key] = cloneUnlessOtherwiseSpecified(target[key], options);
		});
	}
	Object.keys(source).forEach(function(key) {
		if (!options.isMergeableObject(source[key]) || !target[key]) {
			destination[key] = cloneUnlessOtherwiseSpecified(source[key], options);
		} else {
			destination[key] = deepmerge(target[key], source[key], options);
		}
	});
	return destination
}

function deepmerge(target, source, options) {
	options = options || {};
	options.arrayMerge = options.arrayMerge || defaultArrayMerge;
	options.isMergeableObject = options.isMergeableObject || isMergeableObject;

	var sourceIsArray = Array.isArray(source);
	var targetIsArray = Array.isArray(target);
	var sourceAndTargetTypesMatch = sourceIsArray === targetIsArray;

	if (!sourceAndTargetTypesMatch) {
		return cloneUnlessOtherwiseSpecified(source, options)
	} else if (sourceIsArray) {
		return options.arrayMerge(target, source, options)
	} else {
		return mergeObject(target, source, options)
	}
}

deepmerge.all = function deepmergeAll(array, options) {
	if (!Array.isArray(array)) {
		throw new Error('first argument should be an array')
	}

	return array.reduce(function(prev, next) {
		return deepmerge(prev, next, options)
	}, {})
};

var deepmerge_1 = deepmerge;

return deepmerge_1;

})));

},{}],25:[function(require,module,exports){
/*!
 * is-plain-object <https://github.com/jonschlinkert/is-plain-object>
 *
 * Copyright (c) 2014-2017, Jon Schlinkert.
 * Released under the MIT License.
 */

'use strict';

var isObject = require('isobject');

function isObjectObject(o) {
  return isObject(o) === true
    && Object.prototype.toString.call(o) === '[object Object]';
}

module.exports = function isPlainObject(o) {
  var ctor,prot;

  if (isObjectObject(o) === false) return false;

  // If has modified constructor
  ctor = o.constructor;
  if (typeof ctor !== 'function') return false;

  // If has modified prototype
  prot = ctor.prototype;
  if (isObjectObject(prot) === false) return false;

  // If constructor does not have an Object-specific method
  if (prot.hasOwnProperty('isPrototypeOf') === false) {
    return false;
  }

  // Most likely a plain Object
  return true;
};

},{"isobject":26}],26:[function(require,module,exports){
/*!
 * isobject <https://github.com/jonschlinkert/isobject>
 *
 * Copyright (c) 2014-2017, Jon Schlinkert.
 * Released under the MIT License.
 */

'use strict';

module.exports = function isObject(val) {
  return val != null && typeof val === 'object' && Array.isArray(val) === false;
};

},{}],27:[function(require,module,exports){
"use strict";

// ref: https://github.com/tc39/proposal-global
var getGlobal = function () {
	// the only reliable means to get the global object is
	// `Function('return this')()`
	// However, this causes CSP violations in Chrome apps.
	if (typeof self !== 'undefined') { return self; }
	if (typeof window !== 'undefined') { return window; }
	if (typeof global !== 'undefined') { return global; }
	throw new Error('unable to locate global object');
}

var global = getGlobal();

module.exports = exports = global.fetch;

// Needed for TypeScript and Webpack.
exports.default = global.fetch.bind(global);

exports.Headers = global.Headers;
exports.Request = global.Request;
exports.Response = global.Response;
},{}],28:[function(require,module,exports){
module.exports = getUserAgentBrowser

function getUserAgentBrowser () {
  /* global navigator */
  return navigator.userAgent
}

},{}],29:[function(require,module,exports){
(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else {
        root.urltemplate = factory();
    }
}(this, function () {
  /**
   * @constructor
   */
  function UrlTemplate() {
  }

  /**
   * @private
   * @param {string} str
   * @return {string}
   */
  UrlTemplate.prototype.encodeReserved = function (str) {
    return str.split(/(%[0-9A-Fa-f]{2})/g).map(function (part) {
      if (!/%[0-9A-Fa-f]/.test(part)) {
        part = encodeURI(part).replace(/%5B/g, '[').replace(/%5D/g, ']');
      }
      return part;
    }).join('');
  };

  /**
   * @private
   * @param {string} str
   * @return {string}
   */
  UrlTemplate.prototype.encodeUnreserved = function (str) {
    return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
      return '%' + c.charCodeAt(0).toString(16).toUpperCase();
    });
  }

  /**
   * @private
   * @param {string} operator
   * @param {string} value
   * @param {string} key
   * @return {string}
   */
  UrlTemplate.prototype.encodeValue = function (operator, value, key) {
    value = (operator === '+' || operator === '#') ? this.encodeReserved(value) : this.encodeUnreserved(value);

    if (key) {
      return this.encodeUnreserved(key) + '=' + value;
    } else {
      return value;
    }
  };

  /**
   * @private
   * @param {*} value
   * @return {boolean}
   */
  UrlTemplate.prototype.isDefined = function (value) {
    return value !== undefined && value !== null;
  };

  /**
   * @private
   * @param {string}
   * @return {boolean}
   */
  UrlTemplate.prototype.isKeyOperator = function (operator) {
    return operator === ';' || operator === '&' || operator === '?';
  };

  /**
   * @private
   * @param {Object} context
   * @param {string} operator
   * @param {string} key
   * @param {string} modifier
   */
  UrlTemplate.prototype.getValues = function (context, operator, key, modifier) {
    var value = context[key],
        result = [];

    if (this.isDefined(value) && value !== '') {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        value = value.toString();

        if (modifier && modifier !== '*') {
          value = value.substring(0, parseInt(modifier, 10));
        }

        result.push(this.encodeValue(operator, value, this.isKeyOperator(operator) ? key : null));
      } else {
        if (modifier === '*') {
          if (Array.isArray(value)) {
            value.filter(this.isDefined).forEach(function (value) {
              result.push(this.encodeValue(operator, value, this.isKeyOperator(operator) ? key : null));
            }, this);
          } else {
            Object.keys(value).forEach(function (k) {
              if (this.isDefined(value[k])) {
                result.push(this.encodeValue(operator, value[k], k));
              }
            }, this);
          }
        } else {
          var tmp = [];

          if (Array.isArray(value)) {
            value.filter(this.isDefined).forEach(function (value) {
              tmp.push(this.encodeValue(operator, value));
            }, this);
          } else {
            Object.keys(value).forEach(function (k) {
              if (this.isDefined(value[k])) {
                tmp.push(this.encodeUnreserved(k));
                tmp.push(this.encodeValue(operator, value[k].toString()));
              }
            }, this);
          }

          if (this.isKeyOperator(operator)) {
            result.push(this.encodeUnreserved(key) + '=' + tmp.join(','));
          } else if (tmp.length !== 0) {
            result.push(tmp.join(','));
          }
        }
      }
    } else {
      if (operator === ';') {
        if (this.isDefined(value)) {
          result.push(this.encodeUnreserved(key));
        }
      } else if (value === '' && (operator === '&' || operator === '?')) {
        result.push(this.encodeUnreserved(key) + '=');
      } else if (value === '') {
        result.push('');
      }
    }
    return result;
  };

  /**
   * @param {string} template
   * @return {function(Object):string}
   */
  UrlTemplate.prototype.parse = function (template) {
    var that = this;
    var operators = ['+', '#', '.', '/', ';', '?', '&'];

    return {
      expand: function (context) {
        return template.replace(/\{([^\{\}]+)\}|([^\{\}]+)/g, function (_, expression, literal) {
          if (expression) {
            var operator = null,
                values = [];

            if (operators.indexOf(expression.charAt(0)) !== -1) {
              operator = expression.charAt(0);
              expression = expression.substr(1);
            }

            expression.split(/,/g).forEach(function (variable) {
              var tmp = /([^:\*]*)(?::(\d+)|(\*))?/.exec(variable);
              values.push.apply(values, that.getValues(context, operator, tmp[1], tmp[2] || tmp[3]));
            });

            if (operator && operator !== '+') {
              var separator = ',';

              if (operator === '?') {
                separator = '&';
              } else if (operator !== '#') {
                separator = operator;
              }
              return (values.length !== 0 ? operator : '') + values.join(separator);
            } else {
              return values.join(',');
            }
          } else {
            return that.encodeReserved(literal);
          }
        });
      }
    };
  };

  return new UrlTemplate();
}));

},{}],30:[function(require,module,exports){
var octokitGraphql =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./index.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./index.js":
/*!******************!*\
  !*** ./index.js ***!
  \******************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("const request = __webpack_require__(/*! @octokit/request */ \"./node_modules/@octokit/request/index.js\")\nconst getUserAgent = __webpack_require__(/*! universal-user-agent */ \"./node_modules/universal-user-agent/browser.js\")\n\nconst version = __webpack_require__(/*! ./package.json */ \"./package.json\").version\nconst userAgent = `octokit-graphql.js/${version} ${getUserAgent()}`\n\nconst withDefaults = __webpack_require__(/*! ./lib/with-defaults */ \"./lib/with-defaults.js\")\n\nmodule.exports = withDefaults(request, {\n  method: 'POST',\n  url: '/graphql',\n  headers: {\n    'user-agent': userAgent\n  }\n})\n\n\n//# sourceURL=webpack://octokitGraphql/./index.js?");

/***/ }),

/***/ "./lib/error.js":
/*!**********************!*\
  !*** ./lib/error.js ***!
  \**********************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = class GraphqlError extends Error {\n  constructor (request, response) {\n    const message = response.data.errors[0].message\n    super(message)\n\n    Object.assign(this, response.data)\n    this.request = request\n\n    // Maintains proper stack trace (only available on V8)\n    /* istanbul ignore next */\n    if (Error.captureStackTrace) {\n      Error.captureStackTrace(this, this.constructor)\n    }\n  }\n}\n\n\n//# sourceURL=webpack://octokitGraphql/./lib/error.js?");

/***/ }),

/***/ "./lib/graphql.js":
/*!************************!*\
  !*** ./lib/graphql.js ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("module.exports = graphql\n\nconst GraphqlError = __webpack_require__(/*! ./error */ \"./lib/error.js\")\n\nconst NON_VARIABLE_OPTIONS = ['method', 'baseUrl', 'url', 'headers', 'request', 'query']\n\nfunction graphql (request, query, options) {\n  const requestOptions = {\n    variables: {}\n  }\n\n  if (typeof query === 'string') {\n    options = Object.assign({ query }, options)\n  } else {\n    options = query\n  }\n\n  Object.keys(options).forEach(key => {\n    if (NON_VARIABLE_OPTIONS.includes(key)) {\n      requestOptions[key] = options[key]\n      return\n    }\n\n    requestOptions.variables[key] = options[key]\n  })\n\n  return request(requestOptions)\n    .then(response => {\n      if (response.data.data) {\n        return response.data\n      }\n\n      throw new GraphqlError(requestOptions, response)\n    })\n}\n\n\n//# sourceURL=webpack://octokitGraphql/./lib/graphql.js?");

/***/ }),

/***/ "./lib/with-defaults.js":
/*!******************************!*\
  !*** ./lib/with-defaults.js ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("module.exports = withDefaults\n\nconst graphql = __webpack_require__(/*! ./graphql */ \"./lib/graphql.js\")\n\nfunction withDefaults (request, newDefaults) {\n  const newRequest = request.defaults(newDefaults)\n  const newApi = function (query, options) {\n    return graphql(newRequest, query, options)\n  }\n\n  newApi.defaults = withDefaults.bind(null, newRequest)\n  return newApi\n}\n\n\n//# sourceURL=webpack://octokitGraphql/./lib/with-defaults.js?");

/***/ }),

/***/ "./node_modules/@octokit/endpoint/index.js":
/*!*************************************************!*\
  !*** ./node_modules/@octokit/endpoint/index.js ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("const withDefaults = __webpack_require__(/*! ./with-defaults */ \"./node_modules/@octokit/endpoint/with-defaults.js\")\nconst DEFAULTS = __webpack_require__(/*! ./lib/defaults */ \"./node_modules/@octokit/endpoint/lib/defaults.js\")\n\nmodule.exports = withDefaults(null, DEFAULTS)\n\n\n//# sourceURL=webpack://octokitGraphql/./node_modules/@octokit/endpoint/index.js?");

/***/ }),

/***/ "./node_modules/@octokit/endpoint/lib/defaults.js":
/*!********************************************************!*\
  !*** ./node_modules/@octokit/endpoint/lib/defaults.js ***!
  \********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("const getUserAgent = __webpack_require__(/*! universal-user-agent */ \"./node_modules/universal-user-agent/browser.js\")\n\nconst version = __webpack_require__(/*! ../package.json */ \"./node_modules/@octokit/endpoint/package.json\").version\nconst userAgent = `octokit-endpoint.js/${version} ${getUserAgent()}`\n\nmodule.exports = {\n  method: 'GET',\n  baseUrl: 'https://api.github.com',\n  headers: {\n    accept: 'application/vnd.github.v3+json',\n    'user-agent': userAgent\n  }\n}\n\n\n//# sourceURL=webpack://octokitGraphql/./node_modules/@octokit/endpoint/lib/defaults.js?");

/***/ }),

/***/ "./node_modules/@octokit/endpoint/lib/endpoint-with-defaults.js":
/*!**********************************************************************!*\
  !*** ./node_modules/@octokit/endpoint/lib/endpoint-with-defaults.js ***!
  \**********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("module.exports = endpointWithDefaults\n\nconst merge = __webpack_require__(/*! ./merge */ \"./node_modules/@octokit/endpoint/lib/merge.js\")\nconst parse = __webpack_require__(/*! ./parse */ \"./node_modules/@octokit/endpoint/lib/parse.js\")\n\nfunction endpointWithDefaults (defaults, route, options) {\n  return parse(merge(defaults, route, options))\n}\n\n\n//# sourceURL=webpack://octokitGraphql/./node_modules/@octokit/endpoint/lib/endpoint-with-defaults.js?");

/***/ }),

/***/ "./node_modules/@octokit/endpoint/lib/merge.js":
/*!*****************************************************!*\
  !*** ./node_modules/@octokit/endpoint/lib/merge.js ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("module.exports = defaultOptions\n\nconst merge = __webpack_require__(/*! deepmerge */ \"./node_modules/deepmerge/dist/umd.js\")\nconst isPlainObject = __webpack_require__(/*! is-plain-object */ \"./node_modules/is-plain-object/index.js\")\n\nconst lowercaseKeys = __webpack_require__(/*! ./util/lowercase-keys */ \"./node_modules/@octokit/endpoint/lib/util/lowercase-keys.js\")\n\nfunction defaultOptions (defaults, route, options) {\n  if (typeof route === 'string') {\n    let [method, url] = route.split(' ')\n    options = Object.assign(url ? { method, url } : { url: method }, options)\n  } else {\n    options = route || {}\n  }\n\n  // lowercase header names before merging with defaults to avoid duplicates\n  options.headers = lowercaseKeys(options.headers)\n\n  options = merge.all([defaults, options].filter(Boolean), { isMergeableObject: isPlainObject })\n\n  return options\n}\n\n\n//# sourceURL=webpack://octokitGraphql/./node_modules/@octokit/endpoint/lib/merge.js?");

/***/ }),

/***/ "./node_modules/@octokit/endpoint/lib/parse.js":
/*!*****************************************************!*\
  !*** ./node_modules/@octokit/endpoint/lib/parse.js ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("module.exports = toRequestOptions\n\nconst urlTemplate = __webpack_require__(/*! url-template */ \"./node_modules/url-template/lib/url-template.js\")\nconst addQueryParameters = __webpack_require__(/*! ./util/add-query-parameters */ \"./node_modules/@octokit/endpoint/lib/util/add-query-parameters.js\")\nconst extractUrlVariableNames = __webpack_require__(/*! ./util/extract-url-variable-names */ \"./node_modules/@octokit/endpoint/lib/util/extract-url-variable-names.js\")\nconst omit = __webpack_require__(/*! ./util/omit */ \"./node_modules/@octokit/endpoint/lib/util/omit.js\")\n\nfunction toRequestOptions (options) {\n  // https://fetch.spec.whatwg.org/#methods\n  let method = options.method.toUpperCase()\n\n  // replace :varname with {varname} to make it RFC 6570 compatible\n  let url = options.url.replace(/:([a-z]\\w+)/g, '{+$1}')\n  let headers = options.headers\n  let body\n  let parameters = omit(options, ['method', 'baseUrl', 'url', 'headers', 'request'])\n\n  // extract variable names from URL to calculate remaining variables later\n  const urlVariableNames = extractUrlVariableNames(url)\n\n  url = urlTemplate.parse(url).expand(parameters)\n\n  if (!/^http/.test(url)) {\n    url = options.baseUrl + url\n  }\n\n  const omittedParameters = Object.keys(options).filter((option) => urlVariableNames.includes(option)).concat('baseUrl')\n  const remainingParameters = omit(parameters, omittedParameters)\n\n  // for GET/HEAD requests, set URL query parameters from remaining parameters\n  // for PATCH/POST/PUT/DELETE requests, set request body from remaining parameters\n  if (['GET', 'HEAD'].includes(method)) {\n    url = addQueryParameters(url, remainingParameters)\n  } else {\n    if ('data' in remainingParameters) {\n      body = remainingParameters.data\n    } else {\n      if (Object.keys(remainingParameters).length) {\n        body = remainingParameters\n      } else {\n        headers['content-length'] = 0\n      }\n    }\n  }\n\n  // default content-type for JSON if body is set\n  if (!headers['content-type'] && typeof body !== 'undefined') {\n    headers['content-type'] = 'application/json; charset=utf-8'\n  }\n\n  // GitHub expects \"content-length: 0\" header for PUT/PATCH requests without body.\n  // fetch does not allow to set `content-length` header, but we can set body to an empty string\n  if (['PATCH', 'PUT'].includes(method) && typeof body === 'undefined') {\n    body = ''\n  }\n\n  // Only return body/request keys if present\n  return Object.assign(\n    { method: method, url, headers },\n    typeof body !== 'undefined' ? { body } : null,\n    options.request ? { request: options.request } : null\n  )\n}\n\n\n//# sourceURL=webpack://octokitGraphql/./node_modules/@octokit/endpoint/lib/parse.js?");

/***/ }),

/***/ "./node_modules/@octokit/endpoint/lib/util/add-query-parameters.js":
/*!*************************************************************************!*\
  !*** ./node_modules/@octokit/endpoint/lib/util/add-query-parameters.js ***!
  \*************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = addQueryParameters\n\nfunction addQueryParameters (url, parameters) {\n  const separator = /\\?/.test(url) ? '&' : '?'\n  const names = Object.keys(parameters)\n\n  if (names.length === 0) {\n    return url\n  }\n\n  return url + separator + names\n    .map(name => {\n      if (name === 'q') {\n        return 'q=' + parameters.q.split('+')\n          .map(encodeURIComponent)\n          .join('+')\n      }\n\n      return `${name}=${encodeURIComponent(parameters[name])}`\n    })\n    .join('&')\n}\n\n\n//# sourceURL=webpack://octokitGraphql/./node_modules/@octokit/endpoint/lib/util/add-query-parameters.js?");

/***/ }),

/***/ "./node_modules/@octokit/endpoint/lib/util/extract-url-variable-names.js":
/*!*******************************************************************************!*\
  !*** ./node_modules/@octokit/endpoint/lib/util/extract-url-variable-names.js ***!
  \*******************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = extractUrlVariableName\n\nconst urlVariableRegex = /\\{[^}]+\\}/g\nfunction extractUrlVariableName (url) {\n  const matches = url.match(urlVariableRegex)\n\n  if (!matches) {\n    return []\n  }\n\n  return matches.map(removeNonChars).reduce((a, b) => a.concat(b), [])\n}\n\nfunction removeNonChars (variableName) {\n  return variableName.replace(/^\\W+|\\W+$/g, '').split(/,/)\n}\n\n\n//# sourceURL=webpack://octokitGraphql/./node_modules/@octokit/endpoint/lib/util/extract-url-variable-names.js?");

/***/ }),

/***/ "./node_modules/@octokit/endpoint/lib/util/lowercase-keys.js":
/*!*******************************************************************!*\
  !*** ./node_modules/@octokit/endpoint/lib/util/lowercase-keys.js ***!
  \*******************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = lowercaseKeys\n\nfunction lowercaseKeys (object) {\n  if (!object) {\n    return {}\n  }\n\n  return Object.keys(object).reduce((newObj, key) => {\n    newObj[key.toLowerCase()] = object[key]\n    return newObj\n  }, {})\n}\n\n\n//# sourceURL=webpack://octokitGraphql/./node_modules/@octokit/endpoint/lib/util/lowercase-keys.js?");

/***/ }),

/***/ "./node_modules/@octokit/endpoint/lib/util/omit.js":
/*!*********************************************************!*\
  !*** ./node_modules/@octokit/endpoint/lib/util/omit.js ***!
  \*********************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = omit\n\nfunction omit (object, keysToOmit) {\n  return Object.keys(object)\n    .filter((option) => !keysToOmit.includes(option))\n    .reduce((obj, key) => {\n      obj[key] = object[key]\n      return obj\n    }, {})\n}\n\n\n//# sourceURL=webpack://octokitGraphql/./node_modules/@octokit/endpoint/lib/util/omit.js?");

/***/ }),

/***/ "./node_modules/@octokit/endpoint/package.json":
/*!*****************************************************!*\
  !*** ./node_modules/@octokit/endpoint/package.json ***!
  \*****************************************************/
/*! exports provided: _from, _id, _inBundle, _integrity, _location, _phantomChildren, _requested, _requiredBy, _resolved, _shasum, _spec, _where, author, bugs, bundleDependencies, bundlesize, dependencies, deprecated, description, devDependencies, directories, files, homepage, keywords, license, main, name, publishConfig, release, repository, scripts, standard, version, default */
/***/ (function(module) {

eval("module.exports = {\"_from\":\"@octokit/endpoint@^3.0.0\",\"_id\":\"@octokit/endpoint@3.1.1\",\"_inBundle\":false,\"_integrity\":\"sha512-KPkoTvKwCTetu/UqonLs1pfwFO5HAqTv/Ksp9y4NAg//ZgUCpvJsT4Hrst85uEzJvkB8+LxKyR4Bfv2X8O4cmQ==\",\"_location\":\"/@octokit/endpoint\",\"_phantomChildren\":{},\"_requested\":{\"type\":\"range\",\"registry\":true,\"raw\":\"@octokit/endpoint@^3.0.0\",\"name\":\"@octokit/endpoint\",\"escapedName\":\"@octokit%2fendpoint\",\"scope\":\"@octokit\",\"rawSpec\":\"^3.0.0\",\"saveSpec\":null,\"fetchSpec\":\"^3.0.0\"},\"_requiredBy\":[\"/@octokit/request\"],\"_resolved\":\"https://registry.npmjs.org/@octokit/endpoint/-/endpoint-3.1.1.tgz\",\"_shasum\":\"ede9afefaa4d6b7584169e12346425c6fbb45cc3\",\"_spec\":\"@octokit/endpoint@^3.0.0\",\"_where\":\"/Users/andymckay/sandboxes/graphql.js/node_modules/@octokit/request\",\"author\":{\"name\":\"Gregor Martynus\",\"url\":\"https://github.com/gr2m\"},\"bugs\":{\"url\":\"https://github.com/octokit/endpoint.js/issues\"},\"bundleDependencies\":false,\"bundlesize\":[{\"path\":\"./dist/octokit-endpoint.min.js.gz\",\"maxSize\":\"3KB\"}],\"dependencies\":{\"deepmerge\":\"3.0.0\",\"is-plain-object\":\"^2.0.4\",\"universal-user-agent\":\"^2.0.1\",\"url-template\":\"^2.0.8\"},\"deprecated\":false,\"description\":\"Turns REST API endpoints into generic request options\",\"devDependencies\":{\"chai\":\"^4.2.0\",\"compression-webpack-plugin\":\"^2.0.0\",\"coveralls\":\"^3.0.2\",\"cypress\":\"^3.1.0\",\"mkdirp\":\"^0.5.1\",\"mocha\":\"^5.2.0\",\"npm-run-all\":\"^4.1.3\",\"nyc\":\"^13.1.0\",\"semantic-release\":\"^15.10.3\",\"sinon-chai\":\"^3.2.0\",\"standard\":\"^12.0.1\",\"standard-markdown\":\"^5.0.1\",\"webpack\":\"^4.21.0\",\"webpack-bundle-analyzer\":\"^3.0.3\",\"webpack-cli\":\"^3.1.2\"},\"directories\":{\"test\":\"test\"},\"files\":[\"lib\",\"with-defaults.js\"],\"homepage\":\"https://github.com/octokit/endpoint.js#readme\",\"keywords\":[\"octokit\",\"github\",\"api\",\"rest\"],\"license\":\"MIT\",\"main\":\"index.js\",\"name\":\"@octokit/endpoint\",\"publishConfig\":{\"access\":\"public\",\"tag\":\"latest\"},\"release\":{\"publish\":[\"@semantic-release/npm\",{\"path\":\"@semantic-release/github\",\"assets\":[\"dist/*\",\"!dist/*.map.gz\"]}]},\"repository\":{\"type\":\"git\",\"url\":\"git+https://github.com/octokit/endpoint.js.git\"},\"scripts\":{\"build\":\"npm-run-all build:*\",\"build:development\":\"webpack --mode development --entry . --output-library=Octokit --output=./dist/octokit-endpoint.js --profile --json > dist/bundle-stats.json\",\"build:production\":\"webpack --mode production --entry . --plugin=compression-webpack-plugin --output-library=Octokit --output-path=./dist --output-filename=octokit-endpoint.min.js --devtool source-map\",\"bundle-report\":\"webpack-bundle-analyzer dist/bundle-stats.json --mode=static --no-open --report dist/bundle-report.html\",\"coverage\":\"nyc report --reporter=html && open coverage/index.html\",\"coverage:upload\":\"nyc report --reporter=text-lcov | coveralls\",\"prebuild\":\"mkdirp dist/\",\"pretest\":\"standard && standard-markdown *.md\",\"semantic-release\":\"semantic-release\",\"test\":\"nyc mocha test/*-test.js\",\"test:browser\":\"cypress run --browser chrome\"},\"standard\":{\"globals\":[\"describe\",\"before\",\"beforeEach\",\"afterEach\",\"after\",\"it\",\"expect\"]},\"version\":\"3.1.1\"};\n\n//# sourceURL=webpack://octokitGraphql/./node_modules/@octokit/endpoint/package.json?");

/***/ }),

/***/ "./node_modules/@octokit/endpoint/with-defaults.js":
/*!*********************************************************!*\
  !*** ./node_modules/@octokit/endpoint/with-defaults.js ***!
  \*********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("module.exports = withDefaults\n\nconst endpointWithDefaults = __webpack_require__(/*! ./lib/endpoint-with-defaults */ \"./node_modules/@octokit/endpoint/lib/endpoint-with-defaults.js\")\nconst merge = __webpack_require__(/*! ./lib/merge */ \"./node_modules/@octokit/endpoint/lib/merge.js\")\nconst parse = __webpack_require__(/*! ./lib/parse */ \"./node_modules/@octokit/endpoint/lib/parse.js\")\n\nfunction withDefaults (oldDefaults, newDefaults) {\n  const DEFAULTS = merge(oldDefaults, newDefaults)\n  return Object.assign(endpointWithDefaults.bind(null, DEFAULTS), {\n    DEFAULTS,\n    defaults: withDefaults.bind(null, DEFAULTS),\n    merge: merge.bind(null, DEFAULTS),\n    parse\n  })\n}\n\n\n//# sourceURL=webpack://octokitGraphql/./node_modules/@octokit/endpoint/with-defaults.js?");

/***/ }),

/***/ "./node_modules/@octokit/request/index.js":
/*!************************************************!*\
  !*** ./node_modules/@octokit/request/index.js ***!
  \************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("const endpoint = __webpack_require__(/*! @octokit/endpoint */ \"./node_modules/@octokit/endpoint/index.js\")\nconst getUserAgent = __webpack_require__(/*! universal-user-agent */ \"./node_modules/universal-user-agent/browser.js\")\n\nconst version = __webpack_require__(/*! ./package.json */ \"./node_modules/@octokit/request/package.json\").version\nconst userAgent = `octokit-request.js/${version} ${getUserAgent()}`\nconst withDefaults = __webpack_require__(/*! ./lib/with-defaults */ \"./node_modules/@octokit/request/lib/with-defaults.js\")\n\nmodule.exports = withDefaults(endpoint, {\n  headers: {\n    'user-agent': userAgent\n  }\n})\n\n\n//# sourceURL=webpack://octokitGraphql/./node_modules/@octokit/request/index.js?");

/***/ }),

/***/ "./node_modules/@octokit/request/lib/fetch.js":
/*!****************************************************!*\
  !*** ./node_modules/@octokit/request/lib/fetch.js ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("// expose internally used `fetch` method for testing/mocking only\nmodule.exports.fetch = __webpack_require__(/*! node-fetch */ \"./node_modules/node-fetch/browser.js\").default\n\n\n//# sourceURL=webpack://octokitGraphql/./node_modules/@octokit/request/lib/fetch.js?");

/***/ }),

/***/ "./node_modules/@octokit/request/lib/get-buffer-response.js":
/*!******************************************************************!*\
  !*** ./node_modules/@octokit/request/lib/get-buffer-response.js ***!
  \******************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = getBufferResponse\n\nfunction getBufferResponse (response) {\n  return response.buffer()\n}\n\n\n//# sourceURL=webpack://octokitGraphql/./node_modules/@octokit/request/lib/get-buffer-response.js?");

/***/ }),

/***/ "./node_modules/@octokit/request/lib/http-error.js":
/*!*********************************************************!*\
  !*** ./node_modules/@octokit/request/lib/http-error.js ***!
  \*********************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = class HttpError extends Error {\n  constructor (message, statusCode, headers, request) {\n    super(message)\n\n    // Maintains proper stack trace (only available on V8)\n    /* istanbul ignore next */\n    if (Error.captureStackTrace) {\n      Error.captureStackTrace(this, this.constructor)\n    }\n\n    this.name = 'HttpError'\n    this.status = statusCode\n    Object.defineProperty(this, 'code', {\n      get () {\n        console.warn('`error.code` is deprecated, use `error.status`.')\n        return statusCode\n      }\n    })\n    this.headers = headers\n    this.request = request\n  }\n}\n\n\n//# sourceURL=webpack://octokitGraphql/./node_modules/@octokit/request/lib/http-error.js?");

/***/ }),

/***/ "./node_modules/@octokit/request/lib/request.js":
/*!******************************************************!*\
  !*** ./node_modules/@octokit/request/lib/request.js ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nmodule.exports = request\n\nconst isPlainObject = __webpack_require__(/*! is-plain-object */ \"./node_modules/is-plain-object/index.js\")\n\nconst mockable = __webpack_require__(/*! ./fetch */ \"./node_modules/@octokit/request/lib/fetch.js\")\nconst getBuffer = __webpack_require__(/*! ./get-buffer-response */ \"./node_modules/@octokit/request/lib/get-buffer-response.js\")\nconst HttpError = __webpack_require__(/*! ./http-error */ \"./node_modules/@octokit/request/lib/http-error.js\")\n\nfunction request (requestOptions) {\n  if (isPlainObject(requestOptions.body) || Array.isArray(requestOptions.body)) {\n    requestOptions.body = JSON.stringify(requestOptions.body)\n  }\n\n  let headers = {}\n  let status\n\n  return mockable.fetch(requestOptions.url, Object.assign({\n    method: requestOptions.method,\n    body: requestOptions.body,\n    headers: requestOptions.headers,\n    redirect: requestOptions.redirect\n  }, requestOptions.request))\n\n    .then(response => {\n      status = response.status\n\n      for (const keyAndValue of response.headers.entries()) {\n        headers[keyAndValue[0]] = keyAndValue[1]\n      }\n\n      if (status === 204 || status === 205) {\n        return\n      }\n\n      // GitHub API returns 200 for HEAD requsets\n      if (requestOptions.method === 'HEAD') {\n        if (status < 400) {\n          return\n        }\n\n        throw new HttpError(response.statusText, status, headers, requestOptions)\n      }\n\n      if (status === 304) {\n        requestOptions.url = response.headers.location\n        throw new HttpError('Not modified', status, headers, requestOptions)\n      }\n\n      if (status >= 400) {\n        return response.text()\n\n          .then(message => {\n            const error = new HttpError(message, status, headers, requestOptions)\n\n            try {\n              Object.assign(error, JSON.parse(error.message))\n            } catch (e) {\n              // ignore, see octokit/rest.js#684\n            }\n\n            throw error\n          })\n      }\n\n      const contentType = response.headers.get('content-type')\n      if (/application\\/json/.test(contentType)) {\n        return response.json()\n      }\n\n      if (!contentType || /^text\\/|charset=utf-8$/.test(contentType)) {\n        return response.text()\n      }\n\n      return getBuffer(response)\n    })\n\n    .then(data => {\n      return {\n        data,\n        status,\n        headers\n      }\n    })\n\n    .catch(error => {\n      if (error instanceof HttpError) {\n        throw error\n      }\n\n      throw new HttpError(error.message, 500, headers, requestOptions)\n    })\n}\n\n\n//# sourceURL=webpack://octokitGraphql/./node_modules/@octokit/request/lib/request.js?");

/***/ }),

/***/ "./node_modules/@octokit/request/lib/with-defaults.js":
/*!************************************************************!*\
  !*** ./node_modules/@octokit/request/lib/with-defaults.js ***!
  \************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("module.exports = withDefaults\n\nconst request = __webpack_require__(/*! ./request */ \"./node_modules/@octokit/request/lib/request.js\")\n\nfunction withDefaults (oldEndpoint, newDefaults) {\n  const endpoint = oldEndpoint.defaults(newDefaults)\n  const newApi = function (route, options) {\n    return request(endpoint(route, options))\n  }\n\n  newApi.endpoint = endpoint\n  newApi.defaults = withDefaults.bind(null, endpoint)\n  return newApi\n}\n\n\n//# sourceURL=webpack://octokitGraphql/./node_modules/@octokit/request/lib/with-defaults.js?");

/***/ }),

/***/ "./node_modules/@octokit/request/package.json":
/*!****************************************************!*\
  !*** ./node_modules/@octokit/request/package.json ***!
  \****************************************************/
/*! exports provided: _from, _id, _inBundle, _integrity, _location, _phantomChildren, _requested, _requiredBy, _resolved, _shasum, _spec, _where, author, browser, bugs, bundleDependencies, bundlesize, dependencies, deprecated, description, devDependencies, files, homepage, keywords, license, main, name, publishConfig, release, repository, scripts, standard, version, default */
/***/ (function(module) {

eval("module.exports = {\"_from\":\"@octokit/request@^2.2.0\",\"_id\":\"@octokit/request@2.2.0\",\"_inBundle\":false,\"_integrity\":\"sha512-4P9EbwKZ4xfyupVMb3KVuHmM+aO2fye3nufjGKz/qDssvdJj9Rlx44O0FdFvUp4kIzToy3AHLTOulEIDAL+dpg==\",\"_location\":\"/@octokit/request\",\"_phantomChildren\":{},\"_requested\":{\"type\":\"range\",\"registry\":true,\"raw\":\"@octokit/request@^2.2.0\",\"name\":\"@octokit/request\",\"escapedName\":\"@octokit%2frequest\",\"scope\":\"@octokit\",\"rawSpec\":\"^2.2.0\",\"saveSpec\":null,\"fetchSpec\":\"^2.2.0\"},\"_requiredBy\":[\"/\",\"/@octokit/rest\"],\"_resolved\":\"https://registry.npmjs.org/@octokit/request/-/request-2.2.0.tgz\",\"_shasum\":\"f4b2d1ad7c4c8a0b148193610c912046961f8be5\",\"_spec\":\"@octokit/request@^2.2.0\",\"_where\":\"/Users/andymckay/sandboxes/graphql.js\",\"author\":{\"name\":\"Gregor Martynus\",\"url\":\"https://github.com/gr2m\"},\"browser\":{\"./lib/get-request-agent.js\":false,\"./lib/request/get-buffer-response.js\":\"./lib/request/get-buffer-response-browser.js\"},\"bugs\":{\"url\":\"https://github.com/octokit/request.js/issues\"},\"bundleDependencies\":false,\"bundlesize\":[{\"path\":\"./dist/octokit-request.min.js.gz\",\"maxSize\":\"5KB\"}],\"dependencies\":{\"@octokit/endpoint\":\"^3.0.0\",\"is-plain-object\":\"^2.0.4\",\"node-fetch\":\"^2.3.0\",\"universal-user-agent\":\"^2.0.1\"},\"deprecated\":false,\"description\":\"Send parameterized requests to GitHub’s APIs with sensible defaults in browsers and Node\",\"devDependencies\":{\"chai\":\"^4.2.0\",\"compression-webpack-plugin\":\"^2.0.0\",\"coveralls\":\"^3.0.2\",\"cypress\":\"^3.1.0\",\"fetch-mock\":\"^7.2.0\",\"mkdirp\":\"^0.5.1\",\"mocha\":\"^5.2.0\",\"npm-run-all\":\"^4.1.3\",\"nyc\":\"^13.1.0\",\"semantic-release\":\"^15.10.5\",\"simple-mock\":\"^0.8.0\",\"standard\":\"^12.0.1\",\"webpack\":\"^4.22.0\",\"webpack-bundle-analyzer\":\"^3.0.3\",\"webpack-cli\":\"^3.1.2\"},\"files\":[\"lib\"],\"homepage\":\"https://github.com/octokit/request.js#readme\",\"keywords\":[\"octokit\",\"github\",\"api\",\"request\"],\"license\":\"MIT\",\"main\":\"index.js\",\"name\":\"@octokit/request\",\"publishConfig\":{\"access\":\"public\"},\"release\":{\"publish\":[\"@semantic-release/npm\",{\"path\":\"@semantic-release/github\",\"assets\":[\"dist/*\",\"!dist/*.map.gz\"]}]},\"repository\":{\"type\":\"git\",\"url\":\"git+https://github.com/octokit/request.js.git\"},\"scripts\":{\"build\":\"npm-run-all build:*\",\"build:development\":\"webpack --mode development --entry . --output-library=Octokit --output=./dist/octokit-request.js --profile --json > dist/bundle-stats.json\",\"build:production\":\"webpack --mode production --entry . --plugin=compression-webpack-plugin --output-library=Octokit --output-path=./dist --output-filename=octokit-request.min.js --devtool source-map\",\"bundle-report\":\"webpack-bundle-analyzer dist/bundle-stats.json --mode=static --no-open --report dist/bundle-report.html\",\"coverage\":\"nyc report --reporter=html && open coverage/index.html\",\"coverage:upload\":\"nyc report --reporter=text-lcov | coveralls\",\"prebuild\":\"mkdirp dist/\",\"pretest\":\"standard\",\"semantic-release\":\"semantic-release\",\"test\":\"nyc mocha test/*-test.js\",\"test:browser\":\"cypress run --browser chrome\"},\"standard\":{\"globals\":[\"describe\",\"before\",\"beforeEach\",\"afterEach\",\"after\",\"it\",\"expect\"]},\"version\":\"2.2.0\"};\n\n//# sourceURL=webpack://octokitGraphql/./node_modules/@octokit/request/package.json?");

/***/ }),

/***/ "./node_modules/deepmerge/dist/umd.js":
/*!********************************************!*\
  !*** ./node_modules/deepmerge/dist/umd.js ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("(function (global, factory) {\n\t true ? module.exports = factory() :\n\tundefined;\n}(this, (function () { 'use strict';\n\nvar isMergeableObject = function isMergeableObject(value) {\n\treturn isNonNullObject(value)\n\t\t&& !isSpecial(value)\n};\n\nfunction isNonNullObject(value) {\n\treturn !!value && typeof value === 'object'\n}\n\nfunction isSpecial(value) {\n\tvar stringValue = Object.prototype.toString.call(value);\n\n\treturn stringValue === '[object RegExp]'\n\t\t|| stringValue === '[object Date]'\n\t\t|| isReactElement(value)\n}\n\n// see https://github.com/facebook/react/blob/b5ac963fb791d1298e7f396236383bc955f916c1/src/isomorphic/classic/element/ReactElement.js#L21-L25\nvar canUseSymbol = typeof Symbol === 'function' && Symbol.for;\nvar REACT_ELEMENT_TYPE = canUseSymbol ? Symbol.for('react.element') : 0xeac7;\n\nfunction isReactElement(value) {\n\treturn value.$$typeof === REACT_ELEMENT_TYPE\n}\n\nfunction emptyTarget(val) {\n\treturn Array.isArray(val) ? [] : {}\n}\n\nfunction cloneUnlessOtherwiseSpecified(value, options) {\n\treturn (options.clone !== false && options.isMergeableObject(value))\n\t\t? deepmerge(emptyTarget(value), value, options)\n\t\t: value\n}\n\nfunction defaultArrayMerge(target, source, options) {\n\treturn target.concat(source).map(function(element) {\n\t\treturn cloneUnlessOtherwiseSpecified(element, options)\n\t})\n}\n\nfunction mergeObject(target, source, options) {\n\tvar destination = {};\n\tif (options.isMergeableObject(target)) {\n\t\tObject.keys(target).forEach(function(key) {\n\t\t\tdestination[key] = cloneUnlessOtherwiseSpecified(target[key], options);\n\t\t});\n\t}\n\tObject.keys(source).forEach(function(key) {\n\t\tif (!options.isMergeableObject(source[key]) || !target[key]) {\n\t\t\tdestination[key] = cloneUnlessOtherwiseSpecified(source[key], options);\n\t\t} else {\n\t\t\tdestination[key] = deepmerge(target[key], source[key], options);\n\t\t}\n\t});\n\treturn destination\n}\n\nfunction deepmerge(target, source, options) {\n\toptions = options || {};\n\toptions.arrayMerge = options.arrayMerge || defaultArrayMerge;\n\toptions.isMergeableObject = options.isMergeableObject || isMergeableObject;\n\n\tvar sourceIsArray = Array.isArray(source);\n\tvar targetIsArray = Array.isArray(target);\n\tvar sourceAndTargetTypesMatch = sourceIsArray === targetIsArray;\n\n\tif (!sourceAndTargetTypesMatch) {\n\t\treturn cloneUnlessOtherwiseSpecified(source, options)\n\t} else if (sourceIsArray) {\n\t\treturn options.arrayMerge(target, source, options)\n\t} else {\n\t\treturn mergeObject(target, source, options)\n\t}\n}\n\ndeepmerge.all = function deepmergeAll(array, options) {\n\tif (!Array.isArray(array)) {\n\t\tthrow new Error('first argument should be an array')\n\t}\n\n\treturn array.reduce(function(prev, next) {\n\t\treturn deepmerge(prev, next, options)\n\t}, {})\n};\n\nvar deepmerge_1 = deepmerge;\n\nreturn deepmerge_1;\n\n})));\n\n\n//# sourceURL=webpack://octokitGraphql/./node_modules/deepmerge/dist/umd.js?");

/***/ }),

/***/ "./node_modules/is-plain-object/index.js":
/*!***********************************************!*\
  !*** ./node_modules/is-plain-object/index.js ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("/*!\n * is-plain-object <https://github.com/jonschlinkert/is-plain-object>\n *\n * Copyright (c) 2014-2017, Jon Schlinkert.\n * Released under the MIT License.\n */\n\n\n\nvar isObject = __webpack_require__(/*! isobject */ \"./node_modules/isobject/index.js\");\n\nfunction isObjectObject(o) {\n  return isObject(o) === true\n    && Object.prototype.toString.call(o) === '[object Object]';\n}\n\nmodule.exports = function isPlainObject(o) {\n  var ctor,prot;\n\n  if (isObjectObject(o) === false) return false;\n\n  // If has modified constructor\n  ctor = o.constructor;\n  if (typeof ctor !== 'function') return false;\n\n  // If has modified prototype\n  prot = ctor.prototype;\n  if (isObjectObject(prot) === false) return false;\n\n  // If constructor does not have an Object-specific method\n  if (prot.hasOwnProperty('isPrototypeOf') === false) {\n    return false;\n  }\n\n  // Most likely a plain Object\n  return true;\n};\n\n\n//# sourceURL=webpack://octokitGraphql/./node_modules/is-plain-object/index.js?");

/***/ }),

/***/ "./node_modules/isobject/index.js":
/*!****************************************!*\
  !*** ./node_modules/isobject/index.js ***!
  \****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("/*!\n * isobject <https://github.com/jonschlinkert/isobject>\n *\n * Copyright (c) 2014-2017, Jon Schlinkert.\n * Released under the MIT License.\n */\n\n\n\nmodule.exports = function isObject(val) {\n  return val != null && typeof val === 'object' && Array.isArray(val) === false;\n};\n\n\n//# sourceURL=webpack://octokitGraphql/./node_modules/isobject/index.js?");

/***/ }),

/***/ "./node_modules/node-fetch/browser.js":
/*!********************************************!*\
  !*** ./node_modules/node-fetch/browser.js ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\n// ref: https://github.com/tc39/proposal-global\nvar getGlobal = function () {\n\t// the only reliable means to get the global object is\n\t// `Function('return this')()`\n\t// However, this causes CSP violations in Chrome apps.\n\tif (typeof self !== 'undefined') { return self; }\n\tif (typeof window !== 'undefined') { return window; }\n\tif (typeof global !== 'undefined') { return global; }\n\tthrow new Error('unable to locate global object');\n}\n\nvar global = getGlobal();\n\nmodule.exports = exports = global.fetch;\n\n// Needed for TypeScript and Webpack.\nexports.default = global.fetch.bind(global);\n\nexports.Headers = global.Headers;\nexports.Request = global.Request;\nexports.Response = global.Response;\n\n//# sourceURL=webpack://octokitGraphql/./node_modules/node-fetch/browser.js?");

/***/ }),

/***/ "./node_modules/universal-user-agent/browser.js":
/*!******************************************************!*\
  !*** ./node_modules/universal-user-agent/browser.js ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = getUserAgentBrowser\n\nfunction getUserAgentBrowser () {\n  /* global navigator */\n  return navigator.userAgent\n}\n\n\n//# sourceURL=webpack://octokitGraphql/./node_modules/universal-user-agent/browser.js?");

/***/ }),

/***/ "./node_modules/url-template/lib/url-template.js":
/*!*******************************************************!*\
  !*** ./node_modules/url-template/lib/url-template.js ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("(function (root, factory) {\n    if (true) {\n        module.exports = factory();\n    } else {}\n}(this, function () {\n  /**\n   * @constructor\n   */\n  function UrlTemplate() {\n  }\n\n  /**\n   * @private\n   * @param {string} str\n   * @return {string}\n   */\n  UrlTemplate.prototype.encodeReserved = function (str) {\n    return str.split(/(%[0-9A-Fa-f]{2})/g).map(function (part) {\n      if (!/%[0-9A-Fa-f]/.test(part)) {\n        part = encodeURI(part).replace(/%5B/g, '[').replace(/%5D/g, ']');\n      }\n      return part;\n    }).join('');\n  };\n\n  /**\n   * @private\n   * @param {string} str\n   * @return {string}\n   */\n  UrlTemplate.prototype.encodeUnreserved = function (str) {\n    return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {\n      return '%' + c.charCodeAt(0).toString(16).toUpperCase();\n    });\n  }\n\n  /**\n   * @private\n   * @param {string} operator\n   * @param {string} value\n   * @param {string} key\n   * @return {string}\n   */\n  UrlTemplate.prototype.encodeValue = function (operator, value, key) {\n    value = (operator === '+' || operator === '#') ? this.encodeReserved(value) : this.encodeUnreserved(value);\n\n    if (key) {\n      return this.encodeUnreserved(key) + '=' + value;\n    } else {\n      return value;\n    }\n  };\n\n  /**\n   * @private\n   * @param {*} value\n   * @return {boolean}\n   */\n  UrlTemplate.prototype.isDefined = function (value) {\n    return value !== undefined && value !== null;\n  };\n\n  /**\n   * @private\n   * @param {string}\n   * @return {boolean}\n   */\n  UrlTemplate.prototype.isKeyOperator = function (operator) {\n    return operator === ';' || operator === '&' || operator === '?';\n  };\n\n  /**\n   * @private\n   * @param {Object} context\n   * @param {string} operator\n   * @param {string} key\n   * @param {string} modifier\n   */\n  UrlTemplate.prototype.getValues = function (context, operator, key, modifier) {\n    var value = context[key],\n        result = [];\n\n    if (this.isDefined(value) && value !== '') {\n      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {\n        value = value.toString();\n\n        if (modifier && modifier !== '*') {\n          value = value.substring(0, parseInt(modifier, 10));\n        }\n\n        result.push(this.encodeValue(operator, value, this.isKeyOperator(operator) ? key : null));\n      } else {\n        if (modifier === '*') {\n          if (Array.isArray(value)) {\n            value.filter(this.isDefined).forEach(function (value) {\n              result.push(this.encodeValue(operator, value, this.isKeyOperator(operator) ? key : null));\n            }, this);\n          } else {\n            Object.keys(value).forEach(function (k) {\n              if (this.isDefined(value[k])) {\n                result.push(this.encodeValue(operator, value[k], k));\n              }\n            }, this);\n          }\n        } else {\n          var tmp = [];\n\n          if (Array.isArray(value)) {\n            value.filter(this.isDefined).forEach(function (value) {\n              tmp.push(this.encodeValue(operator, value));\n            }, this);\n          } else {\n            Object.keys(value).forEach(function (k) {\n              if (this.isDefined(value[k])) {\n                tmp.push(this.encodeUnreserved(k));\n                tmp.push(this.encodeValue(operator, value[k].toString()));\n              }\n            }, this);\n          }\n\n          if (this.isKeyOperator(operator)) {\n            result.push(this.encodeUnreserved(key) + '=' + tmp.join(','));\n          } else if (tmp.length !== 0) {\n            result.push(tmp.join(','));\n          }\n        }\n      }\n    } else {\n      if (operator === ';') {\n        if (this.isDefined(value)) {\n          result.push(this.encodeUnreserved(key));\n        }\n      } else if (value === '' && (operator === '&' || operator === '?')) {\n        result.push(this.encodeUnreserved(key) + '=');\n      } else if (value === '') {\n        result.push('');\n      }\n    }\n    return result;\n  };\n\n  /**\n   * @param {string} template\n   * @return {function(Object):string}\n   */\n  UrlTemplate.prototype.parse = function (template) {\n    var that = this;\n    var operators = ['+', '#', '.', '/', ';', '?', '&'];\n\n    return {\n      expand: function (context) {\n        return template.replace(/\\{([^\\{\\}]+)\\}|([^\\{\\}]+)/g, function (_, expression, literal) {\n          if (expression) {\n            var operator = null,\n                values = [];\n\n            if (operators.indexOf(expression.charAt(0)) !== -1) {\n              operator = expression.charAt(0);\n              expression = expression.substr(1);\n            }\n\n            expression.split(/,/g).forEach(function (variable) {\n              var tmp = /([^:\\*]*)(?::(\\d+)|(\\*))?/.exec(variable);\n              values.push.apply(values, that.getValues(context, operator, tmp[1], tmp[2] || tmp[3]));\n            });\n\n            if (operator && operator !== '+') {\n              var separator = ',';\n\n              if (operator === '?') {\n                separator = '&';\n              } else if (operator !== '#') {\n                separator = operator;\n              }\n              return (values.length !== 0 ? operator : '') + values.join(separator);\n            } else {\n              return values.join(',');\n            }\n          } else {\n            return that.encodeReserved(literal);\n          }\n        });\n      }\n    };\n  };\n\n  return new UrlTemplate();\n}));\n\n\n//# sourceURL=webpack://octokitGraphql/./node_modules/url-template/lib/url-template.js?");

/***/ }),

/***/ "./package.json":
/*!**********************!*\
  !*** ./package.json ***!
  \**********************/
/*! exports provided: name, version, publishConfig, description, main, scripts, repository, keywords, author, license, bugs, homepage, dependencies, devDependencies, bundlesize, release, standard, files, default */
/***/ (function(module) {

eval("module.exports = {\"name\":\"@octokit/graphql\",\"version\":\"0.0.0-development\",\"publishConfig\":{\"access\":\"public\"},\"description\":\"GitHub GraphQL API client for browsers and Node\",\"main\":\"index.js\",\"scripts\":{\"build\":\"npm-run-all build:*\",\"build:development\":\"webpack --mode development --entry . --output-library=octokitGraphql --output=./dist/octokit-graphql.js --profile --json > dist/bundle-stats.json\",\"build:production\":\"webpack --mode production --entry . --plugin=compression-webpack-plugin --output-library=octokitGraphql --output-path=./dist --output-filename=octokit-graphql.min.js --devtool source-map\",\"bundle-report\":\"webpack-bundle-analyzer dist/bundle-stats.json --mode=static --no-open --report dist/bundle-report.html\",\"coverage\":\"nyc report --reporter=html && open coverage/index.html\",\"coverage:upload\":\"nyc report --reporter=text-lcov | coveralls\",\"pretest\":\"standard\",\"test\":\"nyc mocha test/*-test.js\",\"test:browser\":\"cypress run --browser chrome\"},\"repository\":{\"type\":\"git\",\"url\":\"https://github.com/octokit/graphql.js.git\"},\"keywords\":[\"octokit\",\"github\",\"api\",\"graphql\"],\"author\":\"Gregor Martynus (https://github.com/gr2m)\",\"license\":\"MIT\",\"bugs\":{\"url\":\"https://github.com/octokit/graphql.js/issues\"},\"homepage\":\"https://github.com/octokit/graphql.js#readme\",\"dependencies\":{\"@octokit/request\":\"^2.2.0\"},\"devDependencies\":{\"chai\":\"^4.2.0\",\"compression-webpack-plugin\":\"^2.0.0\",\"coveralls\":\"^3.0.2\",\"cypress\":\"^3.1.0\",\"fetch-mock\":\"^7.2.0\",\"mkdirp\":\"^0.5.1\",\"mocha\":\"^5.2.0\",\"npm-run-all\":\"^4.1.5\",\"nyc\":\"^13.1.0\",\"semantic-release\":\"^15.12.1\",\"simple-mock\":\"^0.8.0\",\"standard\":\"^12.0.1\",\"webpack\":\"^4.22.0\",\"webpack-bundle-analyzer\":\"^3.0.3\",\"webpack-cli\":\"^3.1.2\"},\"bundlesize\":[{\"path\":\"./dist/octokit-graphql.min.js.gz\",\"maxSize\":\"5KB\"}],\"release\":{\"publish\":[\"@semantic-release/npm\",{\"path\":\"@semantic-release/github\",\"assets\":[\"dist/*\",\"!dist/*.map.gz\"]}]},\"standard\":{\"globals\":[\"describe\",\"before\",\"beforeEach\",\"afterEach\",\"after\",\"it\",\"expect\"]},\"files\":[\"lib\"]};\n\n//# sourceURL=webpack://octokitGraphql/./package.json?");

/***/ })

/******/ });
},{}],31:[function(require,module,exports){
let site = require("./site");
let projectRunButton = document.getElementById('project-update-run');

async function run() {
    projectRunButton.disabled = true;
    let project_id = window.localStorage.getItem('project-update:id');
    let org = window.localStorage.getItem('project-update:org');

    let graphql = site.getGraphQL();

    let response = await graphql(`query projectLookup($org: String!, $project_id: Int!) {
        organization(login: $org) {
          project(number: $project_id) {
            columns(first: 100) {
              nodes {
                name
                cards(first: 100) {
                  nodes {
                    id
                    content {
                      __typename
                      ... on Issue {
                        title
                        url
                        updatedAt
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `, {
        org: org,
        project_id: parseInt(project_id)
    })
    site.resultsReset();
    site.addResultColumns('Card', 'Column', 'Last updated')
    for (let column of response.data.organization.project.columns.nodes) {
        for (let card of column.cards.nodes) {
            let issue = card.content;
            if (!issue) {
                continue;
            }
            site.addResultRow(
                issue.url, [
                    issue.title,
                    column.name,
                    moment(issue.updatedAt).fromNow()
                ])
        }
    }
    projectRunButton.disabled = false;
}

projectRunButton.addEventListener("click", run);
},{"./site":33}],32:[function(require,module,exports){
let site = require("./site");
let reviewsRunButton = document.getElementById('reviews-count-run');

async function run() {
    reviewsRunButton.disabled = true;
    let org = window.localStorage.getItem('reviews-count:org');
    let repo = window.localStorage.getItem('reviews-count:repo');

    let graphql = await site.getGraphQL();

    let response = await graphql(`query reviewsLookup($org: String!, $repo: String!) {
        repository(owner: $org, name:$repo) {
          pullRequests(last:20, states:OPEN, orderBy: {field: CREATED_AT, direction: DESC}) {
            edges {
              node {
                title
                url
                number
                createdAt
                reviewRequests(first: 20) {
                  edges {
                    node {
                      id
                    }
                  }
                }
                reviews(first:50) {
                  edges {
                    node {
                      id
                      state
                    }
                  }
                }
              }
            }
          }
        }
      }
    `, {
        org: org,
        repo: repo
    })

    site.resultsReset();
    site.addResultColumns('Review', 'Reviews requested', 'Reviews completed', 'Created at');

    for (let pullRequest of response.data.repository.pullRequests.edges) {
        let requested_reviewers = pullRequest.node.reviewRequests.edges.length;
        let reviews_completed = 0;
        for (let review of pullRequest.node.reviews.edges) {
            if (['APPROVED', 'CHANGES_REQUESTED'].includes(review.node.state)) {
                requested_reviewers += 1;
                reviews_completed += 1;
            }
        }
        site.addResultRow(
            pullRequest.node.url, [`${pullRequest.node.number}: ${pullRequest.node.title}`,
                requested_reviewers,
                reviews_completed,
                moment(pullRequest.node.createdAt).format('ll')
            ]
        );
    }
    reviewsRunButton.disabled = false;
};

reviewsRunButton.addEventListener("click", run);
},{"./site":33}],33:[function(require,module,exports){
let graphql = require('@octokit/graphql');

let table = document.getElementById('results');

function save(event) {
    event.preventDefault();
    let formData = new FormData(event.target);
    let key = event.target.getAttribute('id');
    for (let entry of formData.entries()) {
        window.localStorage.setItem(`${key}:${entry[0]}`, entry[1]);
    }

    hidePat(event);
    event.preventDefault();
}

function hidePat(event) {
    document.getElementById('pat').style.display = 'none';
    document.getElementById("show-pat").style.display = 'block';
}

function showPat(event) {
    document.getElementById('pat').style.display = 'block';
    document.getElementById("show-pat").style.display = 'none';
}

function hashChangeEvent() {
    let hash = window.location.hash;

    if (!hash) {
        return;
    }

    for (let tab of document.querySelectorAll('a.tabnav-tab')) {
        tab.classList.remove('selected');
    }

    for (let wrapper of document.getElementsByClassName('wrapper')) {
        wrapper.style.display = "none";
    }

    let chosen = document.querySelector(`a[href="${hash}"]`);
    chosen.classList.add("selected");
    document.getElementById(hash.slice(1)).style.display = "block";
}

function getGraphQL() {
    let pat = window.localStorage.getItem('pat:pat');
    const octokit = graphql.defaults({
        headers: {
            authorization: `token ${pat}`
        }
    })
    return octokit;
}

function resultsReset() {
    table.getElementsByTagName('thead')[0].innerHTML = '';
    table.getElementsByTagName('tbody')[0].innerHTML = '';
}

function addResultColumns(...headers) {
    for (let text of headers) {
        let header = document.createElement('th');
        header.innerText = text;
        table.getElementsByTagName('thead')[0].appendChild(header);
    }
    document.getElementById('no-results').style.display = 'none';
}

function addResultRow(url, fields) {
    let row = document.createElement('tr');
    for (let k in fields) {
        let field = fields[k];
        let td = document.createElement('td');
        if (k == 0) {
            let a = document.createElement('a');
            a.href = url;
            a.innerText = field;
            td.appendChild(a);
        } else {
            td.innerText = field;
        }
        row.appendChild(td)
    }
    table.getElementsByTagName('tbody')[0].appendChild(row);
}

window.addEventListener("load", function(event) {
    let formIds = [];
    for (let form of document.getElementsByTagName('form')) {
        formIds.push(form.getAttribute('id'));
    }

    for (let key in localStorage) {
        let [prefix, actualKey, ..._] = key.split(':');
        if (prefix && actualKey) {
            let fields = document.querySelectorAll(`form[id="${prefix}"] > input[name="${actualKey}"]`);
            if (fields.length < 1) {
                console.log(`Could not find a field for ${prefix}.`);
            } else {
                fields[0].value = window.localStorage.getItem(key);
            }


        }
    }

    let forms = document.getElementsByClassName("save-form")
    for (let form of forms) {
        form.addEventListener("submit", save);
    }


    hashChangeEvent();
    document.getElementById("show-pat").addEventListener("click", showPat);
});

window.addEventListener("hashchange", hashChangeEvent);

module.exports = { addResultColumns, addResultRow, resultsReset, getGraphQL }
},{"@octokit/graphql":12}]},{},[33,30,32,31]);
