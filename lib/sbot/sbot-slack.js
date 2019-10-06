const SBotBase = require('./sbot-base')
let { WebClient } = require('@slack/web-api')

class SBotSlack extends SBotBase {
  constructor(robot) {
    super(robot)
    if (this.name != 'slack') {
      robot.logger.error(`Adapter isn't a slack`)
      process.exit(1)
    }
    this.is_slack = true
    this._web = new WebClient(robot.adapter.options.token)
  }

  web() {
    return this._web
  }

  // Send methods

  sendEphemeral(msg, text) {
    return this.web().chat.postEphemeral({
      channel: msg.message.user.room,
      user: msg.message.user.id,
      text: text,
      as_user: true
    })
  }

  sendPost(msg, opts) {
    return this.web().chat.postMessage({
      channel: msg.message.user.room,
      as_user: true,
      ...opts
    })
  }

  sendImageLink(msg, url, alt_text) {
    return this.sendPost(msg, {
      blocks: [
        {
          "type": "image",
          "image_url": url,
          "alt_text": alt_text
        }
      ]
    })
  }

  sendSecondaryAttachmentText(msg, title, attachmentText) {
    return this.sendPost(msg, {
      text: title,
      attachments: [
        {
          text: attachmentText
        }
      ]
    })
  }

}

module.exports = SBotSlack