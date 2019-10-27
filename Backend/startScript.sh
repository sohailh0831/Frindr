#!/bin/bash
forever stopall
echo "stopped all forever processes"
git pull
forever start -c "npm start" .
echo "started defect server on port 6161" .
cd ../../Frindr/Backend
pwd
git pull
forever start -c "npm start" .
echo "started actual server"
