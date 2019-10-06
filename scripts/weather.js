'use strict'

// Description:
//  날씨
//
// Commands:
//   weather - Espoo 날씨

require('../lib/sbot')

module.exports = (robot) => {
  robot.$set_sbot()

  const DARKSKY_TOKEN = process.env.DARKSKY_TOKEN

  robot.hear(/^(weather|날씨)/i, (msg) => {
    if (!DARKSKY_TOKEN) {
      msg.send("Darksky Token 이 없습니다.")
      return
    }
    robot.http(`https://api.darksky.net/forecast/${DARKSKY_TOKEN}/60.1596565,24.72843?lang=ko&units=ca`)
      .get()( (err, res, body) => {
        if (err) {
          msg.send("Encountered an error :( #{err}")
          return
        }
        let data = JSON.parse(body)
        let cur = data.currently
        let cur_str = `Espoo: ${cur.summary} 온도:${cur.temperature}`
        msg.send(cur_str)
      })
  })
}

