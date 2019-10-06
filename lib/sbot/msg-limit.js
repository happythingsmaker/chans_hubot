function msg_limit_factory(interval=1000) {
  let msg_queue = []
  let timer = null
  const msg_call = () => {
    let [cb, args] = msg_queue.shift()
    cb(...args)
  }
  const msg_loop = () => {
    if (timer == null) {
      msg_call()
      timer = setInterval(() => {
        if (msg_queue.length > 0) {
          msg_call()
        } else {
          clearInterval(timer)
          timer = null
        }
      }, interval)
    }
  }
  return (cb, ...args) => {
    msg_queue.push([cb, args])
    msg_loop()
    return true //FIXME
  }
}

const msg_limit = msg_limit_factory(1000)

// exports as a object for additional implementations
module.exports = { msg_limit_factory, msg_limit }