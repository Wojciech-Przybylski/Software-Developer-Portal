#!/bin/sh

set -e

TMPFILE=`mktemp ./templates.XXXXXXXXXX`

wget https://github.com/ONSdigital/design-system/releases/download/62.0.0/templates.zip -O $TMPFILE
rm -rf static_website_builder/templates/components
rm -rf static_website_builder/templates/layout

unzip -d ./static_website_builder $TMPFILE
rm $TMPFILE
