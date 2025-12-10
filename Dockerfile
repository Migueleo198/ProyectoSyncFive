FROM php:8.2-apache


RUN a2enmod rewrite


CMD ["apache2-foreground"]
