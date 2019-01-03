const { app, BrowserWindow } = require("electron")
const path = require("path")
const url = require("url")
const DiscordRPC = require("discord-rpc")
const Butter = require("butter-remote")

let mainWindow

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 340,
        height: 250,
        resizable: true,
        title: "Popcorn Time (RP)",
        titleBarStyle: "hidden"
    })

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, "index.html"),
        protocol: "file:",
        slashes: true,
    }))

    mainWindow.on("closed", () => {
        mainWindow = null
    })
}

app.on("ready", createWindow)
app.on("window-all-closed", () => app.quit())
app.on("activate", () => {
    if (mainWindow === null) createWindow()
})

const clientId = "476385217880391682" // Don't change this

const rpc = new DiscordRPC.Client({ transport: "ipc" })

const butter = new Butter({
    debug: false
})

async function setActivity() {
    if (!rpc || !mainWindow) return

    butter.ping().then(async() => {
        const res = await butter.getPlaying()

        if (res.playing === false && !res.title) {
            const setStatus = await mainWindow.webContents.executeJavaScript(`document.querySelector("#status").style.color = "green"; document.querySelector("#status").innerHTML = "Connected"`)
            const setType = await mainWindow.webContents.executeJavaScript(`document.querySelector("#type").innerHTML = "N/A"`)
            const setTitle = await mainWindow.webContents.executeJavaScript(`document.querySelector("#title").innerHTML = "N/A"`)

            const currentTab = await butter.getCurrentTab()
            rpc.setActivity({
                details: currentTab.tab ? `Browsing ${currentTab.tab}` : null,
                largeImageKey: "popcorntime",
                largeImageText: "Popcorn Time",
                instance: false
            })
            return
        } else {
            const title = () => {
                let t = res.title
                // if (res.movie) t += ` (${res.imdb_id})` // TO-DO: get year
                if (res.episode) t += ` (S${res.season}E${res.episode})`
                return t
            }

            const setStatus = await mainWindow.webContents.executeJavaScript(`document.querySelector("#status").style.color = "green"; document.querySelector("#status").innerHTML = "Connected"`)
            const setType = await mainWindow.webContents.executeJavaScript(`document.querySelector("#type").innerHTML = "${res.movie === "movie" ? "Movie" : "Series"}"`)
            const setTitle = await mainWindow.webContents.executeJavaScript(`document.querySelector("#title").innerHTML = "${title()}"`)

            const endTimestamp = Math.round((Date.now() / 1000) + (res.duration - res.currentTime))

            rpc.setActivity({
                state: title(),
                details: `Watching ${res.movie === "movie" ? "Movie" : "Series"}`,
                endTimestamp,
                largeImageKey: "popcorntime",
                largeImageText: "Popcorn Time",
                smallImageKey: res.movie === "movie" ? "movie" : "series",
                smallImageText: res.movie === "movie" ? "Movie" : "Series",
                instance: false
            })
        }
    }).catch(async err => {
        const setStatus = await mainWindow.webContents.executeJavaScript(`document.querySelector("#status").style.color = "red"; document.querySelector("#status").innerHTML = "Not Connected"`)
        console.error(err)
    })
}

rpc.on("ready", () => {
    setActivity()

    // activity can only be set every 15 seconds
    setInterval(() => {
        setActivity()
    }, 15e3)
})

rpc.login({ clientId }).catch(console.error)