let str = '';

document.addEventListener('DOMContentLoaded', (event) => {
    fetch('/backend/index.php')
        .then(function (response) {
            if (response.ok) {
                return response.json();
            } else {
                return Promise.reject(response);
            }
        })
        .then(function (data) {
            $('#overall_confirmed').text(data.latest.confirmed);
            $('#overall_recovered').text(data.latest.recovered);
            $('#overall_deaths').text(data.latest.deaths);

            let tabularData = [];
            let countryMap = {};
            let countries = new Set();
            for (let i = 0; i < data.locations.length; i++) {
                const item = data.locations[i];
                const confirmed = item.timelines.confirmed;
                const recovered = item.timelines.recovered;
                const deaths = item.timelines.deaths;

                let extracted = {
                    country: item.country_code,
                    province: item.province,
                    last_upd: item.last_updated,
                    confirmed_today: confirmed.latest,
                    confirmed_yesterday: confirmed.prev_day,
                    recovered_today: recovered.latest,
                    recovered_yesterday: recovered.prev_day,
                    dead_today: deaths.latest,
                    dead_yesterday: deaths.prev_day,
                };

                // sum by country
                if (countryMap[extracted.country]) {
                    countryMap[extracted.country].confirmed_today += extracted.confirmed_today;
                    countryMap[extracted.country].confirmed_yesterday += extracted.confirmed_yesterday;
                    countryMap[extracted.country].recovered_today += extracted.recovered_today;
                    countryMap[extracted.country].recovered_yesterday += extracted.recovered_yesterday;
                    countryMap[extracted.country].dead_today += extracted.dead_today;
                    countryMap[extracted.country].dead_yesterday += extracted.dead_yesterday;
                } else {
                    countryMap[extracted.country] = extracted;
                }

                countries.add(extracted.country);
            }

            for (let name of countries) {
                let extracted = countryMap[name];
                tabularData.push([
                    /*country: */ translate(extracted.country),
                    /*confirmed_total: */extracted.confirmed_today,
                    /*confirmed_growth: */extracted.confirmed_today - extracted.confirmed_yesterday,
                    /*recovered_total: */extracted.recovered_today,
                    /*recovered_growth: */extracted.recovered_today - extracted.recovered_yesterday,
                    /*dead_total: */extracted.dead_today,
                    /*dead_growth: */extracted.dead_today - extracted.dead_yesterday,
                ]);
            }

            console.log('Translation needed: ', str);

            // see https://datatables.net/examples/data_sources/js_array.html
            let options = {
                paging: false,
                data: tabularData,
                columns: [
                    {title: 'Өлкө'},
                    {title: 'Ооругандар'},
                    {title: 'Ооругандар, өсүшү', render: renderBad},
                    {title: 'Айыккандар'},
                    {title: 'Айыккандар, өсүшү', render: renderGood},
                    {title: 'Өлгөндөр'},
                    {title: 'Өлгөндөр, өсүшү'},
                ],
                order: [[1, "desc"]],
                language: {
                    search: "Издөө"
                }
            };
            if (isMobile()) {
                options.responsive = {
                    details: {
                        display: $.fn.dataTable.Responsive.display.childRowImmediate
                    }
                };

                // reorder blocks on mobile browsers
                const infoElement = document.querySelector('#info');
                const worldstats = document.querySelector('#worldstats');

                worldstats.parentElement.insertBefore(infoElement, worldstats)
            } else {
                options.responsive = false;
            }
            $('#datatable').dataTable(options);
        })
        .catch(function (err) {
            console.error('Error', err);
        });

    return true;
});

function renderBad(data, type, row) {
    if (data > 0) {
        return '<span class="bad">+' + data + '</span>';
    }

    return '0';
}

function renderGood(data, type, row) {
    if (data > 0) {
        return '<span class="good">+' + data + '</span>';
    }

    return '0';
}

function isMobile() {
    return !!(navigator.userAgent.match(/Android/i)
        || navigator.userAgent.match(/webOS/i)
        || navigator.userAgent.match(/iPhone/i)
        || navigator.userAgent.match(/iPad/i)
        || navigator.userAgent.match(/iPod/i)
        || navigator.userAgent.match(/BlackBerry/i)
        || navigator.userAgent.match(/Windows Phone/i));
}

