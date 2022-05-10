DROP DATABASE IF EXISTS db;
CREATE DATABASE db;

CREATE TABLE IF NOT EXISTS  blocks (
        height  integer unique,
        actual_timestamp integer,
        base_reward decimal(100,0),
        blob text,
        block_cumulative_size decimal(100,0),
        block_tself_size decimal(100,0),
        cumulative_diff_adjusted decimal(100,0),
        cumulative_diff_precise decimal(100,0),
        difficulty  decimal(100,0),
        effective_fee_median decimal(100,0),
        id text,
        is_orphan boolean,
        penalty integer,
        prev_id text,
        summary_reward decimal(100,0),
        this_block_fee_median decimal(100,0),
        timestamp integer,
        total_fee decimal(100,0),
        total_txs_size decimal(100,0),
        tr_count bigint,
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
        is_orphan boolean,
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
            block_cumulative_size decimal(100,0),
            cumulative_diff_precise decimal(100,0),
            difficulty decimal,
            tr_count integer,
            type integer,
            difficulty120 bigint,
            hashrate100 bigint,
            hashrate400 bigint
);

CREATE INDEX IF NOT EXISTS index_bl_height ON charts(height);

CREATE TABLE IF NOT EXISTS out_info (
            amount text,
            i integer,
            tx_id text,
            block integer unique
);

CREATE UNIQUE INDEX IF NOT EXISTS index_out ON out_info(amount, i, tx_id);

CREATE OR REPLACE PROCEDURE purgeAboveHeight(IN p_height int) AS $$
BEGIN
    DELETE FROM blocks WHERE height > p_height;
	DELETE FROM charts WHERE height > p_height;
    DELETE FROM transactions WHERE keeper_block > p_height;
	UPDATE aliases 
	   SET enabled = 1
	 WHERE transact IN (SELECT transact 
						  FROM aliases 
						 WHERE alias IN (select alias 
										   from aliases 
										  where block > p_height));
	DELETE FROM aliases WHERE block > p_height;
	DELETE FROM out_info WHERE block > p_height;								 
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE PROCEDURE purge() AS $$
BEGIN
    DELETE FROM blocks;
    DELETE FROM transactions;
	DELETE FROM aliases;
	DELETE FROM alt_blocks;
	DELETE FROM pool;
	DELETE FROM charts;	
	DELETE FROM out_info;								 
END;
$$ LANGUAGE plpgsql;



GRANT ALL ON TABLE public.aliases TO zano;

GRANT ALL ON TABLE public.alt_blocks TO zano;

GRANT ALL ON TABLE public.blocks TO zano;

GRANT ALL ON TABLE public.charts TO zano;

GRANT ALL ON TABLE public.out_info TO zano;

GRANT ALL ON TABLE public.pool TO zano;

GRANT ALL ON TABLE public.transactions TO zano;
