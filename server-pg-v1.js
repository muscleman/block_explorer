const fs = require('fs')
const express = require('express')
const http = require('http')
const app = express()
const server = http.createServer(app)
const { Server } = require('socket.io')
const io = new Server(server)
// const { WebSocketServer } = require('ws')
const { Pool } = require('pg')
const axios = require('axios')
const BigNumber = require('bignumber.js')
const exceptionHandler = require('./exceptionHandler')
const cors = require('cors')

let config = fs.readFileSync('config.json', 'utf8')
config = JSON.parse(config)
const api = config.api + '/json_rpc'
const wallet = `${config.auditable_wallet.api}/json_rpc`
const front_port = config.front_port

io.engine.on('initial_headers', (headers, req) => {
    headers['Access-Control-Allow-Origin'] = 'http://localhost:4200'
})

io.engine.on('headers', (headers, req) => {
    headers['Access-Control-Allow-Origin'] = 'http://localhost:4200'
})

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
        transformResponse: [(data) => JSON.parse(data)]
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
        transformResponse: [(data) => JSON.parse(data)]
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
        transformResponse: [(data) => JSON.parse(data)]
    })
}

const get_all_pool_tx_list = () => {
    return axios({
        method: 'get',
        url: api,
        data: {
            method: 'get_all_pool_tx_list'
        },
        transformResponse: [(data) => JSON.parse(data)]
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
        transformResponse: [(data) => JSON.parse(data)]
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
        transformResponse: [(data) => JSON.parse(data)]
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
        transformResponse: [(data) => JSON.parse(data)]
    })
}

const getbalance = () => {
    return axios({
        method: 'post',
        url: wallet,
        data: {
            method: 'getbalance',
            params: {}
        },
        transformResponse: [(data) => JSON.parse(data)]
    })
}

app.get(
    '/get_info',
    exceptionHandler((req, res, next) => {
        blockInfo.lastBlock = lastBlock.height
        res.json(blockInfo)
    })
)

// Blockchain page
app.get(
    '/get_blocks_details/:start/:count',
    exceptionHandler(async (req, res, next) => {
        let start = req.params.start
        let count = req.params.count

        if (start && count) {
            let result = await db.query(
                `SELECT blocks.* FROM blocks WHERE blocks.height >= ${start} ORDER BY blocks.height ASC LIMIT ${count};`
            )
            res.json(result && result.rowCount > 0 ? result.rows : [])
        }
    })
)

app.get(
    '/get_visibility_info',
    exceptionHandler(async (req, res, next) => {
        const response = await getbalance()
        let result = response.data.result
        result.amount = 9123546523000000000
        result.percentage = 56
        res.json(result)
    })
)

app.get(
    '/get_main_block_details/:id',
    exceptionHandler(async (req, res, next) => {
        let id = req.params.id.toLowerCase()
        if (id) {
            let result = await db.query(
                `SELECT b2.id as next_id, b1.* FROM blocks as b1 left join blocks as b2 on b2.height > b1.height WHERE b1.id = '${id}' ORDER BY b2.height ASC LIMIT 1;`
            )
            if (result && result.rowCount > 0) {
                let result2 = await db.query(
                    `SELECT * FROM transactions WHERE keeper_block = ${result.rows[0].height};`
                )
                result.rows[0].transactions_details = result2.rows
                res.json(result.rows[0])
            } else {
                res.send('block not found')
            }
        }
    })
)

app.get(
    '/get_tx_pool_details/:count',
    exceptionHandler(async (req, res, next) => {
        let count = req.params.count
        if (count !== undefined) {
            let result = await db.query(
                `SELECT * FROM pool ORDER BY timestamp DESC limit ${count};`
            )
            res.json(result && result.rowCount > 0 ? result.rows : [])
        } else {
            res.send("Error. Need 'count' params")
        }
    })
)

// Alt-blocks
app.get(
    '/get_alt_blocks_details/:offset/:count',
    exceptionHandler(async (req, res, next) => {
        let offset = parseInt(req.params.offset)
        let count = parseInt(req.params.count)

        if (count > maxCount) {
            count = maxCount
        }
        let result = await db.query(
            `SELECT * FROM alt_blocks ORDER BY height DESC limit ${count} offset ${offset};`
        )
        res.json(result && result.rowCount > 0 ? result.rows : [])
    })
)

