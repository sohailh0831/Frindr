require('chromedriver');
const assert = require('assert');
const { Builder, Key, By, until } = require('selenium-webdriver');

describe('Basic checkup', function () {
   let driver;
   before(async function () {
      driver = await new Builder().forBrowser('chrome').build();
   });

   it('Check page title', async function () {
      await driver.get('https://frindr.tk');
      let title = await driver.getTitle();
      assert.equal(title, 'Frindr');
   });

   it('Check logo exists', async function () {
      await driver.get('https://frindr.tk');
      assert( await driver.wait(until.elementLocated(By.className('m-login__logo')), 10000) );
   });

   it('Check login fields exist', async function () {
      await driver.get('https://frindr.tk');
      assert( await driver.wait(until.elementLocated(By.className('form-control m-input')), 10000) );
   });

   it('Check no account message exists', async function () {
      await driver.get('https://frindr.tk');
      assert( await driver.wait(until.elementLocated(By.className('m-login__account-msg')), 10000) );
   });

   // close the browser after running tests
   after(() => driver && driver.quit());
})