module.exports = require('mongojs')(
	require('../package.json').db, 
	['user', 'doc', 'revision', 'problem','interview','lock']
);