app.get(
    '/get_alt_block_details/:id',
    exceptionHandler(async (req, res, next) => {
        let id = req.params.id.toLowerCase()
        if (!!id) {
            let result = await db.query(
                `SELECT * FROM alt_blocks WHERE hash = '${id}';`
            )
            res.json(result && result.rowCount > 0 ? result.rows[0] : [])
        } else
            res.status({ status: 500 }).json({
                message: `/get_out_info/:amount/:i ${req.params}, ${error}`
            })
    })
)

// Transactions
app.get(
    '/get_tx_details/:tx_hash',
    exceptionHandler(async (req, res, next) => {
        let tx_hash = req.params.tx_hash.toLowerCase()
        if (tx_hash) {
            let result = await db.query(
                `SELECT transactions.*, blocks.id as block_hash, blocks.timestamp as block_timestamp FROM transactions LEFT JOIN blocks ON transactions.keeper_block = blocks.height WHERE transactions.id = '${tx_hash}';`
            )
            if (result && result.rowCount > 0) res.json(result.rows[0])
            else {
                let response = await get_tx_details(tx_hash)
                let data = response.data
                if (data.result !== undefined) {
                    res.json(data.result.tx_info)
                } else {
                    res.status({ status: 500 }).json({
                        message: `/get_tx_details/:tx_hash ${req.params}, ${error}`
                    })
                }
            }
        }
    })
)

app.get(
    '/get_out_info/:amount/:i',
    exceptionHandler(async (req, res, next) => {
        let amount = req.params.amount
        let i = parseInt(req.params.i)
        if (!!amount && !!i) {
            let result = await db.query(
                `SELECT * FROM out_info WHERE amount = '${amount}' AND i = ${i}`
            )
            if (result === undefined || result.rowCount === 0) {
                let response = await get_out_info(amount, i)
                res.json({ tx_id: response.data.result.tx_id })
            } else {
                res.json(result.rows)
            }
        } else {
            res.status({ status: 500 }).json({
                message: `/get_out_info/:amount/:i ${req.params}, ${error}`
            })
        }
    })
)

// Aliases
app.get(
    '/get_aliases/:offset/:count/:search',
    exceptionHandler(async (req, res, next) => {
        let offset = parseInt(req.params.offset)
        let count = parseInt(req.params.count)
        if (count > maxCount) {
            count = maxCount
        }
        let search = req.params.search.toLowerCase()

        if (search === 'all' && offset !== undefined && count !== undefined) {
            let result = await db.query(
                `SELECT * FROM aliases WHERE enabled = 1 ORDER BY block DESC limit ${count} offset ${offset};`
            )
            res.json(result && result.rowCount > 0 ? result.rows : [])
        } else if (
            search !== undefined &&
            offset !== undefined &&
            count !== undefined
        ) {
            let result = await db.query(
                `SELECT * FROM aliases WHERE enabled = 1 AND (alias LIKE '%${search}%' OR address LIKE '%${search}%' OR comment LIKE '%${search}%') ORDER BY block DESC limit ${count} offset ${offset};`
            )
            res.json(result && result.rowCount > 0 ? result.rows : [])
        }
    })
)

