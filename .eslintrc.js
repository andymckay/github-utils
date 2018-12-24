module.exports = {
    "env": {
        "browser": true,
        "es6": true,
        "amd": true
    },
    "globals": {
        "module": false
    },
    "extends": "eslint:recommended",
    "rules": {
        "indent": [
            "error",
            4
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "double"
        ],
        "semi": [
            "error",
            "always"
        ]
    },
    "parser": "babel-eslint"
};