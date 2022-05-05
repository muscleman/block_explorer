const fs = require('fs')
const express = require('express')
const app = express()
const sqlite3 = require('sqlite3').verbose()
const axios = require('axios')
const JSONbig = require('json-bigint')
const BigNumber = require('bignumber.js')

let config = fs.readFileSync('config.json', 'utf8')
config = JSON.parse(config)
const api = config.api + '/json_rpc'
const front_port = config.front_port

app.use(express.static('dist'))
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*')
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept'
    )
    next()
})

let maxCount = 1000

function log(msg) {
    let t = new Date()
    console.log(
        t.getFullYear() +
            '-' +
            t.getMonth() +
            '-' +
            t.getDate() +
            ' ' +
            t.getHours() +
            ':' +
            t.getMinutes() +
            ':' +
            t.getSeconds() +
            '.' +
            t.getMilliseconds() +
            ' ' +
            msg
    )
}

const get_info = () => {
    return axios({
        method: 'get',
        url: api,
        data: {
            method: 'getinfo',
            params: { flags: 0x410 }
        },
        transformResponse: [(data) => JSONbig.parse(data)]
    })
}

const get_blocks_details = (start, count) => {
    return axios({
        method: 'get',
        url: api,
        data: {
            method: 'get_blocks_details',
            params: {
                height_start: parseInt(start ? start : 0),
                count: parseInt(count ? count : 10),
                ignore_transactions: false
            }
        },
        transformResponse: [(data) => JSONbig.parse(data)]
    })
}

const get_alt_blocks_details = (offset, count) => {
    return axios({
        method: 'get',
        url: api,
        data: {
            method: 'get_alt_blocks_details',
            params: {
                offset: parseInt(offset),
                count: parseInt(count)
            }
        },
        transformResponse: [(data) => JSONbig.parse(data)]
    })
}

const get_all_pool_tx_list = () => {
    return axios({
        method: 'get',
        url: api,
        data: {
            method: 'get_all_pool_tx_list'
        },
        transformResponse: [(data) => JSONbig.parse(data)]
    })
}

const get_pool_txs_details = (ids) => {
    return axios({
        method: 'get',
        url: api,
        data: {
            method: 'get_pool_txs_details',
            params: { ids: ids }
        },
        transformResponse: [(data) => JSONbig.parse(data)]
    })
}

const get_tx_details = (tx_hash) => {
    return axios({
        method: 'get',
        url: api,
        data: {
            method: 'get_tx_details',
            params: { tx_hash: tx_hash }
        },
        transformResponse: [(data) => JSONbig.parse(data)]
    })
}

const get_out_info = (amount, i) => {
    return axios({
        method: 'get',
        url: api,
        data: {
            method: 'get_out_info',
            params: { amount: parseInt(amount), i: parseInt(i) }
        },
        transformResponse: [(data) => JSONbig.parse(data)]
    })
}

app.get('/get_info', (req, res) => {
    blockInfo.lastBlock = lastBlock.height
    res.send(JSON.stringify(blockInfo))
})

// Blockchain page
app.get('/get_blocks_details/:start/:count', (req, res) => {
    let start = req.params.start
    let count = req.params.count

    if (start && count) {
        db.serialize(function () {
            db.all(
                'SELECT blocks.* FROM blocks ' +
                    'WHERE blocks.height >= ? ' +
                    'ORDER BY blocks.height ASC ' +
                    'LIMIT ?;',
                [start, count],
                function (err, rows) {
                    res.send(JSON.stringify(rows))
                }
            )
        })
    }
})

app.get('/get_main_block_details/:id', (req, res) => {
    let id = req.params.id.toLowerCase()
    if (id) {
        db.serialize(function () {
            db.get(
                'SELECT b2.id as next_id, b1.* FROM blocks as b1 left join blocks as b2 on b2.height > b1.height WHERE b1.id == ? ORDER BY b2.height ASC LIMIT 1;',
                [id],
                function (err, row) {
                    if (row) {
                        db.all(
                            'SELECT * FROM transactions WHERE keeper_block == ? ;',
                            [row.height],
                            function (err2, rows2) {
                                for (let i = 0; i < rows2.length; i++) {
                                    rows2[i].extra = JSON.parse(rows2[i].extra)
                                    rows2[i].ins = JSONbig(rows2[i].ins)
                                    rows2[i].outs = JSONbig(rows2[i].outs)
                                    rows2[i].attachments = JSON.parse(
                                        rows2[i].attachments
                                    )
                                }
                                row.transactions_details = rows2
                                res.send(JSON.stringify(row))
                            }
                        )
                    } else {
                        res.send(JSON.stringify('block not found'))
                    }
                }
            )
        })
    }
})

app.get('/get_tx_pool_details/:count', (req, res) => {
    let count = req.params.count
    if (count !== undefined) {
        db.serialize(function () {
            db.all(
                'SELECT * FROM pool ORDER BY timestamp DESC limit ?',
                [count],
                function (err, rows) {
                    res.send(JSON.stringify(rows))
                }
            )
        })
    } else {
        res.send("Error. Need 'count' params")
    }
})

// Alt-blocks
app.get('/get_alt_blocks_details/:offset/:count', (req, res) => {
    let offset = req.params.offset
    let count = req.params.count

    if (count > maxCount) {
        count = maxCount
    }
    db.all(
        'SELECT * FROM alt_blocks ORDER BY height DESC limit ? offset ?',
        [count, offset],
        function (err, rows) {
            res.send(JSON.stringify(rows))
        }
    )
})