// Charts
app.get(
    '/get_chart/:chart/:period',
    exceptionHandler(async (req, res) => {
        let chart = req.params.chart
        let period = req.params.period
        if (chart !== undefined) {
            let period = Math.round(new Date().getTime() / 1000) - 24 * 3600 // + 86400000
            let period2 = Math.round(new Date().getTime() / 1000) - 48 * 3600 // + 86400000
            if (chart === 'all') {
                //convert me into a sp or view[sqllite3] please!!
                let arrayAll = await db.query(
                    `SELECT actual_timestamp::real as at, block_cumulative_size as bcs, tr_count as trc, difficulty as d, type as t FROM charts WHERE actual_timestamp > ${period} ORDER BY at;`
                )
                let rows0 = await db.query(
                    `SELECT extract(epoch from to_timestamp(actual_timestamp)::date)::integer as at, SUM(tr_count)::integer as sum_trc FROM charts GROUP BY at ORDER BY at;`
                )
                let rows1 = await db.query(
                    `SELECT actual_timestamp as at, difficulty120 as d120, hashrate100 as h100, hashrate400 as h400 FROM charts WHERE type=1 AND actual_timestamp > ${period2} ORDER BY at;`
                )
                arrayAll.rows[0] = rows0.rows
                arrayAll.rows[1] = rows1.rows
                res.json(arrayAll.rows)
            } else if (chart === 'AvgBlockSize') {
                result = await db.query(
                    `SELECT extract(epoch from to_timestamp(actual_timestamp)::date)::integer as at, avg(block_cumulative_size)::real as bcs FROM charts GROUP BY at ORDER BY at;`
                )
                res.json(result && result.rowCount > 0 ? result.rows : [])
            } else if (chart === 'AvgTransPerBlock') {
                result = await db.query(
                    `SELECT extract(epoch from to_timestamp(actual_timestamp)::date)::integer as at, avg(tr_count)::real as trc FROM charts GROUP BY at ORDER BY at;`
                )
                res.json(result && result.rowCount > 0 ? result.rows : [])
            } else if (chart === 'hashRate') {
                result = await db.query(
                    `SELECT extract(epoch from to_timestamp(actual_timestamp)::date)::integer as at, avg(difficulty120)::real as d120, avg(hashrate100)::real as h100, avg(hashrate400)::real as h400 FROM charts WHERE type=1 GROUP BY at ORDER BY at;`
                )
                res.json(result && result.rowCount > 0 ? result.rows : [])
            } else if (chart === 'pos-difficulty') {
                let result = await db.query(
                    `SELECT extract(epoch from to_timestamp(actual_timestamp)::date)::integer as at, case when (max(difficulty)-avg(difficulty))>(avg(difficulty)-min(difficulty)) then max(difficulty)::real else min(difficulty)::real end as d FROM charts WHERE type=0 GROUP BY at ORDER BY at;`
                )
                let result1 = await db.query(
                    'SELECT actual_timestamp as at, difficulty as d FROM charts WHERE type=0 ORDER BY at;'
                )
                res.json({
                    aggregated: result.rows,
                    detailed: result1.rows
                })
            } else if (chart === 'pow-difficulty') {
                let result = await db.query(
                    `SELECT extract(epoch from to_timestamp(actual_timestamp)::date)::integer as at, case when (max(difficulty)-avg(difficulty))>(avg(difficulty)-min(difficulty)) then max(difficulty)::real else min(difficulty)::real end as d FROM charts WHERE type=1 GROUP BY at ORDER BY at;`
                )
                let result1 = await db.query(
                    'SELECT actual_timestamp as at, difficulty as d FROM charts WHERE type=1 ORDER BY at;'
                )
                res.json({
                    aggregated: result.rows,
                    detailed: result1.rows
                })
            } else if (chart === 'ConfirmTransactPerDay') {
                let result = await db.query(
                    'SELECT extract(epoch from to_timestamp(actual_timestamp)::date)::integer as at, SUM(tr_count)::integer as sum_trc FROM charts GROUP BY at ORDER BY at;'
                )
                res.json(result && result.rowCount > 0 ? result.rows : [])
            }
        }
    })
)

