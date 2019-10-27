#!/bin/bash
forever stopall
git pull
forever start -c "npm start" .
echo "started actual server"
cd ../../Frindr2/Frindr/Backend
pwd
git pull
forever start -c "npm start" .
echo "started defect server on port 6161"
