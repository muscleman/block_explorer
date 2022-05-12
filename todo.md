# Remaining Todos

1. ~~config.json option to turn off websockets during sync~~
2. ~~double check no old sqllite stuff in server-pg-v1.js or server-ps.js~~
3. practical way - we calculate how much coins dev fun staked in a last day(or week), let's call it "D"
   also we know how much total coins been staked during this day - 720 coins being staked in a day (or in 7 days), let's call it "T"
   also we know total coins in dev fund, let's call it "C" so the staking coins "S" = C \* (T/D)
4. also, as self validation you can use statistics method: coins_staking = PoS_difficulty / 286 (those one without decimal point of course)
5. Angular mixins not playing well on transaction and block details
6. http.service is also a store. refactor out, maybe ngxs store
7. visibility info panel not initialized until next backend push after leaving main page and returning, probably fix with a store.
8. BUGFIX~~`Average Block Size` and `Average Number Of Transactions Per Block` not working on charts page, but works on drill down.~~