// Search
app.get(
    '/search_by_id/:id',
    exceptionHandler(async (req, res, next) => {
        let id = req.params.id.toLowerCase()
        if (!!id) {
            let result = await db.query(
                `SELECT * FROM blocks WHERE id = '${id}' ;`
            )
            if (!result || result.rowCount === 0) {
                result = await db.query(
                    `SELECT * FROM alt_blocks WHERE hash = '${id}' ;`
                )
                if (!result || result.rowCount === 0) {
                    result = await db.query(
                        `SELECT * FROM transactions WHERE id = '${id}' ;`
                    )
                    if (!result || result.rowCount === 0) {
                        try {
                            let response = await get_tx_details(id)
                            if (response.data.result) {
                                res.json({ result: 'tx' })
                            } else {
                                let result = await db.query(
                                    `SELECT * FROM aliases WHERE enabled = 1 AND (alias LIKE '%${id}%' OR address LIKE '%${id}%' OR comment LIKE '%${id}%') ORDER BY block DESC limit 1 offset 0;`
                                )
                                if (result.rowCount > 0) {
                                    res.json({ result: 'alias' })
                                } else {
                                    res.json({ result: 'NOT FOUND' })
                                }
                            }
                        } catch (error) {
                            res.json({ result: 'NOT FOUND' })
                        }
                    } else {
                        res.json({ result: 'tx' })
                    }
                } else {
                    res.json({ result: 'alt_block' })
                }
            } else {
                res.json({ result: 'block' })
            }
        }
    })
)

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
        if (result && result.rowCount === 1) {
            lastBlock = result.rows[0]
        }
        result = await db.query(
            'SELECT COUNT(*)::integer AS alias FROM aliases;'
        )
        if (result) countAliasesDB = result.rows[0].alias

        result = await db.query(
            'SELECT COUNT(*)::integer AS height FROM alt_blocks;'
        )
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
    var splitKey = trackingKey.split(/\s*,\s*/) //.filter((el) => !!el)
    var resultKey = splitKey[5]
    if (resultKey) {
        var key = resultKey.split(':')
        var keyValue = key[1].replace(/\[|\]/g, '')
        if (keyValue) {
            return keyValue.toString().replace(/\s+/g, '')
        } else {
            return ''
        }
    } else {
        return ''
    }
}

