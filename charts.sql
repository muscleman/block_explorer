CREATE OR REPLACE PROCEDURE update_statistics(IN p_startHeight integer, IN p_endHeight integer) AS $$
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
$$ LANGUAGE plpgsql;