app.get('/get_alt_block_details/:id', (req, res) => {
    let id = req.params.id.toLowerCase()
    if (id) {
        db.get(
            'SELECT * FROM alt_blocks WHERE hash == ? ;',
            [id],
            function (err, row) {
                res.send(JSON.stringify(row))
            }
        )
    }
})

// Transactions
app.get('/get_tx_details/:tx_hash', (req, res) => {
    let tx_hash = req.params.tx_hash.toLowerCase()
    if (tx_hash) {
        db.serialize(function () {
            db.all(
                'SELECT transactions.*, blocks.id as block_hash, blocks.timestamp as block_timestamp FROM transactions LEFT JOIN blocks ON transactions.keeper_block = blocks.height WHERE transactions.id == ? ;',
                [tx_hash],
                async function (err, row) {
                    if (row.length) {
                        res.send(JSON.stringify(row[0]))
                    } else {
                        try {
                            let response = await get_tx_details(tx_hash)
                            let data = response.data
                            if (data.result !== undefined) {
                                res.send(JSON.stringify(data.result.tx_info))
                            } else {
                                res.send("Error. Need 'tx_hash' param")
                            }
                        } catch (error) {
                            res.send("Error. Need 'tx_hash' param")
                        }
                    }
                }
            )
        })
    }
})

app.get('/get_out_info/:amount/:i', async (req, res) => {
    let amount = req.params.amount
    let i = req.params.i

    if (amount !== undefined && i !== undefined) {
        let row = await query(
            `SELECT * FROM out_info WHERE amount = ${amount} AND i = ${i}`,
            'get'
        )
        if (row === undefined) {
            let response = await get_out_info(amount, i)
            let data = response.data
            res.send(JSON.stringify({ tx_id: data.result.tx_id }))
        } else {
            res.send(JSON.stringify(row))
        }
    }
})

// Aliases
app.get('/get_aliases/:offset/:count/:search', (req, res) => {
    let offset = req.params.offset
    let count = req.params.count
    let search = req.params.search.toLowerCase()
    if (count > maxCount) {
        count = maxCount
    }
    if (search === 'all' && offset !== undefined && count !== undefined) {
        db.serialize(function () {
            db.all(
                'SELECT * FROM aliases WHERE enabled == 1 ORDER BY block DESC limit ? offset ?',
                [count, offset],
                function (err, rows) {
                    res.send(JSON.stringify(rows))
                }
            )
        })
    } else if (
        search !== undefined &&
        offset !== undefined &&
        count !== undefined
    ) {
        db.serialize(function () {
            db.all(
                "SELECT * FROM aliases WHERE enabled == 1 AND (alias LIKE '%" +
                    search +
                    "%' OR address LIKE '%" +
                    search +
                    "%' OR comment LIKE '%" +
                    search +
                    "%') ORDER BY block DESC limit ? offset ?",
                [count, offset],
                function (err, rows) {
                    res.send(JSON.stringify(rows))
                }
            )
        })
    }
})

