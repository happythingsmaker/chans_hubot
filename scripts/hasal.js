'use strict'

// Description:
//  안녕하살법 보내기
//
// Commands:
//   hasal/안녕하살법 - 안녕하살법!
//   hasal2/안녕하살법받아치기 - 안녕하살법 받아치기!

require('../lib/sbot')

module.exports = (robot) => {
  robot.$set_sbot()

  robot.hear(/^(hasal2|안녕하살법\W*받아치기)\W*$/i, (msg) => {
    msg.finish()
    msg.$sendImageLink('https://i.imgur.com/gzuuxzT.gif', '안녕하살법 받아치기')
  })

  robot.hear(/^(hasal|안녕하살법?)\W*$/i, (msg) => {
    msg.finish()
    msg.$sendImageLink('https://i.imgur.com/6QoG9BD.gif', '안녕하살법')
  })
}

