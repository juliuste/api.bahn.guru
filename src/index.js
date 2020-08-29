'use strict'

const express = require('express')
const http = require('http')
const compression = require('compression')
const cors = require('cors')
const logger = require('pino')()

const router = require('./routes')

const api = express()
const server = http.createServer(api)

api.use(compression())
api.use(cors())
api.use(router)

router.use((err, req, res, next) => {
	logger.error({ err })
	res.status(500).end('internal server error')
})

const getEnv = name => {
	const value = (process.env[name] || '').trim()
	if (!value) throw new Error(`missing env: ${name}`)
	return value
}

const port = getEnv('PORT')
server.listen(port, error => {
	if (error) {
		console.error(error)
		process.exit(1)
	}
	console.log(`Listening on ${port}.`)
})
