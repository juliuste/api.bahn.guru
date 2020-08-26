'use strict'

const express = require('express')
const http = require('http')
const compression = require('compression')

const router = require('./routes')

const api = express()
const server = http.createServer(api)

api.use(compression())
api.use(router)

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
