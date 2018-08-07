// const { webFrame } = require("electron")
// webFrame.setZoomLevelLimits(1, 1)

const interval = document.querySelector("#interval")

let timeLeft = 15;
let timer = setInterval(() => {
    timeLeft--
    interval.innerHTML = timeLeft
    if(timeLeft <= 0) {
        // clearInterval(timer)
        timeLeft = 15
    }
}, 1e3)