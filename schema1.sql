--
-- PostgreSQL database dump
--

-- Dumped from database version 12.10 (Ubuntu 12.10-0ubuntu0.20.04.1)
-- Dumped by pg_dump version 12.10 (Ubuntu 12.10-0ubuntu0.20.04.1)

-- Started on 2022-05-11 08:28:30 CDT

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 209 (class 1255 OID 17461)
-- Name: purge(); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public.purge()
    LANGUAGE plpgsql
    AS $$
BEGIN
    DELETE FROM blocks;
    DELETE FROM transactions;
	DELETE FROM aliases;
	DELETE FROM alt_blocks;
	DELETE FROM pool;
	DELETE FROM charts;	
	DELETE FROM out_info;								 
END;
$$;


ALTER PROCEDURE public.purge() OWNER TO postgres;

--
-- TOC entry 222 (class 1255 OID 17447)
-- Name: purgeaboveheight(integer); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public.purgeaboveheight(p_height integer)
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER PROCEDURE public.purgeaboveheight(p_height integer) OWNER TO postgres;

--
-- TOC entry 223 (class 1255 OID 33483)
-- Name: update_statistics(integer, integer); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public.update_statistics(p_startheight integer, p_endheight integer)
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
			   ), 0) actual_timestamp_b
		  FROM cte
	)
	update charts
	   set difficulty120 = sub.difficulty120, 
		   hashrate100 = sub.hashrate100 from ( SELECT height,
													   (difficulty / 120)::integer as difficulty120,
													   case when cumulative_diff_precise_b = 0 then 0 else ((cumulative_diff_precise_a - cumulative_diff_precise_b) / (actual_timestamp_a - actual_timestamp_b))::decimal(100,11) end as hashrate100
												  FROM cte2
												 where height >= p_startHeight 
												   and height <= p_endHeight
											) as sub
	where charts.height = sub.height;
END;
$$;


ALTER PROCEDURE public.update_statistics(p_startheight integer, p_endheight integer) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 205 (class 1259 OID 16540)
-- Name: aliases; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.aliases (
    alias text,
    address text,
    comment text,
    tracking_key text,
    block integer,
    transact text,
    enabled integer
);


ALTER TABLE public.aliases OWNER TO postgres;

