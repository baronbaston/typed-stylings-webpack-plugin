"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var TypedStylingsWebpackPlugin_1 = require("./TypedStylingsWebpackPlugin");
var ForkTsCheckerTypedStylingsWebpackPlugin = /** @class */ (function () {
    function ForkTsCheckerTypedStylingsWebpackPlugin(options) {
        this.typedStylingsWebpackPlugin = new TypedStylingsWebpackPlugin_1.TypedStylingsWebpackPlugin(__assign({}, options, { asyncHook: 'forkTsCheckerServiceBeforeStart' }));
    }
    ForkTsCheckerTypedStylingsWebpackPlugin.prototype.apply = function (compiler) {
        this.typedStylingsWebpackPlugin.apply(compiler);
    };
    return ForkTsCheckerTypedStylingsWebpackPlugin;
}());
exports.ForkTsCheckerTypedStylingsWebpackPlugin = ForkTsCheckerTypedStylingsWebpackPlugin;
