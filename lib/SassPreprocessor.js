"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
/// <reference types="node-sass" />
var path = __importStar(require("path"));
var renderSync = (function () {
    try {
        return require('node-sass').renderSync;
    }
    catch (_a) {
        return null;
    }
})();
var SassPreprocessor = /** @class */ (function () {
    function SassPreprocessor(paths, nodeModulesPath) {
        this.nodeModulesPath = nodeModulesPath;
        this.sassRegex = /\.(?:scss|sass)$/;
        this.sassTypingRegex = /\.(?:scss|sass).d.ts$/;
        this.paths = paths.concat();
    }
    SassPreprocessor.prototype.test = function (file) {
        return this.sassRegex.test(file);
    };
    SassPreprocessor.prototype.testTyping = function (file) {
        return this.sassTypingRegex.test(file);
    };
    SassPreprocessor.prototype.readSync = function (file) {
        var _this = this;
        var renderedContent = renderSync({
            file: file,
            includePaths: this.paths,
            indentedSyntax: true,
            importer: [function (includeUrl, fileUrl) {
                    var path = _this.resolvePath(includeUrl, fileUrl);
                    _this.paths.push(fileUrl);
                    return { file: path };
                }]
        });
        return renderedContent.css.toString('utf-8');
    };
    SassPreprocessor.prototype.resolvePath = function (includeUrl, fileUrl) {
        if (includeUrl.charAt(0) === '~') {
            return path.join(this.nodeModulesPath, includeUrl.substring(1, includeUrl.length));
        }
        return path.resolve(path.join(path.dirname(fileUrl), includeUrl));
    };
    SassPreprocessor.isSupported = function () {
        return renderSync !== null;
    };
    return SassPreprocessor;
}());
exports.SassPreprocessor = SassPreprocessor;
