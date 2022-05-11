--select into temp table
DO $$
DECLARE
	block record;
	p_startHeight integer := 100;
	p_endHeight integer := 200;
	done boolean := false;
	hashrate100 decimal(100,17) := 0;
	hashrate400 decimal(100,17) := 0;
	cdp decimal(100,0) := 0;
	ats decimal(100,0) := 0;
BEGIN
    for block in 
 SELECT height, actual_timestamp, cumulative_diff_precise, difficulty, tr_count, type 
   from blocks 
  where type = 1 
--     and height >= p_startHeight 
-- 	and height <= p_endHeight 
	and height >= 450
  order by height ASC
  limit 10
loop
	select into cdp, ats cumulative_diff_precise, actual_timestamp from charts where type = 1 and height = block.height - 1;
	
	--raise notice 'cdp %, ats % block.cdp %, block.ata %', cdp, ats, block.cumulative_diff_precise, block.actual_timestamp;	
	
	hashrate100 := (block.cumulative_diff_precise - COALESCE(cdp, 0)) / (block.actual_timestamp - COALESCE(ats, 0));
	
	raise notice 'block.cdp %, cdp %, block.ats %, ats %, block %, hashrate100 %', block.cumulative_diff_precise, COALESCE(cdp, 0), block.actual_timestamp, COALESCE(ats, 0), block.height, hashrate100;
	
	--insert into charts (height, actual_timestamp, block_cumulative_size, cumulative_diff_precise, difficulty, tr_count, type, difficulty120, hashrate100, hashrate400) values
	--(block.height, block.actual_timestamp, block.block_cumulative_size, block.cumulative_diff_precise, block.difficulty, block.tr_count, block.type, 0, hashrate100, 0);
end loop;
END$$;


