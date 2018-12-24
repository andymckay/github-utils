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
  "_from": "@octokit/endpoint@^3.0.0",
  "_id": "@octokit/endpoint@3.1.1",
  "_inBundle": false,
  "_integrity": "sha512-KPkoTvKwCTetu/UqonLs1pfwFO5HAqTv/Ksp9y4NAg//ZgUCpvJsT4Hrst85uEzJvkB8+LxKyR4Bfv2X8O4cmQ==",
  "_location": "/@octokit/endpoint",
  "_phantomChildren": {},
  "_requested": {
    "type": "range",
    "registry": true,
    "raw": "@octokit/endpoint@^3.0.0",
    "name": "@octokit/endpoint",
    "escapedName": "@octokit%2fendpoint",
    "scope": "@octokit",
    "rawSpec": "^3.0.0",
    "saveSpec": null,
    "fetchSpec": "^3.0.0"
  },
  "_requiredBy": [
    "/@octokit/request"
  ],
  "_resolved": "https://registry.npmjs.org/@octokit/endpoint/-/endpoint-3.1.1.tgz",
  "_shasum": "ede9afefaa4d6b7584169e12346425c6fbb45cc3",
  "_spec": "@octokit/endpoint@^3.0.0",
  "_where": "/Users/andymckay/sandboxes/github-utils/node_modules/@octokit/request",
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
  "_from": "@octokit/graphql@^1.0.0",
  "_id": "@octokit/graphql@1.0.0",
  "_inBundle": false,
  "_integrity": "sha512-FCBRZ7rBWPNcr5HTH6Hoanfz/kCeOeYY2E6kgkPzvlxII/zjEt00jq7JTohf/8m+jWcvdCpJUrsJZN8DZUBS7A==",
  "_location": "/@octokit/graphql",
  "_phantomChildren": {},
  "_requested": {
    "type": "range",
    "registry": true,
    "raw": "@octokit/graphql@^1.0.0",
    "name": "@octokit/graphql",
    "escapedName": "@octokit%2fgraphql",
    "scope": "@octokit",
    "rawSpec": "^1.0.0",
    "saveSpec": null,
    "fetchSpec": "^1.0.0"
  },
  "_requiredBy": [
    "#USER",
    "/"
  ],
  "_resolved": "https://registry.npmjs.org/@octokit/graphql/-/graphql-1.0.0.tgz",
  "_shasum": "6fe48d6ae3a7d2c1e81f632d6d3dc394d4933762",
  "_spec": "@octokit/graphql@^1.0.0",
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
},{"./site":32}],31:[function(require,module,exports){
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
},{"./site":32}],32:[function(require,module,exports){
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
},{"@octokit/graphql":12}],33:[function(require,module,exports){
let site = require("./site");
let teamStatusButton = document.getElementById('team-status-run');

async function run() {
    teamStatusButton.disabled = true;
    let org = window.localStorage.getItem('team-status:org');
    let team = window.localStorage.getItem('team-status:team');
    console.log(org, team)
    let graphql = site.getGraphQL();

    let response = await graphql(`query teamLookup($org: String!, $team: String!) {
        organization(login: $org) {
          team(slug: $team) {
            members(first: 100) {
              edges {
                node {
                  name
                  login
                  url
                  issues(last: 100, states: OPEN) {
                    totalCount
                  }
                  pullRequests(last: 100, states: OPEN) {
                    totalCount
                  }
                }
              }
            }
          }
        }
      }
    `, {
        org: org,
        team: team
    })
    site.resultsReset();
    site.addResultColumns('Login', 'Issues open', 'Pull requests open')
    console.log(response);
    for (let edge of response.data.organization.team.members.edges) {
        let member = edge.node;
        site.addResultRow(
            member.url, [
                member.name,
                member.issues.totalCount,
                member.pullRequests.totalCount
            ])
    }
    teamStatusButton.disabled = false;
}

teamStatusButton.addEventListener("click", run);
},{"./site":32}]},{},[30,31,32,33]);
