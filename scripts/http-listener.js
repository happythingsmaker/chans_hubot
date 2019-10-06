module.exports = (robot) => {
  // Events
  robot.router.post('/hubot/kj2lkfjwlkemf22l3i4jlkmn/event', (req, res) => {
    data = req.body
    //console.log(req.header);console.log(data)
    // only for slack verification
    if (data.challenge) {
        return res.send(data.challenge)
    }

    // TODO
    robot.logger.info('= event received')
    return res.send('OK')
  })
}
