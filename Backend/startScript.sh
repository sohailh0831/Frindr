#!/bin/bash
forever stopall
git pull
forever start -c "npm start" .
