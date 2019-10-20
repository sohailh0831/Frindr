require('chromedriver');
const assert = require('assert');
const { Builder, Key, By, until } = require('selenium-webdriver');

describe('Dashboard tests', function () {
   let driver;
   before(async function () {
      driver = await new Builder().forBrowser('chrome').build();
   });

   it('Verify move to dashboard after correct login', async function () {
      await driver.get('https://frindr.tk');
      await driver.findElement(By.name('username')).sendKeys('jj@legitemail.com');
      await driver.findElement(By.name('password')).sendKeys('jimjimpass');
      await driver.findElement(By.id('m_login_signin_submit')).click();
      let currURL = await driver.getCurrentUrl();
      assert.equal(currURL, 'https://frindr.tk/dashboard');
   });

   // close the browser after running tests
   after(() => driver && driver.quit());
})