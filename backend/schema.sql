DROP DATABASE IF EXISTS db;
CREATE DATABASE db;

CREATE TABLE IF NOT EXISTS  blocks (
        height  integer unique,
        actual_timestamp integer,
        base_reward text ,
        blob text,
        block_cumulative_size integer,
        block_tself_size text,
        cumulative_diff_adjusted text,
        cumulative_diff_precise text,
        difficulty text,
        effective_fee_median text,
        id text,
        is_orphan integer,
        penalty text,
        prev_id text,
        summary_reward text,
        this_block_fee_median text,
        timestamp integer,
        total_fee text,
        total_txs_size integer,
        tr_count integer,
        type integer,
        miner_text_info text,
        pow_seed text
);

CREATE INDEX IF NOT EXISTS  index_bl_height ON blocks(height);
CREATE INDEX IF NOT EXISTS  index_id ON blocks(id);

CREATE TABLE IF NOT EXISTS transactions (
        keeper_block integer,
        id  text unique,
        amount text,
        blob_size integer,
        extra text,
        fee text,
        ins  text,
        outs text,
        pub_key text,
        timestamp integer,
        attachments text
);

CREATE INDEX IF NOT EXISTS index_tr_keeper ON transactions(keeper_block);
CREATE INDEX IF NOT EXISTS index_tr_id ON transactions(id);

CREATE TABLE IF NOT EXISTS aliases (
        alias text,
        address text unique,
        comment text,
        tracking_key text,
        block integer,
        transact text,
        enabled integer
);

CREATE INDEX IF NOT EXISTS index_al_block ON aliases(block);

CREATE TABLE IF NOT EXISTS alt_blocks (
        height integer,
        timestamp integer,
        actual_timestamp integer,
        size integer,
        hash text,
        type integer,
        difficulty text,
        cumulative_diff_adjusted text,
        cumulative_diff_precise text,
        is_orphan integer,
        base_reward text,
        total_fee text,
        penalty text,
        summary_reward text,
        block_cumulative_size integer,
        this_block_fee_median text,
        effective_fee_median text,
        total_txs_size integer,
        transactions_details text,
        miner_txt_info text,
        pow_seed text
);

CREATE INDEX IF NOT EXISTS index_ab_hash ON alt_blocks(hash);

CREATE TABLE IF NOT EXISTS pool (
        blob_size text,
        fee text,
        id text,
        timestamp text
);

CREATE INDEX IF NOT EXISTS index_pool_id ON pool(id);

CREATE TABLE IF NOT EXISTS charts (
            height integer,
            actual_timestamp integer,
            block_cumulative_size integer,
            cumulative_diff_precise text,
            difficulty text,
            tr_count integer,
            type integer,
            difficulty120 text,
            hashrate100 text,
            hashrate400 text
);

CREATE INDEX IF NOT EXISTS index_bl_height ON charts(height);

CREATE TABLE IF NOT EXISTS out_info (
            amount text,
            i integer,
            tx_id text,
            block integer unique
);

CREATE UNIQUE INDEX IF NOT EXISTS index_out ON out_info(amount, i, tx_id);
