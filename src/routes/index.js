'use strict'

const { Router } = require('express')

const router = new Router()

router.route('*').get(async (req, res, next) => {
	console.log('the example deployment has been called!', new Date())
	res.end('hello! it works!')
})

module.exports = router
