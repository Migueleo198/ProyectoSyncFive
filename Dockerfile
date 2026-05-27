FROM php:8.2-apache

RUN apt-get update \
    && apt-get install -y --no-install-recommends libzip-dev \
    && docker-php-ext-install pdo pdo_mysql mysqli zip \
    && rm -rf /var/lib/apt/lists/*

RUN a2enmod rewrite

CMD ["apache2-foreground"]