// Charts
app.get('/get_chart/:chart/:period', (req, res) => {
    let chart = req.params.chart
    if (chart !== undefined) {
        if (chart === 'all') {
            let period = Math.round(new Date().getTime() / 1000) - 24 * 3600 // + 86400000
            let period2 = Math.round(new Date().getTime() / 1000) - 48 * 3600 // + 86400000
            if (!!req.params.period) {
                if (req.params.period !== 'all') period = req.params.period
            }

            db.serialize(function () {
                // Charts AvgBlockSize, AvgTransPerBlock, difficultyPoS, difficultyPoW
                db.all(
                    'SELECT actual_timestamp as at, block_cumulative_size as bcs, tr_count as trc, difficulty as d, type as t FROM charts WHERE actual_timestamp > ' +
                        period +
                        ' ORDER BY actual_timestamp;',
                    function (err, arrayAll) {
                        if (err) {
                            log('all charts error', err)
                        } else {
                            // Chart Confirmed Transactions Per Day
                            db.all(
                                "SELECT actual_timestamp as at, SUM(tr_count) as sum_trc FROM charts GROUP BY strftime('%Y-%m-%d', datetime(actual_timestamp, 'unixepoch')) ORDER BY actual_timestamp;",
                                function (err, rows0) {
                                    if (err) {
                                        log(
                                            'all charts confirmed-transactions-per-day',
                                            err
                                        )
                                    } else {
                                        // Chart HashRate
                                        db.all(
                                            'SELECT actual_timestamp as at, difficulty120 as d120, hashrate100 as h100, hashrate400 as h400 FROM charts WHERE type=1 AND actual_timestamp > ' +
                                                period2 +
                                                ' ORDER BY actual_timestamp;',
                                            function (err, rows1) {
                                                if (err) {
                                                    log('all hashrate', err)
                                                } else {
                                                    arrayAll[0] = rows0
                                                    arrayAll[1] = rows1
                                                    res.send(
                                                        JSON.stringify(arrayAll)
                                                    )
                                                }
                                            }
                                        )
                                    }
                                }
                            )
                        }
                    }
                )
            })
        } else if (chart === 'AvgBlockSize') {
            db.serialize(function () {
                db.all(
                    "SELECT actual_timestamp as at, avg(block_cumulative_size) as bcs FROM charts GROUP BY strftime('%Y-%m-%d, %H', datetime(actual_timestamp, 'unixepoch')) ORDER BY actual_timestamp",
                    function (err, rows) {
                        if (err) {
                            log('AvgBlockSize', err)
                        } else {
                            res.send(JSON.stringify(rows))
                        }
                    }
                )
            })
        } else if (chart === 'AvgTransPerBlock') {
            db.serialize(function () {
                db.all(
                    "SELECT actual_timestamp as at, avg(tr_count) as trc FROM charts GROUP BY strftime('%Y-%m-%d, %H', datetime(actual_timestamp, 'unixepoch')) ORDER BY actual_timestamp",
                    function (err, rows) {
                        if (err) {
                            log('AvgTransPerBlock', err)
                        } else {
                            res.send(JSON.stringify(rows))
                        }
                    }
                )
            })
        } else if (chart === 'hashRate') {
            db.serialize(function () {
                db.all(
                    "SELECT actual_timestamp as at, avg(difficulty120) as d120, avg(hashrate100) as h100, avg(hashrate400) as h400 FROM charts WHERE type=1 GROUP BY strftime('%Y-%m-%d, %H', datetime(actual_timestamp, 'unixepoch')) ORDER BY actual_timestamp",
                    function (err, rows) {
                        if (err) {
                            log('hashrate', err)
                        } else {
                            res.send(JSON.stringify(rows))
                        }
                    }
                )
            })
        } else if (chart === 'pos-difficulty') {
            db.serialize(function () {
                db.all(
                    "SELECT actual_timestamp as at, case when (max(difficulty)-avg(difficulty))>(avg(difficulty)-min(difficulty)) then max(difficulty) else min(difficulty) end as d FROM charts WHERE type=0 GROUP BY strftime('%Y-%m-%d, %H', datetime(actual_timestamp, 'unixepoch')) ORDER BY actual_timestamp",
                    function (err, rows) {
                        if (err) {
                            log('pos-difficulty', err)
                        } else {
                            db.all(
                                'SELECT actual_timestamp as at, difficulty as d FROM charts WHERE type=0 ORDER BY actual_timestamp',
                                function (err, rows2) {
                                    if (err) {
                                        log('pow-difficulty', err)
                                    } else {
                                        res.send(
                                            JSON.stringify({
                                                aggregated: rows,
                                                detailed: rows2
                                            })
                                        )
                                    }
                                }
                            )
                        }
                    }
                )
            })
        } else if (chart === 'pow-difficulty') {
            db.serialize(function () {
                db.all(
                    "SELECT actual_timestamp as at, case when (max(difficulty)-avg(difficulty))>(avg(difficulty)-min(difficulty)) then max(difficulty) else min(difficulty) end as d FROM charts WHERE type=1 GROUP BY strftime('%Y-%m-%d, %H', datetime(actual_timestamp, 'unixepoch'))  ORDER BY actual_timestamp",
                    function (err, rows) {
                        if (err) {
                            log('pow-difficulty', err)
                        } else {
                            db.all(
                                'SELECT actual_timestamp as at, difficulty as d FROM charts WHERE type=1 ORDER BY actual_timestamp',
                                function (err, rows2) {
                                    if (err) {
                                        log('pow-difficulty', err)
                                    } else {
                                        res.send(
                                            JSON.stringify({
                                                aggregated: rows,
                                                detailed: rows2
                                            })
                                        )
                                    }
                                }
                            )
                        }
                    }
                )
            })
        } else if (chart === 'ConfirmTransactPerDay') {
            db.serialize(function () {
                db.all(
                    "SELECT actual_timestamp as at, SUM(tr_count) as sum_trc FROM charts GROUP BY strftime('%Y-%m-%d', datetime(actual_timestamp, 'unixepoch')) ORDER BY actual_timestamp",
                    function (err, rows) {
                        if (err) {
                            log('ConfirmTransactPerDay', err)
                        } else {
                            res.send(JSON.stringify(rows))
                        }
                    }
                )
            })
        }
    }
})

// Search
app.get('/search_by_id/:id', async (req, res) => {
    let id = req.params.id.toLowerCase()
    if (id) {
        let row = await query(`SELECT * FROM blocks WHERE id == ${id} ;`, 'get')
        if (row === undefined) {
            let row = await query(
                `SELECT * FROM alt_blocks WHERE hash == ${id} ;`,
                'get'
            )
            if (row === undefined) {
                let row = await query(
                    `SELECT * FROM transactions WHERE id == ${id} ;`,
                    'get'
                )
                if (row === undefined) {
                    try {
                        let response = await get_tx_details(id)
                        let data = response.data
                        if (data.result) {
                            res.send(JSON.stringify({ result: 'tx' }))
                        } else {
                            db.all(
                                "SELECT * FROM aliases WHERE enabled == 1 AND (alias LIKE '%" +
                                    id +
                                    "%' OR address LIKE '%" +
                                    id +
                                    "%' OR comment LIKE '%" +
                                    id +
                                    "%') ORDER BY block DESC limit ? offset ?",
                                [1, 0],
                                function (err, rows) {
                                    if (rows.length > 0) {
                                        res.send(
                                            JSON.stringify({ result: 'alias' })
                                        )
                                    } else {
                                        res.send(
                                            JSON.stringify({
                                                result: 'NOT FOUND'
                                            })
                                        )
                                    }
                                }
                            )
                        }
                    } catch (error) {
                        res.send(JSON.stringify({ result: 'NOT FOUND' }))
                    }
                } else {
                    res.send(JSON.stringify({ result: 'tx' }))
                }
            } else {
                res.send(JSON.stringify({ result: 'alt_block' }))
            }
        } else {
            res.send(JSON.stringify({ result: 'block' }))
        }
    }
})

var lastBlock = {
    height: -1,
    id: '0000000000000000000000000000000000000000000000000000000000000000'
}