function translate(key) {
    switch (key) {
        case "CN":
            return 'Кытай';
        case "TH":
            return "Тайланд";
        case "JP":
            return "Жапан";
        case "SG":
            return "Сингапур";
        case "NP":
            return "Непал";
        case "MY":
            return "Малайзия";
        case "CA":
            return "Канада";
        case "AU":
            return "Австралия";
        case "LK":
            return "Шри-Ланка";
        case "DE":
            return "Германия";
        case "FI":
            return "Финляндия";
        case "AE":
            return "Араб эмираттары";
        case "PH":
            return "Филиппин аралы";
        case "IN":
            return "Индия";
        case "IT":
            return "Италия";
        case "SE":
            return "Швеция";
        case "ES":
            return "Испания";
        case "BE":
            return "Белгия";
        case "EG":
            return "Египет";
        case "HR":
            return "Хорватия";
        case "CH":
            return "Чили";
        case "BR":
            return "Бразилия";
        case "NO":
            return "Норвегия";
        case "RO":
            return "Румыния";
        case "BY":
            return "Белорусия";
        case "LT":
            return "Латвия";
        case "MX":
            return "Мексика";
        case "NZ":
            return "Жаңы Зеландия";
        case "NG":
            return "Нигерия";
        case "IE":
            return "Ирландия";
        case "LU":
            return "Люксембург";
        case "MC":
            return "Монако";
        case "QA":
            return "Катар";
        case "EC":
            return "Эквадор";
        case "AZ":
            return "Азербайжан";
        case "AM":
            return "Армения";
        case "DO":
            return "Доминикан республикасы";
        case "ID":
            return "Индонезия";
        case "PT":
            return "Португалия";
        case "AD":
            return "Андорра";
        case "LV":
            return "Латвия";
        case "MA":
            return "Макао";
        case "SA":
            return "Сауд Арабия";
        case "SN":
            return "Сенегал";
        case "AR":
            return "Аргентина";
        case "CL":
            return "Чили";
        case "JO":
            return "Иордания";
        case "UA":
            return "Украина";
        case "HU":
            return "Венгрия";
        case "LI":
            return "Лихтенштейн";
        case "PL":
            return "Польша";
        case "TN":
            return "Тунис";
        case "BA":
            return "Босния жана Герцеговина";
        case "SI":
            return "Словения";
        case "ZA":
            return "Түштүк Африка";
        case "BT":
            return "Бутан";
        case "CM":
            return "Камерун";
        case "CO":
            return "Колумбия";
        case "CR":
            return "Коста-Рика";
        case "PE":
            return "Перу";
        case "RS":
            return "Сербия";
        case "SK":
            return "Словакия";
        case "TG":
            return "Того";
        case "MT":
            return "Мальта";
        case "BG":
            return "Болгария";
        case "MV":
            return "Мальдив аралы";
        case "BD":
            return "Баңгладеш";
        case "PY":
            return "Парагвай";
        case "AL":
            return "Албания";
        case "CY":
            return "Кипр";
        case "BN":
            return "Бруней";
        case "US":
            return "АКШ";
        case "BF":
            return "Буркина Фасо";
        case "VA":
            return "Ватикан";
        case "MN":
            return "Монголия";
        case "PA":
            return "Панама";
        case "IR":
            return "Иран";
        case "KR":
            return "Түштүк Корея";
        case "FR":
            return "Франция";
        case "XX":
            return "Белгисиз";
        case "DK":
            return "Дания";
        case "CZ":
            return "Чехия";
        case "TW":
            return "Тайван";
        case "VN":
            return "Вьетнам";
        case "RU":
            return "Орусия";
        case "MD":
            return "Молдова";
        case "BO":
            return "Боливия";
        case "HN":
            return "Гондурас";
        case "GB":
            return "Англия";
        case "CD":
            return "Конго";
        case "JM":
            return "Жамайка";
        case "TR":
            return "Түркия";
        case "CU":
            return "Куба";
        case "GY":
            return "Гаяна";
        case "KZ":
            return "Казакстан";
        case "ET":
            return "Эфиопия";
        case "SD":
            return "Судан";
        case "GN":
            return "Гвинея";
        case "KE":
            return "Кения";
        case "AG":
            return "Антигуа жана Барбуда";
        case "UY":
            return "Уругвай";
        case "GH":
            return "Гана";
        case "NA":
            return "Намибия";
        case "KH":
            return "Камбожа";
        case "LB":
            return "Ливан";
        case "IQ":
            return "Ирак";
        case "OM":
            return "Оман";
        case "AF":
            return "Ооганстан";
        case "BH":
            return "Бахрейн";
        case "KW":
            return "Кувейт";
        case "DZ":
            return "Алжир";
        case "AT":
            return "Австрия";
        case "IL":
            return "Израиль";
        case "PK":
            return "Пакистан";
        case "GE":
            return "Грузия";
        case "GR":
            return "Греция";
        case "MK":
            return "Македония";
        case "EE":
            return "Эстония";
        case "SM":
            return "Сан-Марино";
        case "IS":
            return "Исландия";
        case "MQ":
            return "MQ";
        case "CI":
            return "Кот-д'Ивуар";
        case "SC":
            return "Сейшел Аралдары";
        case "TT":
            return "Тринидад жана Тобаго";
        case "VE":
            return "Венесуэла";
        case "SZ":
            return "Эсватини падышачылыгы";
        case "GA":
            return "Габон";
        case "GT":
            return "Гватемала";
        case "MR":
            return "Мавритания";
        case "RW":
            return "Руанда";
        case "LC":
            return "Сент-Люсия";
        case "VC":
            return "Сент-Винсент жана Гренадиндер";
        case "SR":
            return "Суринам";
        case "XK":
            return "Косово";
        case "CF":
            return "Борбордук Африка Республикасы";
        case "CG":
            return "Конго Республикасы";
        case "GQ":
            return "Экватордук Гвинея";
        case "UZ":
            return "Өзбекстан";
        case "NL":
            return "Нидерланд";
        case "BJ":
            return "Бенин";
        case "LR":
            return "Либерия";
        case "SO":
            return "Сомали";
        case "TZ":
            return "Танзания";
        case "BB":
            return "Барбадос";
        case "ME":
            return "Черногория";
        case "KG":
            return "Кыргызстан";
        case "MU":
            return "Маврикий";
        case "ZM":
            return "Замбия";
        case "DJ":
            return "Жибути";
        case "GM":
            return "Гамбия";
        case "BS":
            return "Багама аралдары";
        case "TD":
            return "Чад";
        case "SV":
            return "Сальвадор";
        case "FJ":
            return "Фижи";
        case "NI":
            return "Никарагуа";
        case "MG":
            return "Мадагаскар";
        case "HT":
            return "Гаити";
        case "AO":
            return "Ангола";
        case "CV":
            return "Кабо-Верде";
        case "NE":
            return "Нигер";
        case "PG":
            return "Папуа-Жаңы Гвинея";
        case "ZW":
            return "Зимбабве";
        case "TL":
            return "Тимор Лешти";
        case "ER":
            return "Эритрея";
        case "UG":
            return "Уганда";

        default:
            str += `case "${key}":\n    return "${key}";\n`;
            return key;
    }
}
