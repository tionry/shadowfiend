//在数据库中要创建的表
module.exports = require('mongojs')(
	require('../package.json').db, 
	['user', 'doc', 'revision', 'problem','interview']
);
