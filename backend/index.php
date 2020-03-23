<?php

require_once './vendor/autoload.php';

use GuzzleHttp\ClientInterface;
use GuzzleHttp\Exception\GuzzleException;
use Symfony\Component\Cache\Adapter\FilesystemAdapter;
use Symfony\Contracts\Cache\CacheInterface;
use Symfony\Contracts\Cache\ItemInterface;

/**
 * Class CoronavirusTrackerApi
 */
class CoronavirusTrackerApi
{
    const API_URL = 'https://coronavirus-tracker-api.herokuapp.com/v2/locations?timelines=1';
    const CACHE_KEY = 'coronavirus-tracker-2';
    const CACHE_TIME = 3600;
    const CACHE_DIR = './cache';

    /**
     * @var ClientInterface
     */
    private $client;

    /**
     * @var CacheInterface
     */
    private $cache;

    /**
     * CoronavirusTrackerApi constructor.
     */
    public function __construct()
    {
        $this->client = new GuzzleHttp\Client();
        $this->cache = new FilesystemAdapter('', 0, self::CACHE_DIR);
    }

    /**
     * @throws Exception
     */
    public function getData()
    {
        try {
            $response = $this->client->request('GET', self::API_URL);
        } catch (GuzzleException $e) {
            throw new Exception('Invalid response: ' . $e->getMessage());
        }
        $content = $response->getBody()->getContents();

        if (empty($content)) {
            throw new Exception('The response is empty');
        }
        $json = json_decode($content, true);
        if (empty($json)) {
            throw new Exception('Can\'t be parsed');
        }

        $json = $this->excludeDetailedTimeline($json);

        $locations = $json['locations'];
        $rows = [];
        foreach ($locations as $k => $v) {
            $confirmed = $v['timelines']['confirmed'];
            $recovered = $v['timelines']['recovered'];
            $deaths = $v['timelines']['deaths'];
            $active_cases = $confirmed['latest'] - $recovered['latest'] - $deaths['latest'];

            $row = [
                'country' => $v['country_code'],
                'confirmed_today' => $confirmed['latest'],
                'confirmed_yesterday' => $confirmed['latest'] - $confirmed['prev_day'],
                'recovered_today' => $recovered['latest'],
                'recovered_yesterday' => $recovered['latest'] - $recovered['prev_day'],
                'dead_today' => $deaths['latest'],
                'dead_yesterday' => $deaths['latest'] - $deaths['prev_day'],
                'active_cases' => $active_cases,
                'active_cases_yesterday' => $active_cases - ($confirmed['prev_day'] - $recovered['prev_day'] - $deaths['prev_day']),
            ];

            if ($rows[$row['country']]) {
                $rows[$row['country']]['confirmed_today'] += $row['confirmed_today'];
                $rows[$row['country']]['confirmed_yesterday'] += $row['confirmed_yesterday'];
                $rows[$row['country']]['recovered_today'] += $row['recovered_today'];
                $rows[$row['country']]['recovered_yesterday'] += $row['recovered_yesterday'];
                $rows[$row['country']]['dead_today'] += $row['dead_today'];
                $rows[$row['country']]['dead_yesterday'] += $row['dead_yesterday'];
                $rows[$row['country']]['active_cases'] += $row['active_cases'];
                $rows[$row['country']]['active_cases_yesterday'] += $row['active_cases_yesterday'];
            } else {
                $rows[$row['country']] = $row;
            }
        }

        $flatRows = [];
        foreach ($rows as $row) {
            $flatRows[] = array_values($row);
        }

        return [
            'table' => $flatRows,
            'latest' => [
                'confirmed' => $json['latest']['confirmed'],
                'recovered' => $json['latest']['recovered'],
                'deaths' => $json['latest']['deaths'],
            ]
        ];
    }

    /**
     * @throws \Psr\Cache\InvalidArgumentException
     * @throws Exception
     */
    public function getDataCached()
    {
        return $this->cache->get(self::CACHE_KEY, function (ItemInterface $item) {
            $item->expiresAfter(self::CACHE_TIME);
            return $this->getData();
        });
    }

    /**
     * @param array $json
     * @return array
     */
    private function excludeDetailedTimeline(array $json)
    {
        foreach ($json['locations'] as $locationKey => $location) {
            // Remove detailed timeline for each type (confirmed, deaths, recovered)
            foreach ($location['timelines'] as $timelineKey => $timeline) {
                unset($json['locations'][$locationKey]['timelines'][$timelineKey]['timeline']);

                $timeSeries = $timeline['timeline'];
                $prevDay = 0;
                if (count($timeSeries) > 1) {
                    array_pop($timeSeries);
                    $prevDay = array_pop($timeSeries);
                }

                $json['locations'][$locationKey]['timelines'][$timelineKey]['prev_day'] = $prevDay;
            }
        }
        return $json;
    }

}

$api = new CoronavirusTrackerApi();

try {
    header('Content-type: application/json');
    echo json_encode($api->getDataCached());
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
