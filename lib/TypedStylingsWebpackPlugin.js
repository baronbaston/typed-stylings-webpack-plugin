"use strict";
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
var CssPreprocessor_1 = require("./CssPreprocessor");
var SassPreprocessor_1 = require("./SassPreprocessor");
var TypedStylingsWebpackPlugin = /** @class */ (function () {
    function TypedStylingsWebpackPlugin(options) {
        this.asyncHook = options.asyncHook;
        this.includePaths = Array.isArray(options.includePaths) ? options.includePaths : [options.includePaths];
        this.nodeModulesPath = options.nodeModulesPath || 'node_modules';
        this.preProcessors = options.preProcessors
            ? options.preProcessors
            : (SassPreprocessor_1.SassPreprocessor.isSupported() ? [new SassPreprocessor_1.SassPreprocessor(this.includePaths, this.nodeModulesPath)] : []).concat([
                new CssPreprocessor_1.CssPreprocessor()
            ]);
        this.dtsOptions = options.dtsOptions || { camelCase: true };
        this.dtsCreator = new typed_css_modules_1.default(this.dtsOptions);
        this.timestampCache = {};
    }
    TypedStylingsWebpackPlugin.prototype.apply = function (compiler) {
        var _this = this;
        compiler.hooks[this.asyncHook].tapPromise('TypedStylingsWebpackPlugin', function () {
            var results = _this.includePaths
                .reduce(function (result, path) { return result.concat(_this.getModifiedFiles(path)); }, [])
                .map(function (path) { return ({ path: path, css: _this.getFileContentAsCss(path) }); })
                .filter(function (pathAndCss) { return pathAndCss.css; })
                .map(function (pathAndCss) {
                return _this.dtsCreator.create(pathAndCss.path, pathAndCss.css).then(function (content) { return content.writeFile(); });
            });
            return Promise.all(results);
        });
    };
    TypedStylingsWebpackPlugin.prototype.getModifiedFiles = function (dir) {
        var _this = this;
        var files = this.walkSync(dir);
        return files
            .filter(function (file) {
            var isModified = !_this.timestampCache[file.path] || _this.timestampCache[file.path] < file.stat;
            _this.timestampCache[file.path] = file.stat;
            return isModified;
        })
            .map(function (file) { return file.path; });
    };
    TypedStylingsWebpackPlugin.prototype.walkSync = function (dir, result) {
        if (result === void 0) { result = []; }
        var files = fs.readdirSync(dir);
        for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
            var file = files_1[_i];
            var pathToFile = path.join(dir, file);
            var stat = fs.statSync(pathToFile);
            if (stat.isDirectory()) {
                this.walkSync(pathToFile, result);
            }
            else {
                result.push({ path: pathToFile, stat: stat.mtimeMs });
            }
        }
        return result;
    };
    TypedStylingsWebpackPlugin.prototype.getFileContentAsCss = function (file) {
        var preProcessor = this.preProcessors.find(function (preProcessor) { return preProcessor.test(file); });
        return preProcessor ? preProcessor.readSync(file) : null;
    };
    return TypedStylingsWebpackPlugin;
}());
exports.TypedStylingsWebpackPlugin = TypedStylingsWebpackPlugin;