async function syncTransactions() {
    if (block_array.length > 0) {
        let blockInserts = []
        let transactionInserts = []
        let chartInserts = []
        let outInfoInserts = []
        for (const bl of block_array) {
            //build transaction inserts
            {
                try {
                    if (bl.tr_count === undefined)
                        bl.tr_count = bl.transactions_details.length
                    if (bl.tr_out === undefined) bl.tr_out = []

                    while (
                        !!(localTr = bl.transactions_details.splice(0, 1)[0])
                    ) {
                        let response = await get_tx_details(localTr.id)
                        let tx_info = response.data.result.tx_info
                        for (var item of tx_info.extra) {
                            if (item.type === 'alias_info') {
                                var arr = item.short_view.split('-->')
                                var aliasName = arr[0]
                                var aliasAddress = arr[1]
                                var aliasComment = parseComment(
                                    item.datails_view
                                )
                                var aliasTrackingKey = parseTrackingKey(
                                    item.datails_view
                                )
                                var aliasBlock = bl.height
                                var aliasTransaction = localTr.id
                                await db.query(
                                    `UPDATE aliases SET enabled=0 WHERE alias = '${aliasName}';`
                                )
                                let sql =
                                    `INSERT INTO aliases VALUES ('${aliasName}',` +
                                    `'${aliasAddress}',` +
                                    `'${aliasComment}',` +
                                    `'${aliasTrackingKey}',` +
                                    `'${aliasBlock}',` +
                                    `'${aliasTransaction}',` +
                                    `${1}` +
                                    `) ON CONFLICT (address) ` +
                                    `DO UPDATE SET ` +
                                    `alias='${aliasName}',` +
                                    `address='${aliasAddress}',` +
                                    `comment='${aliasComment}',` +
                                    `tracking_key='${aliasTrackingKey}',` +
                                    `block='${aliasBlock}',` +
                                    `transact='${aliasTransaction}',` +
                                    `enabled=${1};`
                                await db.query(sql)
                            }
                        }

                        for (var item of tx_info.ins) {
                            if (item.global_indexes) {
                                bl.tr_out.push({
                                    amount: item.amount,
                                    i: item.global_indexes[0]
                                })
                            }
                        }

                        transactionInserts.push(
                            `('${tx_info.keeper_block}',` +
                                `'${tx_info.id}',` +
                                `'${tx_info.amount.toString()}',` +
                                `${tx_info.blob_size},` +
                                `'${JSON.stringify(tx_info.extra)}',` +
                                `'${tx_info.fee.toString()}',` +
                                `'${JSON.stringify(tx_info.ins)}',` +
                                `'${JSON.stringify(tx_info.outs)}',` +
                                `'${tx_info.pub_key}',` +
                                `${tx_info.timestamp},` +
                                `'${JSON.stringify(
                                    !!tx_info.attachments
                                        ? tx_info.attachments
                                        : {}
                                )}')`
                        )
                    }
                } catch (error) {
                    log('syncTransactions: Error inserting aliases: ', error)
                }
            }

            // if (bl.tr_out.length === 0) {

            //build chart inserts or use sp after block and trans inserts
            if (bl.type === 1) {
                /*calculate chart averages*/
            }

            //build chart inserts
            if (bl.type !== 1) {
                chartInserts.push(
                    `(${bl.height},` +
                        `${bl.actual_timestamp},` +
                        `${bl.block_cumulative_size},` +
                        `${bl.cumulative_diff_precise},` +
                        `${bl.difficulty},` +
                        `${bl.tr_count ? bl.tr_count : 0},` +
                        `${bl.type},` +
                        `0,` +
                        `0,` +
                        `0)`
                )
            }

            //build out_info inserts
            {
                if (bl.tr_out && bl.tr_out.length > 0) {
                    var localOut = bl.tr_out[0]
                    let localOutAmount = new BigNumber(
                        localOut.amount
                    ).toNumber()

                    let response = await get_out_info(
                        localOutAmount,
                        localOut.i
                    )

                    outInfoInserts.push(
                        `('${localOut.amount.toString()}',` +
                            `${localOut.i}, ` +
                            `'${response.data.result.tx_id}', ` +
                            `${bl.height})`
                    )
                }
            }

            //build block inserts
            {
                blockInserts.push(
                    `(${bl.height},` +
                        `${bl.actual_timestamp},` +
                        `${bl.base_reward},` +
                        `'${bl.blob}',` +
                        `${bl.block_cumulative_size},` +
                        `${bl.block_tself_size},` +
                        `${bl.cumulative_diff_adjusted},` +
                        `${bl.cumulative_diff_precise},` +
                        `${bl.difficulty},` +
                        `${bl.effective_fee_median},` +
                        `'${bl.id}',` +
                        `${bl.is_orphan},` +
                        `${bl.penalty},` +
                        `'${bl.prev_id}',` +
                        `${bl.summary_reward},` +
                        `${bl.this_block_fee_median},` +
                        `${bl.timestamp},` +
                        `${bl.total_fee},` +
                        `${bl.total_txs_size},` +
                        `${bl.tr_count ? bl.tr_count : 0},` +
                        `${bl.type},` +
                        `'${bl.miner_text_info}',` +
                        `'${bl.pow_seed}')`
                )
            }
        }

        await db.query('begin')
        //save transactions
        {
            try {
                if (transactionInserts.length > 0) {
                    let sql =
                        `INSERT INTO transactions VALUES ` +
                        transactionInserts.join(',') +
                        ' ON CONFLICT (id) DO NOTHING;'
                    await db.query(sql)
                }
            } catch (error) {
                console.log(error)
            }
        }

        //save charts
        {
            try {
                if (chartInserts.length > 0) {
                    let sql =
                        `INSERT INTO charts VALUES ` +
                        chartInserts.join(',') +
                        ';'
                    await db.query(sql)
                }
            } catch (error) {
                console.log(error)
            }
        }

        //save out_info
        {
            try {
                if (outInfoInserts.length > 0) {
                    let sql =
                        `INSERT INTO out_info VALUES ` +
                        outInfoInserts.join(',') +
                        ' ON CONFLICT(tx_id) DO NOTHING;'
                    await db.query(sql)
                }
            } catch (error) {
                console.log(error)
            }
        }

        //save blocks
        {
            try {
                if (blockInserts.length > 0) {
                    let sql =
                        'INSERT INTO blocks (height,' +
                        'actual_timestamp,' +
                        'base_reward,' +
                        'blob,' +
                        'block_cumulative_size,' +
                        'block_tself_size,' +
                        'cumulative_diff_adjusted,' +
                        'cumulative_diff_precise,' +
                        'difficulty,' +
                        'effective_fee_median,' +
                        'id,' +
                        'is_orphan,' +
                        'penalty,' +
                        'prev_id,' +
                        'summary_reward,' +
                        'this_block_fee_median,' +
                        'timestamp,' +
                        'total_fee,' +
                        'total_txs_size,' +
                        'tr_count,' +
                        'type,' +
                        'miner_text_info,' +
                        'pow_seed) VALUES ' +
                        blockInserts.join(',') +
                        ';'
                    await db.query(sql)
                }
            } catch (error) {
                console.log(error)
            }
        }
        try {
            await db.query('commit')
        } catch (error) {
            console.log(error)
        }
        lastBlock = block_array.pop()
        log('BLOCKS: db =' + lastBlock.height + '/ server =' + blockInfo.height)
        block_array = []
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
            await emitSocketInfo()
            if (lastBlock.height >= blockInfo.height - 1) {
                now_blocks_sync = false
            } else {
                await pause(serverTimeout)
                await syncBlocks()
            }
        } else {
            const deleteCount = 100
            await db.query(
                `CALL purgeAboveHeight(${lastBlock.height - deleteCount})`
            )
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
            await pause(serverTimeout)
            await syncBlocks()
        }
    } catch (error) {
        log('syncBlocks() get_blocks_details ERROR', error)
        now_blocks_sync = false
    }
}

