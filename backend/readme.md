
### Installation
```
cd backend
php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
php composer-setup.php
php -r "unlink('composer-setup.php');"
php composer.phar install
```

### Get data

Use ```/backend/index.php``` instead ```https://coronavirus-tracker-api.herokuapp.com/v2/locations?timelines=1```.