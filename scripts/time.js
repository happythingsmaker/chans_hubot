'use strict'

// Description:
//  Very simple Wold time
//
// Commands:
//   time|시간|타임


/* TODO
 * additional cities on demand
 * better output format
 * can tell you a day of week of a certain date or vice versa
 */

require('../lib/sbot')

// Library to manage time zone from local server time
// https://momentjs.com/timezone/docs/
const moment = require('moment-timezone')
moment.locale('ko')


module.exports = (robot) => {
  robot.$set_sbot()

  robot.hear(/^(time|시간|타임)$/i, (msg) => {
    let zones = [
      ['헬싱키', 'Europe/Helsinki'],
      ['서울', 'Asia/Seoul' ]
    ]
    let time_str = zones.map(z => z[0].padEnd(10) + ' ' + moment.tz(z[1]).format('LLLL')).join("\n")
    msg.$send(time_str)
  })
}

