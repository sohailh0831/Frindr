require('chromedriver');
const assert = require('assert');
const { Builder, Key, By, until } = require('selenium-webdriver');

describe('Dashboard tests', function () {
   let driver;
   before(async function () {
      driver = await new Builder().forBrowser('chrome').build();
   });

   it('Verify move to registration page after clicking "register now"', async function () {
      await driver.get('https://frindr.tk');
      await driver.findElement(By.className('m-link m-link--light m-login__account-link')).click();
      let currURL = await driver.getCurrentUrl();
      assert.equal(currURL, 'https://frindr.tk/register');
   });

   it('Check username field exists', async function () {
      await driver.get('https://frindr.tk');
      await driver.findElement(By.className('m-link m-link--light m-login__account-link')).click();
      assert( await driver.wait(until.elementLocated(By.name('name')), 10000) );
   });

   it('Check email field exists', async function () {
      await driver.get('https://frindr.tk');
      await driver.findElement(By.className('m-link m-link--light m-login__account-link')).click();
      assert( await driver.wait(until.elementLocated(By.name('email')), 10000) );
   });

   it('Check password field exists', async function () {
      await driver.get('https://frindr.tk');
      await driver.findElement(By.className('m-link m-link--light m-login__account-link')).click();
      assert( await driver.wait(until.elementLocated(By.name('password')), 10000) );
   });

   it('Check confirm password field exists', async function () {
      await driver.get('https://frindr.tk');
      await driver.findElement(By.className('m-link m-link--light m-login__account-link')).click();
      assert( await driver.wait(until.elementLocated(By.name('password2')), 10000) );
   });

   it('Check sign up button exists', async function () {
      await driver.get('https://frindr.tk');
      await driver.findElement(By.className('m-link m-link--light m-login__account-link')).click();
      assert( await driver.wait(until.elementLocated(By.id('m_login_signup_submit')), 10000) );
   });

   it('Verify move to login page after clicking "login now"', async function () {
      await driver.get('https://frindr.tk');
      await driver.findElement(By.className('m-link m-link--light m-login__account-link')).click();
      await driver.findElement(By.className('m-link m-link--light m-login__account-link')).click();
      let currURL = await driver.getCurrentUrl();
      assert.equal(currURL, 'https://frindr.tk/login');
   });

   // close the browser after running tests
   after(() => driver && driver.quit());
})