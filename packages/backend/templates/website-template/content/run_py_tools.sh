#!/bin/sh

CMDS=("pylint static_website_builder" "flake8 static_website_builder" "bandit -r static_website_builder")

for i in "${CMDS[@]}"
do 
    if $i
    then
        echo "$i command successfully executed"
    else
        echo "$i command failed to execute or display errors that needs to be corrected"
    fi
done