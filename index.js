const tokens = require('./custom_modules/prismarine-tokens/index')
const ProxyAgent = require('proxy-agent')
const fs = require('fs')

const tokensFolder = './data/tokens/'
const proxyPath = './data/proxys.txt'
const accountsPath = './data/credentials.txt'
const fileAccountsSuccess = './data/successful.txt'
const fileAccountsFailed = './data/failed.txt'
const tokensDebug = true
const AccountsPerProxy = 10

const proxys = fs.readFileSync(proxyPath, 'utf8').split('\n')
let counter = 0

const accounts = fs.readFileSync(accountsPath, 'utf8').split('\n')

authAccounts().then(data => {
	console.log('Successful ' + data.success.length)
	console.log('Failed ' + data.failed.length)
	fs.writeFile(fileAccountsSuccess, data.success.join('\n'), (err) => {
		if (err) console.error(err)
	})
	fs.writeFile(fileAccountsFailed, data.failed.join('\n'), (err) => {
		if (err) console.error(err)
	})
})

function authAccounts() {
	return new Promise(async (resolve) => {
		const listSuccess = []
		const listFailed = []
		let currentProxy
		for (let i = 0; i < accounts.length; i++) {
			if (i % AccountsPerProxy === 0) {
				if (counter === proxys.length) {
					console.error('All proxys used')
					break
				}
				currentProxy = proxys[counter]
				counter += 1
			}
			const [username, password] = accounts[i].split(':')
			let session_options

			try {
				session_options = await use({
					agent: new ProxyAgent({protocol: 'socks5:', host: currentProxy.host, port: currentProxy.port}),
					tokensLocation: tokensFolder + `${username}_token.json`,
					username,
					password,
					tokensDebug
				})
			} catch (e) {
				console.error(username + ' ' + e.message)
				listFailed.push(username)
				continue
			}
			if (!session_options.session) {
				console.error('Auth failed look at logs')
			} else {
				listSuccess.push(session_options.username)
			}
		}
		resolve({
			success: listSuccess,
			failed: listFailed
		})
	})
}

function use(options) {
	return new Promise((resolve, reject) => {
		tokens.use(options,(err, option_session) => {
			if (err) {
				reject(err)
				return
			}
			resolve(option_session)
		})
	})
}

