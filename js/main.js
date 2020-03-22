document.addEventListener('DOMContentLoaded', (event) => {
    fetch('https://coronavirus-tracker-api.herokuapp.com/v2/locations?timelines=1')
        .then(function (response) {
            if (response.ok) {
                return response.json();
            } else {
                return Promise.reject(response);
            }
        })
        .then(function (data) {
            // todo: transform & render
            console.log(data);

            $('#overall_confirmed').text(data.latest.confirmed);
            $('#overall_recovered').text(data.latest.recovered);
            $('#overall_deaths').text(data.latest.deaths);

            let tabularData = [];
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
                    confirmed_yesterday: 0, // TODO: calculate
                    recovered_today: recovered.latest,
                    recovered_yesterday: 0, // TODO: calculate
                    dead_today: deaths.latest,
                    dead_yesterday: 0, // TODO: calculate
                };
                tabularData.push([
                    /*country: */ `${extracted.country} ${extracted.province}`,
                    /*confirmed_total: */extracted.confirmed_today,
                    /*confirmed_growth: */extracted.confirmed_today - extracted.confirmed_yesterday,
                    /*recovered_total: */extracted.recovered_today,
                    /*recovered_growth: */extracted.recovered_today - extracted.recovered_yesterday,
                    /*dead_total: */extracted.dead_today,
                    /*dead_growth: */extracted.dead_today - extracted.dead_yesterday,
                ]);
            }

            // see https://datatables.net/examples/data_sources/js_array.html
            $('#datatable').dataTable({
                paging: false,
                data: tabularData,
                columns: [
                    {title: 'Өлкө'},
                    {title: 'Ооругандар'},
                    {title: 'Ооругандар, өсүшү'},
                    {title: 'Айыккандар'},
                    {title: 'Айыккандар, өсүшү'},
                    {title: 'Өлгөндөр'},
                    {title: 'Өлгөндөр, өсүшү'},
                ],
                order: [[2, "desc"]],
                responsive: true
            });
        })
        .catch(function (err) {
            console.error('Error', err);
        });

    return true;
});