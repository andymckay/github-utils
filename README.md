A collection of GitHub utilities that I use for working on GitHub regularly. Hopefully its useful to others.

## Browser extensions

* **Sticky pinned tabs** [This extension](https://addons.mozilla.org/en-US/firefox/addon/sticky-pinned-tabs/) ensures that if you pinned a tab, all links go to a new window. This is really useful if you pin a project page. There are some links on the project page that do not open in a new tab.

* **Firefox containers** [This extension](https://addons.mozilla.org/en-US/firefox/addon/multi-account-containers/) let's you have different cookie stores per tab. It means you can have multiple tabs in the same window all logged into different GitHub accounts and differentiate them easily.

## Random scripts

This directory contains a web page that uses the GitHub GraphQL API to pull up some reports. You can access it at:

https://andymckay.github.io/github-utils/

Or by running:

```
python -m SimpleHTTPServer
```

Then accessing: http://localhost:8000/

You will need a personal access token from GitHub.

Licenses:

* octokit-rest.js is from [octokit/rest.js](https://github.com/octokit/rest.js/) and is under the MIT license.
* moment.js is from [moment.js](https://momentjs.com/) and is under the MIT license.
* primer.css is from [GitHub primer](https://styleguide.github.com/primer/) and is under the MIT license.
* icon is from [octicons](https://octicons.github.com/) and is under the MIT license.