async function syncAltBlocks() {
    try {
        statusSyncAltBlocks = true
        await db.query('BEGIN')
        await db.query('DELETE FROM alt_blocks')
        let response = await get_alt_blocks_details(0, countAltBlocksServer)
        for (var block of response.data.result.blocks) {
            let sql =
                `INSERT INTO alt_blocks(height, timestamp, actual_timestamp, size, hash, type, difficulty, cumulative_diff_adjusted, cumulative_diff_precise,` +
                ` is_orphan, base_reward, total_fee, penalty, summary_reward, block_cumulative_size, this_block_fee_median, effective_fee_median, total_txs_size, transactions_details, miner_txt_info, pow_seed) VALUES (` +
                `${block.height},` +
                `${block.timestamp},` +
                `${block.actual_timestamp},` +
                `${block.block_cumulative_size},` +
                `'${block.id}',` +
                `${block.type},` +
                `'${block.difficulty}',` +
                `'${block.cumulative_diff_adjusted}',` +
                `'${block.cumulative_diff_precise}',` +
                `${block.is_orphan},` +
                `'${block.base_reward}',` +
                `'${block.total_fee}',` +
                `'${block.penalty}',` +
                `'${block.summary_reward}',` +
                `${block.block_cumulative_size},` +
                `'${block.this_block_fee_median}',` +
                `'${block.effective_fee_median}',` +
                `${block.total_txs_size},` +
                `'${JSON.stringify(block.transactions_details)}',` +
                `'${block.miner_text_info}',` +
                `''` +
                `);`
            await db.query(sql)
        }
        await db.query('COMMIT')
        let result = await db.query(
            'SELECT COUNT(*)::integer AS height FROM alt_blocks'
        )
        countAltBlocksDB = result && result.rowCount ? result.rows[0].height : 0
    } catch (error) {
        log('syncAltBlocks() ERROR', error)
        await db.query('ROLLBACK')
    }
    statusSyncAltBlocks = false
}

const getVisibilityInfo = async () => {
    let result = {
        amount: 0,
        percentage: 0,
        balance: 0,
        unlocked_balance: 0
    }
    try {
        const response = await getbalance()
        result.balance = response.data.result.balance
        result.unlocked_balance = response.data.result.unlocked_balance
        result.amount = 9123546523000000000
        result.percentage = 56
    } catch (error) {}
    return JSON.stringify(result)
}

const emitSocketInfo = async () => {
    blockInfo.lastBlock = lastBlock.height
    io.emit('get_info', JSON.stringify(blockInfo))

    io.emit('get_visibility_info', await getVisibilityInfo())
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
                    'SELECT COUNT(*)::integer AS transactions FROM pool'
                )
                if (result && result.rowCount > 0) {
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
                await emitSocketInfo()
            }
            await pause(10000)
            await getInfoTimer()
        } catch (error) {
            log('getInfoTimer() get_info error')
            blockInfo.daemon_network_state = 0
            await pause(300000)
            await getInfoTimer()
        }
    } else {
        await pause(10000)
        await getInfoTimer()
    }
}

const pause = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

