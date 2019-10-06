const { msg_limit } = require('./msg-limit')

class SBotBase {

  constructor(robot) {
    this.robot = robot
    this.name = robot.adapterName
  }

  // send methods

  sendEphemeral(msg, text) {
    return msg.send(text) //TODO private send
  }

  sendImageLink(msg, url, alt_text) {
    return msg.send(url)
  }

  sendPost(msg, opts) {
    return msg.send(opts.text)
  }

  sendSecondaryAttachmentText(msg, title, attachmentText) {
    return msg.send(title);
  }

  // limitted send methods

  sendEphemeralLimit(...args) {
    return msg_limit(()=>this.sendEphemeral(...args))
  }

  sendPostLimit(...args) {
    return msg_limit(()=>this.sendPost(...args))
  }

  sendImageLinkLimit(...args) {
    return msg_limit(()=>this.sendImageLink(...args))
  }

  sendSecondaryAttachmentTextLimit(...args) {
    return msg_limit(()=>this.sendSecondaryAttachmentText(...args))
  }
}

module.exports = SBotBase