var blockInfo = {}
var now_blocks_sync = false

// market
var now_delete_offers = false

// pool
var countTrPoolServer
var statusSyncPool = false

// aliases
var countAliasesDB
var countAliasesServer

// alt_blocks
var countAltBlocksDB = 0
var countAltBlocksServer
var statusSyncAltBlocks = false

var db = new sqlite3.Database('db')
db.configure('busyTimeout', 30000)
db.serialize(function () {
    db.run(
        'create table if not exists blocks (height INTEGER UNIQUE' +
            ', actual_timestamp INTEGER' +
            ', base_reward TEXT' +
            ', blob TEXT' +
            ', block_cumulative_size INTEGER' +
            ', block_tself_size TEXT' +
            ', cumulative_diff_adjusted TEXT' +
            ', cumulative_diff_precise TEXT' +
            ', difficulty TEXT' +
            ', effective_fee_median TEXT' +
            ', id TEXT' +
            ', is_orphan INTEGER' +
            ', penalty TEXT' +
            ', prev_id TEXT' +
            ', summary_reward TEXT' +
            ', this_block_fee_median TEXT' +
            ', timestamp INTEGER' +
            ', total_fee TEXT' +
            ', total_txs_size INTEGER' +
            ', tr_count INTEGER' +
            ', type INTEGER' +
            ', miner_text_info TEXT' +
            ', pow_seed TEXT' +
            ');'
    )

    db.run('CREATE INDEX if not exists index_bl_height ON blocks(height);')
    db.run('CREATE INDEX if not exists index_bl_id ON blocks(id);')

    db.run(
        'create table if not exists transactions (keeper_block INTEGER, ' +
            'id TEXT, ' +
            'amount TEXT,' +
            'blob_size INTEGER,' +
            'extra TEXT,' +
            'fee TEXT,' +
            'ins TEXT,' +
            'outs TEXT,' +
            'pub_key TEXT,' +
            'timestamp INTEGER,' +
            'attachments TEXT' +
            ');'
    )

    db.run(
        'CREATE INDEX if not exists index_tr_keeper_block ON transactions(keeper_block);'
    )
    db.run('CREATE INDEX if not exists index_tr_id ON transactions(id);')

    db.run(
        'create table if not exists aliases (' +
            'alias TEXT,' +
            'address TEXT,' +
            'comment TEXT,' +
            'tracking_key TEXT,' +
            'block INTEGER,' +
            'transact TEXT,' +
            'enabled INTEGER' +
            ');'
    )

    db.run('CREATE INDEX if not exists index_al_block ON aliases(block);')

    db.run(
        'create table if not exists alt_blocks (' +
            'height INTEGER,' +
            'timestamp INTEGER,' +
            'actual_timestamp INTEGER,' +
            'size INTEGER,' +
            'hash TEXT,' +
            'type INTEGER,' +
            'difficulty TEXT,' +
            'cumulative_diff_adjusted TEXT,' +
            'cumulative_diff_precise TEXT,' +
            'is_orphan INTEGER,' +
            'base_reward TEXT,' +
            'total_fee TEXT,' +
            'penalty TEXT,' +
            'summary_reward TEXT,' +
            'block_cumulative_size INTEGER,' +
            'this_block_fee_median TEXT,' +
            'effective_fee_median TEXT,' +
            'total_txs_size INTEGER,' +
            'transactions_details TEXT,' +
            'miner_txt_info TEXT,' +
            'pow_seed TEXT' +
            ');'
    )

    db.run('CREATE INDEX if not exists index_ab_hash ON alt_blocks(hash);')

    db.run(
        'create table if not exists pool (' +
            'blob_size TEXT,' +
            'fee TEXT,' +
            'id TEXT,' +
            'timestamp TEXT' +
            ');'
    )

    db.run('CREATE INDEX if not exists index_pool_id ON pool(id);')

    db.run(
        'create table if not exists charts (' +
            'height INTEGER' +
            ', actual_timestamp INTEGER' +
            ', block_cumulative_size INTEGER' +
            ', cumulative_diff_precise TEXT' +
            ', difficulty TEXT' +
            ', tr_count INTEGER' +
            ', type INTEGER' +
            ', difficulty120 TEXT' +
            ', hashrate100 TEXT' +
            ', hashrate400 TEXT' +
            ');'
    )

    db.run('CREATE INDEX if not exists index_bl_height ON charts(height);')

    db.run('DELETE FROM alt_blocks')
    db.get(
        'SELECT * FROM blocks WHERE height=(SELECT MAX(height) FROM blocks)',
        [],
        function (err, row) {
            if (err) log('select from blocks', err)
            if (row) {
                lastBlock = row
            }
            db.get(
                'SELECT COUNT(*) AS alias FROM aliases',
                function (err, row) {
                    if (err) log('select count alias', err)
                    if (row) {
                        countAliasesDB = row.alias
                    }
                    db.get(
                        'SELECT COUNT(*) AS height FROM alt_blocks',
                        async function (err, row) {
                            if (err) log('select count alt-blocks', err)
                            if (row) {
                                countAltBlocksDB = row.height
                            }
                            await getInfoTimer()
                        }
                    )
                }
            )
        }
    )

    db.run(
        'create table if not exists out_info (' +
            'amount TEXT,' +
            'i INTEGER,' +
            'tx_id TEXT,' +
            'block INTEGER' +
            ');'
    )

    db.run(
        'CREATE UNIQUE INDEX if not exists index_out_info ON out_info(amount, i, tx_id);'
    )
})