// API
app.get(
    '/api/get_info/:flags',
    exceptionHandler(async (req, res) => {
        let flags = req.params.flags
        const response = await axios({
            method: 'get',
            url: api,
            data: {
                method: 'getinfo',
                params: { flags: parseInt(flags) }
            }
        })
        res.json(response.data)
    })
)

app.get(
    '/api/get_total_coins',
    exceptionHandler(async (req, res) => {
        const response = await axios({
            method: 'get',
            url: api,
            data: {
                method: 'getinfo',
                params: { flags: parseInt(4294967295) }
            }
        })

        let str = response.data.result.total_coins
        let result
        let totalCoins = Number(str)
        if (typeof totalCoins === 'number') {
            result = parseInt(totalCoins) / 1000000000000
        }
        let r2 = result.toFixed(2)
        res.send(r2)
    })
)

app.get(
    '/api/get_blocks_details/:start/:count',
    exceptionHandler(async (req, res) => {
        let start = req.params.start
        let count = req.params.count
        const response = await axios({
            method: 'get',
            url: api,
            data: {
                method: 'get_blocks_details',
                params: {
                    height_start: parseInt(start ? start : 0),
                    count: parseInt(count ? count : 10),
                    ignore_transactions: false
                }
            }
        })
        res.json(response.data)
    })
)

app.get(
    '/api/get_main_block_details/:id',
    exceptionHandler(async (req, res) => {
        let id = req.params.id
        const response = await axios({
            method: 'get',
            url: api,
            data: {
                method: 'get_main_block_details',
                params: {
                    id: id
                }
            }
        })
        res.json(response.data)
    })
)

app.get(
    '/api/get_alt_blocks_details/:offset/:count',
    exceptionHandler(async (req, res) => {
        let offset = req.params.offset
        let count = req.params.count
        const response = await axios({
            method: 'get',
            url: api,
            data: {
                method: 'get_alt_blocks_details',
                params: {
                    offset: parseInt(offset),
                    count: parseInt(count)
                }
            }
        })
        res.json(response.data)
    })
)

app.get(
    '/api/get_alt_block_details/:id',
    exceptionHandler(async (req, res) => {
        let id = req.params.id
        const response = await axios({
            method: 'get',
            url: api,
            data: {
                method: 'get_alt_block_details',
                params: {
                    id: id
                }
            }
        })
        req.json(response.data)
    })
)

app.get(
    '/api/get_all_pool_tx_list',
    exceptionHandler(async (req, res) => {
        const response = await axios({
            method: 'get',
            url: api,
            data: {
                method: 'get_all_pool_tx_list'
            }
        })
        res.json(response.data)
    })
)

app.get(
    '/api/get_pool_txs_details',
    exceptionHandler(async (req, res) => {
        const response = await axios({
            method: 'get',
            url: api,
            data: {
                method: 'get_pool_txs_details'
            }
        })
        res.json(response.data)
    })
)

app.get(
    '/api/get_pool_txs_brief_details',
    exceptionHandler(async (req, res) => {
        const response = await axios({
            method: 'get',
            url: api,
            data: {
                method: 'get_pool_txs_brief_details'
            }
        })
        res.json(response.data)
    })
)

app.get(
    '/api/get_tx_details/:tx_hash',
    exceptionHandler(async (req, res) => {
        let tx_hash = req.params.tx_hash
        const response = await axios({
            method: 'get',
            url: api,
            data: {
                method: 'get_tx_details',
                params: { tx_hash: tx_hash }
            }
        })
        res.json(response.data)
    })
)

// app.get('/api/get_out_info/:amount/:i', exceptionHandler(async (req, res) => {
//     let amount = req.params.amount
//     let i = req.params.i
//     const response = axios({
//         method: 'get',
//         url: api,
//         data: {
//             method: 'get_out_info',
//             params: {'amount': parseInt(amount), 'i': parseInt(i)},
//         }
//     })
//     res.json(response.data)
// }))

app.use(function (req, res) {
    res.sendFile(__dirname + '/dist/index.html')
})

io.on('connection', async (socket) => {
    console.log('a user connected')
    await emitSocketInfo()
})

server.listen(8008, () => {
    log(`Server listening on port ${server.address().port}`)
})
