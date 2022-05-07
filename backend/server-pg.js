const fs = require('fs')
const express = require('express')
const app = express()
const { Pool } = require('pg')
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

const db = new Pool({
    user: 'zano',
    host: '10.0.0.13',
    port: 5432,
    database: 'db',
    password: '123456'
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
app.get('/get_blocks_details/:start/:count', async (req, res) => {
    let start = req.params.start
    let count = req.params.count

    if (start && count) {
        try {
            let result = await db.query(
                `SELECT blocks.* FROM blocks WHERE blocks.height >= ${start} ORDER BY blocks.height ASC LIMIT ${count};`
            )
            res.send(JSON.stringify(JSON.stringify(result.rows[0])))
        } catch (error) {
            log('get_blocks_details', error)
        }
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

app.get('/get_tx_pool_details/:count', async (req, res) => {
    let count = req.params.count
    if (count !== undefined) {
        try {
            let result = await db.query(
                `SELECT * FROM pool ORDER BY timestamp DESC limit ${count};`
            )
            res.send(JSON.stringify(JSON.stringify(result.rows[0])))
        } catch (error) {
            log('get_tx_pool_details', error)
        }
    } else {
        res.send("Error. Need 'count' params")
    }
})

// Alt-blocks
app.get('/get_alt_blocks_details/:offset/:count', async (req, res) => {
    let offset = req.params.offset
    let count = req.params.count

    if (count > maxCount) {
        count = maxCount
    }
    try {
        let result = await db.query(
            `SELECT * FROM alt_blocks ORDER BY height DESC limit ${count} offset ${offset};`
        )
        res.send(JSON.stringify(JSON.stringify(result.rows[0])))
    } catch (error) {
        log('get_alt_block_details', error)
    }
})

app.get('/get_alt_block_details/:id', async (req, res) => {
    let id = req.params.id.toLowerCase()
    if (id) {
        try {
            let result = await db.query(
                `SELECT * FROM alt_blocks WHERE hash == ${id};`
            )
            res.send(JSON.stringify(JSON.stringify(result.rows[0])))
        } catch (error) {
            log('get_alt_block_details', error)
        }
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
        let result = await db.query(
            `SELECT * FROM out_info WHERE amount = ${amount} AND i = ${i}`
        )
        if (result === undefined) {
            let response = await get_out_info(amount, i)
            res.send(JSON.stringify({ tx_id: response.data.result.tx_id }))
        } else {
            res.send(JSON.stringify(result.rows[0]))
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
app.get('/get_chart/:chart/:period', async (req, res) => {
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
            let result = null
            try {
                result = await db.query(
                    `SELECT actual_timestamp as at, avg(block_cumulative_size) as bcs FROM charts GROUP BY strftime('%Y-%m-%d, %H', datetime(actual_timestamp, 'unixepoch')) ORDER BY actual_timestamp;`
                )
                res.send(JSON.stringify(JSON.stringify(result.rows[0])))
            } catch (error) {
                log('pow-AvgBlockSize', error)
            }
        } else if (chart === 'AvgTransPerBlock') {
            let result = null
            try {
                result = await db.query(
                    `SELECT actual_timestamp as at, avg(tr_count) as trc FROM charts GROUP BY strftime('%Y-%m-%d, %H', datetime(actual_timestamp, 'unixepoch')) ORDER BY actual_timestamp;`
                )
                res.send(JSON.stringify(JSON.stringify(result.rows[0])))
            } catch (error) {
                log('pow-AvgTransPerBlock', error)
            }
        } else if (chart === 'hashRate') {
            let result = null
            try {
                result = await db.query(
                    `SELECT actual_timestamp as at, avg(difficulty120) as d120, avg(hashrate100) as h100, avg(hashrate400) as h400 FROM charts WHERE type=1 GROUP BY strftime('%Y-%m-%d, %H', datetime(actual_timestamp, 'unixepoch')) ORDER BY actual_timestamp;`
                )
                res.send(JSON.stringify(result.rows[0]))
            } catch (error) {
                log('pow-difficulty', error)
            }
        } else if (chart === 'pos-difficulty') {
            let result = null
            let result1 = null
            try {
                result = await db.query(
                    `SELECT actual_timestamp as at, case when (max(difficulty)-avg(difficulty))>(avg(difficulty)-min(difficulty)) then max(difficulty) else min(difficulty) end as d FROM charts WHERE type=0 GROUP BY strftime('%Y-%m-%d, %H', datetime(actual_timestamp, 'unixepoch')) ORDER BY actual_timestamp;`
                )
            } catch (error) {
                log('pow-difficulty', error)
            }
            try {
                result1 = await db.query(
                    'SELECT actual_timestamp as at, difficulty as d FROM charts WHERE type=0 ORDER BY actual_timestamp;'
                )
                res.send(
                    JSON.stringify({
                        aggregated: result.rows[0],
                        detailed: result1.rows[0]
                    })
                )
            } catch (error) {
                log('pow-difficulty', error)
            }
        } else if (chart === 'pow-difficulty') {
            let result = null
            let result1 = null
            try {
                result = await db.query(
                    `SELECT actual_timestamp as at, case when (max(difficulty)-avg(difficulty))>(avg(difficulty)-min(difficulty)) then max(difficulty) else min(difficulty) end as d FROM charts WHERE type=1 GROUP BY strftime('%Y-%m-%d, %H', datetime(actual_timestamp, 'unixepoch'))  ORDER BY actual_timestamp;`
                )
            } catch (error) {
                log('pow-difficulty', error)
            }
            try {
                result1 = await db.query(
                    'SELECT actual_timestamp as at, difficulty as d FROM charts WHERE type=1 ORDER BY actual_timestamp;'
                )
                res.send(
                    JSON.stringify({
                        aggregated: result.rows[0],
                        detailed: result1.rows[0]
                    })
                )
            } catch (error) {
                log('pow-difficulty', error)
            }
        } else if (chart === 'ConfirmTransactPerDay') {
            try {
                let result = await db.query(
                    "SELECT actual_timestamp as at, SUM(tr_count) as sum_trc FROM charts GROUP BY strftime('%Y-%m-%d', datetime(actual_timestamp, 'unixepoch')) ORDER BY actual_timestamp;"
                )
                if (result.rowCount > 0)
                    res.send(JSON.stringify(result.rows[0]))
            } catch (error) {
                log('ConfirmTransactPerDay', error)
            }
        }
    }
})

// Search
app.get('/search_by_id/:id', async (req, res) => {
    let id = req.params.id.toLowerCase()
    if (id) {
        let result = await db.query(`SELECT * FROM blocks WHERE id == ${id} ;`)
        if (result === undefined) {
            result = await db.query(
                `SELECT * FROM alt_blocks WHERE hash == ${id} ;`
            )
            if (result === undefined) {
                result = await db.query(
                    `SELECT * FROM transactions WHERE id == ${id} ;`
                )
                if (result === undefined) {
                    try {
                        let response = await get_tx_details(id)
                        if (response.data.result) {
                            res.send(JSON.stringify({ result: 'tx' }))
                        } else {
                            let result = await db.query(
                                "SELECT * FROM aliases WHERE enabled == 1 AND (alias LIKE '%" +
                                    id +
                                    "%' OR address LIKE '%" +
                                    id +
                                    "%' OR comment LIKE '%" +
                                    id +
                                    "%') ORDER BY block DESC limit 1 offset 0;"
                            )

                            if (result.rowCount > 0) {
                                res.send(JSON.stringify({ result: 'alias' }))
                            } else {
                                res.send(
                                    JSON.stringify({
                                        result: 'NOT FOUND'
                                    })
                                )
                            }
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

const start = async () => {
    try {
        await db.query('DELETE FROM alt_blocks;')
        let result = await db.query(
            'SELECT * FROM blocks WHERE height=(SELECT MAX(height) FROM blocks);'
        )
        if (result) {
            lastBlock = result.rows[0]
        }
        result = await db.query('SELECT COUNT(*) AS alias FROM aliases;')
        if (result) countAliasesDB = result.rows[0].alias

        result = await db.query('SELECT COUNT(*) AS height FROM alt_blocks;')
        if (result) countAltBlocksDB = result.rows[0].height
        getInfoTimer()
    } catch (error) {
        log('Start Error', error)
    }
}

start()

var block_array = []
var pools_array = []

var serverTimeout = 30

async function syncPool() {
    try {
        statusSyncPool = true
        countTrPoolServer = blockInfo.tx_pool_size
        if (countTrPoolServer === 0) {
            await db.query('DELETE FROM pool;')
            statusSyncPool = false
        } else {
            let response = await get_all_pool_tx_list()
            // const data = response.data
            if (response.data.result.ids) {
                pools_array = response.data.result.ids
                    ? response.data.result.ids
                    : []
                try {
                    await db.query(
                        `DELETE FROM pool WHERE id NOT IN ( '${pools_array.join(
                            "','"
                        )}' )`
                    )
                } catch (error) {
                    log('pool delete', error)
                }
                try {
                    let result = await db.query('SELECT id FROM pool')
                    var new_ids = []
                    for (var j = 0; j < pools_array.length; j++) {
                        var find = false
                        for (var i = 0; i < result.rows[0].length; i++) {
                            if (pools_array[j] === result.rows[0][i].id) {
                                find = true
                                break
                            } else {
                                log('pools_array[j] !== result.rows[i].id')
                            }
                        }
                        if (!find) {
                            new_ids.push(pools_array[j])
                        }
                    }

                    if (new_ids.length) {
                        try {
                            let response = await get_pool_txs_details(new_ids)
                            if (
                                response.data.result &&
                                response.data.result.txs
                            ) {
                                db.serialize(async function () {
                                    await db.query('begin')
                                    var stmt = db.prepare(
                                        'INSERT INTO pool VALUES (?,?,?,?)'
                                    )
                                    for (var tx of response.data.result.txs) {
                                        stmt.run(
                                            tx.blob_size,
                                            tx.fee,
                                            tx.id,
                                            tx.timestamp
                                        )
                                    }
                                    stmt.finalize()
                                    await db.query('commit')
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
        await db.query('DELETE FROM pool')
        statusSyncPool = false
    }
}

function parseComment(comment) {
    var splitComment = comment.split(/\s*,\s*/).filter((el) => !!el)
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
    var splitKey = trackingKey.split(/\s*,\s*/).filter((el) => !!el)
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
                await db.query('begin')
                var hashrate100 = 0
                var hashrate400 = 0

                if (localBl.type === 1) {
                    try {
                        let result = await db.query(
                            `SELECT height, actual_timestamp, cumulative_diff_precise FROM charts WHERE type=1`
                        )
                        if (result.rowCount > 0) {
                            for (let i = 0; i < result.rows[0].length; i++) {
                                hashrate100 =
                                    i > 99 - 1
                                        ? (localBl['cumulative_diff_precise'] -
                                              result.rows[0][
                                                  result.rows[0].length - 100
                                              ]['cumulative_diff_precise']) /
                                          (localBl['actual_timestamp'] -
                                              result.rows[0][
                                                  result.rows[0].length - 100
                                              ]['actual_timestamp'])
                                        : 0
                                hashrate400 =
                                    i > 399 - 1
                                        ? (localBl['cumulative_diff_precise'] -
                                              result.rows[0][
                                                  result.rows[0].length - 400
                                              ]['cumulative_diff_precise']) /
                                          (localBl['actual_timestamp'] -
                                              result.rows[0][
                                                  result.rows[0].length - 400
                                              ]['actual_timestamp'])
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
                            await db.query(sql)
                        }
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
                    await db.query(sql)
                }

                let sql = `INSERT INTO blocks (height,
                    actual_timestamp,
                    base_reward,
                    blob,
                    block_cumulative_size,
                    block_tself_size,
                    cumulative_diff_adjusted,
                    cumulative_diff_precise,
                    difficulty,
                    effective_fee_median,
                    id,
                    is_orphan,
                    penalty,
                    prev_id,
                    summary_reward,
                    this_block_fee_median,
                    timestamp,
                    total_fee,
                    total_txs_size,
                    tr_count,
                    type,
                    miner_text_info,
                    pow_seed) VALUES (${localBl.height},
                        ${localBl.actual_timestamp},
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
                await db.query(sql)
                await db.query('commit')
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
                    // let data2 = response.data
                    await db.query('begin transaction')
                    let sql = `INSERT INTO out_info VALUES ('${localOut.amount.toString()}', 
                                ${localOut.i}, 
                                '${response.data.result.tx_id}', 
                                ${
                                    localBl.height
                                }) ON CONFLICT(tx_id) DO NOTHING;`
                    /* ON CONFLICT (block) DO UPDATE SET 
                                amount = '${localOut.amount.toString()}',
                                i = ${localOut.i},
                                tx_id = '${response.data.result.tx_id}',
                                height = ${localBl.height};`*/
                    await db.query(sql)
                    localBl.tr_out.splice(0, 1)
                    await db.query('commit')
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
                let tx_info = response.data.result.tx_info
                for (var item of tx_info.extra) {
                    if (item.type === 'alias_info') {
                        var arr = item.short_view.split('-->')
                        var aliasName = arr[0]
                        var aliasAddress = arr[1]
                        var aliasComment = parseComment(item.datails_view)
                        var aliasTrackingKey = parseTrackingKey(
                            item.datails_view
                        )
                        var aliasBlock = localBl.height
                        var aliasTransaction = localTr.id
                        await db.query(
                            `UPDATE aliases SET enabled=0 WHERE alias == '${aliasName}';`
                        )
                        let sql = `INSERT INTO aliases VALUES ('${aliasName}',
                            '${aliasAddress}',
                            '${aliasComment}',
                            '${aliasTrackingKey}',
                            '${aliasBlock}',
                            '${aliasTransaction}',
                            ${1}
                        ) ON CONFLICT () DO NOTHING;`
                        await db.query(sql)
                    }
                }

                for (var item of tx_info.ins) {
                    if (item.global_indexes) {
                        localBl.tr_out.push({
                            amount: item.amount,
                            i: item.global_indexes[0]
                        })
                    }
                }

                await db.query('begin')
                let sql = `INSERT INTO transactions VALUES (
                        '${tx_info.keeper_block}',
                        '${tx_info.id}',
                        '${tx_info.amount.toString()}',
                        ${tx_info.blob_size},
                        '${JSON.stringify(tx_info.extra)}',
                        '${tx_info.fee.toString()}',
                        '${JSON.stringify(tx_info.ins)}',
                        '${JSON.stringify(tx_info.outs)}',
                        '${tx_info.pub_key}',
                        ${tx_info.timestamp},
                        '${JSON.stringify(
                            !!tx_info.attachments ? tx_info.attachments : {}
                        )}'
                ) ON CONFLICT (id) DO NOTHING;`
                /*UPDATE SET
                    keeper_block = '${tx_info.keeper_block}',
                    id = '${tx_info.id}',
                    amount = '${tx_info.amount.toString()}',
                    blob_size = ${tx_info.blob_size},
                    extra = '${JSON.stringify(tx_info.extra)}',
                    fee ='${tx_info.fee.toString()}',
                    ins = '${JSON.stringify(tx_info.ins)}',
                    outs = '${JSON.stringify(tx_info.outs)}',
                    pub_key = '${tx_info.pub_key}',
                    timestamp = ${tx_info.timestamp},
                    attachments = '${JSON.stringify(
                            !!tx_info.attachments ? tx_info.attachments : {}
                        )}'
                ;`
                */
                await db.query(sql)
                await db.query('commit')
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
                log('syncTransactions() get_tx_details ERROR', error)
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
        var localBlocks =
            response.data.result && response.data.result.blocks
                ? response.data.result.blocks
                : []
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
            await db.query(`DELETE FROM blocks WHERE height > ${height};`)
            await db.query(`DELETE FROM charts WHERE height > ${height};`)
            await db.query(
                `DELETE FROM transactions WHERE keeper_block > ${height};`
            )
            await db.query(
                `UPDATE aliases SET enabled=1 WHERE transact IN (SELECT transact FROM aliases WHERE alias IN (select alias from aliases where block > ${height}`
            )
            await db.query(`DELETE FROM aliases WHERE block > ${height};`)
            await db.query(`DELETE FROM out_info WHERE block > ${height};`)
            const result = await db.query(
                'SELECT * FROM blocks WHERE  height=(SELECT MAX(height) FROM blocks);'
            )
            if (result) {
                lastBlock = result.rows[0]
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
        log('syncBlocks() get_blocks_details ERROR', error)
        now_blocks_sync = false
    }
}

async function syncAltBlocks() {
    statusSyncAltBlocks = true
    try {
        await db.query('DELETE FROM alt_blocks')
        let response = await get_alt_blocks_details(0, countAltBlocksServer)
        for (var block of response.data.result.blocks) {
            let sql = `INSERT INTO alt_blocks VALUES (
            ${block.height},
            ${block.timestamp},
            ${block.actual_timestamp},
            ${block.block_cumulative_size},
            '${block.id}',
            ${block.type},
            '${block.difficulty.toString()}',
            '${block.cumulative_diff_adjusted.toString()}',
            '${block.cumulative_diff_precise.toString()}',
            ${block.is_orphan},
            '${block.base_reward}',
            '${block.total_fee.toString()}',
            '${block.penalty}',
            '${block.summary_reward}',
            ${block.block_cumulative_size},
            '${block.this_block_fee_median}',
            '${block.effective_fee_median}',
            ${block.total_txs_size},
            '${JSON.stringify(block.transactions_details)}',
            '${block.miner_text_info}',
            ''
            );`
            await db.query(sql)
        }
        try {
            let result = await db.query(
                'SELECT COUNT(*) AS height FROM alt_blocks'
            )
            if (result) countAltBlocksDB = result.rows[0].height
            statusSyncAltBlocks = false
        } catch (error) {
            log('syncAltBlocks() ERROR', error)
        }
    } catch (error) {
        statusSyncAltBlocks = false
    }
}

async function getInfoTimer() {
    if (now_delete_offers === false) {
        try {
            let response = await get_info()
            blockInfo = response.data.result
            countAliasesServer = blockInfo.alias_count
            countAltBlocksServer = blockInfo.alt_blocks_count
            countTrPoolServer = blockInfo.tx_pool_size
            if (statusSyncPool === false) {
                let result = await db.query(
                    'SELECT COUNT(*) AS transactions FROM pool'
                )
                if (result) {
                    if (result.rows[0].transactions !== countTrPoolServer) {
                        log(
                            'need update pool transactions db=' +
                                result.rows[0].transactions +
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