var block_array = []
var pools_array = []

var serverTimeout = 30

async function syncPool() {
    try {
        statusSyncPool = true
        countTrPoolServer = blockInfo.tx_pool_size
        if (countTrPoolServer === 0) {
            await query('DELETE FROM pool', 'run')
            statusSyncPool = false
        } else {
            let response = await get_all_pool_tx_list()
            const data = response.data
            if (data.result.ids) {
                pools_array = data.result.ids ? data.result.ids : []
                try {
                    await query(
                        `DELETE FROM pool WHERE id NOT IN ( '${pools_array.join(
                            "','"
                        )}' )`,
                        'run'
                    )
                } catch (error) {
                    log('pool delete', error)
                }
                try {
                    let rows = await query('SELECT id FROM pool', 'all')
                    var new_ids = []
                    for (var j = 0; j < pools_array.length; j++) {
                        var find = false
                        for (var i = 0; i < rows.length; i++) {
                            if (pools_array[j] === rows[i].id) {
                                find = true
                                break
                            } else {
                                log('pools_array[j] !== rows[i].id')
                            }
                        }
                        if (!find) {
                            new_ids.push(pools_array[j])
                        }
                    }

                    if (new_ids.length) {
                        try {
                            let response = await get_pool_txs_details(new_ids)
                            let data = response.data
                            if (data.result && data.result.txs) {
                                db.serialize(function () {
                                    log('begin transaction, syncPool')
                                    db.run('begin transaction')
                                    var stmt = db.prepare(
                                        'INSERT INTO pool VALUES (?,?,?,?)'
                                    )
                                    for (var x in data.result.txs) {
                                        stmt.run(
                                            data.result.txs[x].blob_size,
                                            data.result.txs[x].fee,
                                            data.result.txs[x].id,
                                            data.result.txs[x].timestamp
                                        )
                                    }
                                    stmt.finalize()
                                    db.run('commit')
                                    log('commit, syncPool')
                                    statusSyncPool = false
                                })
                            } else {
                                statusSyncPool = false
                            }
                        } catch (error) {
                            statusSyncPool = false
                        }
                    } else {
                        statusSyncPool = false
                    }
                } catch (error) {
                    log('select id from pool', error)
                }
            } else {
                statusSyncPool = false
            }
        }
    } catch (error) {
        query('DELETE FROM pool', 'run')
        statusSyncPool = false
    }
}

