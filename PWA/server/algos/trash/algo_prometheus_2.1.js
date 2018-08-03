

module.exports = async function(cryptoDB, interval, base_cur, quote_cur, exchange, currentDatetime) {

    var name = "Prometheus 2.1";
    const core = require('./core.js');
	var portfolio = {};

    var inp = await core.obtain_price(cryptoDB, interval, 60*24*1, base_cur, quote_cur, exchange, currentDatetime)

	var keys = Object.keys(inp);
	var dtStart = core.parseDateTime_dt(keys[0]);
	var dtEnd = core.parseDateTime_dt(keys[keys.length -1]);
	var dtit = dtStart;

	var prevPrice = null;

	var uncertainty_margin = 0.001
    var slope_pct_threshold = 0.9

	while (dtit <= dtEnd) {
		var idx = core.dateTime_ToString(dtit);
		if (idx in inp) {
			var c = inp[idx]['close'];
            var o = inp[idx]['open'];
            var l = inp[idx]['low'];
            var h = inp[idx]['high'];

            // var price = (o+c)/2;
            var price = c; // this is a real-time simulation so we use the latest price (close)

        	core.portfolioPriceEntry(portfolio, dtit, price, o, c, l, h);

            if (prevPrice != null) {
            	var slope_pct = (price-prevPrice)/prevPrice*100;
            	
                if (slope_pct > slope_pct_threshold) {
                	core.portfolioBuy(portfolio, dtit, price, uncertainty_margin)
                } else {
                    if (slope_pct <= 0) {// sell
                        core.portfolioSell(portfolio, dtit, price, uncertainty_margin)
                    }
                }
            }

            prevPrice = c;
		}
		//console.log(dtit)
		dtit = dtit.add(interval, 'minutes');
	}
	// var proc = core.processPortfolio(portfolio, 0.001, 1, 1);
	
    console.log(name + " " + base_cur + " " + quote_cur)
    core.processSignals(cryptoDB, portfolio, interval, base_cur, quote_cur, exchange, name) 

}


