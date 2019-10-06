"use strict"

// Description:
//  Very simple naver new crawling
//
// Commands:
//   한국 소식|뉴스|요즘|요새|최근


require('../lib/sbot')
var Iconv = require('iconv').Iconv;
var https = require('https');

const NAVER_NEWS_MAIN_URL: string = `https://news.naver.com/main/home.nhn`;
const NEWS_HEADLINE_REGEX: RegExp = new RegExp('href="(.+?)".*?\n.*?<strong>(.*?)</strong>', 'igm')
const NEWS_LIMIT_COUNT = 30;
const CACHE_EVICTION_SEC = 3;
let cachedNewsHeadlineList: string = "";
let lastCacheUpdated: number = 0;

async function accessNaverNews(msg)
{
    let newsHeadlineExcludes = new Set<string>(['헤드라인 뉴스', '자동 추출']);
    let newsHeadlines = new Set<string>();
    let newsHeadlineList: string = "";

    https.get(NAVER_NEWS_MAIN_URL, (resp) => {

        resp.setEncoding('binary');

        let iconv = new Iconv('euc-kr', 'utf-8');
        let bufferList = new Array<Buffer>();
        let data:Buffer;

        // A chunk of data has been recieved.
        resp.on('data', (chunk) => {
            bufferList.push(Buffer.from(chunk, 'binary'));
        });

        // The whole response has been received. Print out the result.
        resp.on('end', () => {
            data = Buffer.concat(bufferList);

            let responseString = iconv.convert(data).toString('utf-8');
            let response: string[] = responseString.split('\n');
            let lineCount = 0;

            let matched = null;
            while (matched = NEWS_HEADLINE_REGEX.exec(responseString)) {
                if (lineCount >= NEWS_LIMIT_COUNT) {
                    break;
                }
                let matchedTitle = matched[2];
                let matchedUrl = matched[1]; // TODO: if domain is missed
                if (!newsHeadlineExcludes.has(matchedTitle) && matchedTitle != undefined)
                {
                    console.log(matched[1], matched[2])
                    newsHeadlines.add(`<${matchedUrl}|${matchedTitle.trim()}>`);
                    ++lineCount;
                }
            }

            console.log(`size : ${newsHeadlines.size}`);

            newsHeadlines.forEach((x) => {
                newsHeadlineList += `- ${x}\n`;
            });

            lastCacheUpdated = new Date().getTime();
            newsHeadlineList += `_Last updated : ${new Date(lastCacheUpdated)}_`;
            cachedNewsHeadlineList = newsHeadlineList;

            sendResponse(msg, newsHeadlineList);
        });
    });
}

function sendResponse(msg, newsHeadlineList)
{
    msg.$sendSecondaryAttachmentText(
        `:hey-baby::hey-baby: 한국 소식이 궁금하셨군요! :hey-baby::hey-baby:`,
        newsHeadlineList)
}

module.exports = (robot) => {
    robot.$set_sbot()

    robot.hear(/(한국).*(소식|뉴스|요즘|요새|최근)/i, (msg) => {

        if (cachedNewsHeadlineList.length > 0 &&
            new Date().getTime() - lastCacheUpdated  < 1000 * CACHE_EVICTION_SEC)
        {
            sendResponse(msg, cachedNewsHeadlineList);
            console.log("cached");
        }
        else
        {
            accessNaverNews(msg);
        }
    })
  }
