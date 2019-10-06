const { msg_limit } = require('./msg-limit')
const Robot = require('hubot/src/robot')
const Response = require('hubot/src/response')
const SBotBase = require('./sbot-base')
const SBotSlack = require('./sbot-slack')

module.exports = {
  SBotBase, 
  SBotSlack,
  msg_limit
}


Robot.prototype.$set_sbot = function () {
  if (this.adapterName == 'slack') {
    this.$sbot = new SBotSlack(this)
  } else {
    this.$sbot = new SBotBase(this)
  }
}

Response.prototype.$send = function (...args) {
  return msg_limit(() => this.send(...args))
}

Response.prototype.$sendPrivate = function (text) {
  return this.robot.$sbot.sendEphemeralLimit(this, text)
}

Response.prototype.$sendPost = function (opts) {
  return this.robot.$sbot.sendPostLimit(this, opts)
}

Response.prototype.$sendImageLink = function (url, alt_text) {
  return this.robot.$sbot.sendImageLinkLimit(this, url, alt_text)
}

Response.prototype.$sendSecondaryAttachmentText = function (title, attachmentText) {
  return this.robot.$sbot.sendSecondaryAttachmentText(this, title, attachmentText)
}
