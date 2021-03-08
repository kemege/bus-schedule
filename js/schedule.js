var specialDays = [
	[[2019,1,19], [2019,2,19], 'winter_2019'],
	[[2019,7,8], [2019,8,25], 'summer_2019'],
	[[2019,10,1], [2019,10,7], 'stop'],
	[[2020,1,20], [2020,2,17], 'winter_2019'],
	[[2020,1,24], [2020,1,30], 'stop'],
];
var schedule_stop = {}
var schedule = {
	'stop': [],
	'hd-jw': [730,740,0800,0815,0830,0900,0930,1000,1020,1100,1130,1145,1200,1230,1300,1330,1400,1430,1500,1530,1600,1615,1620,1630,1700,1715,1725,1735,1745,1800,1830,2000,2020,2030,2050,2100,2120,2140,2200,2215,2230],
	'jw-hd': [710,720,730,740,750,0800,0815,0830,0845,0900,0915,0930,1000,1030,1110,1140,1200,1215,1230,1240,1300,1330,1400,1500,1515,1530,1600,1630,1655,1700,1710,1730,1800,1900,2000,2030,2100,2120,2145,2210,2230],
	'hd-jw-weekend': [0820,0840,0900,0920,0940,1000, 1050,1220,1700,2015,2100,2145,2230],
	'jw-hd-weekend': [740,0800,0820,0840,0900,0920,0940,1020,1150,1630,1730,2040,2120,2210,2230],
	'hd-zj': [710,740,0800,0830,0900,1000,1150,1230,1245,1430,1530,1615,1720,1830,2020,2030,2100,2120],
	'zj-hd': [700,715,0800,0840,0900,1000,1150,1215,1240,1415,1520,1540,1600,1630,1700,1720,1830,2110],
	'hd-zj-weekend': [0830,1630],
	'zj-hd-weekend': [0920,1730],
	'fl-zj': [700,730,0900,1215,1330,1630,1900],
	'zj-fl': [750,1215,1500,1700,1900],
	'hd-fl': [655,710,0815,0915,1015,1100,1230,1300,1400,1530,1600,1655,1710,1800,1930,2020,2125],
	'fl-hd': [710,720,0815,0915,1100,1145,1215,1300,1400,1430,1530,1600,1655,1710,1725,1820,2020,2115,2150],
	'hd-fl-weekend': [0800,1630],
	'fl-hd-weekend': [0900,1730]
};
var schedule_winter_2019 = {
	'stop': [],
	'hd-jw': [730, 830, 930, 1200, 1500, 1600, 1700, 1800, 2030, 2130],
	'jw-hd': [740, 800, 900, 1130, 1430, 1530, 1630, 1730, 1830, 2000, 2100]
}
var schedule_winter_2020 = {
	'stop': [],
	'hd-jw': [730, 830, 930, 1200, 1500, 1600, 1700, 1800, 2030, 2130],
	'jw-hd': [740, 800, 900, 1130, 1430, 1530, 1630, 1730, 1830, 2000, 2100]
}
var schedule_summer_2019 = schedule_winter_2019;
var names = {
	'hd-jw': '邯郸-江湾',
	'jw-hd': '江湾-邯郸',
	'hd-zj': '邯郸-张江',
	'zj-hd': '张江-邯郸',
	'hd-fl': '邯郸-枫林',
	'fl-hd': '枫林-邯郸',
	'fl-zj': '枫林-张江',
	'zj-fl': '张江-枫林'
};
var maxDisplay = 5;
var timer;

function registerSW() {
	if ('serviceWorker' in navigator) {
		console.log('Starting registering service worker.');
		navigator.serviceWorker.register('/bus-schedule/service-worker.js').then(function () {
			console.log('Service worker registration complete.');
		}, function () {
			console.log('Service worker registration failed.')
		});
	} else {
		console.log('Service worker is not supported by this browser.');
	}
}

function format(data) {
	hour = parseInt(data / 100);
	minute = data % 100;
	var time = new Date();
	var nowHour = time.getHours();
	var nowMinute = time.getMinutes();
	result = ('00' + hour).slice(-2) + ':' + ('00' + minute).slice(-2);
	if ((hour - nowHour) * 60 + (minute - nowMinute) < 10) {
		result = '<span class="red">' + result + '</span>';
	}
	return result
}

function getNext(type, number) {
	var time = new Date();
	var dategroup = [time.getYear() + 1900, time.getMonth() + 1, time.getDate()];
	var day = time.getDay();

	var realSchedule = schedule;
	for (var s in specialDays) {
		if (todayInRange(specialDays[s][0], specialDays[s][1])) {
			realSchedule = eval('schedule_' + specialDays[s][2]);
			break;
		}
	}

	var hour = time.getHours();
	var minute = time.getMinutes();
	var realtype = type;
	if ([6, 0].includes(day)) {
		realtype += '-weekend';
	}
	if (day == 7) {
		realtype = 'stop';
	}
	if (!(realtype in realSchedule)) {
		// Unknown type
		return [];
	}
	var threshold = hour * 100 + minute;
	result = []
	for (var i = 0; i < realSchedule[realtype].length; i++) {
		if (threshold >= realSchedule[realtype][i]) {
			continue;
		}
		if (result.length < number) {
			result.push(realSchedule[realtype][i])
		}
	}
	return result;
}

function update() {
	for (var i in schedule) {
		schedule[i].sort(function(a, b) {return a - b;});
	}
	$('.bus').each(function(i) {
		$(this).html('<tr><td class="type"></td><td class="first"></td></tr><tr><td colspan="2" class="others"></td></tr>');
		var type = this.dataset.type;
		var next = getNext(type, maxDisplay);
		$(this).find('.type').html(names[type]);
		if (next.length > 1) {
			$(this).find('.first').html(format(next[0]));
		} else {
			$(this).find('.first').html('--:--');
		}
		
		htmlText = ''
		for (var i = next.length - 1; i > 0; i--) {
			htmlText += '<span class="badge badge-secondary">' + format(next[i]) + '</span>';
		}
		$(this).find('.others').html(htmlText);
	});
	$('#update').html(new Date().toLocaleString());
}

function todayInRange(r1, r2) {
	var today = new Date();
	var year = today.getYear() + 1900;
	var month = today.getMonth() + 1;
	var day = today.getDate();
	var num = year * 10000 + month * 100 + day;
	var num1 = r1[0] * 10000 + r1[1] * 100 + r1[2];
	var num2 = r2[0] * 10000 + r2[1] * 100 + r2[2];
	if ((num >= num1) && (num <= num2)) {
		return true;
	} else {
		return false;
	}
}

$(document).ready(function() {
	registerSW();
	update();
	$('#updateNow').click(function() {
		caches.keys().then(function (keys) {
			return Promise.all(keys.map(function (key) {
				return caches.delete(key);
			}));
		});
	});
	timer = setInterval(update, 5000);
});