function parseComment(comment) {
    var splitComment = comment.split(/\s*,\s*/)
    var splitResult = splitComment[4]
    if (splitResult) {
        var result = splitResult.split(/\s*"\s*/)
        var input = result[3].toString()
        if (input) {
            var output = Buffer.from(input, 'hex')
            return output.toString()
        } else {
            return ''
        }
    } else {
        return ''
    }
}

function parseTrackingKey(trackingKey) {
    var splitKey = trackingKey.split(/\s*,\s*/)
    var resultKey = splitKey[5]
    if (resultKey) {
        var key = resultKey.split(':')
        var keyValue = key[1].replace(/\[|\]/g, '')
        if (keyValue) {
            keyValue.toString()
            keyValue = keyValue.replace(/\s+/g, '')
            return keyValue
        } else {
            return ''
        }
    } else {
        return ''
    }
}

async function syncTransactions() {
    if (block_array.length > 0) {
        var localBl = block_array[0]
        if (localBl.transactions_details.length === 0) {
            if (localBl.tr_out.length === 0) {
                db.run('begin transaction')
                var hashrate100 = 0
                var hashrate400 = 0

                if (localBl.type === 1) {
                    try {
                        let rows = await query(
                            `SELECT height, actual_timestamp, cumulative_diff_precise FROM charts WHERE type=1`,
                            'all'
                        )
                        for (let i = 0; i < rows.length; i++) {
                            hashrate100 =
                                i > 99 - 1
                                    ? (localBl['cumulative_diff_precise'] -
                                          rows[rows.length - 100][
                                              'cumulative_diff_precise'
                                          ]) /
                                      (localBl['actual_timestamp'] -
                                          rows[rows.length - 100][
                                              'actual_timestamp'
                                          ])
                                    : 0
                            hashrate400 =
                                i > 399 - 1
                                    ? (localBl['cumulative_diff_precise'] -
                                          rows[rows.length - 400][
                                              'cumulative_diff_precise'
                                          ]) /
                                      (localBl['actual_timestamp'] -
                                          rows[rows.length - 400][
                                              'actual_timestamp'
                                          ])
                                    : 0
                        }

                        let sql = `INSERT INTO charts VALUES (
                                ${localBl.height}, 
                                ${localBl.actual_timestamp}, 
                                ${localBl.block_cumulative_size}, 
                                '${localBl.cumulative_diff_precise.toString()}', 
                                '${localBl.difficulty.toString()}', 
                                ${localBl.tr_count ? localBl.tr_count : 0}, 
                                ${localBl.type}, 
                                '${(localBl.difficulty / 120).toFixed(0)}', 
                                '${hashrate100}', 
                                '${hashrate400}');`
                        await query(sql, 'run')
                    } catch (error) {
                        log('syncTransactions', error)
                    }
                } else {
                    let sql = `INSERT INTO charts VALUES (${localBl.height}, 
                            ${localBl.actual_timestamp}, 
                            ${localBl.block_cumulative_size}, 
                            '${localBl.cumulative_diff_precise.toString()}', 
                            '${localBl.difficulty.toString()}', 
                            ${localBl.tr_count ? localBl.tr_count : 0}, 
                            ${localBl.type}, 
                            '0', 
                            '0', 
                            '0');`
                    await query(sql, 'run')
                }

                let sql = `INSERT INTO blocks VALUES (${localBl.height},
                        '${localBl.actual_timestamp}',
                        '${localBl.base_reward}',
                        '${localBl.blob}',
                        ${localBl.block_cumulative_size},
                        '${localBl.block_tself_size}',
                        '${localBl.cumulative_diff_adjusted.toString()}',
                        '${localBl.cumulative_diff_precise.toString()}',
                        '${localBl.difficulty.toString()}',
                        '${localBl.effective_fee_median}',
                        '${localBl.id}',
                        ${localBl.is_orphan},
                        '${localBl.penalty}',
                        '${localBl.prev_id}',
                        '${localBl.summary_reward}',
                        '${localBl.this_block_fee_median}',
                        ${localBl.timestamp},
                        '${localBl.total_fee.toString()}',
                        ${localBl.total_txs_size},
                        ${localBl.tr_count ? localBl.tr_count : 0},
                        ${localBl.type},
                        '${localBl.miner_text_info}',
                        '${localBl.pow_seed}');`
                await query(sql, 'run')
                log('commit, syncTransactions')
                db.run('commit')
                lastBlock = block_array.splice(0, 1)[0]
                log(
                    'BLOCKS: db =' +
                        lastBlock.height +
                        '/server =' +
                        blockInfo.height +
                        ' transaction left = ' +
                        localBl.tr_count
                )
                await delay(serverTimeout)
                await syncTransactions()
            } else {
                var localOut = localBl.tr_out[0]
                let localOutAmount = new BigNumber(localOut.amount).toNumber()

                try {
                    let response = await get_out_info(
                        localOutAmount,
                        localOut.i
                    )
                    let data2 = response.data

                    log('begin transaction else side, syncTransactions')
                    db.run('begin transaction')
                    let sql = `REPLACE INTO out_info VALUES ('${localOut.amount.toString()}', 
                                ${localOut.i}, 
                                '${data2.result.tx_id}', 
                                ${localBl.height});`
                    await query(sql, 'run')
                    localBl.tr_out.splice(0, 1)
                    log('commit else side, syncTransactions')
                    db.run('commit')
                    log('tr_out left = ' + localBl.tr_out.length)
                    await delay(serverTimeout)
                    await syncTransactions()
                } catch (error) {
                    log('syncTransactions() get_out_info ERROR', error)
                    now_blocks_sync = false
                }
            }
        } else {
            if (localBl.tr_count === undefined)
                localBl.tr_count = localBl.transactions_details.length
            if (localBl.tr_out === undefined) localBl.tr_out = []
            var localTr = localBl.transactions_details.splice(0, 1)[0]
            try {
                let response = await get_tx_details(localTr.id)
                let data = response.data
                var extra = data.result.tx_info.extra

                for (var item in extra) {
                    if (extra[item].type === 'alias_info') {
                        var arr = extra[item].short_view.split('-->')
                        var aliasName = arr[0]
                        var aliasAddress = arr[1]
                        var aliasComment = parseComment(
                            extra[item].datails_view
                        )
                        var aliasTrackingKey = parseTrackingKey(
                            extra[item].datails_view
                        )
                        var aliasBlock = localBl.height
                        var aliasTransaction = localTr.id
                        await query(
                            `UPDATE aliases SET enabled=0 WHERE alias == '${aliasName}';`,
                            'run'
                        )
                        let sql = `REPLACE INTO aliases VALUES ('${aliasName}',
                            '${aliasAddress}',
                            '${aliasComment}',
                            '${aliasTrackingKey}',
                            '${aliasBlock}',
                            '${aliasTransaction}',
                            ${1}
                        );`
                        await query(sql, 'run')
                    }
                }

                var ins = data.result.tx_info.ins
                for (var item in ins) {
                    if (ins[item].global_indexes) {
                        localBl.tr_out.push({
                            amount: ins[item].amount,
                            i: ins[item].global_indexes[0]
                        })
                    }
                }

                let sql = `REPLACE INTO transactions VALUES (
                        '${data.result.tx_info.keeper_block}',
                        '${data.result.tx_info.id}',
                        '${data.result.tx_info.amount.toString()}',
                        ${data.result.tx_info.blob_size},
                        '${JSON.stringify(data.result.tx_info.extra)}',
                        '${data.result.tx_info.fee.toString()}',
                        '${JSON.stringify(data.result.tx_info.ins)}',
                        '${JSON.stringify(data.result.tx_info.outs)}',
                        '${data.result.tx_info.pub_key}',
                        ${data.result.tx_info.timestamp},
                        '${JSON.stringify(data.result.tx_info.attachments)}'
                );`
                await query(sql, 'run')
                await delay(serverTimeout)
                log(
                    'BLOCKS: db =' +
                        localBl.height +
                        '/ server =' +
                        blockInfo.height +
                        ' transaction left = ' +
                        localBl.transactions_details.length
                )
                await syncTransactions()
            } catch (error) {
                log('syncTransactions() get_tx_details ERROR')
                log(data)
                now_blocks_sync = false
            }
        }
    }
}

async function syncBlocks() {
    try {
        var count = blockInfo.height - lastBlock.height + 1
        if (count > 100) {
            count = 100
        }
        if (count < 0) {
            count = 1
        }
        let response = await get_blocks_details(lastBlock.height + 1, count)
        let body2 = response.data
        var localBlocks =
            body2.result && body2.result.blocks ? body2.result.blocks : []
        if (localBlocks.length && lastBlock.id === localBlocks[0].prev_id) {
            block_array = localBlocks
            await syncTransactions()
            if (lastBlock.height >= blockInfo.height - 1) {
                now_blocks_sync = false
            } else {
                await delay(serverTimeout)
                await syncBlocks()
            }
        } else {
            const deleteCount = 100
            const height = parseInt(lastBlock.height) - deleteCount
            await query(`DELETE FROM blocks WHERE height > ${height};`, 'run')
            await query(`DELETE FROM charts WHERE height > ${height};`, 'run')
            await query(
                `DELETE FROM transactions WHERE keeper_block > ${height};`,
                'run'
            )
            await query(
                `UPDATE aliases SET enabled=1 WHERE transact IN (SELECT transact FROM aliases WHERE alias IN (select alias from aliases where block > ${height}`,
                'run'
            )
            await query(`DELETE FROM aliases WHERE block > ${height};`, 'run')
            await query(`DELETE FROM out_info WHERE block > ${height};`, 'run')
            const row = await query(
                'SELECT * FROM blocks WHERE  height=(SELECT MAX(height) FROM blocks);',
                'get'
            )
            if (row) {
                lastBlock = row
            } else {
                lastBlock = {
                    height: -1,
                    id: '0000000000000000000000000000000000000000000000000000000000000000'
                }
            }
            await delay(serverTimeout)
            await syncBlocks()
        }
    } catch (error) {
        log('syncBlocks() get_blocks_details ERROR')
        log(error)
        now_blocks_sync = false
    }
}

const query = (command, method = 'all') => {
    return new Promise((resolve, reject) => {
        db[method](command, (error, result) => {
            if (error) {
                reject(error)
            } else {
                resolve(result)
            }
        })
    })
}

async function syncAltBlocks() {
    statusSyncAltBlocks = true
    try {
        await query('DELETE FROM alt_blocks', 'run')
        let response = await get_alt_blocks_details(0, countAltBlocksServer)
        let data = response.data
        for (var x in data.result.blocks) {
            let sql = `INSERT INTO alt_blocks VALUES (
            ${data.result.blocks[x].height},
            ${data.result.blocks[x].timestamp},
            ${data.result.blocks[x].actual_timestamp},
            ${data.result.blocks[x].block_cumulative_size},
            '${data.result.blocks[x].id}',
            ${data.result.blocks[x].type},
            '${data.result.blocks[x].difficulty.toString()}',
            '${data.result.blocks[x].cumulative_diff_adjusted.toString()}',
            '${data.result.blocks[x].cumulative_diff_precise.toString()}',
            ${data.result.blocks[x].is_orphan},
            '${data.result.blocks[x].base_reward}',
            '${data.result.blocks[x].total_fee.toString()}',
            '${data.result.blocks[x].penalty}',
            '${data.result.blocks[x].summary_reward}',
            ${data.result.blocks[x].block_cumulative_size},
            '${data.result.blocks[x].this_block_fee_median}',
            '${data.result.blocks[x].effective_fee_median}',
            ${data.result.blocks[x].total_txs_size},
            '${JSON.stringify(data.result.blocks[x].transactions_details)}',
            '${data.result.blocks[x].miner_text_info}',
            ''
            );`
            await query(sql, 'run')
        }
        try {
            let rows = await query(
                'SELECT COUNT(*) AS height FROM alt_blocks',
                'get'
            )
            if (rows) countAltBlocksDB = rows.height
            statusSyncAltBlocks = false
        } catch (error) {
            log(error)
        }
    } catch (error) {
        statusSyncAltBlocks = false
    }
}

async function getInfoTimer() {
    if (now_delete_offers === false) {
        try {
            let response = await get_info()
            let body = response.data
            blockInfo = body.result
            countAliasesServer = blockInfo.alias_count
            countAltBlocksServer = blockInfo.alt_blocks_count
            countTrPoolServer = blockInfo.tx_pool_size

            if (statusSyncPool === false) {
                let rows = await query(
                    'SELECT COUNT(*) AS transactions FROM pool',
                    'get'
                )
                if (rows) {
                    if (rows.transactions !== countTrPoolServer) {
                        log(
                            'need update pool transactions db=' +
                                rows.transactions +
                                ' server=' +
                                countTrPoolServer
                        )
                        await syncPool()
                    }
                }
            }

            if (statusSyncAltBlocks === false) {
                if (countAltBlocksServer !== countAltBlocksDB) {
                    log(
                        'need update alt-blocks db=' +
                            countAltBlocksDB +
                            ' server=' +
                            countAltBlocksServer
                    )
                    await syncAltBlocks()
                }
            }
            if (
                lastBlock.height !== blockInfo.height - 1 &&
                now_blocks_sync === false
            ) {
                log(
                    'need update blocks db=' +
                        lastBlock.height +
                        ' server=' +
                        blockInfo.height
                )
                log(
                    'need update aliases db=' +
                        countAliasesDB +
                        ' server=' +
                        countAliasesServer
                )
                now_blocks_sync = true
                await syncBlocks()
            }
            await delay(10000)
            await getInfoTimer()
        } catch (error) {
            log('getInfoTimer() get_info error')
            blockInfo.daemon_network_state = 0
            await delay(300000)
            await getInfoTimer()
        }
    } else {
        await delay(10000)
        await getInfoTimer()
    }
}

const delay = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

// API
app.get('/api/get_info/:flags', (req, res) => {
    let flags = req.params.flags
    axios({
        method: 'get',
        url: api,
        data: {
            method: 'getinfo',
            params: { flags: parseInt(flags) }
        },
        transformResponse: [(data) => JSONbig.parse(data)]
    })
        .then((response) => {
            res.send(JSON.stringify(response.data))
        })
        .catch(function (error) {
            log('api get_info', error)
        })
})

app.get('/api/get_total_coins', (req, res) => {
    axios({
        method: 'get',
        url: api,
        data: {
            method: 'getinfo',
            params: { flags: parseInt(4294967295) }
        },
        transformResponse: [(data) => JSONbig.parse(data)]
    })
        .then((response) => {
            let str = response.data.result.total_coins
            let result
            let totalCoins = Number(str)
            if (typeof totalCoins === 'number') {
                result = parseInt(totalCoins) / 1000000000000
            }
            let r2 = result.toFixed(2)
            res.send(r2)
        })
        .catch(function (error) {
            log('api get_info', error)
        })
})

app.get('/api/get_blocks_details/:start/:count', (req, res) => {
    let start = req.params.start
    let count = req.params.count
    axios({
        method: 'get',
        url: api,
        data: {
            method: 'get_blocks_details',
            params: {
                height_start: parseInt(start ? start : 0),
                count: parseInt(count ? count : 10),
                ignore_transactions: false
            }
        },
        transformResponse: [(data) => JSONbig.parse(data)]
    })
        .then(function (response) {
            res.send(JSON.stringify(response.data))
        })
        .catch(function (error) {
            log('api get_blocks_details failed', error)
        })
})

app.get('/api/get_main_block_details/:id', (req, res) => {
    let id = req.params.id
    axios({
        method: 'get',
        url: api,
        data: {
            method: 'get_main_block_details',
            params: {
                id: id
            }
        },
        transformResponse: [(data) => JSONbig.parse(data)]
    })
        .then(function (response) {
            res.send(JSON.stringify(response.data))
        })
        .catch(function (error) {
            log('api get_main_block_details failed', error)
        })
})

app.get('/api/get_alt_blocks_details/:offset/:count', (req, res) => {
    let offset = req.params.offset
    let count = req.params.count
    axios({
        method: 'get',
        url: api,
        data: {
            method: 'get_alt_blocks_details',
            params: {
                offset: parseInt(offset),
                count: parseInt(count)
            }
        },
        transformResponse: [(data) => JSONbig.parse(data)]
    })
        .then(function (response) {
            res.send(JSON.stringify(response.data))
        })
        .catch(function (error) {
            log('api get_alt_blocks_details failed', error)
        })
})

app.get('/api/get_alt_block_details/:id', (req, res) => {
    let id = req.params.id
    axios({
        method: 'get',
        url: api,
        data: {
            method: 'get_alt_block_details',
            params: {
                id: id
            }
        },
        transformResponse: [(data) => JSONbig.parse(data)]
    })
        .then(function (response) {
            res.send(JSON.stringify(response.data))
        })
        .catch(function (error) {
            log('api get_alt_block_details failed', error)
        })
})

app.get('/api/get_all_pool_tx_list', (req, res) => {
    axios({
        method: 'get',
        url: api,
        data: {
            method: 'get_all_pool_tx_list'
        },
        transformResponse: [(data) => JSONbig.parse(data)]
    })
        .then((response) => {
            res.send(JSON.stringify(response.data))
        })
        .catch(function (error) {
            log('api get_all_pool_tx_list failed', error)
        })
})

app.get('/api/get_pool_txs_details', (req, res) => {
    axios({
        method: 'get',
        url: api,
        data: {
            method: 'get_pool_txs_details'
        },
        transformResponse: [(data) => JSONbig.parse(data)]
    })
        .then((response) => {
            res.send(JSON.stringify(response.data))
        })
        .catch(function (error) {
            log('api get_pool_txs_details failed', error)
        })
})

app.get('/api/get_pool_txs_brief_details', (req, res) => {
    axios({
        method: 'get',
        url: api,
        data: {
            method: 'get_pool_txs_brief_details'
        },
        transformResponse: [(data) => JSONbig.parse(data)]
    })
        .then((response) => {
            res.send(JSON.stringify(response.data))
        })
        .catch(function (error) {
            log('api get_pool_txs_details failed', error)
        })
})

app.get('/api/get_tx_details/:tx_hash', (req, res) => {
    let tx_hash = req.params.tx_hash
    axios({
        method: 'get',
        url: api,
        data: {
            method: 'get_tx_details',
            params: { tx_hash: tx_hash }
        },
        transformResponse: [(data) => JSONbig.parse(data)]
    })
        .then((response) => {
            res.send(JSON.stringify(response.data))
        })
        .catch(function (error) {
            log('api get_tx_details failed', error)
        })
})

// app.get('/api/get_out_info/:amount/:i', (req, res) => {
//     let amount = req.params.amount
//     let i = req.params.i
//     axios({
//         method: 'get',
//         url: api,
//         data: {
//             method: 'get_out_info',
//             params: {'amount': amount, 'i': i},
//         },
//         transformResponse: [data => JSONbig.parse(data)]
//     })
//         .then((response) => {
//             res.send(JSON.stringify(response.data))
//         })
//         .catch(function (error) {
//             log('api get_tx_details failed', error)
//         })
// })

app.use(function (req, res) {
    res.sendFile(__dirname + '/dist/index.html')
})

// Start the server
const server = app.listen(parseInt(front_port), (req, res, error) => {
    if (error) return log(`Error: ${error}`)
    log(`Server listening on port ${server.address().port}`)
})
