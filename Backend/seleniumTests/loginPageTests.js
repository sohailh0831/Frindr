require('chromedriver');
const assert = require('assert');
const { Builder, Key, By, until } = require('selenium-webdriver');

describe('Login page tests', function () {
   let driver;
   before(async function () {
      driver = await new Builder().forBrowser('chrome').build();
   });

   it('Check page loads to login when not signed in', async function () {
      await driver.get('https://frindr.tk');
      let currURL = await driver.getCurrentUrl();
      assert.equal(currURL, 'https://frindr.tk/login');
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

   it('Check username field exists', async function () {
      await driver.get('https://frindr.tk');
      assert( await driver.wait(until.elementLocated(By.name('username')), 10000) );
   });

   it('Check password field exists', async function () {
      await driver.get('https://frindr.tk');
      assert( await driver.wait(until.elementLocated(By.name('password')), 10000) );
   });

   it('Check sign in button exists', async function () {
      await driver.get('https://frindr.tk');
      assert( await driver.wait(until.elementLocated(By.id('m_login_signin_submit')), 10000) );
   });

   it('Verify error comes when sign in clicked with no input', async function () {
      await driver.get('https://frindr.tk');
      await driver.findElement(By.id('m_login_signin_submit')).click();
      assert( await driver.wait(until.elementLocated(By.className('m-alert')), 10000) );
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
