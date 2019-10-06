'use strict'

// Description:
//  Wolfram Alpha API binder
//
// Commands:
//   wfa|= [expression]

require('../lib/sbot')

module.exports = (robot) => {
  robot.$set_sbot()

  const WOLFRAM_ALPHA_TOKEN = process.env.WOLFRAM_ALPHA_TOKEN
  if (!WOLFRAM_ALPHA_TOKEN) {
    robot.logger.error('Wrong Wolfram APPID')
    return
  }
  const WolframAlphaAPI = require('wolfram-alpha-api')
  const waApi = WolframAlphaAPI(WOLFRAM_ALPHA_TOKEN)

  // remove `wolfram` as a trigger to prevent mis-react
  robot.hear(/^(=|wfa)$/i, (msg) => {
    msg.$send("wfa|= [expression]")
  })

  robot.hear(/^(=|wfa\s+)\s*(.*)/i, (msg) => {
    if (!WOLFRAM_ALPHA_TOKEN) {
      msg.$send("Wolfram Alpha Token 이 없습니다.")
      return
    }

    let wolfram_expression = msg.match[2]

    let wolfram_short_param_obj = {i: wolfram_expression, units: 'metric'}

    robot.logger.info("wolfram_expression : " + wolfram_short_param_obj)

    waApi.getShort(wolfram_short_param_obj).then((answer) => {
        msg.$send(`\`${wolfram_expression} =\` ${answer}`)
      }).catch((error) => {
        robot.logger.error(error)
      })
  })
}

