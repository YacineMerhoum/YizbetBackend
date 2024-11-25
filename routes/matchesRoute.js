const fs = require("fs")
const path = require("path")
const express = require("express")
const axios = require("axios")
const cron = require("node-cron")
require("dotenv").config()

const router = express.Router()

const dataDir = path.resolve(__dirname, "../data")
router.use("/data", express.static(dataDir))

async function fetchDataAndSaveToFile() {
  try {
    console.log("Fetching data from API...")
    const response = await axios.get(process.env.FOOTBALL_API_URL, {
      headers: {
        "X-Auth-Token": process.env.FOOTBALL_API_TOKEN,
      },
    })
    const data = response.data
    

    const updatedData = {
      updatedAt: new Date().toISOString(),
      data: data,
    }

    if (!fs.existsSync(dataDir)) {
      console.log(`Creating directory: ${dataDir}`)
      fs.mkdirSync(dataDir, { recursive: true })
    }

    const filePath = path.join(dataDir, "matchesRoute.json")
    console.log(`Saving data to ${filePath}...`)
    fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2))
    console.log(`Data saved successfully to ${filePath}`)
  } catch (error) {
    console.error(
      "Error fetching and saving data:",
      error
    )
  }
}
// cron.schedule('*/10 * * * * *', () => {
cron.schedule('0 * * * *', () => {
  console.log(
    "Executing scheduled task: fetching Ligue 1"
  )
  fetchDataAndSaveToFile();
})

router.get("/matches", (req, res) => {
  try {
    const filePath = path.join(dataDir, "matchesRoute.json")
    console.log(`Reading data from ${filePath}...`)
    const data = fs.readFileSync(filePath, "utf-8")
    res.json(JSON.parse(data))
  } catch (error) {
    console.error(
      "Error reading data from JSON file:",
      error
    );
    res.status(500).send("Error retrieving data")
  }
})

module.exports = router
