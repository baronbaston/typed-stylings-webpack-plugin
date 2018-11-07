"use strict";
/// <reference types="node-sass" />
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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = __importStar(require("fs"));
var path = __importStar(require("path"));
var typed_css_modules_1 = __importDefault(require("typed-css-modules"));
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
        this.paths = paths;
        this.nodeModulesPath = nodeModulesPath;
        this._sassRegex = /\.(?:scss|sass)$/;
    }
    SassPreprocessor.prototype.test = function (file) {
        return this._sassRegex.test(file);
    };
    SassPreprocessor.prototype.readSync = function (file) {
        var _this = this;
        var renderedContent = renderSync({
            file: file,
            includePaths: this.paths,
            indentedSyntax: true,
            importer: [function (includeUrl, fileUrl) {
                    var path = _this._resolvePath(includeUrl, fileUrl);
                    _this.paths.push(fileUrl);
                    return { file: path };
                }]
        });
        return renderedContent.css.toString('utf-8');
    };
    SassPreprocessor.prototype._resolvePath = function (includeUrl, fileUrl) {
        if (includeUrl.charAt(0) === '~') {
            return path.join(this.nodeModulesPath, includeUrl.substring(1, includeUrl.length));
        }
        return path.resolve(path.join(path.dirname(fileUrl), includeUrl));
    };
    return SassPreprocessor;
}());
exports.SassPreprocessor = SassPreprocessor;
var CssPreprocessor = /** @class */ (function () {
    function CssPreprocessor() {
        this.cssRegex = /\.css$/;
    }
    CssPreprocessor.prototype.test = function (file) {
        return this.cssRegex.test(file);
    };
    CssPreprocessor.prototype.readSync = function (file) {
        return fs.readFileSync(file, 'utf-8');
    };
    return CssPreprocessor;
}());
exports.CssPreprocessor = CssPreprocessor;
var TypedStylingsWebpackPlugin = /** @class */ (function () {
    function TypedStylingsWebpackPlugin(options) {
        this._asyncHook = options.asyncHook;
        this._includePaths = Array.isArray(options.includePaths) ? options.includePaths : [options.includePaths];
        this._nodeModulesPath = options.nodeModulesPath || 'node_modules';
        this._preProcessors = options.preProcessors
            ? options.preProcessors
            : (renderSync ? [new SassPreprocessor(this._includePaths, this._nodeModulesPath)] : []).concat([
                new CssPreprocessor
            ]);
        this._dtsOptions = options.dtsOptions || { camelCase: true };
        this._dtsCreator = new typed_css_modules_1.default(this._dtsOptions);
        this._timestampCache = {};
    }
    TypedStylingsWebpackPlugin.prototype.apply = function (compiler) {
        var _this = this;
        compiler.hooks[this._asyncHook].tapPromise('TypedStylingsWebpackPlugin', function () {
            var results = _this._includePaths
                .reduce(function (result, path) { return result.concat(_this._getModifiedFiles(path)); }, [])
                .map(function (path) { return ({ path: path, css: _this._getFileContentAsCss(path) }); })
                .filter(function (pathAndCss) { return pathAndCss.css; })
                .map(function (pathAndCss) {
                return _this._dtsCreator.create(pathAndCss.path, pathAndCss.css).then(function (content) { return content.writeFile(); });
            });
            return Promise.all(results);
        });
    };
    TypedStylingsWebpackPlugin.prototype._getModifiedFiles = function (dir) {
        var _this = this;
        var files = this._walkSync(dir);
        return files
            .filter(function (file) {
            var isModified = !_this._timestampCache[file.path] || _this._timestampCache[file.path] < file.stat;
            _this._timestampCache[file.path] = file.stat;
            return isModified;
        })
            .map(function (file) { return file.path; });
    };
    TypedStylingsWebpackPlugin.prototype._walkSync = function (dir, result) {
        if (result === void 0) { result = []; }
        var files = fs.readdirSync(dir);
        for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
            var file = files_1[_i];
            var pathToFile = path.join(dir, file);
            var stat = fs.statSync(pathToFile);
            if (stat.isDirectory()) {
                this._walkSync(pathToFile, result);
            }
            else {
                result.push({ path: pathToFile, stat: stat.mtimeMs });
            }
        }
        return result;
    };
    TypedStylingsWebpackPlugin.prototype._getFileContentAsCss = function (file) {
        var preProcessor = this._preProcessors.find(function (preProcessor) { return preProcessor.test(file); });
        return preProcessor ? preProcessor.readSync(file) : null;
    };
    return TypedStylingsWebpackPlugin;
}());
exports.TypedStylingsWebpackPlugin = TypedStylingsWebpackPlugin;
var ForkTsCheckerTypedStylingsWebpackPlugin = /** @class */ (function () {
    function ForkTsCheckerTypedStylingsWebpackPlugin(options) {
        this.typedStylingsWebpackPlugin = new TypedStylingsWebpackPlugin(__assign({}, options, { asyncHook: 'forkTsCheckerServiceBeforeStart' }));
    }
    ForkTsCheckerTypedStylingsWebpackPlugin.prototype.apply = function (compiler) {
        this.typedStylingsWebpackPlugin.apply(compiler);
    };
    return ForkTsCheckerTypedStylingsWebpackPlugin;
}());
exports.ForkTsCheckerTypedStylingsWebpackPlugin = ForkTsCheckerTypedStylingsWebpackPlugin;