--
-- TOC entry 206 (class 1259 OID 19911)
-- Name: alt_blocks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alt_blocks (
    height integer,
    "timestamp" integer,
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


ALTER TABLE public.alt_blocks OWNER TO postgres;

--
-- TOC entry 207 (class 1259 OID 27913)
-- Name: blocks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.blocks (
    height integer,
    actual_timestamp integer,
    base_reward numeric(100,0),
    blob text,
    block_cumulative_size numeric(100,0),
    block_tself_size numeric(100,0),
    cumulative_diff_adjusted numeric(100,0),
    cumulative_diff_precise numeric(100,0),
    difficulty numeric(100,0),
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


ALTER TABLE public.blocks OWNER TO postgres;

--
-- TOC entry 208 (class 1259 OID 33758)
-- Name: charts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.charts (
    height integer,
    actual_timestamp integer,
    block_cumulative_size numeric(100,0),
    cumulative_diff_precise numeric(100,0),
    difficulty numeric(100,0),
    tr_count bigint,
    type integer,
    difficulty120 numeric(100,0),
    hashrate100 numeric(100,12),
    hashrate400 numeric(100,12)
);


ALTER TABLE public.charts OWNER TO postgres;

--
-- TOC entry 204 (class 1259 OID 16512)
-- Name: out_info; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.out_info (
    amount text,
    i integer,
    tx_id text,
    block integer
);


ALTER TABLE public.out_info OWNER TO postgres;

--
-- TOC entry 203 (class 1259 OID 16474)
-- Name: pool; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pool (
    blob_size text,
    fee text,
    id text,
    "timestamp" text
);


ALTER TABLE public.pool OWNER TO postgres;

--
-- TOC entry 202 (class 1259 OID 16450)
-- Name: transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transactions (
    keeper_block integer,
    id text,
    amount text,
    blob_size integer,
    extra text,
    fee text,
    ins text,
    outs text,
    pub_key text,
    "timestamp" integer,
    attachments text
);


ALTER TABLE public.transactions OWNER TO postgres;

--
-- TOC entry 2836 (class 2606 OID 16547)
-- Name: aliases aliases_address_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aliases
    ADD CONSTRAINT aliases_address_key UNIQUE (address);


--
-- TOC entry 2840 (class 2606 OID 27920)
-- Name: blocks blocks_height_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blocks
    ADD CONSTRAINT blocks_height_key UNIQUE (height);


--
-- TOC entry 2834 (class 2606 OID 16519)
-- Name: out_info out_info_tx_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.out_info
    ADD CONSTRAINT out_info_tx_id_key UNIQUE (tx_id);


--
-- TOC entry 2830 (class 2606 OID 16457)
-- Name: transactions transactions_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_id_key UNIQUE (id);


--
-- TOC entry 2838 (class 1259 OID 19917)
-- Name: index_ab_hash; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX index_ab_hash ON public.alt_blocks USING btree (hash);


--
-- TOC entry 2837 (class 1259 OID 16548)
-- Name: index_al_block; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX index_al_block ON public.aliases USING btree (block);


--
-- TOC entry 2832 (class 1259 OID 16520)
-- Name: index_out; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX index_out ON public.out_info USING btree (amount, i, tx_id);


--
-- TOC entry 2831 (class 1259 OID 16480)
-- Name: index_pool_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX index_pool_id ON public.pool USING btree (id);


--
-- TOC entry 2827 (class 1259 OID 16459)
-- Name: index_tr_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX index_tr_id ON public.transactions USING btree (id);


--
-- TOC entry 2828 (class 1259 OID 16458)
-- Name: index_tr_keeper; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX index_tr_keeper ON public.transactions USING btree (keeper_block);


--
-- TOC entry 2972 (class 0 OID 0)
-- Dependencies: 209
-- Name: PROCEDURE purge(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON PROCEDURE public.purge() TO zano;


--
-- TOC entry 2973 (class 0 OID 0)
-- Dependencies: 222
-- Name: PROCEDURE purgeaboveheight(p_height integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON PROCEDURE public.purgeaboveheight(p_height integer) TO zano;


--
-- TOC entry 2974 (class 0 OID 0)
-- Dependencies: 223
-- Name: PROCEDURE update_statistics(p_startheight integer, p_endheight integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON PROCEDURE public.update_statistics(p_startheight integer, p_endheight integer) TO zano;


--
-- TOC entry 2975 (class 0 OID 0)
-- Dependencies: 205
-- Name: TABLE aliases; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.aliases TO zano;


--
-- TOC entry 2976 (class 0 OID 0)
-- Dependencies: 206
-- Name: TABLE alt_blocks; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.alt_blocks TO zano;


--
-- TOC entry 2977 (class 0 OID 0)
-- Dependencies: 207
-- Name: TABLE blocks; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.blocks TO zano;


--
-- TOC entry 2978 (class 0 OID 0)
-- Dependencies: 208
-- Name: TABLE charts; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.charts TO zano;


--
-- TOC entry 2979 (class 0 OID 0)
-- Dependencies: 204
-- Name: TABLE out_info; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.out_info TO zano;


--
-- TOC entry 2980 (class 0 OID 0)
-- Dependencies: 203
-- Name: TABLE pool; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.pool TO zano;


--
-- TOC entry 2981 (class 0 OID 0)
-- Dependencies: 202
-- Name: TABLE transactions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.transactions TO zano;


-- Completed on 2022-05-11 08:28:31 CDT

--
-- PostgreSQL database dump complete
--

