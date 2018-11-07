"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = __importStar(require("fs"));
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
