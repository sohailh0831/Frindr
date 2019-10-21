require('chromedriver');
const assert = require('assert');
const { Builder, Key, By, until } = require('selenium-webdriver');

describe('Dashboard tests', function () {
   let driver;
   before(async function () {
      driver = await new Builder().forBrowser('chrome').build();
   });

   it('Verify move to dashboard after correct login', async function () {
      await driver.manage().window().maximize();
      await driver.get('https://frindr.tk');
      await driver.wait(until.elementLocated(By.id('m_login_signin_submit')), 10000); //ensures location service active
      await driver.findElement(By.name('username')).sendKeys('test@test.test');
      await driver.findElement(By.name('password')).sendKeys('testpassword');
      await driver.findElement(By.id('m_login_signin_submit')).click();
      let currURL = await driver.getCurrentUrl();
      assert.equal(currURL, 'https://frindr.tk/dashboard');
   });

   it('After login, loads to dashboard page', async function () {
      await driver.manage().window().maximize();
      await driver.get('https://frindr.tk');
      let currURL = await driver.getCurrentUrl();
      assert.equal(currURL, 'https://frindr.tk/dashboard');
   });

   it('Check image carousel exists', async function () {
      await driver.manage().window().maximize();
      await driver.get('https://frindr.tk');
      assert( await driver.wait(until.elementLocated(By.id('myCarousel')), 10000) );
   });

   it('Check dashboard button exists in dropdown', async function () {
      await driver.manage().window().maximize();
      await driver.get('https://frindr.tk');
      assert( await driver.wait(until.elementLocated(By.linkText('Dashboard')), 10000) );
   });

   it('Check matches button exists in dropdown', async function () {
      await driver.manage().window().maximize();
      await driver.get('https://frindr.tk');
      assert( await driver.wait(until.elementLocated(By.linkText('My Matches')), 10000) );
   });

   it('Check profile button exists in dropdown', async function () {
      await driver.manage().window().maximize();
      await driver.get('https://frindr.tk');
      assert( await driver.wait(until.elementLocated(By.linkText('Profile')), 10000) );
   });

   it('Verify clicking profile button moves to profile page', async function () {
      await driver.manage().window().maximize();
      await driver.get('https://frindr.tk');
      await driver.findElement(By.linkText("Profile")).click();
      let currURL = await driver.getCurrentUrl();
      assert.equal(currURL, 'https://frindr.tk/profile');
   });

   // close the browser after running tests
   after(() => driver && driver.quit());
})