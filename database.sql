CREATE TABLE IF NOT EXISTS  blocks (
        height  integer primary key,
        actual_timestamp integer,
        base_reward numeric(100,0),
        blob text,
        block_cumulative_size numeric(100,0),
        block_tself_size numeric(100,0),
        cumulative_diff_adjusted numeric(100,0),
        cumulative_diff_precise numeric(100,0),
        difficulty  numeric(100,0),
        effective_fee_median numeric(100,0),
        id text,
        is_orphan boolean,
        penalty integer,
        prev_id text,
        summary_reward numeric(100,0),
        this_block_fee_median numeric(100,0),
        "timestamp" integer,
        total_fee numeric(100,0),
        total_txs_size numeric(100,0),
        tr_count bigint,
        type integer,
        miner_text_info text,
        pow_seed text
);

CREATE INDEX IF NOT EXISTS  index_block_height ON blocks(height);
CREATE INDEX IF NOT EXISTS  index_block_id ON blocks(id);

CREATE TABLE IF NOT EXISTS transactions (
        keeper_block integer,
        id  text unique,
        amount numeric(100,0),
        blob_size integer,
        extra text,
        fee numeric(100,0),
        ins  text,
        outs text,
        pub_key text,
        timestamp integer,
        attachments text,
        primary key(keeper_block, id)
);

CREATE INDEX IF NOT EXISTS index_transaction_keeper ON transactions(keeper_block);
CREATE INDEX IF NOT EXISTS index_transaction_id ON transactions(id);

CREATE TABLE IF NOT EXISTS aliases (
        alias text,
        address text unique,
        comment text,
        tracking_key text,
        block integer,
        transact text,
        enabled integer
);

CREATE INDEX IF NOT EXISTS index_aliases_block ON aliases(block);

CREATE TABLE IF NOT EXISTS alt_blocks (
        height integer,
        "timestamp" integer,
        actual_timestamp integer,
        size integer,
        hash text,
        type integer,
        difficulty numeric(100,0),
        cumulative_diff_adjusted numeric(100,0),
        cumulative_diff_precise numeric(100,0),
        is_orphan boolean,
        base_reward numeric(100,0),
        total_fee numeric(100,0),
        penalty integer,
        summary_reward numeric(100,0),
        block_cumulative_size numeric(100,0),
        this_block_fee_median numeric(100,0),
        effective_fee_median numeric(100,0),
        total_txs_size numeric(100,0),
        transactions_details text,
        miner_txt_info text,
        pow_seed text,
        primary key (height, timestamp)
);

CREATE INDEX IF NOT EXISTS index_altblocks_hash ON alt_blocks(hash);

CREATE TABLE IF NOT EXISTS pool (
        blob_size text,
        fee text,
        id text,
        timestamp text
);

CREATE INDEX IF NOT EXISTS index_pool_id ON pool(id);

CREATE TABLE IF NOT EXISTS charts (
            height integer primary key,
            actual_timestamp integer,
            block_cumulative_size decimal(100,0),
            cumulative_diff_precise decimal(100,0),
            difficulty  decimal(100,0),
            tr_count bigint,
            type integer,
            difficulty120 decimal(100,0),
            hashrate100 decimal(100,12),
            hashrate400 decimal(100,12)
);

CREATE INDEX IF NOT EXISTS index_charts_height ON charts(height);

CREATE TABLE IF NOT EXISTS out_info (
            amount decimal(100,0),
            i integer,
            tx_id text,
            block integer,
            primary key (amount, i, tx_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS index_out_info ON out_info(amount, i, tx_id);

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

CREATE OR REPLACE PROCEDURE update_statistics(p_startheight integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
	WITH cte AS (
		SELECT height,
			   difficulty,
			   actual_timestamp as actual_timestamp_a, 
			   cumulative_diff_precise as cumulative_diff_precise_a
		  FROM charts
		 where type = 1
		 ORDER BY height
	), cte2 AS (
		SELECT height,
			   difficulty,
			   actual_timestamp_a, 
			   cumulative_diff_precise_a,
			   COALESCE(LAG(cumulative_diff_precise_a,100) OVER (
				   ORDER BY height asc
			   ), 0) cumulative_diff_precise_b,
			   COALESCE(LAG(actual_timestamp_a,100) OVER (
				   ORDER BY height asc
			   ), 0) actual_timestamp_b,
			   COALESCE(LAG(cumulative_diff_precise_a, 400) OVER (
				   ORDER BY height asc
			   ), 0) cumulative_diff_precise_c,
			   COALESCE(LAG(actual_timestamp_a, 400) OVER (
				   ORDER BY height asc
			   ), 0) actual_timestamp_c
		  FROM cte
	)
	update charts
	   set difficulty120 = sub.difficulty120, 
		   hashrate100 = sub.hashrate100,
		   hashrate400 = sub.hashrate400 from ( SELECT height,
													   (difficulty / 120)::integer as difficulty120,
													   case when cumulative_diff_precise_b = 0 then 0 else ((cumulative_diff_precise_a - cumulative_diff_precise_b) / (actual_timestamp_a - actual_timestamp_b))::decimal(100,11) end as hashrate100,
		   											   case when cumulative_diff_precise_c = 0 then 0 else ((cumulative_diff_precise_a - cumulative_diff_precise_c) / (actual_timestamp_a - actual_timestamp_c))::decimal(100,11) end as hashrate400
												  FROM cte2
												 where height >= p_startHeight
											) as sub
	where charts.height = sub.height;
END;
$$;


GRANT EXECUTE ON PROCEDURE purge() TO zano;

GRANT EXECUTE ON PROCEDURE purgeaboveheight(p_height integer) TO zano;

GRANT EXECUTE ON PROCEDURE update_statistics(p_startheight integer) TO zano;

GRANT ALL ON TABLE aliases TO zano;

GRANT ALL ON TABLE alt_blocks TO zano;

GRANT ALL ON TABLE blocks TO zano;

GRANT ALL ON TABLE charts TO zano;

GRANT ALL ON TABLE out_info TO zano;

GRANT ALL ON TABLE pool TO zano;

GRANT ALL ON TABLE transactions TO zano;
