"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
// Description:
//  Very simple naver new crawling
//
// Commands:
//   한국 소식|뉴스|요즘|요새|최근
require('../lib/sbot');
var Iconv = require('iconv').Iconv;
var https = require('https');
var NAVER_NEWS_MAIN_URL = "https://news.naver.com/main/home.nhn";
var NEWS_HEADLINE_REGEX = new RegExp('href="(.+?)".*?\n.*?<strong>(.*?)</strong>', 'igm');
var NEWS_LIMIT_COUNT = 30;
var CACHE_EVICTION_SEC = 3;
var cachedNewsHeadlineList = "";
var lastCacheUpdated = 0;
function accessNaverNews(msg) {
    return __awaiter(this, void 0, void 0, function () {
        var newsHeadlineExcludes, newsHeadlines, newsHeadlineList;
        return __generator(this, function (_a) {
            newsHeadlineExcludes = new Set(['헤드라인 뉴스', '자동 추출']);
            newsHeadlines = new Set();
            newsHeadlineList = "";
            https.get(NAVER_NEWS_MAIN_URL, function (resp) {
                resp.setEncoding('binary');
                var iconv = new Iconv('euc-kr', 'utf-8');
                var bufferList = new Array();
                var data;
                // A chunk of data has been recieved.
                resp.on('data', function (chunk) {
                    bufferList.push(Buffer.from(chunk, 'binary'));
                });
                // The whole response has been received. Print out the result.
                resp.on('end', function () {
                    data = Buffer.concat(bufferList);
                    var responseString = iconv.convert(data).toString('utf-8');
                    var response = responseString.split('\n');
                    var lineCount = 0;
                    var matched = null;
                    while (matched = NEWS_HEADLINE_REGEX.exec(responseString)) {
                        if (lineCount >= NEWS_LIMIT_COUNT) {
                            break;
                        }
                        var matchedTitle = matched[2];
                        var matchedUrl = matched[1]; // TODO: if domain is missed
                        if (!newsHeadlineExcludes.has(matchedTitle) && matchedTitle != undefined) {
                            console.log(matched[1], matched[2]);
                            newsHeadlines.add("<" + matchedUrl + "|" + matchedTitle.trim() + ">");
                            ++lineCount;
                        }
                    }
                    console.log("size : " + newsHeadlines.size);
                    newsHeadlines.forEach(function (x) {
                        newsHeadlineList += "- " + x + "\n";
                    });
                    lastCacheUpdated = new Date().getTime();
                    newsHeadlineList += "_Last updated : " + new Date(lastCacheUpdated) + "_";
                    cachedNewsHeadlineList = newsHeadlineList;
                    sendResponse(msg, newsHeadlineList);
                });
            });
            return [2 /*return*/];
        });
    });
}
function sendResponse(msg, newsHeadlineList) {
    msg.$sendSecondaryAttachmentText(":hey-baby::hey-baby: \uD55C\uAD6D \uC18C\uC2DD\uC774 \uAD81\uAE08\uD558\uC168\uAD70\uC694! :hey-baby::hey-baby:", newsHeadlineList);
}
module.exports = function (robot) {
    robot.$set_sbot();
    robot.hear(/(한국).*(소식|뉴스|요즘|요새|최근)/i, function (msg) {
        if (cachedNewsHeadlineList.length > 0 &&
            new Date().getTime() - lastCacheUpdated < 1000 * CACHE_EVICTION_SEC) {
            sendResponse(msg, cachedNewsHeadlineList);
            console.log("cached");
        }
        else {
            accessNaverNews(msg);
        }
    });
};
