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
    const API_URL = 'https://corona.lmao.ninja/countries';
    const API_URL_ALL = 'https://corona.lmao.ninja/all';
    const CACHE_KEY = 'coronavirus-tracker-3';
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
            $allResponse = $this->client->request('GET', self::API_URL_ALL);
        } catch (GuzzleException $e) {
            throw new Exception('Invalid response: ' . $e->getMessage());
        }
        $content = $response->getBody()->getContents();
        $contentAll = $allResponse->getBody()->getContents();

        if (empty($content) || empty($contentAll)) {
            throw new Exception('The response is empty');
        }
        $json = json_decode($content, true);
        if (empty($json)) {
            throw new Exception('Can\'t be parsed');
        }
        $jsonAll = json_decode($contentAll, true);
        if (empty($jsonAll)) {
            throw new Exception('All json can\'t be parsed');
        }

        $locations = $json['locations'];
        $rows = [];

        foreach ($json as $v) {
            $rows [] = [
                /*'country' => */$v['countryInfo']['iso2'] == 'NO DATA' ? $v['country'] : $v['countryInfo']['iso2'],
                /*'confirmed' => */$v['cases'],
                /*'confirmed_today' => */$v['todayCases'],
                /*'deaths' => */$v['deaths'],
                /*'deaths_today' => */$v['todayDeaths'],
                /*'active_cases' => */$v['active'],
            ];
        }

        return [
            'table' => $rows,
            'latest' => [
                'confirmed' => $jsonAll['cases'],
                'recovered' => $jsonAll['recovered'],
                'deaths' => $jsonAll['deaths'],
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
